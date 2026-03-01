import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from './parser.js'
import {
  SigilError, ArtifactFile, SigilFile, CharterFile, DoctrineFile,
  ProvisionDeclaration, BehaviorBody, RuleBody, Position,
} from './types.js'
import { Manifest } from './manifest.js'

// ─── Corpus ────────────────────────────────────────────────────────────────────

interface LoadedFile<T extends ArtifactFile> {
  path: string
  ast: T
}

// ─── Vocabulary resolution ────────────────────────────────────────────────────

// Build a flat map of term → definition from a vocabulary section (if present).
// Emits a validation error for any key that appears to be a plural form.
function buildVocabMap(artifact: ArtifactFile, errors: SigilError[]): Map<string, string> {
  const map = new Map<string, string>()
  if (artifact.vocabulary) {
    for (const entry of artifact.vocabulary.entries) {
      const singular = singularCandidate(entry.name)
      if (singular !== null) {
        errors.push({
          category: 'VALIDATION',
          message: `Vocabulary key '${entry.name}' appears to be a plural form. Vocabulary keys must use singular forms — did you mean '${singular}'?`,
          pos: entry.pos,
        })
      }
      map.set(entry.name, entry.definition)
    }
  }
  return map
}

// Resolve a term through Doctrine → Charter → Sigil chain.
// Returns true if the term is found at any layer.
function resolveTerm(
  term: string,
  sigilVocab: Map<string, string>,
  charterVocab: Map<string, string>,
  doctrineVocab: Map<string, string>,
): boolean {
  return sigilVocab.has(term) || charterVocab.has(term) || doctrineVocab.has(term)
}

// Return the likely singular form of a term using common English suffix rules,
// or null if the term does not match a known plural pattern.
// Used for best-effort error message suggestions only — not for resolution.
function singularCandidate(term: string): string | null {
  if (term.length > 4 && term.endsWith('ies')) return term.slice(0, -3) + 'y'
  if (term.length > 3 && term.endsWith('es')) return term.slice(0, -2)
  if (term.length > 3 && term.endsWith('s')) return term.slice(0, -1)
  return null
}

// Build an actionable error message for an unresolved identifier.
// Checks in order: plural candidate, lowercase prose suggestion.
function unresolvedMessage(
  term: string,
  context: string,
  sigilVocab: Map<string, string>,
  charterVocab: Map<string, string>,
  doctrineVocab: Map<string, string>,
): string {
  const base = `'${term}' in ${context} is not defined in vocabulary.`

  const singular = singularCandidate(term)
  if (singular !== null && resolveTerm(singular, sigilVocab, charterVocab, doctrineVocab)) {
    return `${base} Vocabulary keys use singular forms — did you mean '${singular}'?`
  }

  const lower = term.toLowerCase()
  if (lower !== term) {
    return `${base} If it is a domain term, add a vocabulary entry for '${term}' at the sigil, charter, or doctrine level. If it is a prose word, use lowercase '${lower}' instead.`
  }

  return `${base} Add a vocabulary entry for '${term}' at the sigil, charter, or doctrine level.`
}

// ─── Identifier extraction ────────────────────────────────────────────────────

// Regex matching the IDENTIFIER token pattern: [A-Z][A-Za-z0-9]+
// (At least two characters — one uppercase, one or more alphanumeric)
const IDENTIFIER_RE = /\b([A-Z][A-Za-z0-9]+)\b/g

// Extract all Capitalized identifiers from a free-text string.
function extractIdentifiers(text: string): string[] {
  const matches: string[] = []
  let m: RegExpExecArray | null
  IDENTIFIER_RE.lastIndex = 0
  while ((m = IDENTIFIER_RE.exec(text)) !== null) {
    matches.push(m[1])
  }
  return matches
}

// ─── Provision text extraction ────────────────────────────────────────────────

// Collect all free-text strings from a provision that are subject to
// vocabulary resolution: trigger items, preconditions, postconditions,
// provision invariants.
interface TextWithPos {
  text: string
  pos: Position
}

function provisionTexts(prov: ProvisionDeclaration): TextWithPos[] {
  const texts: TextWithPos[] = []
  const body = prov.body

  if (body.kind === 'behavior') {
    const b = body as BehaviorBody
    for (const item of b.trigger.items) {
      texts.push({ text: item, pos: b.trigger.pos })
    }
    if (b.preconditions) {
      for (const item of b.preconditions.items) {
        texts.push({ text: item, pos: b.preconditions.pos })
      }
    }
    for (const item of b.postconditions.items) {
      texts.push({ text: item, pos: b.postconditions.pos })
    }
    if (b.invariants) {
      for (const item of b.invariants.items) {
        texts.push({ text: item, pos: b.invariants.pos })
      }
    }
  } else {
    const r = body as RuleBody
    for (const item of r.preconditions.items) {
      texts.push({ text: item, pos: r.preconditions.pos })
    }
    for (const item of r.postconditions.items) {
      texts.push({ text: item, pos: r.postconditions.pos })
    }
    if (r.invariants) {
      for (const item of r.invariants.items) {
        texts.push({ text: item, pos: r.invariants.pos })
      }
    }
  }

  return texts
}

// Collect all free-text strings from a sigil's invariants section.
function sigilInvariantTexts(sigil: SigilFile): TextWithPos[] {
  if (!sigil.invariants) return []
  return sigil.invariants.items.map(item => ({ text: item, pos: sigil.invariants!.pos }))
}

// ─── Main validator ────────────────────────────────────────────────────────────

export interface ValidationResult {
  errors: SigilError[]
}

export function validate(manifest: Manifest): ValidationResult {
  const errors: SigilError[] = []

  // ── Step 1: Load and parse doctrine ────────────────────────────────────────

  const doctrineSource = readFileSafe(manifest.doctrinePath)
  if (!doctrineSource) return { errors }

  const doctrineResult = parse(doctrineSource, manifest.doctrinePath)
  errors.push(...doctrineResult.errors)

  if (!doctrineResult.ast || doctrineResult.ast.kind !== 'doctrine') {
    errors.push({
      category: 'PARSE',
      message: `Expected a doctrine declaration in ${manifest.doctrinePath}`,
      pos: { file: manifest.doctrinePath, line: 1, col: 1 },
    })
    return { errors }
  }

  const doctrine = doctrineResult.ast as DoctrineFile

  // ── Steps 2 & 3: Load charters and their sigils ────────────────────────────

  const charters: LoadedFile<CharterFile>[] = []
  const sigilsByName = new Map<string, LoadedFile<SigilFile>>()

  for (const charterRef of doctrine.charters) {
    const charterPath = join(manifest.chartersDir, `${charterRef.name}.charter`)
    const charterSource = readFileSafe(charterPath)
    if (!charterSource) {
      errors.push({
        category: 'VALIDATION',
        message: `Charter '${charterRef.name}' referenced in doctrine but not found at ${charterPath}. Create the file with a 'charter ${charterRef.name}:' declaration.`,
        pos: charterRef.pos,
      })
      continue
    }

    const charterResult = parse(charterSource, charterPath)
    errors.push(...charterResult.errors)

    if (!charterResult.ast || charterResult.ast.kind !== 'charter') {
      errors.push({
        category: 'PARSE',
        message: `Expected a charter declaration in ${charterPath}`,
        pos: charterRef.pos,
      })
      continue
    }

    const charter = charterResult.ast as CharterFile
    charters.push({ path: charterPath, ast: charter })

    // Version-pinned reference check for charters
    if (charterRef.version && charter.identity.version !== charterRef.version) {
      errors.push({
        category: 'VALIDATION',
        message: `Charter '${charterRef.name}' is pinned to version ${charterRef.version} but declares version ${charter.identity.version}. Update the pin in the doctrine to @${charter.identity.version}, or bump the charter to ${charterRef.version}.`,
        pos: charterRef.pos,
      })
    }

    // Load sigils referenced by this charter
    for (const sigilRef of charter.sigils) {
      const sigilPath = join(manifest.sigilsDir, `${sigilRef.name}.sigil`)

      if (!sigilsByName.has(sigilRef.name)) {
        const sigilSource = readFileSafe(sigilPath)
        if (!sigilSource) {
          errors.push({
            category: 'VALIDATION',
            message: `Sigil '${sigilRef.name}' referenced in charter '${charter.name}' but not found at ${sigilPath}. Create the file with a 'sigil ${sigilRef.name}:' declaration.`,
            pos: sigilRef.pos,
          })
          continue
        }

        const sigilResult = parse(sigilSource, sigilPath)
        errors.push(...sigilResult.errors)

        if (!sigilResult.ast || sigilResult.ast.kind !== 'sigil') {
          errors.push({
            category: 'PARSE',
            message: `Expected a sigil declaration in ${sigilPath}`,
            pos: sigilRef.pos,
          })
          continue
        }

        sigilsByName.set(sigilRef.name, { path: sigilPath, ast: sigilResult.ast as SigilFile })
      }

      // Version-pinned reference check for sigils
      const loadedSigil = sigilsByName.get(sigilRef.name)
      if (loadedSigil && sigilRef.version && loadedSigil.ast.identity.version !== sigilRef.version) {
        errors.push({
          category: 'VALIDATION',
          message: `Sigil '${sigilRef.name}' is pinned to version ${sigilRef.version} but declares version ${loadedSigil.ast.identity.version}. Update the pin in the charter to @${loadedSigil.ast.identity.version}, or bump the sigil to ${sigilRef.version}.`,
          pos: sigilRef.pos,
        })
      }
    }
  }

  // ── Step 4: Abort if any parse errors ─────────────────────────────────────
  // (parse errors already accumulated above — semantic checks only if clean)

  const hasParseErrors = errors.some(e => e.category === 'PARSE')
  if (hasParseErrors) return { errors }

  // ── Step 5: Vocabulary resolution ─────────────────────────────────────────

  const doctrineVocab = buildVocabMap(doctrine, errors)

  for (const { ast: charter } of charters) {
    const charterVocab = buildVocabMap(charter, errors)

    for (const sigilRef of charter.sigils) {
      const loaded = sigilsByName.get(sigilRef.name)
      if (!loaded) continue

      const sigil = loaded.ast
      const sigilVocab = buildVocabMap(sigil, errors)

      // Check all Capitalized identifiers in provisions
      for (const prov of sigil.provisions) {
        for (const { text, pos } of provisionTexts(prov)) {
          for (const term of extractIdentifiers(text)) {
            if (!resolveTerm(term, sigilVocab, charterVocab, doctrineVocab)) {
              errors.push({
                category: 'VALIDATION',
                message: unresolvedMessage(term, `provision '${prov.name}'`, sigilVocab, charterVocab, doctrineVocab),
                pos,
              })
            }
          }
        }
      }

      // Check sigil-level invariants
      for (const { text, pos } of sigilInvariantTexts(sigil)) {
        for (const term of extractIdentifiers(text)) {
          if (!resolveTerm(term, sigilVocab, charterVocab, doctrineVocab)) {
            errors.push({
              category: 'VALIDATION',
              message: unresolvedMessage(term, `sigil invariants of '${sigil.name}'`, sigilVocab, charterVocab, doctrineVocab),
              pos,
            })
          }
        }
      }
    }
  }

  return { errors }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFileSafe(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

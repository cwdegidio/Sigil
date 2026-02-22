import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parser.js';
// ─── Vocabulary resolution ────────────────────────────────────────────────────
// Build a flat map of term → definition from a vocabulary section (if present).
function buildVocabMap(artifact) {
    const map = new Map();
    if (artifact.vocabulary) {
        for (const entry of artifact.vocabulary.entries) {
            map.set(entry.name, entry.definition);
        }
    }
    return map;
}
// Resolve a term through Doctrine → Charter → Sigil chain.
// Returns true if the term is found at any layer.
function resolveTerm(term, sigilVocab, charterVocab, doctrineVocab) {
    return sigilVocab.has(term) || charterVocab.has(term) || doctrineVocab.has(term);
}
// ─── Identifier extraction ────────────────────────────────────────────────────
// Regex matching the IDENTIFIER token pattern: [A-Z][A-Za-z0-9]+
// (At least two characters — one uppercase, one or more alphanumeric)
const IDENTIFIER_RE = /\b([A-Z][A-Za-z0-9]+)\b/g;
// Extract all Capitalized identifiers from a free-text string.
function extractIdentifiers(text) {
    const matches = [];
    let m;
    IDENTIFIER_RE.lastIndex = 0;
    while ((m = IDENTIFIER_RE.exec(text)) !== null) {
        matches.push(m[1]);
    }
    return matches;
}
function provisionTexts(prov) {
    const texts = [];
    const body = prov.body;
    if (body.kind === 'behavior') {
        const b = body;
        for (const item of b.trigger.items) {
            texts.push({ text: item, pos: b.trigger.pos });
        }
        if (b.preconditions) {
            for (const item of b.preconditions.items) {
                texts.push({ text: item, pos: b.preconditions.pos });
            }
        }
        for (const item of b.postconditions.items) {
            texts.push({ text: item, pos: b.postconditions.pos });
        }
        if (b.invariants) {
            for (const item of b.invariants.items) {
                texts.push({ text: item, pos: b.invariants.pos });
            }
        }
    }
    else {
        const r = body;
        for (const item of r.preconditions.items) {
            texts.push({ text: item, pos: r.preconditions.pos });
        }
        for (const item of r.postconditions.items) {
            texts.push({ text: item, pos: r.postconditions.pos });
        }
        if (r.invariants) {
            for (const item of r.invariants.items) {
                texts.push({ text: item, pos: r.invariants.pos });
            }
        }
    }
    return texts;
}
// Collect all free-text strings from a sigil's invariants section.
function sigilInvariantTexts(sigil) {
    if (!sigil.invariants)
        return [];
    return sigil.invariants.items.map(item => ({ text: item, pos: sigil.invariants.pos }));
}
export function validate(manifest) {
    const errors = [];
    // ── Step 1: Load and parse doctrine ────────────────────────────────────────
    const doctrineSource = readFileSafe(manifest.doctrinePath, errors, {
        file: manifest.doctrinePath, line: 1, col: 1,
    });
    if (!doctrineSource)
        return { errors };
    const doctrineResult = parse(doctrineSource, manifest.doctrinePath);
    errors.push(...doctrineResult.errors);
    if (!doctrineResult.ast || doctrineResult.ast.kind !== 'doctrine') {
        errors.push({
            category: 'PARSE',
            message: `Expected a doctrine declaration in ${manifest.doctrinePath}`,
            pos: { file: manifest.doctrinePath, line: 1, col: 1 },
        });
        return { errors };
    }
    const doctrine = doctrineResult.ast;
    // ── Steps 2 & 3: Load charters and their sigils ────────────────────────────
    const charters = [];
    const sigilsByName = new Map();
    for (const charterRef of doctrine.charters) {
        const charterPath = join(manifest.chartersDir, `${charterRef.name}.charter`);
        const charterSource = readFileSafe(charterPath, errors, charterRef.pos);
        if (!charterSource) {
            errors.push({
                category: 'VALIDATION',
                message: `Charter '${charterRef.name}' referenced in doctrine but not found at ${charterPath}`,
                pos: charterRef.pos,
            });
            continue;
        }
        const charterResult = parse(charterSource, charterPath);
        errors.push(...charterResult.errors);
        if (!charterResult.ast || charterResult.ast.kind !== 'charter') {
            errors.push({
                category: 'PARSE',
                message: `Expected a charter declaration in ${charterPath}`,
                pos: charterRef.pos,
            });
            continue;
        }
        const charter = charterResult.ast;
        charters.push({ path: charterPath, ast: charter });
        // Version-pinned reference check for charters
        if (charterRef.version && charter.identity.version !== charterRef.version) {
            errors.push({
                category: 'VALIDATION',
                message: `Charter '${charterRef.name}' is pinned to version ${charterRef.version} but the file declares version ${charter.identity.version}`,
                pos: charterRef.pos,
            });
        }
        // Load sigils referenced by this charter
        for (const sigilRef of charter.sigils) {
            const sigilPath = join(manifest.sigilsDir, `${sigilRef.name}.sigil`);
            if (!sigilsByName.has(sigilRef.name)) {
                const sigilSource = readFileSafe(sigilPath, errors, sigilRef.pos);
                if (!sigilSource) {
                    errors.push({
                        category: 'VALIDATION',
                        message: `Sigil '${sigilRef.name}' referenced in charter '${charter.name}' but not found at ${sigilPath}`,
                        pos: sigilRef.pos,
                    });
                    continue;
                }
                const sigilResult = parse(sigilSource, sigilPath);
                errors.push(...sigilResult.errors);
                if (!sigilResult.ast || sigilResult.ast.kind !== 'sigil') {
                    errors.push({
                        category: 'PARSE',
                        message: `Expected a sigil declaration in ${sigilPath}`,
                        pos: sigilRef.pos,
                    });
                    continue;
                }
                sigilsByName.set(sigilRef.name, { path: sigilPath, ast: sigilResult.ast });
            }
            // Version-pinned reference check for sigils
            const loadedSigil = sigilsByName.get(sigilRef.name);
            if (loadedSigil && sigilRef.version && loadedSigil.ast.identity.version !== sigilRef.version) {
                errors.push({
                    category: 'VALIDATION',
                    message: `Sigil '${sigilRef.name}' is pinned to version ${sigilRef.version} but the file declares version ${loadedSigil.ast.identity.version}`,
                    pos: sigilRef.pos,
                });
            }
        }
    }
    // ── Step 4: Abort if any parse errors ─────────────────────────────────────
    // (parse errors already accumulated above — semantic checks only if clean)
    const hasParseErrors = errors.some(e => e.category === 'PARSE');
    if (hasParseErrors)
        return { errors };
    // ── Step 5: Vocabulary resolution ─────────────────────────────────────────
    const doctrineVocab = buildVocabMap(doctrine);
    for (const { ast: charter } of charters) {
        const charterVocab = buildVocabMap(charter);
        for (const sigilRef of charter.sigils) {
            const loaded = sigilsByName.get(sigilRef.name);
            if (!loaded)
                continue;
            const sigil = loaded.ast;
            const sigilVocab = buildVocabMap(sigil);
            // Check all Capitalized identifiers in provisions
            for (const prov of sigil.provisions) {
                for (const { text, pos } of provisionTexts(prov)) {
                    for (const term of extractIdentifiers(text)) {
                        if (!resolveTerm(term, sigilVocab, charterVocab, doctrineVocab)) {
                            errors.push({
                                category: 'VALIDATION',
                                message: `Identifier '${term}' in provision '${prov.name}' has no vocabulary entry in the resolution chain (sigil → charter → doctrine)`,
                                pos,
                            });
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
                            message: `Identifier '${term}' in sigil invariants of '${sigil.name}' has no vocabulary entry in the resolution chain`,
                            pos,
                        });
                    }
                }
            }
        }
    }
    return { errors };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function readFileSafe(filePath, errors, refPos) {
    try {
        return readFileSync(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=validator.js.map
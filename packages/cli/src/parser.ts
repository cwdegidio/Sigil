import { lex } from './lexer.js'
import {
  Token, TokenType, Position, SigilError,
  ParseResult, ArtifactFile,
  SigilFile, CharterFile, DoctrineFile,
  IdentitySection, VocabularySection, VocabularyEntry,
  ScopeSection, InvariantsSection, InvariantsField,
  ProvisionDeclaration, BehaviorBody, RuleBody,
  TriggerField, TriggerKind, PreconditionsField, PostconditionsField,
  MemberRef,
} from './types.js'

// ─── Parser ───────────────────────────────────────────────────────────────────
//
// Recursive descent parser. Consumes the token stream produced by the lexer
// and produces an AST or a list of parse errors.
//
// Strategy: errors are accumulated (not abort-on-first). When a parse error is
// encountered, the parser attempts to recover and continue, so all errors in a
// file are reported in one pass.
//
// The parser is structured around the grammar productions in spec §5–§8.
// ─────────────────────────────────────────────────────────────────────────────

export function parse(source: string, file: string): ParseResult<ArtifactFile> {
  const { tokens, errors: lexErrors } = lex(source, file)
  const errors: SigilError[] = [...lexErrors]

  let pos = 0

  // ── Cursor helpers ─────────────────────────────────────────────────────────

  function peek(): Token {
    return tokens[pos] ?? { type: 'EOF', value: '', pos: { file, line: 0, col: 0 } }
  }


  function advance(): Token {
    const t = tokens[pos]
    pos++
    return t
  }

  function check(type: TokenType, value?: string): boolean {
    const t = peek()
    return t.type === type && (value === undefined || t.value === value)
  }

  function checkKeyword(kw: string): boolean {
    return check('KEYWORD', kw)
  }

  function consume(type: TokenType, value?: string, errorMsg?: string): Token | null {
    if (check(type, value)) return advance()
    const t = peek()
    errors.push({
      category: 'PARSE',
      message: errorMsg ?? `Expected ${value ?? type} but got '${t.value || t.type}'`,
      pos: t.pos,
    })
    return null
  }

  function consumeKeyword(kw: string): Token | null {
    return consume('KEYWORD', kw, `Expected keyword '${kw}' but got '${peek().value || peek().type}'`)
  }

  function currentPos(): Position {
    return peek().pos
  }

  // Skip NEWLINE tokens (used after consuming a block's content line)
  function skipNewline(): void {
    while (check('NEWLINE')) advance()
  }

  // ── Indentation block helpers ──────────────────────────────────────────────

  // Consume INDENT, execute body fn, consume DEDENT.
  // Returns false if INDENT is not present (parse error emitted).
  function withBlock<T>(context: string, bodyFn: () => T): T | null {
    if (!check('INDENT')) {
      errors.push({
        category: 'PARSE',
        message: `Expected indented block after '${context}'`,
        pos: currentPos(),
      })
      return null
    }
    advance() // consume INDENT
    const result = bodyFn()
    // Consume DEDENT(s) — there may be multiple when nested blocks close
    if (!check('DEDENT')) {
      errors.push({
        category: 'PARSE',
        message: `Expected end of '${context}' block`,
        pos: currentPos(),
      })
    } else {
      advance() // consume DEDENT
    }
    return result
  }

  // ── List items ────────────────────────────────────────────────────────────

  // Parses one or more `- <free text>` items from an indented block.
  // Returns the text content of each item.
  function parseListItems(): string[] {
    const items: string[] = []
    while (check('DASH')) {
      advance() // consume DASH
      // Collect the rest of the line as free text.
      // Could be FREE_TEXT, or multiple tokens (e.g. keyword words in a sentence).
      items.push(collectLineAsText())
      skipNewline()
    }
    return items
  }

  // Parses one or more `- <member-ref>` items from an indented block.
  function parseMemberItems(): MemberRef[] {
    const refs: MemberRef[] = []
    while (check('DASH')) {
      advance() // consume DASH
      const refPos = currentPos()

      if (!check('IDENTIFIER')) {
        errors.push({
          category: 'PARSE',
          message: `Expected a member name (Capitalized identifier) after '-'`,
          pos: currentPos(),
        })
        // Skip to next line
        skipToNewline()
        skipNewline()
        continue
      }
      const nameTok = advance()
      const ref: MemberRef = { pos: refPos, name: nameTok.value }

      if (check('AT')) {
        advance() // consume @
        if (!check('VERSION')) {
          errors.push({
            category: 'PARSE',
            message: `Expected version number after '@' in member reference`,
            pos: currentPos(),
          })
        } else {
          ref.version = advance().value
        }
      }

      // Ensure nothing else on the line
      if (!check('NEWLINE') && !check('EOF') && !check('DEDENT')) {
        errors.push({
          category: 'PARSE',
          message: `Unexpected content after member reference '${ref.name}' — member references must be on their own line (e.g. '- ${ref.name}' or '- ${ref.name}@1.0').`,
          pos: currentPos(),
        })
        skipToNewline()
      }

      refs.push(ref)
      skipNewline()
    }
    return refs
  }

  // Collects everything up to NEWLINE/DEDENT/EOF as a single string.
  function collectLineAsText(): string {
    const parts: string[] = []
    while (!check('NEWLINE') && !check('EOF') && !check('INDENT') && !check('DEDENT')) {
      const t = advance()
      // Check for @ outside member-ref context
      if (t.type === 'AT') {
        errors.push({
          category: 'PARSE',
          message: `'@' is only valid in a member reference (e.g. Name@1.0)`,
          pos: t.pos,
        })
      }
      // Check for possessive suffix on an identifier
      if (t.type === 'IDENTIFIER') {
        const next = peek()
        if (next.type === 'FREE_TEXT' && /^'s(\s|$)/.test(next.value)) {
          errors.push({
            category: 'PARSE',
            message: `Possessive form '${t.value}'s' is not valid syntax. Use 'the [field] of the ${t.value}' or '${t.value} [field]' instead.`,
            pos: t.pos,
          })
        }
      }
      parts.push(t.value)
    }
    return parts.join(' ').trim()
  }

  function skipToNewline(): void {
    while (!check('NEWLINE') && !check('EOF') && !check('DEDENT')) {
      advance()
    }
  }

  // ── Shared section parsers ─────────────────────────────────────────────────

  // identity:
  //     version: X.X
  //     status: draft|active|deprecated
  //     description: "..."    (optional)
  function parseIdentitySection(): IdentitySection | null {
    const p = currentPos()
    if (!consumeKeyword('identity')) return null
    if (!consume('COLON')) return null
    skipNewline()

    let version: string | null = null
    let status: string | null = null
    let description: string | undefined

    const result = withBlock('identity:', () => {
      // version (required, must come first)
      if (!checkKeyword('version')) {
        errors.push({
          category: 'PARSE',
          message: `Expected 'version' field in identity section`,
          pos: currentPos(),
        })
      } else {
        advance() // version keyword
        consume('COLON')
        if (check('VERSION')) {
          version = advance().value
        } else {
          errors.push({
            category: 'PARSE',
            message: `Expected version number (e.g. 1.0) after 'version:'`,
            pos: currentPos(),
          })
          skipToNewline()
        }
        skipNewline()
      }

      // status (required, must come second)
      if (!checkKeyword('status')) {
        errors.push({
          category: 'PARSE',
          message: `Expected 'status' field after 'version' in identity section`,
          pos: currentPos(),
        })
      } else {
        advance() // status keyword
        consume('COLON')
        if (check('STATUS')) {
          status = advance().value
        } else {
          errors.push({
            category: 'PARSE',
            message: `Expected status value (draft, active, or deprecated) after 'status:'`,
            pos: currentPos(),
          })
          skipToNewline()
        }
        skipNewline()
      }

      // description (optional, must come after status)
      if (checkKeyword('description')) {
        advance() // description keyword
        consume('COLON')
        if (check('QUOTED_STR')) {
          description = advance().value.slice(1, -1) // strip outer quotes
        } else {
          errors.push({
            category: 'PARSE',
            message: `Expected a quoted string (e.g. "A brief description.") after 'description:'`,
            pos: currentPos(),
          })
          skipToNewline()
        }
        skipNewline()
      }

      // Out-of-order check: if any other identity field appears now, error
      const t = peek()
      if (t.type === 'KEYWORD' && (t.value === 'version' || t.value === 'status' || t.value === 'description')) {
        errors.push({
          category: 'PARSE',
          message: `Identity fields must appear in order: version, status, description`,
          pos: t.pos,
        })
      }
    })

    if (result === null) return null
    if (!version || !status) return null

    return { pos: p, version, status, description }
  }

  // vocabulary:
  //     TermName:
  //         definition: "..."
  function parseVocabularySection(): VocabularySection | null {
    const p = currentPos()
    if (!consumeKeyword('vocabulary')) return null
    if (!consume('COLON')) return null
    skipNewline()

    const entries: VocabularyEntry[] = []

    withBlock('vocabulary:', () => {
      // Must have at least one entry
      if (!check('IDENTIFIER')) {
        errors.push({
          category: 'PARSE',
          message: `Empty 'vocabulary:' block — at least one entry is required`,
          pos: currentPos(),
        })
        return
      }

      while (check('IDENTIFIER')) {
        const entryPos = currentPos()
        const nameTok = advance()
        consume('COLON')
        skipNewline()

        let definition = ''
        withBlock(`${nameTok.value}:`, () => {
          if (!checkKeyword('definition')) {
            errors.push({
              category: 'PARSE',
              message: `Expected 'definition:' field in vocabulary entry '${nameTok.value}'`,
              pos: currentPos(),
            })
            return
          }
          advance() // definition keyword
          consume('COLON')
          if (check('QUOTED_STR')) {
            definition = advance().value.slice(1, -1) // strip quotes
          } else {
            errors.push({
              category: 'PARSE',
              message: `Expected a quoted string (e.g. "The meaning of the term.") after 'definition:'`,
              pos: currentPos(),
            })
            skipToNewline()
          }
          skipNewline()
        })

        entries.push({ pos: entryPos, name: nameTok.value, definition })
        skipNewline()
      }
    })

    return { pos: p, entries }
  }

  // scope:
  //     excludes:
  //         - ...
  function parseScopeSection(): ScopeSection | null {
    const p = currentPos()
    if (!consumeKeyword('scope')) return null
    if (!consume('COLON')) return null
    skipNewline()

    const excludes: string[] = []

    withBlock('scope:', () => {
      if (!checkKeyword('excludes')) {
        errors.push({
          category: 'PARSE',
          message: `Expected 'excludes:' inside scope section`,
          pos: currentPos(),
        })
        return
      }
      advance() // excludes keyword
      consume('COLON')
      skipNewline()

      withBlock('excludes:', () => {
        if (!check('DASH')) {
          errors.push({
            category: 'PARSE',
            message: `Empty 'excludes:' block — at least one item is required`,
            pos: currentPos(),
          })
          return
        }
        excludes.push(...parseListItems())
      })
    })

    return { pos: p, excludes }
  }

  // invariants:
  //     - ...
  function parseInvariantsSection(): InvariantsSection | null {
    const p = currentPos()
    if (!consumeKeyword('invariants')) return null
    if (!consume('COLON')) return null
    skipNewline()

    const items: string[] = []

    withBlock('invariants:', () => {
      if (!check('DASH')) {
        errors.push({
          category: 'PARSE',
          message: `Empty 'invariants:' block — at least one item is required`,
          pos: currentPos(),
        })
        return
      }
      items.push(...parseListItems())
    })

    return { pos: p, items }
  }

  // ── Provision field parsers ────────────────────────────────────────────────

  // trigger: / trigger and: / trigger or:
  function parseTriggerField(): TriggerField | null {
    const p = currentPos()
    if (!checkKeyword('trigger')) return null
    advance() // trigger

    let kind: TriggerKind = 'single'

    if (checkKeyword('and')) {
      advance()
      kind = 'and'
    } else if (checkKeyword('or')) {
      advance()
      kind = 'or'
    }

    consume('COLON')
    skipNewline()

    const items: string[] = []
    const triggerContext = kind === 'single' ? 'trigger:' : `trigger ${kind}:`

    withBlock(triggerContext, () => {
      if (!check('DASH')) {
        errors.push({
          category: 'PARSE',
          message: `Empty 'trigger' block — at least one item is required`,
          pos: currentPos(),
        })
        return
      }
      items.push(...parseListItems())
    })

    // Validate item count
    if (kind === 'single' && items.length > 1) {
      errors.push({
        category: 'PARSE',
        message: `'trigger:' block must contain exactly one item; use 'trigger and:' or 'trigger or:' for multiple`,
        pos: p,
      })
    }
    if ((kind === 'and' || kind === 'or') && items.length < 2) {
      errors.push({
        category: 'PARSE',
        message: `'trigger ${kind}:' requires at least two items`,
        pos: p,
      })
    }

    return { pos: p, kind, items }
  }

  function parsePreconditionsField(): PreconditionsField | null {
    const p = currentPos()
    if (!checkKeyword('preconditions')) return null
    advance()
    consume('COLON')
    skipNewline()

    const items: string[] = []
    withBlock('preconditions:', () => {
      if (!check('DASH')) {
        errors.push({
          category: 'PARSE',
          message: `Empty 'preconditions:' block — at least one item is required`,
          pos: currentPos(),
        })
        return
      }
      items.push(...parseListItems())
    })

    return { pos: p, items }
  }

  function parsePostconditionsField(): PostconditionsField | null {
    const p = currentPos()
    if (!checkKeyword('postconditions')) return null
    advance()
    consume('COLON')
    skipNewline()

    const items: string[] = []
    withBlock('postconditions:', () => {
      if (!check('DASH')) {
        errors.push({
          category: 'PARSE',
          message: `Empty 'postconditions:' block — at least one item is required`,
          pos: currentPos(),
        })
        return
      }
      items.push(...parseListItems())
    })

    return { pos: p, items }
  }

  function parseInvariantsField(): InvariantsField | null {
    const p = currentPos()
    if (!checkKeyword('invariants')) return null
    advance()
    consume('COLON')
    skipNewline()

    const items: string[] = []
    withBlock('invariants:', () => {
      if (!check('DASH')) {
        errors.push({
          category: 'PARSE',
          message: `Empty 'invariants:' block — at least one item is required`,
          pos: currentPos(),
        })
        return
      }
      items.push(...parseListItems())
    })

    return { pos: p, items }
  }

  // ── Provision body ─────────────────────────────────────────────────────────

  // behavior body: trigger, preconditions?, postconditions, invariants?
  function parseBehaviorBody(): BehaviorBody | null {
    const trigger = parseTriggerField()
    if (!trigger) {
      errors.push({
        category: 'PARSE',
        message: `'behavior' provision requires a 'trigger' field`,
        pos: currentPos(),
      })
    }
    skipNewline()

    // Check for out-of-order fields
    let preconditions: PreconditionsField | undefined
    let postconditions: PostconditionsField | undefined
    let invariants: InvariantsField | undefined

    if (checkKeyword('preconditions')) {
      preconditions = parsePreconditionsField() ?? undefined
      skipNewline()
    }

    // Out-of-order check: invariants before postconditions
    if (checkKeyword('invariants') && !checkKeyword('postconditions')) {
      errors.push({
        category: 'PARSE',
        message: `'postconditions' must come before 'invariants' in a provision body`,
        pos: currentPos(),
      })
    }

    if (checkKeyword('postconditions')) {
      postconditions = parsePostconditionsField() ?? undefined
      skipNewline()
    } else {
      errors.push({
        category: 'PARSE',
        message: `'behavior' provision requires a 'postconditions' field`,
        pos: currentPos(),
      })
    }

    if (checkKeyword('invariants')) {
      invariants = parseInvariantsField() ?? undefined
      skipNewline()
    }

    if (!trigger || !postconditions) return null

    return { kind: 'behavior', trigger, preconditions, postconditions, invariants }
  }

  // rule body: preconditions, postconditions, invariants?
  function parseRuleBody(): RuleBody | null {
    const preconditions = parsePreconditionsField()
    if (!preconditions) {
      errors.push({
        category: 'PARSE',
        message: `'rule' provision requires a 'preconditions' field`,
        pos: currentPos(),
      })
    }
    skipNewline()

    if (checkKeyword('invariants') && !checkKeyword('postconditions')) {
      errors.push({
        category: 'PARSE',
        message: `'postconditions' must come before 'invariants' in a provision body`,
        pos: currentPos(),
      })
    }

    const postconditions = parsePostconditionsField()
    if (!postconditions) {
      errors.push({
        category: 'PARSE',
        message: `'rule' provision requires a 'postconditions' field`,
        pos: currentPos(),
      })
    }
    skipNewline()

    let invariants: InvariantsField | undefined
    if (checkKeyword('invariants')) {
      invariants = parseInvariantsField() ?? undefined
      skipNewline()
    }

    if (!preconditions || !postconditions) return null

    return { kind: 'rule', preconditions, postconditions, invariants }
  }

  // provision <Name> behavior|rule:
  //     <body>
  function parseProvision(): ProvisionDeclaration | null {
    const p = currentPos()
    if (!consumeKeyword('provision')) return null

    if (!check('IDENTIFIER')) {
      errors.push({
        category: 'PARSE',
        message: `Expected provision name (Capitalized identifier) after 'provision'`,
        pos: currentPos(),
      })
      skipToNewline()
      skipNewline()
      return null
    }
    const nameTok = advance()

    let subtype: 'behavior' | 'rule' | null = null
    if (checkKeyword('behavior')) {
      subtype = 'behavior'
      advance()
    } else if (checkKeyword('rule')) {
      subtype = 'rule'
      advance()
    } else {
      errors.push({
        category: 'PARSE',
        message: `Expected 'behavior' or 'rule' after provision name '${nameTok.value}'`,
        pos: currentPos(),
      })
      skipToNewline()
      skipNewline()
      return null
    }

    consume('COLON')
    skipNewline()

    let body: BehaviorBody | RuleBody | null = null
    withBlock(`provision ${nameTok.value} ${subtype}:`, () => {
      if (subtype === 'behavior') {
        body = parseBehaviorBody()
      } else {
        body = parseRuleBody()
      }
    })

    if (!body) return null
    return { pos: p, name: nameTok.value, body }
  }

  // ── Top-level declaration parsers ──────────────────────────────────────────

  function parseSigilDeclaration(): SigilFile | null {
    const p = currentPos()
    if (!consumeKeyword('sigil')) return null

    if (!check('IDENTIFIER')) {
      errors.push({
        category: 'PARSE',
        message: `Expected sigil name (Capitalized identifier) after 'sigil'`,
        pos: currentPos(),
      })
      return null
    }
    const nameTok = advance()
    consume('COLON')
    skipNewline()

    let identity: IdentitySection | null = null
    let vocabulary: VocabularySection | undefined
    let scope: ScopeSection | undefined
    const provisions: ProvisionDeclaration[] = []
    let invariants: InvariantsSection | undefined

    // Section order: identity → vocabulary? → scope? → provision+ → invariants?
    // Track which sections we've seen to detect out-of-order
    type SigilSection = 'identity' | 'vocabulary' | 'scope' | 'provision' | 'invariants'
    let lastSection: SigilSection | null = null

    function sectionOrder(s: SigilSection): number {
      return { identity: 0, vocabulary: 1, scope: 2, provision: 3, invariants: 4 }[s]
    }

    function checkSectionOrder(s: SigilSection): boolean {
      if (lastSection !== null && sectionOrder(s) < sectionOrder(lastSection)) {
        errors.push({
          category: 'PARSE',
          message: `Section '${s}' appears out of order — expected after '${lastSection}'; prescribed order is identity → vocabulary → scope → provision → invariants`,
          pos: currentPos(),
        })
        return false
      }
      lastSection = s
      return true
    }

    withBlock(`sigil ${nameTok.value}:`, () => {
      // identity (required)
      if (!checkKeyword('identity')) {
        errors.push({
          category: 'PARSE',
          message: `Sigil body must start with an 'identity:' section`,
          pos: currentPos(),
        })
      } else {
        checkSectionOrder('identity')
        identity = parseIdentitySection()
        skipNewline()
      }

      // Optional sections and provisions
      let keepGoing = true
      while (keepGoing && !check('EOF') && !check('DEDENT')) {
        if (checkKeyword('vocabulary')) {
          checkSectionOrder('vocabulary')
          vocabulary = parseVocabularySection() ?? undefined
          skipNewline()
        } else if (checkKeyword('scope')) {
          checkSectionOrder('scope')
          scope = parseScopeSection() ?? undefined
          skipNewline()
        } else if (checkKeyword('provision')) {
          checkSectionOrder('provision')
          const prov = parseProvision()
          if (prov) provisions.push(prov)
          skipNewline()
        } else if (checkKeyword('invariants')) {
          checkSectionOrder('invariants')
          invariants = parseInvariantsSection() ?? undefined
          skipNewline()
        } else {
          keepGoing = false
        }
      }

      if (provisions.length === 0) {
        errors.push({
          category: 'PARSE',
          message: `Sigil '${nameTok.value}' must contain at least one provision declaration`,
          pos: currentPos(),
        })
      }
    })

    if (!identity) return null

    return {
      kind: 'sigil',
      pos: p,
      name: nameTok.value,
      identity,
      vocabulary,
      scope,
      provisions,
      invariants,
    }
  }

  function parseCharterDeclaration(): CharterFile | null {
    const p = currentPos()
    if (!consumeKeyword('charter')) return null

    if (!check('IDENTIFIER')) {
      errors.push({
        category: 'PARSE',
        message: `Expected charter name (Capitalized identifier) after 'charter'`,
        pos: currentPos(),
      })
      return null
    }
    const nameTok = advance()
    consume('COLON')
    skipNewline()

    let identity: IdentitySection | null = null
    const sigils: MemberRef[] = []
    let vocabulary: VocabularySection | undefined
    let scope: ScopeSection | undefined
    let invariants: InvariantsSection | undefined

    // Section order: identity → sigils → vocabulary? → scope? → invariants?
    type CharterSection = 'identity' | 'sigils' | 'vocabulary' | 'scope' | 'invariants'
    let lastSection: CharterSection | null = null

    function sectionOrder(s: CharterSection): number {
      return { identity: 0, sigils: 1, vocabulary: 2, scope: 3, invariants: 4 }[s]
    }

    function checkSectionOrder(s: CharterSection): boolean {
      if (lastSection !== null && sectionOrder(s) < sectionOrder(lastSection)) {
        errors.push({
          category: 'PARSE',
          message: `Section '${s}' appears out of order — prescribed order is identity → sigils → vocabulary → scope → invariants`,
          pos: currentPos(),
        })
        return false
      }
      lastSection = s
      return true
    }

    withBlock(`charter ${nameTok.value}:`, () => {
      // identity (required)
      if (!checkKeyword('identity')) {
        errors.push({
          category: 'PARSE',
          message: `Charter body must start with an 'identity:' section`,
          pos: currentPos(),
        })
      } else {
        checkSectionOrder('identity')
        identity = parseIdentitySection()
        skipNewline()
      }

      // sigils (required)
      if (!checkKeyword('sigils')) {
        errors.push({
          category: 'PARSE',
          message: `Charter body requires a 'sigils:' section`,
          pos: currentPos(),
        })
      } else {
        checkSectionOrder('sigils')
        advance() // sigils keyword
        consume('COLON')
        skipNewline()
        withBlock('sigils:', () => {
          if (!check('DASH')) {
            errors.push({
              category: 'PARSE',
              message: `Empty 'sigils:' block — a Charter must list at least one member Sigil`,
              pos: currentPos(),
            })
            return
          }
          sigils.push(...parseMemberItems())
        })
        skipNewline()
      }

      // Optional sections
      let keepGoing = true
      while (keepGoing && !check('EOF') && !check('DEDENT')) {
        if (checkKeyword('vocabulary')) {
          checkSectionOrder('vocabulary')
          vocabulary = parseVocabularySection() ?? undefined
          skipNewline()
        } else if (checkKeyword('scope')) {
          checkSectionOrder('scope')
          scope = parseScopeSection() ?? undefined
          skipNewline()
        } else if (checkKeyword('invariants')) {
          checkSectionOrder('invariants')
          invariants = parseInvariantsSection() ?? undefined
          skipNewline()
        } else {
          keepGoing = false
        }
      }
    })

    if (!identity) return null

    return { kind: 'charter', pos: p, name: nameTok.value, identity, sigils, vocabulary, scope, invariants }
  }

  function parseDoctrineDeclaration(): DoctrineFile | null {
    const p = currentPos()
    if (!consumeKeyword('doctrine')) return null

    if (!check('IDENTIFIER')) {
      errors.push({
        category: 'PARSE',
        message: `Expected doctrine name (Capitalized identifier) after 'doctrine'`,
        pos: currentPos(),
      })
      return null
    }
    const nameTok = advance()
    consume('COLON')
    skipNewline()

    let identity: IdentitySection | null = null
    const charters: MemberRef[] = []
    let vocabulary: VocabularySection | undefined
    let scope: ScopeSection | undefined
    let invariants: InvariantsSection | undefined

    // Section order: identity → charters → vocabulary? → scope? → invariants?
    type DoctrineSection = 'identity' | 'charters' | 'vocabulary' | 'scope' | 'invariants'
    let lastSection: DoctrineSection | null = null

    function sectionOrder(s: DoctrineSection): number {
      return { identity: 0, charters: 1, vocabulary: 2, scope: 3, invariants: 4 }[s]
    }

    function checkSectionOrder(s: DoctrineSection): boolean {
      if (lastSection !== null && sectionOrder(s) < sectionOrder(lastSection)) {
        errors.push({
          category: 'PARSE',
          message: `Section '${s}' appears out of order — prescribed order is identity → charters → vocabulary → scope → invariants`,
          pos: currentPos(),
        })
        return false
      }
      lastSection = s
      return true
    }

    withBlock(`doctrine ${nameTok.value}:`, () => {
      // identity (required)
      if (!checkKeyword('identity')) {
        errors.push({
          category: 'PARSE',
          message: `Doctrine body must start with an 'identity:' section`,
          pos: currentPos(),
        })
      } else {
        checkSectionOrder('identity')
        identity = parseIdentitySection()
        skipNewline()
      }

      // charters (required)
      if (!checkKeyword('charters')) {
        errors.push({
          category: 'PARSE',
          message: `Doctrine body requires a 'charters:' section`,
          pos: currentPos(),
        })
      } else {
        checkSectionOrder('charters')
        advance() // charters keyword
        consume('COLON')
        skipNewline()
        withBlock('charters:', () => {
          if (!check('DASH')) {
            errors.push({
              category: 'PARSE',
              message: `Empty 'charters:' block — a Doctrine must list at least one member Charter`,
              pos: currentPos(),
            })
            return
          }
          charters.push(...parseMemberItems())
        })
        skipNewline()
      }

      // Optional sections
      let keepGoing = true
      while (keepGoing && !check('EOF') && !check('DEDENT')) {
        if (checkKeyword('vocabulary')) {
          checkSectionOrder('vocabulary')
          vocabulary = parseVocabularySection() ?? undefined
          skipNewline()
        } else if (checkKeyword('scope')) {
          checkSectionOrder('scope')
          scope = parseScopeSection() ?? undefined
          skipNewline()
        } else if (checkKeyword('invariants')) {
          checkSectionOrder('invariants')
          invariants = parseInvariantsSection() ?? undefined
          skipNewline()
        } else {
          keepGoing = false
        }
      }
    })

    if (!identity) return null

    return { kind: 'doctrine', pos: p, name: nameTok.value, identity, charters, vocabulary, scope, invariants }
  }

  // ── Entry point ────────────────────────────────────────────────────────────

  skipNewline()

  let ast: ArtifactFile | null = null

  if (checkKeyword('sigil')) {
    ast = parseSigilDeclaration()
  } else if (checkKeyword('charter')) {
    ast = parseCharterDeclaration()
  } else if (checkKeyword('doctrine')) {
    ast = parseDoctrineDeclaration()
  } else {
    errors.push({
      category: 'PARSE',
      message: `Expected 'sigil', 'charter', or 'doctrine' declaration at top level`,
      pos: currentPos(),
    })
  }

  skipNewline()

  // Check for a second declaration (§3: each file contains exactly one)
  if (!check('EOF') && (checkKeyword('sigil') || checkKeyword('charter') || checkKeyword('doctrine'))) {
    errors.push({
      category: 'PARSE',
      message: `Each file must contain exactly one declaration; found additional declaration`,
      pos: currentPos(),
    })
  }

  return { ast, errors }
}

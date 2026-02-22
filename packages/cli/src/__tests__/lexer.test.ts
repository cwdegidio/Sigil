import { describe, it, expect } from 'vitest'
import { lex } from '../lexer.js'
import { Token, TokenType } from '../types.js'

// Helper: extract just type+value pairs for compact assertions
function tokenSummary(tokens: Token[]): Array<[TokenType, string]> {
  return tokens.map(t => [t.type, t.value])
}

describe('lexer', () => {
  describe('basic token recognition', () => {
    it('tokenizes a simple sigil declaration header', () => {
      const { tokens, errors } = lex('sigil Checkout:', 'test.sigil')
      expect(errors).toHaveLength(0)
      const summary = tokenSummary(tokens)
      expect(summary).toContainEqual(['KEYWORD', 'sigil'])
      expect(summary).toContainEqual(['IDENTIFIER', 'Checkout'])
      expect(summary).toContainEqual(['COLON', ':'])
      expect(summary).toContainEqual(['EOF', ''])
    })

    it('recognizes STATUS tokens (draft, active, deprecated)', () => {
      for (const status of ['draft', 'active', 'deprecated']) {
        const { tokens } = lex(`status: ${status}`, 'test.sigil')
        const types = tokenSummary(tokens)
        expect(types).toContainEqual(['STATUS', status])
      }
    })

    it('recognizes VERSION tokens', () => {
      const { tokens } = lex('version: 1.0', 'test.sigil')
      const types = tokenSummary(tokens)
      expect(types).toContainEqual(['VERSION', '1.0'])
    })

    it('recognizes QUOTED_STR tokens', () => {
      const { tokens } = lex('description: "A test description."', 'test.sigil')
      const types = tokenSummary(tokens)
      expect(types).toContainEqual(['QUOTED_STR', '"A test description."'])
    })

    it('recognizes all known keywords', () => {
      const keywords = [
        'sigil', 'charter', 'doctrine', 'provision',
        'identity', 'vocabulary', 'scope', 'invariants',
        'trigger', 'preconditions', 'postconditions',
        'behavior', 'rule', 'and', 'or', 'excludes',
        'version', 'status', 'description', 'definition',
        'sigils', 'charters',
      ]
      for (const kw of keywords) {
        const { tokens } = lex(kw, 'test.sigil')
        const types = tokenSummary(tokens)
        expect(types).toContainEqual(['KEYWORD', kw])
      }
    })

    it('emits DASH for list item markers', () => {
      const { tokens } = lex('- User submits the form', 'test.sigil')
      const summary = tokenSummary(tokens)
      expect(summary[0]).toEqual(['DASH', '-'])
    })

    it('emits AT token', () => {
      const { tokens } = lex('- Checkout@1.2', 'test.sigil')
      const summary = tokenSummary(tokens)
      expect(summary).toContainEqual(['AT', '@'])
      expect(summary).toContainEqual(['VERSION', '1.2'])
    })
  })

  describe('indentation', () => {
    it('emits INDENT and DEDENT for indented blocks', () => {
      const src = [
        'sigil Checkout:',
        '    identity:',
      ].join('\n')
      const { tokens, errors } = lex(src, 'test.sigil')
      expect(errors).toHaveLength(0)
      const types = tokens.map(t => t.type)
      expect(types).toContain('INDENT')
      expect(types).toContain('DEDENT')
    })

    it('emits DEDENT when returning to root level', () => {
      const src = [
        'sigil Checkout:',
        '    identity:',
        'scope:',
      ].join('\n')
      const { tokens } = lex(src, 'test.sigil')
      const types = tokens.map(t => t.type)
      const indentCount = types.filter(t => t === 'INDENT').length
      const dedentCount = types.filter(t => t === 'DEDENT').length
      expect(dedentCount).toBeGreaterThanOrEqual(indentCount)
    })

    it('skips blank lines without affecting indent stack', () => {
      const src = [
        'sigil Checkout:',
        '',
        '    identity:',
      ].join('\n')
      const { tokens, errors } = lex(src, 'test.sigil')
      expect(errors).toHaveLength(0)
      expect(tokens.map(t => t.type)).toContain('INDENT')
    })

    it('emits PARSE error for tab indentation', () => {
      const src = 'sigil Checkout:\n\tidentity:'
      const { errors } = lex(src, 'test.sigil')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toMatch(/tab/i)
    })

    it('emits PARSE error for inconsistent indentation', () => {
      // First indented block uses 4 spaces, second uses 6 spaces (not a multiple of 4)
      const src = [
        'sigil Checkout:',
        '    identity:',
        '      version: 1.0',
      ].join('\n')
      const { errors } = lex(src, 'test.sigil')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toMatch(/inconsistent indentation/i)
    })
  })

  describe('position tracking', () => {
    it('reports correct line numbers', () => {
      const src = ['sigil Checkout:', '    identity:'].join('\n')
      const { tokens } = lex(src, 'test.sigil')
      const identityKw = tokens.find(t => t.type === 'KEYWORD' && t.value === 'identity')
      expect(identityKw?.pos.line).toBe(2)
    })

    it('reports correct column numbers', () => {
      const src = 'sigil Checkout:'
      const { tokens } = lex(src, 'test.sigil')
      const identifierTok = tokens.find(t => t.type === 'IDENTIFIER')
      expect(identifierTok?.pos.col).toBe(7) // "sigil " = 6 chars, Checkout starts at col 7
    })

    it('includes file name in all token positions', () => {
      const { tokens } = lex('sigil Checkout:', 'myfile.sigil')
      for (const t of tokens.filter(t => t.type !== 'EOF')) {
        expect(t.pos.file).toBe('myfile.sigil')
      }
    })
  })

  describe('FREE_TEXT handling', () => {
    it('collects non-structured content after a dash as FREE_TEXT or word tokens', () => {
      const src = '- User submits the checkout form'
      const { tokens, errors } = lex(src, 'test.sigil')
      expect(errors).toHaveLength(0)
      // DASH should be first
      expect(tokens[0].type).toBe('DASH')
      // Remaining tokens combined should reconstruct the text
      const textTokens = tokens.slice(1).filter(t => !['NEWLINE', 'EOF'].includes(t.type))
      const reconstructed = textTokens.map(t => t.value).join(' ')
      expect(reconstructed).toContain('submits')
    })

    it('treats status words in free text as FREE_TEXT rather than STATUS tokens', () => {
      // "draft" appears mid-sentence — should not be STATUS
      const src = '- Order is in draft state awaiting review'
      const { tokens } = lex(src, 'test.sigil')
      // The word "draft" embedded in a sentence should produce FREE_TEXT (not STATUS)
      // since it's followed by more word characters in the sentence context
      const statuses = tokens.filter(t => t.type === 'STATUS' && t.value === 'draft')
      expect(statuses).toHaveLength(0)
    })
  })
})

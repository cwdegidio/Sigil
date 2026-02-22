import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadManifest } from '../manifest.js'
import { validate } from '../validator.js'

// ─── Fixture corpus builder ───────────────────────────────────────────────────

interface CorpusFiles {
  doctrine: string
  charters: Record<string, string>
  sigils: Record<string, string>
}

function buildCorpus(dir: string, corpus: CorpusFiles): string {
  const chartersDir = join(dir, 'charters')
  const sigilsDir = join(dir, 'sigils')
  mkdirSync(chartersDir, { recursive: true })
  mkdirSync(sigilsDir, { recursive: true })

  writeFileSync(join(dir, 'ECommerce.doctrine'), corpus.doctrine)
  for (const [name, content] of Object.entries(corpus.charters)) {
    writeFileSync(join(chartersDir, `${name}.charter`), content)
  }
  for (const [name, content] of Object.entries(corpus.sigils)) {
    writeFileSync(join(sigilsDir, `${name}.sigil`), content)
  }

  const manifestContent = `
[project]
name = "ECommerce"
doctrine = "ECommerce.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
`.trim()
  const manifestPath = join(dir, 'sigil.toml')
  writeFileSync(manifestPath, manifestContent)
  return manifestPath
}

// ─── Fixture content ──────────────────────────────────────────────────────────

const DOCTRINE_CONTENT = `\
doctrine ECommerce:
    identity:
        version: 1.0
        status: draft
    charters:
        - OrderManagement
    vocabulary:
        Currency:
            definition: "The platform denomination."
`

const CHARTER_CONTENT = `\
charter OrderManagement:
    identity:
        version: 1.0
        status: draft
    sigils:
        - Checkout
    vocabulary:
        User:
            definition: "An authenticated account holder."
        Order:
            definition: "A confirmed purchase record."
        Cart:
            definition: "A transient collection of items."
`

const SIGIL_CONTENT = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    vocabulary:
        Pending:
            definition: "The initial Order status."
    provision PlaceOrder behavior:
        trigger:
            - User submits the checkout form
        preconditions:
            - Cart is not empty
        postconditions:
            - Order is created with status Pending
            - Cart is cleared
`

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validator', () => {
  describe('clean corpus', () => {
    it('returns no errors for a fully valid corpus', () => {
      const dir = join(tmpdir(), `sigil-validator-clean-${Date.now()}`)
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: DOCTRINE_CONTENT,
          charters: { OrderManagement: CHARTER_CONTENT },
          sigils: { Checkout: SIGIL_CONTENT },
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        expect(errors).toHaveLength(0)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })
  })

  describe('missing file errors', () => {
    it('emits VALIDATION error when a referenced charter is missing', () => {
      const dir = join(tmpdir(), `sigil-validator-missing-charter-${Date.now()}`)
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: DOCTRINE_CONTENT,
          charters: {}, // OrderManagement missing
          sigils: {},
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        expect(errors.some(e => e.category === 'VALIDATION' && e.message.match(/OrderManagement/i))).toBe(true)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('emits VALIDATION error when a referenced sigil is missing', () => {
      const dir = join(tmpdir(), `sigil-validator-missing-sigil-${Date.now()}`)
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: DOCTRINE_CONTENT,
          charters: { OrderManagement: CHARTER_CONTENT },
          sigils: {}, // Checkout missing
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        expect(errors.some(e => e.category === 'VALIDATION' && e.message.match(/Checkout/i))).toBe(true)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })
  })

  describe('vocabulary resolution', () => {
    it('emits VALIDATION error for an unresolvable identifier in a provision', () => {
      const dir = join(tmpdir(), `sigil-validator-vocab-${Date.now()}`)
      const sigilWithUnknownTerm = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits the checkout form
        postconditions:
            - UnknownTerm is created
`
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: DOCTRINE_CONTENT,
          charters: { OrderManagement: CHARTER_CONTENT },
          sigils: { Checkout: sigilWithUnknownTerm },
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        expect(errors.some(e => e.category === 'VALIDATION' && e.message.match(/UnknownTerm/i))).toBe(true)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('resolves a term defined at the doctrine layer', () => {
      // Currency is defined in the doctrine vocabulary; sigil references it
      const dir = join(tmpdir(), `sigil-validator-doctrine-vocab-${Date.now()}`)
      const sigilWithDoctrineVocab = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits the checkout form
        postconditions:
            - Order total is expressed in Currency
`
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: DOCTRINE_CONTENT,
          charters: { OrderManagement: CHARTER_CONTENT },
          sigils: { Checkout: sigilWithDoctrineVocab },
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        // Currency is defined in doctrine — no validation error expected for it
        const currencyErrors = errors.filter(e => e.message.match(/Currency/i))
        expect(currencyErrors).toHaveLength(0)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('resolves a term defined at the charter layer', () => {
      // Order is defined in charter vocabulary
      const dir = join(tmpdir(), `sigil-validator-charter-vocab-${Date.now()}`)
      const sigilUsingCharterTerm = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: DOCTRINE_CONTENT,
          charters: { OrderManagement: CHARTER_CONTENT },
          sigils: { Checkout: sigilUsingCharterTerm },
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        const orderErrors = errors.filter(e => e.message.match(/\bOrder\b/))
        expect(orderErrors).toHaveLength(0)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })
  })

  describe('version-pinned references', () => {
    it('emits VALIDATION error when pinned version does not match file version', () => {
      const dir = join(tmpdir(), `sigil-validator-version-${Date.now()}`)
      const doctrineWithPinnedCharter = `\
doctrine ECommerce:
    identity:
        version: 1.0
        status: draft
    charters:
        - OrderManagement@2.0
`
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: doctrineWithPinnedCharter,
          charters: { OrderManagement: CHARTER_CONTENT }, // version is 1.0
          sigils: { Checkout: SIGIL_CONTENT },
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        expect(errors.some(e =>
          e.category === 'VALIDATION' && e.message.match(/OrderManagement/) && e.message.match(/2\.0/)
        )).toBe(true)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })

    it('accepts a version-pinned reference that matches', () => {
      const dir = join(tmpdir(), `sigil-validator-version-match-${Date.now()}`)
      const doctrineWithMatchingPin = `\
doctrine ECommerce:
    identity:
        version: 1.0
        status: draft
    charters:
        - OrderManagement@1.0
    vocabulary:
        Currency:
            definition: "The platform denomination."
`
      try {
        const manifestPath = buildCorpus(dir, {
          doctrine: doctrineWithMatchingPin,
          charters: { OrderManagement: CHARTER_CONTENT },
          sigils: { Checkout: SIGIL_CONTENT },
        })
        const manifest = loadManifest(manifestPath)
        const { errors } = validate(manifest)
        const versionErrors = errors.filter(e => e.message.match(/pinned|version/i))
        expect(versionErrors).toHaveLength(0)
      } finally {
        rmSync(dir, { recursive: true })
      }
    })
  })
})

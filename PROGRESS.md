# Sigil — Progress

## Current Phase

**Phase 1 — Language Design**

## Status

All four layer anatomies defined. Sigil identity, scope, Charter anatomy, and Doctrine anatomy are complete. Next decision: example-first or grammar-first ordering before drafting either artifact.

## Active Work

- [x] Define Sigil identity anatomy (what goes in the `identity` section beyond name and version)
- [x] Define Sigil-level scope section
- [x] Define Charter anatomy
- [x] Define Doctrine anatomy
- [x] Decide ordering: example-first or grammar-first → chose interleaved (Option C)
- [x] Write first annotated example sigil (`docs/examples/Checkout.sigil`)
- [x] Draft grammar v0.1 (`spec/grammar.md`) — Sigil layer complete, all open questions resolved
- [ ] Expand example to include `vocabulary` and `scope` sections
- [ ] Expand grammar to cover `vocabulary-section` and `scope-section`
- [ ] Draft grammar for Charter layer
- [ ] Draft grammar for Doctrine layer
- [ ] Define Sigil membership reference syntax (name-only vs. name+version) in grammar

## Open Questions

- How are Sigil clauses referenced from scenario tests? (reference syntax not yet defined)
- How will AI agents know how to discover, load, and validate against Sigil files? (deferred — tooling/integration question, not a language design question; address after grammar is defined)

## Completed

- [x] Project name decided: **Sigil**
- [x] `README.md` written
- [x] `CLAUDE.md` written
- [x] `docs/inception.md` written
- [x] `PROGRESS.md` and `docs/journal.md` structure defined
- [x] `docs/design-decisions.md` created
- [x] DD-001: Scope — general-purpose
- [x] DD-002: Primary consumer — human and AI agent equally
- [x] DD-003: Adoption model — open standard
- [x] DD-004: Syntax strategy — single canonical syntax
- [x] DD-005: Tiebreaker — parse-first
- [x] DD-006/008: Four-layer composition model (Provision → Sigil → Charter → Doctrine)
- [x] DD-007/009: Layer naming — Doctrine / Charter / Sigil / Provision
- [x] DD-010: Vocabulary as first-class section at Doctrine, Charter, Sigil levels
- [x] DD-011: Vocabulary scoping — full replacement, no inheritance
- [x] DD-012: Minimal valid Sigil — Identity + at least one Provision
- [x] DD-013: Casing convention — lowercase keywords, Capitalized entities
- [x] DD-014: Provision sub-types — `behavior` and `rule`
- [x] DD-015: Provision invariants are optional
- [x] DD-016: Provision identity — name only
- [x] DD-017: Provision field requirements by sub-type
- [x] DD-018: Versioning scheme — X.X, constrict = major, expand = minor, all layers
- [x] DD-019: File conventions — `.sigil`, `.charter`, `.doctrine` extensions; separate files per version
- [x] DD-020: Sigil identity anatomy — name, version, status (required: draft/active/deprecated), description (optional)
- [x] DD-021: Sigil scope — exclusions only; disavowal of responsibility, not absence inventory
- [x] DD-022: Charter anatomy — identity, sigils (≥1, Charter-owns), vocabulary, invariants, scope; name-only or pinned version references
- [x] DD-023: Doctrine anatomy — mirrors Charter with charters (≥1) in place of sigils; vocabulary is resolution chain root

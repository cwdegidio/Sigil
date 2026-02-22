# Sigil — Progress

## Current Phase

**Phase 1 — Language Design**

## Status

Grammar complete for all four layers. All active grammar tasks resolved. Scenario testing model finalized (DD-038). Phase 1 language design is substantially complete.

## Active Work

- [x] Define Sigil identity anatomy (what goes in the `identity` section beyond name and version)
- [x] Define Sigil-level scope section
- [x] Define Charter anatomy
- [x] Define Doctrine anatomy
- [x] Decide ordering: example-first or grammar-first → chose interleaved (Option C)
- [x] Write first annotated example sigil (`docs/examples/Checkout.sigil`)
- [x] Draft grammar v0.1 (`spec/sigil-grammar.md`) — Sigil layer complete, all open questions resolved
- [x] Expand example to include `vocabulary` and `scope` sections
- [x] Expand grammar to cover `vocabulary-section` and `scope-section`
- [x] Define membership reference syntax → `Name` (current) or `Name@X.X` (pinned), `@` operator (DD-036)
- [x] Draft grammar for Charter layer (`spec/charter-grammar.md`)
- [x] Draft grammar for Doctrine layer (`spec/doctrine-grammar.md`)
- [x] Resolve scenario testing model → behavioral acceptance tests, decoupled from spec (DD-038)
- [ ] Write annotated Charter example
- [ ] Write annotated Doctrine example
- [ ] Determine Phase 2 scope

## Open Questions

- How will AI agents know how to discover, load, and validate against Sigil files? (deferred — tooling/integration question, not a language design question; address after grammar is defined)

## Completed

- [x] Project name decided: **Sigil**
- [x] `README.md` written
- [x] `CLAUDE.md` written
- [x] `docs/inception.md` written
- [x] `PROGRESS.md` and `docs/journal.md` structure defined
- [x] `docs/design-decisions.md` created
- [x] DD-001 through DD-038 logged

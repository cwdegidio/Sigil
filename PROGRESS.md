# Sigil — Progress

## Current Phase

**Phase 2 — Formal Specification**

## Status

Phase 1 complete. All four-layer grammar defined, annotated examples written for all three file types (Sigil, Charter, Doctrine), DD-001 through DD-038 logged, and scenario testing model finalized. Phase 2 begins: convert grammar files and design decisions into a publishable, implementor-facing specification.

## Phase 2 Plan

A → B → C

- **A — Formal spec document** ✓ complete
- **B — Reference parser/validator** ✓ complete
- **C — Language extensions** ← next

## Active Work

- [x] Define formal spec document structure and outline
- [x] Draft `spec/language-spec.md` — unified narrative spec covering all four layers
- [x] Define validation rule taxonomy (parse error vs. validation error)
- [x] Document vocabulary resolution chain formally (Doctrine → Charter → Sigil)
- [x] Document membership reference resolution formally
- [x] Define error catalog
- [x] Plan Phase 2B — reference parser/validator (language, scope, parse-only vs. full validation)
- [x] Implement Phase 2B — `@sigil-lang/cli` TypeScript reference parser/validator

## Phase 2B Plan (locked)

| Decision | Choice |
|---|---|
| Scope | Full validation — parse errors + semantic validation |
| Discovery | Manifest file (TOML) |
| Manifest content | Root doctrine + search paths, relative to manifest location |
| Implementation language | TypeScript |
| Distribution | `@sigil-lang/cli` via npm |
| CLI invocation | `sigil validate <path-to-manifest>` |
| Output format | Human-readable, compiler-style (`file:line:col — [type]: message`) |
| Initial IDE target | VS Code (IntelliJ via CLI subprocess later) |

## Open Questions

- None active. Previous agent discovery question resolved by manifest-based corpus discovery (DD-041, DD-043).

## Completed — Phase 1

- [x] Project name decided: **Sigil**
- [x] `README.md` written
- [x] `CLAUDE.md` written
- [x] `docs/inception.md` written
- [x] `PROGRESS.md` and `docs/journal.md` structure defined
- [x] `docs/design-decisions.md` created
- [x] DD-001 through DD-038 logged
- [x] Decide ordering: example-first or grammar-first → chose interleaved (Option C)
- [x] Write annotated Sigil example (`docs/examples/Checkout.sigil`)
- [x] Write annotated Charter example (`docs/examples/OrderManagement.charter`)
- [x] Write annotated Doctrine example (`docs/examples/ECommerce.doctrine`)
- [x] Draft Sigil grammar (`spec/sigil-grammar.md`) — all sections complete
- [x] Draft Charter grammar (`spec/charter-grammar.md`)
- [x] Draft Doctrine grammar (`spec/doctrine-grammar.md`)
- [x] Define membership reference syntax — `Name` (current) or `Name@X.X` (pinned), `@` operator (DD-036)
- [x] Resolve scenario testing model — behavioral acceptance tests, decoupled from spec clauses (DD-038)

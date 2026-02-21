# Sigil — Project Journal

_A timestamped record of sessions, decisions, and dead ends. Append only — never overwrite history._

---

## 2026-02-21 — Project Inception

**Contributors:** Engineer, Claude

### Summary

Project originated from a conversation about how AI is reshaping software development. The central problem identified: as specs replace code as the primary engineering artifact, natural language ambiguity becomes a critical failure point. Decided to design a formalized specification language to close the gap between human intent and agentic execution.

### Key Decisions

- Language name: **Sigil** — chosen for its metaphorical depth (a symbol with precise, defined meaning) and useful naming derivatives (specs are "sigils," a validated spec is a "sealed sigil")
- Specs written in Sigil are called **sigils**
- Design priority order: rigor → readability → consistency → token efficiency
- Claude's role: co-author, documentation writer, and test case generator
- Claude always asks before proceeding at design forks rather than assuming

### Open Questions Carried Forward

- Target scope (general vs. domain-specific first)
- Primary consumer (human vs. AI agent vs. both)
- Adoption model (internal vs. open)

### Files Created

- `README.md`
- `CLAUDE.md`
- `PROGRESS.md`
- `docs/inception.md`
- `docs/journal.md`

---

## 2026-02-21 — Phase 0 Close / Phase 1 Open

**Contributors:** Engineer, Claude

### Summary

Resolved the three open questions carried forward from inception. Logged five foundational design decisions (DD-001 through DD-005). Project is now in Phase 1 — Language Design.

### Key Decisions

- **DD-001** Scope: general-purpose — no domain-specific assumptions
- **DD-002** Primary consumer: human and AI agent equally — single language, no privileged consumer
- **DD-003** Adoption model: open standard — no institutional context assumed, all conventions explicit
- **DD-004** Syntax strategy: single canonical syntax — one form serves both consumers
- **DD-005** Tiebreaker: parse-first — unambiguity beats readability when they conflict

### Design Notes

The parse-first tiebreaker (DD-005) is load-bearing. It's what makes the single-syntax ambition (DD-004) viable. Without it, the tension between human readability and machine parseability would have no principled resolution and would recur as a conflict in every syntax decision.

### Next

Define the anatomy of a sigil — what a minimal but complete sigil looks like. This drives all subsequent construct and syntax decisions.

---

## 2026-02-21 — Phase 1 Session 1: Composition Model and Provision Anatomy

**Contributors:** Engineer, Claude

### Summary

Defined the full composition model and completed the Provision anatomy. The language now has a clear structural skeleton from the atomic unit up to the platform level.

### Key Decisions

- **DD-008**: Four-layer model — Provision → Sigil → Charter → Doctrine. Each layer has first-class properties: vocabulary, invariants, scope.
- **DD-009**: Layer naming — Doctrine (platform), Charter (bounded context), Sigil (feature), Provision (atomic).
- **DD-010/011**: Vocabulary is first-class at Doctrine/Charter/Sigil. Full replacement scoping, no inheritance. Sigil-level definitions override Charter, which overrides Doctrine.
- **DD-012**: Minimal valid Sigil requires only Identity + one Provision.
- **DD-013**: Casing convention — lowercase = keywords, Capitalized = defined entities. Undefined capitalized terms are validation errors.
- **DD-014**: Provision has two sub-types: `behavior` (event-driven, has trigger) and `rule` (declarative implication, no trigger).
- **DD-015/016/017**: Provision anatomy finalized — invariants optional, identity is name only, field requirements differ by sub-type.

### Design Notes

The distinction between `rule` and Sigil-level invariant is structurally enforced: a `rule` without `preconditions` is a validation error. This prevents ambiguity about which construct to use for unconditional guarantees.

The casing convention (DD-013) resolves keyword collision broadly and doubles as a readability signal — readers can immediately distinguish grammar from defined concepts.

### Next

Define Sigil anatomy — identity, vocabulary, scope, invariants. Then Charter and Doctrine.

---

## 2026-02-21 — Phase 1 Session 2: Versioning, File Conventions, and Open Questions

**Contributors:** Engineer, Claude

### Summary

Resolved versioning strategy and file format conventions. Identified and deferred the AI agent consumption question. Session ended before starting Sigil identity anatomy.

### Key Decisions

- **DD-018**: Versioning scheme — `X.X` format applied at Sigil, Charter, and Doctrine levels. Major bump = constricting change (removes or tightens guarantees, consumers may break). Minor bump = expanding change (adds or extends guarantees, consumers cannot break). Initial version `1.0`.
- **DD-019**: File conventions — layer-specific extensions (`.sigil`, `.charter`, `.doctrine`). Current version uses name only (`Checkout.sigil`); historical versions embed version in filename (`Checkout.1.2.sigil`). Provisions live inside Sigil files, not as standalone files.

### Design Notes

The constrict/expand versioning framing is more precise than "add/remove vs. modify" because it maps directly to consumer impact rather than the structural nature of the change. A modification that tightens a guarantee is breaking; one that loosens it is not.

Layer-specific file extensions were chosen over directory-structure conventions to avoid baking repository layout assumptions into an open standard (would violate DD-003).

### Deferred

- AI agent consumption model: how agents discover, load, and validate against Sigil files. Tooling/integration question — address after grammar is defined.

### Next

Define Sigil identity anatomy — what the `identity` section contains beyond the already-settled name and version fields.

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

---

## 2026-02-21 — Phase 1 Session 3: Layer Anatomies

**Contributors:** Engineer, Claude

### Summary

Completed the anatomy definitions for all four layers. The structural skeleton of the language is now fully defined from Provision up to Doctrine.

### Key Decisions

- **DD-020**: Sigil identity anatomy — four fields: `name` (required), `version` (required, X.X), `status` (required: `draft` | `active` | `deprecated`), `description` (optional, human-facing only). Tags were considered and rejected — no concrete use case that isn't already served by the composition model or vocabulary.
- **DD-021**: Sigil scope — exclusions only. An exclusion is an explicit disavowal of responsibility, not a negative inventory of absent provisions. Inclusions are redundant with provisions. Referential syntax deferred to grammar phase.
- **DD-022**: Charter anatomy — `identity`, `sigils` (required, ≥1), `vocabulary`, `invariants`, `scope`. Charter owns the membership relationship. Sigil references are name-only (current) or name+version (pinned). Syntax deferred to grammar phase.
- **DD-023**: Doctrine anatomy — mirrors Charter exactly, with `charters` in place of `sigils`. Doctrine vocabulary is the root of the resolution chain; no higher layer overrides it.

### Design Notes

The empty-artifact rule (a layer with no members is invalid) now applies uniformly across all layers: a Sigil requires ≥1 Provision (DD-012), a Charter requires ≥1 Sigil (DD-022), a Doctrine requires ≥1 Charter (DD-023).

The version reference model (name-only = current, name+version = pinned) applies at both the Charter→Sigil and Doctrine→Charter membership levels.

### Open Question Carried Forward

Before drafting the grammar or the first annotated example, a sequencing decision is needed: example-first (syntax driven by concrete authoring) or grammar-first (syntax formally defined, example derived). Both are valid; the choice was deferred to the next session.

### Next

Decide example-first vs. grammar-first ordering, then begin drafting whichever comes first.

---

## 2026-02-21 — Phase 1 Session 4: Syntax Decisions, First Example, and Grammar v0.1

**Contributors:** Engineer, Claude

### Summary

Resolved the example-first vs. grammar-first ordering question in favor of an interleaved approach (Option C): minimal example first, grammar derived from it, both expanded together. Used a checkout domain for all examples. Produced the first annotated example sigil and a complete grammar for the Sigil layer, resolving all open questions that surfaced during derivation.

### Key Decisions

- **DD-024**: Block delimiter syntax — colon after block-opening keywords, indentation for body, no explicit end markers.
- **DD-025**: Scalar field syntax — `key: value` with colon separator. Applies to identity fields only; all provision fields are list-valued.
- **DD-026**: List item syntax — `-` always required, even for single-item lists. No single-line shorthand.
- **DD-027**: Trigger variants — `trigger:` (single condition), `trigger and:` (all must fire), `trigger or:` (any fires). All use block form with `-` items. Operators lowercase.
- **DD-028**: Logical operators (`and`/`or`) scoped to `trigger` only. Preconditions and postconditions are implicitly conjunctive.
- **DD-029**: Indentation — spaces only, no fixed unit (inferred from first block), consistent per block, no tab/space mixing. Python model.
- **DD-030**: FREE_TEXT permits colons and dashes — both disambiguated by position.
- **DD-031**: Sigil section ordering prescribed — meta before spec: `identity` → `vocabulary` → `scope` → `provision+` → `invariants`.
- **DD-032**: Provision field ordering prescribed — `behavior`: trigger → preconditions → postconditions → invariants. `rule`: preconditions → postconditions → invariants.
- **DD-033**: `trigger:` item count enforced at grammar level. Multiple items under plain `trigger:` is a parse error.

### Artifacts Produced

- `docs/examples/Checkout.sigil` — minimal example with one `behavior` and one `rule`
- `spec/grammar.md` v0.1 — Sigil layer grammar, all open questions resolved

### Design Notes

The interleaved approach (Option C) proved its value immediately — writing the example surfaced five grammar questions that would not have appeared from a purely top-down grammar derivation. In particular, the FREE_TEXT disambiguation rule (DD-030) and the trigger item-count enforcement (DD-033) emerged directly from looking at real content.

The meta/spec section ordering split (DD-031) gave the language a coherent read narrative: orient first, specify second. This framing extends naturally to provisions (DD-032) and should be considered when designing Charter and Doctrine structure.

### Next

Expand the Checkout example and grammar to cover `vocabulary` and `scope` sections, then draft the Charter and Doctrine grammar layers.

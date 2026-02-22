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

---

## 2026-02-21 — Phase 1 Session 5: Grammar Complete, Testing Model Resolved

**Contributors:** Engineer, Claude

### Summary

Completed the grammar for all four layers. Expanded the Checkout example with `vocabulary` and `scope`. Resolved all active grammar tasks. Clarified and finalized the scenario testing model, closing the last open question from the previous session.

### Key Decisions

- **DD-034**: Vocabulary entry syntax — block form with `definition: QUOTED_STR` subfield. Extensible without breaking grammar changes.
- **DD-035**: Scope exclusion syntax — `excludes:` named sub-block with free-text list items. Self-describing; exclusions are communicative, not formally referential.
- **DD-036**: Membership reference syntax — `- Name` (current version) or `- Name@X.X` (version-pinned). `@` introduced as a single-purpose version pin operator. Membership entries use `member-item` (structured), not `list-item` (free-text).
- **DD-037**: Charter and Doctrine section ordering — meta-before-spec principle from DD-031 extended to both layers: identity → sigils/charters → vocabulary → scope → invariants.
- **DD-038**: Scenario testing model — two tiers: AI-generated unit tests (spec-derived, AI's responsibility) and human-authored behavioral acceptance tests (framework-agnostic, decoupled from spec). Scenario failures signal spec quality issues to the author, not implementation bugs to the AI. Sigil makes no claims about scenario format or tooling.

### Artifacts Produced

- `docs/examples/Checkout.sigil` — expanded with `vocabulary` (5 terms) and `scope` (3 exclusions)
- `spec/sigil-grammar.md` — renamed from `grammar.md`; completed with `vocabulary-section`, `scope-section`, `invariants-section`, `member-item` productions
- `spec/charter-grammar.md` — Charter layer grammar v0.1
- `spec/doctrine-grammar.md` — Doctrine layer grammar v0.1

### Design Notes

The vocabulary term naming question (CamelCase vs. Title Case) surfaced a downstream constraint: vocabulary terms must be recognizable in FREE_TEXT provision content (DD-013 validation model). Title Case with spaces would break that detection. CamelCase was retained.

The scenario testing discussion clarified the boundary between Sigil (language) and tooling (agent execution, test generation). Unit test generation from the spec is an agent capability, not a language feature. Scenarios are a human quality-assurance artifact, not a spec-traceability mechanism.

### Files Updated

- `CLAUDE.md` — removed "test case generator" from Claude's role; updated `tests/scenarios/` row and Key Design Constraints to reflect DD-038
- `docs/design-decisions.md` — DD-034 through DD-038 appended

### Open Questions Resolved

- Scenario clause reference syntax — resolved as N/A; scenarios are decoupled from spec (DD-038)

### Next

Phase 1 grammar work is complete. Remaining work: define scenario test format (if any Sigil-specific format is warranted), write additional annotated examples at Charter and Doctrine layers, and begin Phase 2 planning.

---

## 2026-02-22 — Phase 1 Close / Phase 2 Open: Formal Specification

**Contributors:** Engineer, Claude

### Summary

Closed Phase 1 by writing annotated Charter and Doctrine examples. Decided Phase 2 sequencing (A — formal spec → B — reference parser → C — language extensions). Drafted the unified language specification (`spec/language-spec.md`) and resolved one new design decision that surfaced during drafting.

### Artifacts Produced

- `docs/examples/OrderManagement.charter` — annotated Charter example; governs a bounded context containing `Checkout`, `OrderFulfillment`, and `OrderCancellation` sigils. Demonstrates cross-Sigil vocabulary (User, Cart, Item, Order), scope exclusions with named responsible contexts, and cross-Sigil invariants.
- `docs/examples/ECommerce.doctrine` — annotated Doctrine example; governs the full platform containing `OrderManagement`, `UserAccounts`, and `Catalog` charters. Demonstrates platform-wide vocabulary (User, Currency), platform-boundary scope exclusions, and platform-wide invariants.
- `spec/language-spec.md` — unified narrative language specification v0.1 covering all four layers, shared productions, vocabulary resolution chain, membership reference resolution, and a complete parse/validation error taxonomy.

### Key Decisions

- **DD-039**: Empty `sigils:` (Charter) and `charters:` (Doctrine) blocks are parse errors, not validation errors. Consistent with the `+` quantifier in the grammar and the treatment of all other required-content blocks in the language.

### Design Notes

The Charter and Doctrine examples were kept domain-continuous with `Checkout.sigil` to illustrate the full resolution hierarchy in a coherent context. The `User` term is defined at all three layers (Doctrine: platform-wide account holder; Charter: order management context; Sigil: checkout-initiating user), demonstrating the full-replacement scoping model (DD-011) with a concrete instance.

The parse/validation distinction (DD-039) clarified a principle: if the grammar's quantifier already enforces a constraint, the error is structural (parse), not semantic (validation). This principle should be applied consistently if new grammar rules are added in Phase C.

The spec was written in declarative prose rather than RFC 2119 normative language. RFC 2119 keywords are deferred to a later version when the spec is ready for external normative publication.

### Phase 2 Plan

A → B → C:
- **A — Formal spec document** — complete this session
- **B — Reference parser/validator** — next
- **C — Language extensions** — after tooling is in place

### Next

Phase 2A is complete. Next: plan Phase 2B — the reference parser/validator. Decisions needed: implementation language, what "reference" means (canonical behavior vs. illustrative implementation), and whether the parser targets parse errors only or also performs semantic validation.

---

## 2026-02-22 — Phase 2B Planning Complete

**Contributors:** Engineer, Claude

### Summary

Planned the full Phase 2B reference parser/validator. Resolved all key design decisions: scope, discovery mechanism, manifest format and schema, implementation language, distribution, CLI interface, error output format, and IDE targets. Updated `spec/language-spec.md` (§10, §12) and logged DD-040 through DD-048.

### Key Decisions

- **DD-040**: Scope is full validation — parse errors and semantic validation errors. Parse-only is explicitly out of scope.
- **DD-041**: Corpus discovery via TOML manifest file. No directory conventions, no CLI enumeration.
- **DD-042**: Manifest format is TOML — designed for human-authored config, comment support, no footguns. JSON rejected (no comments), YAML rejected (spec complexity, implicit type coercion).
- **DD-043**: Manifest schema — `[project]` (name, doctrine path) + `[paths]` (charters dir, sigils dir). The member reference graph is already encoded in the artifacts; the manifest only bootstraps the tool into it. All paths resolve relative to the manifest file location.
- **DD-044**: Implementation language is TypeScript — self-documenting AST types, npm ecosystem, VS Code extension native.
- **DD-045**: Distribution as `@sigil-lang/cli` on npm. Supports both `npx` (zero-install) and `npm install -g` (global install).
- **DD-046**: CLI interface is `sigil validate <path-to-manifest>`. Subcommand structure leaves namespace open for future commands.
- **DD-047**: Output is human-readable compiler-style errors (`file:line:col — [parse error | validation error]: message`). JSON output deferred to a `--json` flag in a later phase.
- **DD-048**: VS Code is the initial IDE integration target (TypeScript-native). IntelliJ deferred; will consume the CLI as a subprocess.

### Spec Updates

- **§10** — Membership Reference Resolution updated to reference the manifest (§12) instead of deferring discovery to the environment.
- **§12** — Project Manifest added: schema, path resolution rules, and validation sequence.

### Design Notes

The key insight in the manifest design: since the doctrine already declares its charters, and charters already declare their sigils, the manifest does not enumerate files — it only maps artifact names to file system locations. The reference graph is walked from the doctrine root outward. This keeps the manifest minimal and avoids requiring updates every time a sigil is added.

The language choice (TypeScript over Python) was driven primarily by the library consumption story and IDE ecosystem fit. Python's Lark parser library was noted as a strong alternative for readability; this is the primary tradeoff accepted. A port to Python remains tractable if community need arises.

### Next

Implement Phase 2B — `@sigil-lang/cli` TypeScript reference parser/validator.

# Sigil — Design Decisions

_Append only. Each entry records a finalized decision, its rationale, and the date it was made._

---

## DD-001 — Scope: General-Purpose

**Date:** 2026-02-21
**Decision:** Sigil is a general-purpose specification language. It makes no domain-specific assumptions and must work across problem domains without baking in conventions that are only valid in a particular context (e.g., HTTP services, UI components, data pipelines).
**Rationale:** Domain-targeting would limit adoption and create pressure to fork or extend the language for each new domain. Starting general forces the core constructs to be foundational rather than contextual.

---

## DD-002 — Primary Consumer: Human and AI Agent Equally

**Date:** 2026-02-21
**Decision:** Sigil is designed to be written and reviewed by human engineers and executed against by AI agents. Neither consumer is privileged — the language must serve both without a separate format or translation layer.
**Rationale:** A human-only language would sacrifice the machine-parseability needed for reliable agentic execution. An agent-only language would sacrifice the readability needed for team adoption. The value of Sigil depends on closing that gap, not picking a side.

---

## DD-003 — Adoption Model: Open Standard

**Date:** 2026-02-21
**Decision:** Sigil is designed as an open standard, not an internal organizational tool. The language may not assume shared institutional context. All conventions must be explicit and self-contained within the language itself.
**Rationale:** An internal tool can externalize convention to organizational knowledge. An open language cannot. This constraint keeps the language self-describing and portable across teams and organizations.

---

## DD-004 — Syntax Strategy: Single Canonical Syntax

**Date:** 2026-02-21
**Decision:** Sigil uses one syntax that serves both human authors and machine consumers. There is no separate "human-facing" format and "machine-readable" serialization. The canonical form is the only form.
**Rationale:** Multiple formats create synchronization problems, versioning complexity, and a de facto primary format (whichever the toolchain prefers). A single syntax forces the design to solve the hard problem — making one form work for both consumers — rather than papering over it.
**Dependency:** Requires DD-002 (equal consumers) and DD-005 (parse-first tiebreaker) to be viable.

---

## DD-005 — Tiebreaker: Parse-First

**Date:** 2026-02-21
**Decision:** When human readability and unambiguous parseability conflict, unambiguity wins. Writers accept minor syntactic friction; the grammar accepts no ambiguity.
**Rationale:** Sigil's core guarantee is that ambiguity is a defect. A tiebreaker that allows readability to introduce ambiguity would undermine the language's primary value. Parse-first keeps the grammar honest. Readability is pursued within the constraint of unambiguity, not at its expense.
**Dependency:** Enables DD-004 (single canonical syntax) — the single syntax can only serve both consumers if it is unambiguously parseable.

---

## DD-006 — Three-Layer Composition Model _(superseded by DD-008)_

**Date:** 2026-02-21
**Decision:** Sigil uses a three-layer hierarchy. The atomic unit (C) is composed into feature-level artifacts (B), which are composed into system-level artifacts (A). Each layer is a first-class artifact with its own properties — invariants, scope boundaries, and vocabulary. No layer is purely organizational.
**Rationale:** A single granularity forces a choice between authoring convenience and atomic referenceability. The three-layer model provides both: authors work at the feature level, references trace to the atomic level, and system-level constraints have a dedicated home. Uniform properties across all layers (invariants, scope, vocabulary) keeps the model consistent rather than special-casing any level.

---

## DD-007 — Layer Naming: Charter / Sigil / Provision _(superseded by DD-009)_

**Date:** 2026-02-21
**Decision:** The three layers are named: **Charter** (A — system level), **Sigil** (B — feature level), **Provision** (C — atomic level).
**Rationale:**
- *Charter* implies authority, governance, and boundary-setting — appropriate for the system-level artifact that governs a collection of sigils.
- *Sigil* is the primary authoring artifact and the project's namesake — a symbol with precise, defined meaning.
- *Provision* was chosen over *behavior* and *rule* to avoid keyword collision with common domain entity names. It carries the legal/contractual register consistent with the language's intended feel and is specific enough that engineers are unlikely to use it as an entity name in a domain model.

---

## DD-008 — Four-Layer Composition Model (supersedes DD-006)

**Date:** 2026-02-21
**Decision:** Sigil uses a four-layer hierarchy. From atomic to platform: Provision (C) → Sigil (B) → Charter (A) → Doctrine (D). Each layer is a first-class artifact with its own properties — vocabulary, invariants, and scope boundaries. No layer is purely organizational.
**Rationale:** The three-layer model (DD-006) had no home for cross-charter concerns. In systems composed of multiple bounded contexts (e.g., microservices), platform-wide vocabulary and invariants are real and distinct from any single charter's concerns. Adding the Doctrine layer gives cross-charter properties a dedicated, first-class home consistent with the uniform model established in DD-006.

---

## DD-009 — Layer Naming: Doctrine / Charter / Sigil / Provision (supersedes DD-007)

**Date:** 2026-02-21
**Decision:** The four layers are named: **Doctrine** (D — platform level), **Charter** (A — service/bounded context level), **Sigil** (B — feature level), **Provision** (C — atomic level).
**Rationale:**
- *Doctrine* — chosen over *canon*, *realm*, *accord*, and others for its fit with the DDD ubiquitous language concept. A doctrine is the agreed body of knowledge and definitions that all parties operate under. It carries authority without implying top-down decree. Noted as a working name; may be revisited.
- *Charter*, *Sigil*, *Provision* — rationale unchanged from DD-007.

---

## DD-010 — Vocabulary as First-Class Section

**Date:** 2026-02-21
**Decision:** Vocabulary is a first-class, optional section at the Doctrine, Charter, and Sigil layers. It is not present at the Provision layer. Vocabulary defines named concepts with precise definitions — the ubiquitous language of that layer's scope.
**Rationale:** Without a vocabulary section, terms used in provisions are undefined within the spec itself, reintroducing the natural language ambiguity Sigil is designed to eliminate. A named, structured vocabulary section makes term definitions explicit, machine-readable, and co-located with the specs that use them.

---

## DD-011 — Vocabulary Scoping: Full Replacement, No Inheritance

**Date:** 2026-02-21
**Decision:** Vocabulary definitions resolve via a Doctrine → Charter → Sigil chain. A definition at a lower layer fully replaces the higher-layer definition for the same term within that layer's scope. There is no inheritance or extension — a lower-layer definition must be complete and self-contained.
**Rationale:** Extension/inheritance semantics require tracing a chain of definitions to understand what a term means, which introduces the same comprehension burden as inheritance hierarchies in OOP. Full replacement keeps every vocabulary definition locally readable — what you see at the Sigil level is the complete definition. This also keeps the language accessible to non-engineers (PMs, BAs) who should not need to understand inheritance to read a spec.

---

## DD-012 — Minimal Valid Sigil

**Date:** 2026-02-21
**Decision:** A valid Sigil requires: (1) an Identity section with at minimum a name, and (2) at least one Provision. All other sections — vocabulary, invariants, scope — are optional.
**Rationale:** Identity is required for referenceability; a nameless sigil cannot be linked to or versioned. At least one Provision is required because a sigil with no provisions specifies nothing — it is an empty contract. All other sections are optional to keep the barrier to authoring low; a minimal sigil should be writable in minutes.

---

## DD-013 — Casing Convention: Lowercase Keywords, Capitalized Entities

**Date:** 2026-02-21
**Decision:** Sigil uses case as a lexical signal with two distinct categories:
- **Lowercase** — language keywords and structural elements (e.g., `provision`, `behavior`, `rule`, `preconditions`, `trigger`, `postconditions`, `invariants`, `vocabulary`, `scope`, `sigil`, `charter`, `doctrine`)
- **Capitalized** — named artifacts and vocabulary-defined terms (e.g., `User`, `Order`, `SubmitCheckout`, `PaymentService`)

A capitalized identifier appearing in a provision that has no corresponding vocabulary definition in the Doctrine → Charter → Sigil resolution chain is a validation error. Undefined terms are detectable by construction.
**Rationale:** Case-sensitivity resolves keyword collision broadly — `behavior` and `rule` as lowercase keywords never conflict with `Behavior` or `Rule` as vocabulary-defined entity names. It also gives readers an immediate visual signal: lowercase is grammar, capitalized is a defined concept. This reinforces Sigil's core value that every term in a provision must have a precise, declared meaning somewhere in the vocabulary chain.

---

## DD-014 — Provision Sub-Types: behavior and rule

**Date:** 2026-02-21
**Decision:** A Provision has two sub-types, declared with a lowercase keyword following the provision name:
- **`behavior`** — event-driven. Has `preconditions`, `trigger`, and `postconditions`. The trigger is the initiating event; preconditions are the required prior state.
- **`rule`** — declarative. Has `preconditions` and `postconditions` only. Expresses a logical implication: if preconditions hold, postconditions follow. No initiating event.

Both sub-types may also have `invariants`. The sub-type keyword is required — a Provision must declare which kind it is.
**Rationale:** The two sub-types are semantically distinct: a behavior describes what happens when something fires; a rule describes what is always true given certain conditions. Collapsing them into one construct (with trigger optional) would hide that distinction. Making the sub-type explicit in the grammar keeps the distinction unambiguous for both human readers and parsers. Keyword collision with vocabulary entity names is resolved by DD-013 (casing convention).

---

## DD-015 — Provision Invariants Are Optional

**Date:** 2026-02-21
**Decision:** The `invariants` section is optional on both `behavior` and `rule` Provisions. It must only be written when a genuine constraint exists that must hold throughout execution. An absent `invariants` section means no such constraint is asserted, not that constraints were overlooked.
**Rationale:** Forcing invariants when none exist produces artificial constraints that add noise and may introduce false guarantees. An invariant written to satisfy a requirement to have one is worse than no invariant — it misleads both readers and agents. Optional keeps authoring honest.

---

## DD-016 — Provision Identity: Name Only

**Date:** 2026-02-21
**Decision:** A Provision's identity is its name alone. No separate ID, no version, no description.
- **No separate ID** — the name serves as the identifier. Cross-Sigil references use `SigilName.ProvisionName`. A secondary ID would be redundant.
- **No version** — Provisions are versioned through their containing Sigil. Independent Provision versioning creates unnecessary tracking overhead.
- **No description** — the name, sub-type, and structured content (preconditions, trigger, postconditions, invariants) are self-describing. A description alongside structured content creates a second source of truth that can drift and mislead. If documentation is needed, it is generated from structured content, not authored separately. Descriptions may be appropriate at the Sigil level and above, where artifacts are large enough that a summary adds value.

---

## DD-017 — Provision Field Requirements by Sub-Type

**Date:** 2026-02-21
**Decision:** Required and optional fields differ by Provision sub-type:

| Field | `behavior` | `rule` |
|---|---|---|
| `preconditions` | optional | required |
| `trigger` | required | not present |
| `postconditions` | required | required |
| `invariants` | optional | optional |

A `rule` missing `preconditions` is a validation error. The correct construct for an unconditional guarantee is a Sigil-level invariant, not a `rule` Provision. A validator must reject `rule` Provisions with no `preconditions` and direct the author to use a Sigil-level invariant instead.
**Rationale:** A rule without preconditions is not a conditional implication — it is an unconditional guarantee. That construct already exists at the Sigil level as an invariant. Allowing a `rule` without preconditions would create two syntactically valid ways to express the same thing, introducing ambiguity about which to use. Requiring `preconditions` on `rule` keeps the construct semantically precise and the language unambiguous.

---

## DD-018 — Versioning Scheme: X.X, Constrict/Expand

**Date:** 2026-02-21
**Decision:** All versioned layers (Sigil, Charter, Doctrine) use a two-part `X.X` version number:
- **Major (X.)** — a constricting change: removes or tightens existing guarantees. Consumers may break. Examples: provision removed, precondition added to existing behavior, postcondition removed, invariant tightened, trigger changed.
- **Minor (.X)** — an expanding change: adds or extends guarantees. Consumers cannot break. Examples: provision added, postcondition added to existing behavior, precondition relaxed, invariant relaxed.

Initial version is `1.0`. Versions are author-managed and embedded in the artifact's identity section.
**Rationale:** The constrict/expand framing maps directly onto consumer impact — a constricting change can break consumers who depend on existing guarantees; an expanding change cannot. This is more precise than "modify vs. add/remove" (which conflates breaking and non-breaking modifications) and more learnable than full SemVer. The two-part format is sufficient because there is no patch concept in a spec — a correction to a spec is either a constriction or an expansion.

---

## DD-019 — File Conventions: Layer-Specific Extensions, Separate Files Per Version

**Date:** 2026-02-21
**Decision:** Each layer has a distinct file extension:
- Sigil → `.sigil`
- Charter → `.charter`
- Doctrine → `.doctrine`

The current version of an artifact uses the name alone: `Checkout.sigil`. Historical/pinned versions embed the version in the filename: `Checkout.1.2.sigil`. Provisions do not get their own files — they live as sections within a Sigil file. A Sigil file that becomes unwieldy in size is a signal that it is too broad in scope and should be split into multiple Sigils.
**Rationale:** Layer-specific extensions make the artifact type immediately identifiable to humans, tooling, and AI agents without reading file contents. This is more reliable than directory-structure conventions (which would bake repository layout assumptions into the standard, violating DD-003) or a single extension for all layers (which requires reading the file to determine its type). Separate files per version allow consumers to pin to a specific version without requiring VCS access, keeping Sigil artifacts self-contained and distributable.

---

## DD-020 — Sigil Identity Anatomy

**Date:** 2026-02-21
**Decision:** The Sigil `identity` section contains four fields:

| Field | Required | Values / Format |
|---|---|---|
| `name` | yes | identifier — the Sigil's unique name within its Charter |
| `version` | yes | `X.X` format per DD-018 |
| `status` | yes | `draft` \| `active` \| `deprecated` |
| `description` | no | free text; human-readable summary |

`status` is required because its purpose is unambiguous lifecycle declaration — an optional status reintroduces the ambiguity it exists to eliminate. The three values cover the full lifecycle: not yet authoritative (`draft`), canonical and in use (`active`), superseded and retired (`deprecated`).

`description` is optional, consistent with DD-012's low authoring barrier. When present, it is for human readers only — it carries no semantic weight for agents and is not a substitute for vocabulary definitions or provision content.
**Dependency:** DD-012 (name required for minimal valid Sigil), DD-018 (version format).

---

## DD-021 — Sigil Scope: Exclusions Only

**Date:** 2026-02-21
**Decision:** The Sigil `scope` section is optional and, when present, contains only explicit exclusion declarations. An exclusion is a disavowal of responsibility — an explicit assertion that a concern is outside this Sigil's domain by design. It is not a negative inventory of absent provisions; absence is already observable from the provisions list.

Exclusions are warranted at boundaries where adjacent concerns might otherwise be attributed to this Sigil by a reader or agent. Not every absent concern requires an exclusion — only those where silence would be misleading.

The referential syntax of exclusions (whether they name other Sigils, use vocabulary-defined terms, or use free text) is deferred to the grammar definition phase.
**Rationale:** Inclusions are redundant with provisions — what a Sigil covers is fully expressed by its provision content. Exclusions are not redundant; they convey intent that cannot be inferred from what is present. Scope as exclusions-only keeps the section non-redundant and focused on the one thing only an author can assert: what is explicitly not this Sigil's responsibility.
**Dependency:** DD-012 (scope is optional in a minimal valid Sigil), DD-005 (referential syntax subject to parse-first constraint, resolved at grammar phase).

---

## DD-022 — Charter Anatomy

**Date:** 2026-02-21
**Decision:** A Charter contains the following sections:

| Section | Required | Notes |
|---|---|---|
| `identity` | yes | name, version (X.X), status (draft/active/deprecated), description (optional) — same fields and rules as DD-020 |
| `sigils` | yes, ≥1 | list of member Sigils; name-only = current version, name + version = pinned to that version |
| `vocabulary` | no | per DD-010; definitions fully replace Doctrine-level terms for the same name |
| `invariants` | no | cross-Sigil constraints that apply across the entire bounded context |
| `scope` | no | exclusions only, per DD-021 |

A Charter with no `sigils` entries is a validation error — an empty Charter governs nothing. This extends DD-012's empty-artifact principle to the Charter layer.

The membership reference model: a Sigil referenced by name alone resolves to its current version; a Sigil referenced by name and version is pinned to that version. The syntax of these references is deferred to the grammar definition phase.

The Charter owns the membership relationship — it declares which Sigils belong to it. This preserves the compositional model: provisions compose into Sigils, Sigils compose into Charters, Charters compose into Doctrines.
**Rationale:** Charter-owns membership keeps each layer self-describing as a boundary declaration. A reader can understand a Charter's full scope from the Charter file alone without traversing all Sigil files. Version pinning allows consumers to lock against a specific Sigil version when stability is required, while name-only references reduce maintenance overhead for the common case.
**Dependency:** DD-008 (Charter is a first-class layer with vocabulary, invariants, scope), DD-010 (vocabulary at Charter level), DD-018 (version format), DD-019 (file conventions), DD-020 (identity anatomy), DD-021 (scope: exclusions only).

---

## DD-023 — Doctrine Anatomy

**Date:** 2026-02-21
**Decision:** A Doctrine contains the following sections:

| Section | Required | Notes |
|---|---|---|
| `identity` | yes | name, version (X.X), status (draft/active/deprecated), description (optional) |
| `charters` | yes, ≥1 | list of member Charters; name-only = current version, name + version = pinned |
| `vocabulary` | no | per DD-010; platform-level root — no higher layer overrides Doctrine definitions |
| `invariants` | no | platform-wide constraints applying across all member Charters and their Sigils |
| `scope` | no | exclusions only, per DD-021 |

A Doctrine with no `charters` entries is a validation error — an empty Doctrine governs nothing. This completes the empty-artifact principle established in DD-012 and extended in DD-022 across all layers.

Doctrine vocabulary is the root of the Doctrine → Charter → Sigil resolution chain (DD-011). Doctrine-level definitions are the baseline; Charter definitions override them within a bounded context; Sigil definitions override Charter within a feature. There is no layer above Doctrine.
**Rationale:** Doctrine mirrors Charter structurally, with Charters in place of Sigils. The same compositional ownership model applies: a Doctrine declares which Charters belong to it, keeping the top-level artifact self-describing as a platform boundary. Doctrine invariants and vocabulary serve the cross-Charter use case that motivated the four-layer model in DD-008.
**Dependency:** DD-008 (Doctrine layer rationale), DD-010/011 (vocabulary as first-class, full-replacement scoping), DD-018 (version format), DD-019 (file conventions), DD-020 (identity anatomy), DD-021 (scope: exclusions only), DD-022 (Charter anatomy — Doctrine mirrors Charter one layer up).

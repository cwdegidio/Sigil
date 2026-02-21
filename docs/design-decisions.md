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

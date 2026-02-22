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

---

## DD-024 — Block Delimiter Syntax: Colon + Indentation

**Date:** 2026-02-21
**Decision:** Block-opening keywords are followed by a colon. The block body is indented beneath the opening line. There are no explicit end markers (`end`, `}`, etc.).
```
sigil Checkout:
    identity:
        version: 1.0
```
**Rationale:** The colon signals "what follows is the body of this construct" — a widely understood convention. Indentation is the delimiter, which aligns with human readability goals. Explicit end markers add syntactic noise without disambiguation value when indentation already establishes block boundaries unambiguously.

---

## DD-025 — Scalar Field Syntax: `key: value`

**Date:** 2026-02-21
**Decision:** Scalar fields use colon-separated key-value syntax: `key: value`. In the current grammar, scalar fields appear only in the `identity` section: `version`, `status`, and `description`. All provision fields (`trigger`, `preconditions`, `postconditions`, `invariants`) are list-valued and use block form per DD-026 — they are not scalar fields and the `key: value` shorthand does not apply to them.
**Rationale:** Without the colon, multi-word values create parsing ambiguity — the parser cannot determine where the key ends and the value begins without special-casing every field name. The colon eliminates this ambiguity by construction, consistent with DD-005 (parse-first). Scoping `key: value` to genuinely scalar fields avoids a mixed model where some fields are sometimes scalar and sometimes block-form.

---

## DD-026 — List Item Syntax: `-` Always Required

**Date:** 2026-02-21
**Decision:** All list-valued fields (`trigger`, `preconditions`, `postconditions`, and any future list-valued fields) use block form with a `-` prefix on each item. No single-line shorthand is valid, even for single-item lists.
```
preconditions:
    - Cart is not empty
    - User is authenticated

trigger:
    - User submits the checkout form
```
**Rationale:** Allowing both single-line (`field: value`) and block form (`field:\n  - value`) for the same field type creates two valid parse paths for every list field, complicating the grammar and producing inconsistency across authored files. Requiring `-` always gives the parser one path and gives readers a consistent visual signal that a field is list-valued. It also preserves `-` as the unambiguous marker for list membership across the language.

---

## DD-027 — Trigger Variants: Single and Multi-Condition

**Date:** 2026-02-21
**Decision:** The `trigger` field has three valid forms, all using block form with `-` per DD-026:

| Form | Syntax | Semantics |
|---|---|---|
| Single condition | `trigger:` + one `-` item | One initiating event or state |
| All conditions | `trigger and:` + multiple `-` items | All listed conditions must be satisfied |
| Any condition | `trigger or:` + multiple `-` items | Any one listed condition fires the trigger |

`and` and `or` are lowercase per DD-013. A single-condition trigger uses no logical operator — the operator is only present when there are multiple items.
**Rationale:** Single-condition triggers have no logical relationship to express; adding an operator would be noise. Multi-condition triggers require explicit `and`/`or` to avoid semantic ambiguity — a list of conditions without a declared relationship forces agents to infer the relationship, which is a defect per the ambiguity-as-defect principle. Lowercase keeps operators consistent with DD-013 (lowercase keywords).

---

## DD-028 — Logical Operators Scoped to `trigger` Only

**Date:** 2026-02-21
**Decision:** The `and` and `or` logical operators are valid only on `trigger`. They are not valid syntax on `preconditions` or `postconditions`.
**Rationale:** Preconditions are implicitly conjunctive — all listed preconditions must hold. Postconditions are implicitly conjunctive — all listed postconditions are guaranteed. These semantics are unambiguous without an explicit operator. `trigger` is the only field where OR semantics are genuinely distinct (two different events can fire the same behavior). Extending `and`/`or` to other fields would add syntactic complexity without semantic necessity, and would introduce ambiguity about whether implicit AND is the default when no operator is given — precisely the kind of ambiguity Sigil is designed to eliminate.

---

## DD-029 — Indentation: Spaces Only, Unit Inferred, No Mixing

**Date:** 2026-02-21
**Decision:** Sigil uses indentation as block delimiters (DD-024) with the following rules:
- **Spaces only** — tabs are not valid indentation characters.
- **No fixed unit** — the number of spaces per indentation level is not prescribed by the language. 2-space and 4-space files are both valid.
- **Unit inferred from first indented block** — the lexer determines the indentation unit from the first indented line in the file and uses it to generate INDENT/DEDENT tokens throughout.
- **Consistent per block** — all lines at the same level within a block must use the same number of spaces. Inconsistency within a block is a syntax error.
- **No mixing** — a file may not mix tabs and spaces for indentation. A mixed file is a syntax error.
**Rationale:** The Python model is well-understood, has 35 years of precedent, and is implemented by mature lexer tooling. Fixing the unit (e.g., 4 spaces) would be a language-level constraint solving a style problem — that concern belongs to a linter or formatter, not the grammar. Spaces-only is enforced because tab rendering width varies by editor, which undermines visual consistency and readability (DD-002) in a spec language written collaboratively across teams.

---

## DD-030 — FREE_TEXT Permits Colons and Dashes

**Date:** 2026-02-21
**Decision:** FREE_TEXT (the content of list items) may contain colons and dashes without escaping. Both characters are disambiguated from their structural uses by position:
- A `-` is a list-item marker only when it appears at the start of a line after indentation, followed by a space (`- `). A dash anywhere else on a line is FREE_TEXT content.
- A `:` is a structural separator only when it appears at the end of a keyword or identifier token at the start of a line (`key:`). A colon appearing after a list-item marker (`- ... : ...`) is FREE_TEXT content.

**Rationale:** Prohibiting colons and dashes in FREE_TEXT would impose authoring restrictions with no parsing necessity — both are unambiguous by position. Free-text assertions in preconditions, postconditions, and triggers benefit from natural use of dashes (e.g., `non-authenticated`) and colons (e.g., `Status is one of: Pending, Confirmed`). Restricting them would work against the readability goals of the spec language without any corresponding precision gain.

---

## DD-031 — Sigil Section Ordering: Meta Before Spec

**Date:** 2026-02-21
**Decision:** Sections within a `sigil-body` must appear in the following prescribed order:

| Position | Section | Required |
|---|---|---|
| 1 | `identity` | yes |
| 2 | `vocabulary` | no |
| 3 | `scope` | no |
| 4 | `provision` (one or more) | yes |
| 5 | `invariants` | no |

Sections appearing out of order are a syntax error.

**Rationale:** The ordering reflects a conceptual split between meta-information and behavioral specification. `identity`, `vocabulary`, and `scope` are meta — they define what the sigil is, what terms it uses, and what it explicitly excludes. `provisions` and `invariants` are the spec — what the sigil does and what must always hold. Reading a sigil in order moves from orientation to specification, which matches how both human readers and agents should consume the artifact: understand the frame before interpreting the content.
**Dependency:** DD-012 (identity required, provisions required), DD-010 (vocabulary optional), DD-021 (scope optional), DD-015 (invariants optional).

---

## DD-032 — Provision Field Ordering: Prescribed

**Date:** 2026-02-21
**Decision:** Fields within a provision body must appear in the following prescribed order by subtype:

**`behavior`:**

| Position | Field | Required |
|---|---|---|
| 1 | `trigger` | yes |
| 2 | `preconditions` | no |
| 3 | `postconditions` | yes |
| 4 | `invariants` | no |

**`rule`:**

| Position | Field | Required |
|---|---|---|
| 1 | `preconditions` | yes |
| 2 | `postconditions` | yes |
| 3 | `invariants` | no |

Fields appearing out of order are a syntax error.

**Rationale:** Prescribed ordering enforces a consistent read narrative within every provision. For a `behavior`: *what fires it* → *what must be true first* → *what results* → *what always holds*. For a `rule`: *when is this true* → *what follows* → *what always holds*. Consistent ordering means a reader scanning any provision always finds each field in the same position, reducing cognitive load. This extends the same reasoning applied to sigil-level section ordering (DD-031).
**Dependency:** DD-014 (provision subtypes), DD-017 (field requirements by subtype), DD-015 (invariants optional), DD-031 (prescribed ordering at sigil level — same principle applied within provisions).

---

## DD-033 — `trigger:` Item Count Enforced at Grammar Level

**Date:** 2026-02-21
**Decision:** A plain `trigger:` block (no logical operator) is defined in the grammar to accept exactly one list item. A `trigger:` block containing more than one item is a parse error, not a semantic validation error. The author must use `trigger and:` or `trigger or:` to express multiple conditions.
**Rationale:** Enforcing the single-item constraint at the grammar level is consistent with DD-005 (parse-first, no ambiguity tolerated). A semantic validator could produce a friendlier error message, but the parse failure is itself unambiguous: `trigger:` with multiple items does not match any valid grammar production. The distinction between `trigger:`, `trigger and:`, and `trigger or:` is structurally meaningful — it is correctly a syntactic distinction, not a semantic one. Deferring it to semantic validation would imply the grammar accepts it, which it does not.

---

## DD-034 — Vocabulary Entry Syntax: Block Form with `definition` Field

**Date:** 2026-02-21
**Decision:** Each vocabulary entry uses block form: a Capitalized CamelCase IDENTIFIER key followed by a colon opens a block containing a single required `definition` field whose value is a QUOTED_STR.
```
Cart:
    definition: "A transient collection of Items selected for purchase by an authenticated User."
```
An empty `vocabulary:` block (section present, no entries) is a syntax error. A `vocabulary-entry` block with no `definition` field is a syntax error.
**Rationale:** Block form is consistent with the structural pattern used throughout the language (provisions, identity, scope). It leaves the entry open to additional fields — such as `example`, `alias`, or `notes` — without requiring a breaking grammar change. Inline scalar form (`Cart: "..."`) would require replacing every entry site to add fields. QUOTED_STR for the definition value is consistent with `description-field` in the identity section and provides explicit string boundaries without relying on positional disambiguation.
**Dependency:** DD-010 (vocabulary as first-class section), DD-011 (full replacement scoping), DD-013 (Capitalized CamelCase identifiers), DD-025 (scalar field syntax for `definition` field).

---

## DD-035 — Scope Exclusion Syntax: `excludes:` Sub-Block with Free-Text List Items

**Date:** 2026-02-21
**Decision:** The `scope` section contains a single named sub-block `excludes:` whose body is one or more free-text list items. A `scope:` block with no `excludes:` sub-block, or an `excludes:` block with no list items, is a syntax error.
```
scope:
    excludes:
        - Payment authorization and processing.
        - Inventory reservation or stock validation.
```
Exclusion items are free text — they are not formal references to other Sigils or vocabulary-defined terms.
**Rationale:** The `excludes:` keyword makes the sub-block self-describing (consistent with DD-003, open standard: all conventions must be explicit) and reserves the `scope:` block for future sub-blocks without a breaking grammar change. Exclusion content is free text because exclusions are disavowals of responsibility — communicative assertions for human readers and agents, not machine-actionable references. Requiring formal references would constrain exclusions to only things that already exist as named artifacts, which misses the case where an exclusion names a concern no artifact covers.
**Dependency:** DD-021 (scope: exclusions only), DD-003 (open standard: self-describing), DD-026 (list item syntax).

---

## DD-036 — Membership Reference Syntax: Name-Only and `@` Version Pin

**Date:** 2026-02-21
**Decision:** Membership references appear as structured list items in `sigils:` (Charter) and `charters:` (Doctrine) sections. Two forms are valid:
- **Name-only:** `- Checkout` — resolves to the current version of the named artifact.
- **Version-pinned:** `- Checkout@1.2` — resolves to the specified version.

Membership entries use a `member-item` grammar production distinct from `list-item`. Their content is a parsed `member-ref` (`IDENTIFIER` or `IDENTIFIER "@" VERSION`), not FREE_TEXT. `@` is a single-purpose operator valid only in `member-ref` — it is not valid in provision fields or any other position in the language.
**Rationale:** `@` carries the semantics of "at version" and is familiar from package manager conventions (npm, pip) without importing programming language connotations. Because `@` is unused elsewhere in the language, its presence unambiguously signals a version pin at parse time, consistent with DD-005 (parse-first). Separating `member-item` from `list-item` in the grammar makes explicit that membership sections contain structured references, not free-text assertions — a validator can extract and resolve names and versions from them directly.
**Dependency:** DD-022 (Charter `sigils:` section), DD-023 (Doctrine `charters:` section), DD-018 (VERSION format), DD-005 (parse-first).

---

## DD-037 — Charter and Doctrine Section Ordering: Meta Before Spec

**Date:** 2026-02-21
**Decision:** Sections within a `charter-body` and `doctrine-body` must appear in the following prescribed order:

**Charter:**

| Position | Section | Required |
|---|---|---|
| 1 | `identity` | yes |
| 2 | `sigils` | yes |
| 3 | `vocabulary` | no |
| 4 | `scope` | no |
| 5 | `invariants` | no |

**Doctrine:**

| Position | Section | Required |
|---|---|---|
| 1 | `identity` | yes |
| 2 | `charters` | yes |
| 3 | `vocabulary` | no |
| 4 | `scope` | no |
| 5 | `invariants` | no |

Sections appearing out of order are a syntax error.

**Rationale:** Applies the meta-before-spec principle established in DD-031 to the Charter and Doctrine layers. `identity` declares what the artifact is; `sigils`/`charters` declares what it governs — both are meta. `vocabulary` and `scope` are definitional meta. `invariants` are behavioral spec. Reading in order moves from orientation to governance to specification, consistent with how both human readers and agents should consume the artifact.
**Dependency:** DD-031 (meta-before-spec principle), DD-022 (Charter anatomy), DD-023 (Doctrine anatomy).

---

## DD-038 — Scenario Testing Model: Behavioral Acceptance, Decoupled from Spec

**Date:** 2026-02-21
**Decision:** Scenarios are human-authored behavioral acceptance tests. They verify that an implementation does what was intended — not that it structurally conforms to specific spec clauses. Two distinct testing tiers exist:

- **AI-generated unit tests** — derived from the Sigil spec at artifact creation time by the AI agent. These are spec-traceable by construction and are the AI's responsibility to generate and fix.
- **Human-authored scenarios** — behavioral acceptance tests written in whatever testing framework suits the artifact (Jest, JUnit, Cypress, etc.). They live in `tests/scenarios/` but carry no Sigil-specific format or clause reference syntax.

A failing scenario is a signal to the author to review the spec for clarity or completeness — not a signal for the AI to fix the implementation. A failing AI-generated unit test is the AI's problem.

Sigil makes no claims about scenario format, tooling, or traceability. Scenario tests are outside the language boundary.
**Rationale:** Requiring scenarios to reference spec clauses conflates two distinct concerns: behavioral verification (did we build the right thing?) and spec compliance (does the implementation match the clause?). Spec compliance is served by AI-generated unit tests. Scenarios serve a higher-order question that only a human can answer by observing end-to-end behavior. Keeping scenarios decoupled preserves their independence as a quality signal on the spec itself — a scenario failure means the spec may be incomplete or unclear, not that a clause was violated.

// ─── Sigil context artifact content ──────────────────────────────────────────
//
// Content is embedded as string literals so the output is self-contained after
// npm install, regardless of where the package is installed.

const AUTHOR = `\
<!-- Sigil Context — Author Role -->
<!-- Load this file when: writing or editing .sigil, .charter, or .doctrine files; designing feature specifications; planning bounded context structure. -->
<!-- Do not load when implementing code from existing specs — use SIGIL-CONSUMER.md instead. -->

# Sigil — Author Context

Sigil is a formalized specification language for AI-driven software development. It sits between natural language prose and formal mathematical notation — precise enough for agentic execution, readable enough for engineers to write without specialized training. Your role as a spec author is to write \`.sigil\`, \`.charter\`, and \`.doctrine\` files that are unambiguous, complete, and consistent.

---

## File Types

| File | Extension | Governs |
|---|---|---|
| Doctrine | \`.doctrine\` | A platform — one or more Charters |
| Charter | \`.charter\` | A bounded context — one or more Sigils |
| Sigil | \`.sigil\` | A feature — one or more provisions |

Write from the top down: define the Doctrine first, then Charters, then Sigils. Each file contains exactly one declaration. Multiple declarations in a single file are a parse error.

---

## Grammar Reference

### Keywords and Naming

All language keywords are lowercase: \`sigil\`, \`charter\`, \`doctrine\`, \`provision\`, \`identity\`, \`vocabulary\`, \`scope\`, \`invariants\`, \`trigger\`, \`preconditions\`, \`postconditions\`, \`behavior\`, \`rule\`, \`and\`, \`or\`, \`excludes\`, \`version\`, \`status\`, \`description\`, \`definition\`, \`sigils\`, \`charters\`.

All named artifacts — Sigil names, Charter names, Doctrine names, provision names, vocabulary entry keys — use CapitalizedCamelCase: first character uppercase, followed by one or more alphanumeric characters (e.g., \`PetProfile\`, \`RegisterPet\`, \`PlaceOrder\`).

### Indentation

Spaces only. No tabs. The indent width is inferred from the first indented block in the file. Use the same unit throughout the file. Mixing tabs and spaces is a parse error.

### Doctrine

\`\`\`
doctrine IDENTIFIER:

    identity:
        version: X.X
        status: draft | active | deprecated
        description: "..."            # optional

    charters:
        - CharterName                 # name-only: resolves to current version
        - CharterName@X.X            # version-pinned reference

    vocabulary:                       # optional
        Term:
            definition: "..."

    scope:                            # optional
        excludes:
            - Free text description of excluded concern.

    invariants:                       # optional
        - Platform-wide constraint that holds unconditionally.
\`\`\`

Section order is required: \`identity\` → \`charters\` → \`vocabulary\` → \`scope\` → \`invariants\`. Out-of-order sections are a parse error.

### Charter

\`\`\`
charter IDENTIFIER:

    identity:
        version: X.X
        status: draft | active | deprecated
        description: "..."            # optional

    sigils:
        - SigilName
        - SigilName@X.X

    vocabulary:                       # optional
        Term:
            definition: "..."

    scope:                            # optional
        excludes:
            - Free text description of excluded concern.

    invariants:                       # optional
        - Cross-Sigil constraint for this bounded context.
\`\`\`

Section order is required: \`identity\` → \`sigils\` → \`vocabulary\` → \`scope\` → \`invariants\`. Out-of-order sections are a parse error.

### Sigil

\`\`\`
sigil IDENTIFIER:

    identity:
        version: X.X
        status: draft | active | deprecated
        description: "..."            # optional

    vocabulary:                       # optional
        Term:
            definition: "..."

    scope:                            # optional
        excludes:
            - Free text description of excluded concern.

    provision IDENTIFIER behavior:
        trigger:
            - Single condition that fires this behavior
        preconditions:                # optional
            - State that must hold before the behavior fires
        postconditions:
            - State that must hold after the behavior completes
        invariants:                   # optional
            - Constraint that holds within this provision

    provision IDENTIFIER rule:
        preconditions:                # required for rule
            - Condition under which the rule applies
        postconditions:
            - Assertion that must hold given the preconditions
        invariants:                   # optional
            - Constraint that holds within this provision

    invariants:                       # optional — applies across all provisions in this Sigil
        - Cross-provision constraint.
\`\`\`

Section order is required: \`identity\` → \`vocabulary\` → \`scope\` → \`provision(s)\` → \`invariants\`. Provision field order is required: \`trigger\` → \`preconditions\` → \`postconditions\` → \`invariants\`. Out-of-order fields are a parse error.

### Trigger Variants

| Syntax | Meaning | Item count |
|---|---|---|
| \`trigger:\` | Single condition | Exactly one — more is a parse error |
| \`trigger and:\` | All conditions must hold simultaneously | Two or more — fewer is a parse error |
| \`trigger or:\` | Any one condition suffices | Two or more — fewer is a parse error |

---

## Vocabulary Resolution Chain

Terms are resolved innermost-first: **Sigil → Charter → Doctrine**.

Any Capitalized identifier appearing in a provision or invariant must be defined at one of these layers. The validator checks the Sigil's \`vocabulary\` first, then the governing Charter's, then the governing Doctrine's. If not found at any layer, it is a validation error.

**Full replacement:** when a term is defined at multiple layers, the innermost definition wins for all artifacts at that layer and below. Definitions do not merge. Define terms at the most specific layer where they apply. If a term means the same thing platform-wide, define it in the Doctrine and omit it from lower layers.

---

## File Organization

Each file contains exactly one declaration. Name files to match their artifact identifier exactly:

\`\`\`
PetHealth.doctrine
Authentication.charter
AppointmentScheduling.charter
Login.sigil
RegisterPet.sigil
\`\`\`

Place files in the directories declared in the project manifest (\`sigil.toml\`):

\`\`\`toml
[project]
name = "ProjectName"
doctrine = "PetHealth.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
\`\`\`

The validator resolves \`- Authentication\` by looking for \`charters/Authentication.charter\`. The manifest and all referenced files are self-contained — paths resolve relative to the manifest's location.

---

## Design Constraints

- **Ambiguity is a defect.** Write provisions so there is exactly one valid interpretation. If a behavior is unclear to you as the author, it will be unclear to the implementor — and that is a spec bug, not a judgment call.
- **Scope exclusions are always explicit.** If a concern is out of scope, write an \`excludes:\` item. The absence of an exclusion does not imply inclusion.
- **Every behavior has \`trigger\` and \`postconditions\`.** Every rule has \`preconditions\` and \`postconditions\`. These are required fields for their respective provision subtypes.
- **Preconditions, postconditions, and invariants are conjunctive.** All listed items must hold. There is no \`or\` syntax within these fields — \`and\`/\`or\` are valid only in \`trigger\`.
- **Vocabulary entries use free-text definitions.** Write them in plain English. They are interpreted by agents and humans, not parsed by the validator.
- **A Sigil must have at least one provision.** A Sigil with no provisions is a parse error.
- **Empty sections are parse errors.** \`vocabulary:\`, \`excludes:\`, \`invariants:\`, \`sigils:\`, and \`charters:\` blocks must each contain at least one item if the section is present.
- **\`@\` is only valid in member references.** Using \`@\` anywhere other than a \`sigils:\` or \`charters:\` list item is a parse error.

---

## Key Design Decisions

- **DD-005 — Parse-first.** When readability and unambiguous parseability conflict, unambiguity wins. Writers accept minor syntactic friction; the grammar accepts no ambiguity.
- **DD-011 — Vocabulary: full replacement.** Definitions at inner layers replace outer-layer definitions. They do not inherit or merge.
- **DD-014 — Two provision subtypes.** \`behavior\` is for system responses to external triggers. \`rule\` is for constraints that must hold under given conditions.
- **DD-021 — Scope: exclusions only.** The \`scope\` section names what is explicitly out of scope. Inclusions are not declared — everything not excluded is in scope for the artifact.
- **DD-027/028 — Logical operators scoped to \`trigger\` only.** \`and\` and \`or\` are only valid in the \`trigger\` field. All other list fields are implicitly conjunctive.
- **DD-036 — Member reference syntax.** Name-only (\`- Checkout\`) resolves to current version. Version-pinned (\`- Checkout@1.2\`) resolves to that exact version.

---

## Annotated Examples

### Doctrine

\`\`\`
doctrine ECommerce:

    identity:
        version: 1.0
        status: draft
        description: "Governs the ECommerce platform. Defines platform-wide vocabulary, cross-charter scope boundaries, and invariants that hold across all bounded contexts."

    charters:
        - OrderManagement
        - UserAccounts
        - Catalog

    vocabulary:
        User:
            definition: "An authenticated account holder recognized across all bounded contexts within this platform."
        Currency:
            definition: "The single denomination in which all monetary values within the platform are expressed."

    scope:
        excludes:
            - Third-party payment processing. Delegated to external payment providers; platform is not responsible for their behavior or availability.
            - Shipping carrier integration. Delegated to external logistics providers.

    invariants:
        - All monetary values across all bounded contexts are denominated in a single Currency.
        - Every action within the platform is performed by or on behalf of an authenticated User.
        - No bounded context may directly invoke the internal operations of another bounded context.
\`\`\`

### Charter

\`\`\`
charter OrderManagement:

    identity:
        version: 1.0
        status: draft
        description: "Governs the order management bounded context, from cart submission through order lifecycle resolution."

    sigils:
        - Checkout
        - OrderFulfillment

    vocabulary:
        Order:
            definition: "A confirmed purchase record owned by a User, carrying a lifecycle status from creation through resolution."

    scope:
        excludes:
            - Payment authorization and settlement. Responsibility of the Payments bounded context.
            - User identity and authentication. Responsibility of the UserAccounts bounded context.

    invariants:
        - An Order cannot hold both a fulfilled status and a cancelled status simultaneously.
        - Every Order is owned by exactly one User.
\`\`\`

### Sigil

\`\`\`
sigil Checkout:

    identity:
        version: 1.0
        status: draft
        description: "Governs the checkout flow from cart confirmation through order creation."

    vocabulary:
        Cart:
            definition: "A transient collection of Items selected for purchase by an authenticated User."
        Order:
            definition: "A confirmed purchase record created from a Cart, assigned a lifecycle status."

    scope:
        excludes:
            - Payment authorization and processing.
            - Inventory reservation or stock validation.

    provision PlaceOrder behavior:
        trigger:
            - User submits the checkout form
        preconditions:
            - Cart is not empty
            - User is authenticated
        postconditions:
            - Order is created with status Pending
            - Cart is cleared

    provision OrderTotalMatchesItems rule:
        preconditions:
            - Order exists
        postconditions:
            - Order.total equals sum of Item.price for each Item in Order
\`\`\`
`

const CONSUMER = `\
<!-- Sigil Context — Consumer Role -->
<!-- Load this file when: implementing code from .sigil, .charter, or .doctrine files; building features governed by Sigil provisions; interpreting spec contracts during development. -->
<!-- Do not load when writing spec files — use SIGIL-AUTHOR.md instead. -->

# Sigil — Consumer Context

Sigil is a formalized specification language. The \`.sigil\`, \`.charter\`, and \`.doctrine\` files in this project are the authoritative specification for what the system must do. Your role as a spec consumer is to implement what the spec says — precisely, completely, and without filling in gaps not stated in the spec.

---

## Finding the Spec

The project manifest (\`sigil.toml\`) is the entry point. It names the root doctrine and the directories where Charter and Sigil files are located.

\`\`\`toml
[project]
name = "ProjectName"
doctrine = "PetHealth.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
\`\`\`

File graph traversal order:

1. Load the doctrine named in \`project.doctrine\`.
2. For each entry in the doctrine's \`charters:\` section, load \`{paths.charters}/{Name}.charter\`.
3. For each entry in a charter's \`sigils:\` section, load \`{paths.sigils}/{Name}.sigil\`.

A version-pinned member reference (\`- Checkout@1.2\`) means that exact version is required. Do not substitute the current version if the pinned version is unavailable — flag it as an unresolved reference.

---

## Reading Provisions

Each Sigil contains one or more provisions. A provision is either a \`behavior\` or a \`rule\`.

### \`behavior\` — a system response to a trigger

\`\`\`
provision PlaceOrder behavior:
    trigger:
        - User submits the checkout form
    preconditions:
        - Cart is not empty
        - User is authenticated
    postconditions:
        - Order is created with status Pending
        - Cart is cleared
\`\`\`

Implement as: when the trigger condition occurs **and** all preconditions hold, produce the system state described in the postconditions. All precondition items are conjunctive — every item must hold. All postcondition items are conjunctive — every item must be true after execution.

### \`rule\` — a constraint that must always hold

\`\`\`
provision OrderTotalMatchesItems rule:
    preconditions:
        - Order exists
    postconditions:
        - Order.total equals sum of Item.price for each Item in Order
\`\`\`

Implement as: whenever the preconditions hold, the postconditions must be true. This is an assertion, not a procedure. Your implementation must ensure this invariant is maintained — typically via data integrity constraints, validation logic, or enforced computation.

### Trigger Variants

| Syntax | Meaning |
|---|---|
| \`trigger:\` | Single condition. The behavior fires when this condition occurs. |
| \`trigger and:\` | Multiple conditions. All must hold simultaneously before the behavior fires. |
| \`trigger or:\` | Multiple conditions. Any one suffices to fire the behavior. |

### Invariants

\`invariants\` blocks appear at multiple levels and have different scopes:

| Level | Scope |
|---|---|
| Provision \`invariants:\` | Applies within that provision only |
| Sigil \`invariants:\` | Applies across all provisions in that Sigil |
| Charter \`invariants:\` | Applies across all Sigils within that Charter |
| Doctrine \`invariants:\` | Applies platform-wide, across all Charters and their Sigils |

Invariants are unconditional. They hold regardless of trigger state, preconditions, or execution path. Treat them as non-negotiable system constraints. All items in an \`invariants:\` block are conjunctive — every item must hold.

---

## Vocabulary Resolution

When you encounter a Capitalized identifier in a provision or invariant, its definition is found through the resolution chain — innermost layer wins:

1. Check the containing Sigil's \`vocabulary\` section.
2. If not found, check the governing Charter's \`vocabulary\` section.
3. If not found, check the governing Doctrine's \`vocabulary\` section.

Use the resolved definition when interpreting what a term means in implementation context. Do not substitute your own understanding of the word — the spec definition is authoritative.

**Full replacement:** a Charter-level definition of a term replaces the Doctrine-level definition for all Sigils within that Charter's scope. Definitions do not merge or inherit.

---

## Scope Exclusions

The \`scope.excludes\` block explicitly lists concerns that are out of scope for the artifact. If a concern appears in \`excludes:\`, do not implement it within the scope of that artifact — it belongs elsewhere.

\`\`\`
scope:
    excludes:
        - Payment authorization and processing.
        - Inventory reservation or stock validation.
\`\`\`

Exclusions often identify which other bounded context (Charter) owns the excluded concern. Use them to understand system boundaries, not to find what to implement.

---

## Ambiguity Protocol

If a provision, invariant, or vocabulary definition is ambiguous — meaning two or more reasonable implementations would satisfy the text — **do not guess**. Ambiguity is a defect in the spec, not a judgment call for the implementor.

Flag the ambiguity: identify the specific artifact (file name and provision name), quote the ambiguous text, and describe what interpretations are possible. Ask the engineer to resolve it in the spec before proceeding with implementation.

---

## Running the Validator

Validate the full corpus before implementing. This catches structural and semantic errors in the spec itself.

\`\`\`bash
npx @sigil-lang/cli validate sigil.toml
\`\`\`

Or if globally installed:

\`\`\`bash
sigil validate sigil.toml
\`\`\`

Output format:

\`\`\`
file:line:col — [parse error]: description
file:line:col — [validation error]: description
\`\`\`

**Parse errors** mean the file is structurally invalid and cannot be interpreted. Resolve all parse errors before implementing anything from that file.

**Validation errors** mean the file is parseable but semantically broken — for example, an unresolvable vocabulary term or a missing member reference. These indicate an incomplete or inconsistent spec; do not implement against a spec with validation errors.
`

export type Role = 'author' | 'consumer'

export function getContext(role: Role): string {
  return role === 'author' ? AUTHOR : CONSUMER
}

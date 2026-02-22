<!-- Sigil Context — Consumer Role -->
<!-- Load this file when: implementing code from .sigil, .charter, or .doctrine files; building features governed by Sigil provisions; interpreting spec contracts during development. -->
<!-- Do not load when writing spec files — use SIGIL-AUTHOR.md instead. -->

# Sigil — Consumer Context

Sigil is a formalized specification language. The `.sigil`, `.charter`, and `.doctrine` files in this project are the authoritative specification for what the system must do. Your role as a spec consumer is to implement what the spec says — precisely, completely, and without filling in gaps not stated in the spec.

---

## Finding the Spec

The project manifest (`sigil.toml`) is the entry point. It names the root doctrine and the directories where Charter and Sigil files are located.

```toml
[project]
name = "ProjectName"
doctrine = "PetHealth.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
```

File graph traversal order:

1. Load the doctrine named in `project.doctrine`.
2. For each entry in the doctrine's `charters:` section, load `{paths.charters}/{Name}.charter`.
3. For each entry in a charter's `sigils:` section, load `{paths.sigils}/{Name}.sigil`.

A version-pinned member reference (`- Checkout@1.2`) means that exact version is required. Do not substitute the current version if the pinned version is unavailable — flag it as an unresolved reference.

---

## Reading Provisions

Each Sigil contains one or more provisions. A provision is either a `behavior` or a `rule`.

### `behavior` — a system response to a trigger

```
provision PlaceOrder behavior:
    trigger:
        - User submits the checkout form
    preconditions:
        - Cart is not empty
        - User is authenticated
    postconditions:
        - Order is created with status Pending
        - Cart is cleared
```

Implement as: when the trigger condition occurs **and** all preconditions hold, produce the system state described in the postconditions. All precondition items are conjunctive — every item must hold. All postcondition items are conjunctive — every item must be true after execution.

### `rule` — a constraint that must always hold

```
provision OrderTotalMatchesItems rule:
    preconditions:
        - Order exists
    postconditions:
        - Order.total equals sum of Item.price for each Item in Order
```

Implement as: whenever the preconditions hold, the postconditions must be true. This is an assertion, not a procedure. Your implementation must ensure this invariant is maintained — typically via data integrity constraints, validation logic, or enforced computation.

### Trigger Variants

| Syntax | Meaning |
|---|---|
| `trigger:` | Single condition. The behavior fires when this condition occurs. |
| `trigger and:` | Multiple conditions. All must hold simultaneously before the behavior fires. |
| `trigger or:` | Multiple conditions. Any one suffices to fire the behavior. |

### Invariants

`invariants` blocks appear at multiple levels and have different scopes:

| Level | Scope |
|---|---|
| Provision `invariants:` | Applies within that provision only |
| Sigil `invariants:` | Applies across all provisions in that Sigil |
| Charter `invariants:` | Applies across all Sigils within that Charter |
| Doctrine `invariants:` | Applies platform-wide, across all Charters and their Sigils |

Invariants are unconditional. They hold regardless of trigger state, preconditions, or execution path. Treat them as non-negotiable system constraints. All items in an `invariants:` block are conjunctive — every item must hold.

---

## Vocabulary Resolution

When you encounter a Capitalized identifier in a provision or invariant, its definition is found through the resolution chain — innermost layer wins:

1. Check the containing Sigil's `vocabulary` section.
2. If not found, check the governing Charter's `vocabulary` section.
3. If not found, check the governing Doctrine's `vocabulary` section.

Use the resolved definition when interpreting what a term means in implementation context. Do not substitute your own understanding of the word — the spec definition is authoritative.

**Full replacement:** a Charter-level definition of a term replaces the Doctrine-level definition for all Sigils within that Charter's scope. Definitions do not merge or inherit.

---

## Scope Exclusions

The `scope.excludes` block explicitly lists concerns that are out of scope for the artifact. If a concern appears in `excludes:`, do not implement it within the scope of that artifact — it belongs elsewhere.

```
scope:
    excludes:
        - Payment authorization and processing.
        - Inventory reservation or stock validation.
```

Exclusions often identify which other bounded context (Charter) owns the excluded concern. Use them to understand system boundaries, not to find what to implement.

---

## Ambiguity Protocol

If a provision, invariant, or vocabulary definition is ambiguous — meaning two or more reasonable implementations would satisfy the text — **do not guess**. Ambiguity is a defect in the spec, not a judgment call for the implementor.

Flag the ambiguity: identify the specific artifact (file name and provision name), quote the ambiguous text, and describe what interpretations are possible. Ask the engineer to resolve it in the spec before proceeding with implementation.

---

## Running the Validator

Validate the full corpus before implementing. This catches structural and semantic errors in the spec itself.

```bash
npx @sigil-lang/cli validate sigil.toml
```

Or if globally installed:

```bash
sigil validate sigil.toml
```

Output format:

```
file:line:col — [parse error]: description
file:line:col — [validation error]: description
```

**Parse errors** mean the file is structurally invalid and cannot be interpreted. Resolve all parse errors before implementing anything from that file.

**Validation errors** mean the file is parseable but semantically broken — for example, an unresolvable vocabulary term or a missing member reference. These indicate an incomplete or inconsistent spec; do not implement against a spec with validation errors.

# Sigil Language Specification — v0.1

---

## 1. Introduction

Sigil is a formalized specification language for AI-driven software development. It sits between natural language prose and formal mathematical notation — precise enough for agentic execution, readable enough for engineers to write without specialized training.

### 1.1 The Four-Layer Model

Sigil uses a four-layer composition hierarchy. From atomic to platform:

| Layer | File Extension | Governs |
|---|---|---|
| Provision | (embedded in Sigil) | A single named behavior or rule |
| Sigil | `.sigil` | A feature — one or more provisions |
| Charter | `.charter` | A bounded context — one or more Sigils |
| Doctrine | `.doctrine` | A platform — one or more Charters |

Each layer is a first-class artifact. Every layer supports vocabulary definitions, scope exclusions, and invariants. No layer is purely organizational.

### 1.2 Design Principles

**Single canonical syntax.** There is no separate human-facing format and machine-readable serialization. The canonical form is the only form.

**Parse-first.** When readability and unambiguous parseability conflict, unambiguity wins. Writers accept minor syntactic friction; the grammar accepts no ambiguity.

**Ambiguity is a defect.** The language provides no judgment calls to the implementor. Every construct has one valid interpretation.

**Explicit scope.** Exclusions are always stated explicitly. The absence of an exclusion does not imply inclusion.

---

## 2. Conventions

### 2.1 Grammar Notation

| Symbol | Meaning |
|---|---|
| `=` | Production rule definition |
| `\|` | Alternative |
| `?` | Zero or one |
| `+` | One or more |
| `*` | Zero or more |
| `"literal"` | Terminal string |
| `UPPERCASE` | Lexer token |
| *lowercase* | Non-terminal rule |

### 2.2 Indentation

Sigil uses indentation to delimit blocks.

- Spaces only. Tabs are not permitted.
- No fixed indent unit — the indent width is inferred from the first indented block in the file.
- Indentation must be consistent within a file: the same number of spaces per indent level throughout.
- Tabs and spaces may not be mixed.

---

## 3. File Conventions

Each layer corresponds to a distinct file extension:

| Layer | Extension |
|---|---|
| Sigil | `.sigil` |
| Charter | `.charter` |
| Doctrine | `.doctrine` |

Each file contains exactly one declaration. Multiple declarations in a single file are a parse error.

---

## 4. Lexer Tokens

```
NEWLINE     = end of line
INDENT      = increase in indentation level (relative to parent block)
DEDENT      = return to parent indentation level
IDENTIFIER  = [A-Z][A-Za-z0-9]+
VERSION     = [0-9]+ "." [0-9]+
STATUS      = "draft" | "active" | "deprecated"
FREE_TEXT   = any character sequence excluding NEWLINE
AT          = "@"
QUOTED_STR  = '"' any character* '"'
```

**IDENTIFIER** matches a Capitalized CamelCase name — first character uppercase, followed by one or more alphanumeric characters. All named artifacts in Sigil (Sigil names, Charter names, Doctrine names, provision names, vocabulary entry keys) use this form. Language keywords (`sigil`, `charter`, `doctrine`, `provision`, `identity`, `vocabulary`, `scope`, `invariants`, `trigger`, `preconditions`, `postconditions`, `behavior`, `rule`, `and`, `or`, `excludes`, `version`, `status`, `description`, `definition`, `sigils`, `charters`) are lowercase and are not IDENTIFIERs.

Apostrophe (`'`) is not a valid IDENTIFIER character. Possessive constructions (`Appointment's`) are a grammar error. Use the `of the X` form ("the status of the Appointment") or a compound noun form ("Appointment status") instead.

**FREE_TEXT** permits colons and dashes mid-line. Disambiguation is by position: structural uses of `:` and `-` occur only at the start of a line after indentation. A leading `- ` (dash followed by a space, at line start after indent) is always a list-item marker, never FREE_TEXT content.

**AT** (`@`) is the version pin operator. It is valid only within a `member-ref` production. Its presence anywhere else is a parse error.

**QUOTED_STR** is a double-quoted string. It may contain any character except an unescaped double quote. It is used for human-readable field values (`description`, `definition`) where the content must be treated as opaque text.

---

## 5. Shared Productions

The following productions are defined once and used identically across the Sigil, Charter, and Doctrine layers.

### 5.1 Identity Section

```
identity-section    = "identity" ":" NEWLINE
                      INDENT identity-fields DEDENT

identity-fields     = version-field
                      status-field
                      description-field?

version-field       = "version" ":" VERSION NEWLINE
status-field        = "status" ":" STATUS NEWLINE
description-field   = "description" ":" QUOTED_STR NEWLINE
```

`version` and `status` are required. `description` is optional. All fields use scalar `key: value` syntax on a single line. Field ordering is prescribed: `version` → `status` → `description`. Out-of-order fields are a parse error.

`status` accepts three values:

- `draft` — the artifact is under active development and subject to change.
- `active` — the artifact is in use; changes follow the versioning scheme.
- `deprecated` — the artifact has been superseded and should not be referenced in new work.

`version` uses a two-part numeric scheme (`MAJOR.MINOR`). A change that removes or constrains existing behavior increments the major version. A change that adds or expands behavior increments the minor version.

### 5.2 Vocabulary Section

```
vocabulary-section  = "vocabulary" ":" NEWLINE
                      INDENT vocabulary-entry+ DEDENT

vocabulary-entry    = IDENTIFIER ":" NEWLINE
                      INDENT definition-field DEDENT

definition-field    = "definition" ":" QUOTED_STR NEWLINE
```

The `vocabulary` section defines terms used within the artifact's provisions or invariants. At least one entry is required if the section is present — an empty `vocabulary:` block is a parse error.

Each entry key is an IDENTIFIER. The `definition` value is a `QUOTED_STR` containing a human-readable description of the term.

Vocabulary keys must use the singular form. Plural forms as vocabulary keys are a validation error. Where the validator detects that a key matches a common English plural pattern (trailing `s`, `es`, or `ies`), it emits an actionable message identifying the likely singular form.

Any Capitalized identifier appearing in a provision or invariant within a Sigil must have a corresponding vocabulary entry resolvable through the Doctrine → Charter → Sigil chain. An unresolvable Capitalized identifier is a validation error. See Section 9 — Vocabulary Resolution.

### 5.3 Scope Section

```
scope-section       = "scope" ":" NEWLINE
                      INDENT excludes-block DEDENT

excludes-block      = "excludes" ":" NEWLINE
                      INDENT list-item+ DEDENT
```

The `scope` section explicitly names concerns that are out of scope for the artifact. At least one item is required if the section is present — an empty `excludes:` block is a parse error.

Scope exclusions are disavowals of responsibility. They identify adjacent concerns for which this artifact does not govern. Exclusion content is free text; exclusions are not machine-actionable references to other artifacts.

### 5.4 Invariants Section

```
invariants-section  = "invariants" ":" NEWLINE
                      INDENT list-item+ DEDENT
```

The `invariants` section expresses constraints that hold unconditionally within the artifact's scope. At least one item is required if the section is present — an empty `invariants:` block is a parse error. Items are implicitly conjunctive — all listed constraints must hold.

The semantic scope of invariants is determined by the containing declaration:

- In a Sigil, invariants apply across all provisions in that Sigil.
- In a Charter, invariants apply across all member Sigils.
- In a Doctrine, invariants apply across all member Charters and their contained Sigils.

### 5.5 List Item

```
list-item           = "-" " " FREE_TEXT NEWLINE
```

The `-` marker is followed by exactly one space, then free-text content. FREE_TEXT is interpreted as natural language by the consuming agent and carries no formal parse structure beyond the line boundary.

### 5.6 Member Item and Member Reference

```
member-item = "-" " " member-ref NEWLINE

member-ref  = IDENTIFIER
            | IDENTIFIER AT VERSION
```

`member-item` is used in the `sigils` section of a Charter and the `charters` section of a Doctrine. It is structurally identical to `list-item` in appearance but produces a parsed reference rather than free text. `member-item` is not valid in provision fields — those use `list-item`.

A name-only reference (`- Checkout`) resolves to the current version of the named artifact. A version-pinned reference (`- Checkout@1.2`) resolves to the specified version. `@` is valid only within a `member-ref`; its presence anywhere else is a parse error.

---

## 6. Sigil Layer

A Sigil governs a feature — a coherent unit of behavior defined by one or more provisions. It is the primary authoring artifact and the level at which individual behaviors and rules are specified.

### 6.1 File Structure

```
sigil-file          = sigil-declaration
```

A `.sigil` file contains exactly one sigil declaration.

### 6.2 Sigil Declaration

```
sigil-declaration   = "sigil" IDENTIFIER ":" NEWLINE
                      INDENT sigil-body DEDENT
```

The sigil name is an IDENTIFIER.

### 6.3 Sigil Body

```
sigil-body          = identity-section
                      vocabulary-section?
                      scope-section?
                      provision-declaration+
                      invariants-section?
```

`identity-section` and at least one `provision-declaration` are required. A Sigil with no provisions is a parse error — a Sigil that specifies nothing governs nothing.

Section ordering is prescribed: meta sections (`identity`, `vocabulary`, `scope`) precede spec sections (`provision`, `invariants`). Out-of-order sections are a parse error.

### 6.4 Provision Declaration

```
provision-declaration = "provision" IDENTIFIER provision-subtype ":" NEWLINE
                        INDENT provision-body DEDENT

provision-subtype     = "behavior" | "rule"
```

A provision is a named behavioral or rule specification within a Sigil. The provision name is an IDENTIFIER. The subtype keyword follows immediately after the name.

Two subtypes are defined:

- **`behavior`** — specifies a system response to an external trigger. Defines what the system does when something happens.
- **`rule`** — specifies a constraint or invariant relationship that must hold under given conditions. Defines what must always be true.

### 6.5 Provision Body

```
provision-body      = behavior-body | rule-body

behavior-body       = trigger-field
                      preconditions-field?
                      postconditions-field
                      invariants-field?

rule-body           = preconditions-field
                      postconditions-field
                      invariants-field?
```

Field ordering within a provision body is prescribed. Out-of-order fields are a parse error.

For `behavior` provisions: `trigger` is required; `preconditions` is optional; `postconditions` is required; `invariants` is optional.

For `rule` provisions: `preconditions` is required; `postconditions` is required; `invariants` is optional.

### 6.6 Trigger Field

```
trigger-field       = trigger-single | trigger-and | trigger-or

trigger-single      = "trigger" ":" NEWLINE
                      INDENT list-item DEDENT

trigger-and         = "trigger" "and" ":" NEWLINE
                      INDENT list-item list-item+ DEDENT

trigger-or          = "trigger" "or" ":" NEWLINE
                      INDENT list-item list-item+ DEDENT
```

`trigger-single` accepts exactly one list item. A `trigger:` block containing more than one item is a parse error — use `trigger and:` or `trigger or:` for multiple conditions.

`trigger and:` expresses a compound trigger where all listed conditions must hold simultaneously before the behavior fires.

`trigger or:` expresses a compound trigger where any one of the listed conditions suffices to fire the behavior.

Both compound forms require at least two items — a compound trigger with one item is a parse error.

### 6.7 Preconditions and Postconditions

```
preconditions-field   = "preconditions" ":" NEWLINE
                        INDENT list-item+ DEDENT

postconditions-field  = "postconditions" ":" NEWLINE
                        INDENT list-item+ DEDENT
```

`preconditions` specifies the conditions that must hold before the behavior fires or before the rule is evaluated.

`postconditions` specifies the conditions that must hold after the behavior completes or that the rule asserts must always be true given its preconditions.

Both fields are implicitly conjunctive — all listed items must hold. No logical operator syntax is available within these fields.

### 6.8 Provision Invariants Field

```
invariants-field    = "invariants" ":" NEWLINE
                      INDENT list-item+ DEDENT
```

Optional on both `behavior` and `rule` provisions. Expresses constraints that hold unconditionally within the scope of this provision, regardless of trigger or precondition state. Implicitly conjunctive.

---

## 7. Charter Layer

A Charter governs a bounded context — a coherent set of Sigils that share a vocabulary, scope boundary, and cross-Sigil invariants.

### 7.1 File Structure

```
charter-file        = charter-declaration
```

A `.charter` file contains exactly one charter declaration.

### 7.2 Charter Declaration

```
charter-declaration = "charter" IDENTIFIER ":" NEWLINE
                      INDENT charter-body DEDENT
```

The charter name is an IDENTIFIER.

### 7.3 Charter Body

```
charter-body        = identity-section
                      sigils-section
                      vocabulary-section?
                      scope-section?
                      invariants-section?
```

`identity-section` and `sigils-section` are required. All other sections are optional.

Section ordering is prescribed: `identity` → `sigils` → `vocabulary` → `scope` → `invariants`. Out-of-order sections are a parse error.

### 7.4 Sigils Section

```
sigils-section      = "sigils" ":" NEWLINE
                      INDENT member-item+ DEDENT
```

At least one `member-item` is required. An empty `sigils:` block is a validation error — a Charter with no member Sigils governs nothing.

### 7.5 Semantics

A Charter's `vocabulary` definitions apply across all member Sigils. Where a Charter defines a term also defined in a member Sigil, the Charter's definition takes effect within this Charter's scope; the Sigil-level definition is not consulted. See Section 9 — Vocabulary Resolution.

A Charter's `scope` exclusions express concerns outside this bounded context's boundary. At the Charter boundary, exclusions typically identify peer bounded contexts responsible for the excluded concern.

A Charter's `invariants` express constraints that apply across all member Sigils — constraints that no single Sigil can fully own but that the bounded context as a whole must uphold.

---

## 8. Doctrine Layer

A Doctrine governs a platform — a coherent set of Charters that share platform-wide vocabulary, scope boundaries, and cross-Charter invariants.

### 8.1 File Structure

```
doctrine-file       = doctrine-declaration
```

A `.doctrine` file contains exactly one doctrine declaration.

### 8.2 Doctrine Declaration

```
doctrine-declaration = "doctrine" IDENTIFIER ":" NEWLINE
                       INDENT doctrine-body DEDENT
```

The doctrine name is an IDENTIFIER.

### 8.3 Doctrine Body

```
doctrine-body       = identity-section
                      charters-section
                      vocabulary-section?
                      scope-section?
                      invariants-section?
```

`identity-section` and `charters-section` are required. All other sections are optional.

Section ordering is prescribed: `identity` → `charters` → `vocabulary` → `scope` → `invariants`. Out-of-order sections are a parse error.

### 8.4 Charters Section

```
charters-section    = "charters" ":" NEWLINE
                      INDENT member-item+ DEDENT
```

At least one `member-item` is required. An empty `charters:` block is a validation error — a Doctrine with no member Charters governs nothing.

### 8.5 Semantics

A Doctrine's `vocabulary` definitions are the root of the vocabulary resolution chain. No higher layer exists to override them.

A Doctrine's `scope` exclusions express concerns outside the platform boundary — typically third-party systems, external integrations, or concerns delegated entirely outside the platform.

A Doctrine's `invariants` apply platform-wide, across all member Charters and their contained Sigils. These are the constraints that hold unconditionally for the entire platform.

---

## 9. Vocabulary Resolution

### 9.1 Identifier Detection in Provision Text

Provision and invariant text is mixed content — natural language prose surrounding vocabulary references. The resolver distinguishes the two by token form: only IDENTIFIER tokens (PascalCase, matching `[A-Z][A-Za-z0-9]+`) are treated as vocabulary references. All other tokens — lowercase words, numbers, punctuation, quantifier phrases such as "1 or more" or "at least one" — are prose and are not resolved.

**PascalCase is the only capitalization convention in provision text.** There is no sentence-case rule — the `-` list-item marker already delimits the start of an item. Articles, quantifiers, conjunctions, verbs, and all other prose words must be lowercase, including at the start of a list item. A PascalCase word anywhere in provision text signals a vocabulary reference; no other interpretation exists.

```
- 1 or more Appointment can be cancelled
- the system notifies each Pet owner
- no Appointment can overlap with an existing Appointment
- all Pet records must be retained
```

The validator resolves `Appointment` and `Pet`; all lowercase prose is ignored. A PascalCase word that does not resolve to a vocabulary entry is always a validation error — there are no reserved non-vocabulary PascalCase words.

### 9.2 Resolution Chain

When the resolver encounters an IDENTIFIER in a provision or invariant, it resolves the term as follows:

1. Check the containing Sigil's `vocabulary` section.
2. If not found, check the `vocabulary` section of the Sigil's governing Charter.
3. If not found, check the `vocabulary` section of the Charter's governing Doctrine.
4. If not found at any layer, the identifier is unresolved — a validation error.

Resolution requires an **exact match** between the identifier as written and a vocabulary key. No normalization is applied. `Appointments` does not resolve from a vocabulary key of `Appointment`.

When an unresolved identifier matches a common English plural pattern (trailing `s`, `es`, or `ies`) and a corresponding singular form exists in the vocabulary, the validator emits an actionable error message identifying the singular candidate:

```
'Appointments' is not defined in vocabulary.
Vocabulary keys use singular forms — did you mean 'Appointment'?
```

Resolution is by **full replacement**. When a term is defined at multiple layers, the innermost definition takes effect for all artifacts at that layer and below. Outer-layer definitions for the same term are not consulted and do not merge with the inner definition. A Charter-level definition of `User` replaces any Doctrine-level definition of `User` for all Sigils within that Charter's scope.

---

## 10. Membership Reference Resolution

Member references in `sigils:` and `charters:` sections name artifacts within the enclosing system.

A **name-only reference** (`- Checkout`) resolves to the current version of the named artifact. The validator discovers the named file using the search paths declared in the project manifest — see Section 12.

A **version-pinned reference** (`- Checkout@1.2`) resolves to the artifact at the specified version. If the specified version is not available in the environment, the reference is unresolved — a validation error.

---

## 11. Validation

Errors fall into two categories.

**Parse errors** are structural violations caught during parsing. A file containing a parse error is not a valid Sigil artifact and cannot be interpreted.

**Validation errors** are semantic violations detected after a file has been successfully parsed. A file may be syntactically valid but semantically invalid.

### Parse Errors

| Condition | Section |
|---|---|
| More than one declaration in a file | §3 |
| `identity` section missing from any declaration | §6.3, §7.3, §8.3 |
| No `provision-declaration` in a Sigil body | §6.3 |
| `sigils` section missing from a Charter body | §7.3 |
| `charters` section missing from a Doctrine body | §8.3 |
| Sections out of prescribed order | §6.3, §7.3, §8.3 |
| Fields out of prescribed order within a provision body | §6.5 |
| `trigger:` block with more than one item | §6.6 |
| `trigger and:` or `trigger or:` with fewer than two items | §6.6 |
| Empty `vocabulary:` block | §5.2 |
| Empty `excludes:` block | §5.3 |
| Empty `invariants:` block (section or field) | §5.4, §6.8 |
| Empty `sigils:` block in a Charter | §7.4 |
| Empty `charters:` block in a Doctrine | §8.4 |
| `@` appearing outside a `member-ref` | §5.6 |
| Possessive suffix (`'s`) attached to an identifier | §4 |
| Tabs used for indentation | §2.2 |
| Mixed tabs and spaces | §2.2 |

### Validation Errors

| Condition | Section |
|---|---|
| Capitalized identifier in a provision or invariant with no exact-match vocabulary entry in the resolution chain | §9.2 |
| Capitalized identifier in a provision or invariant that resembles a plural form of an existing vocabulary key (actionable message emitted) | §9.2 |
| Vocabulary key that matches a common English plural pattern | §5.2 |
| Version-pinned member reference that cannot be resolved in the environment | §10 |
| Member reference name that cannot be found in the search paths declared in the manifest | §12 |

---

## 12. Project Manifest

A project manifest is a TOML file that defines the corpus for a validation run. It bootstraps the validator into the member reference graph by naming the root doctrine and providing file system search paths for resolving artifact names to file paths.

### 12.1 Schema

```toml
[project]
name = "ECommerce"
doctrine = "ECommerce.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
```

`project.name` is a human-readable label for the corpus. It is not an IDENTIFIER and carries no formal parse role.

`project.doctrine` is the path to the root doctrine file.

`paths.charters` is the directory in which charter files are located. The validator resolves a charter name `OrderManagement` by looking for `{paths.charters}/OrderManagement.charter`.

`paths.sigils` is the directory in which sigil files are located. The validator resolves a sigil name `Checkout` by looking for `{paths.sigils}/Checkout.sigil`.

All paths are resolved relative to the manifest file's location, not the working directory from which the validator is invoked. This makes the manifest and its referenced files self-contained regardless of invocation context.

### 12.2 Validation Sequence

Given a manifest, the validator proceeds in the following order:

1. Load and parse the doctrine file at `project.doctrine`.
2. For each `member-item` in the doctrine's `charters:` section, resolve the name to a file path using `paths.charters` and load the charter.
3. For each `member-item` in each charter's `sigils:` section, resolve the name to a file path using `paths.sigils` and load the sigil.
4. Validate each loaded artifact for parse errors.
5. Validate vocabulary resolution across the full corpus.
6. Validate that all version-pinned member references resolve to available artifacts.

If a file cannot be found during steps 2 or 3, the reference is unresolved — a validation error. Validation does not proceed past step 4 if any parse errors are present.

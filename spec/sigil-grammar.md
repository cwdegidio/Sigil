# Sigil Grammar — v0.1 (draft)

Derived from `docs/examples/Checkout.sigil`. Covers the Sigil layer only. Charter and Doctrine grammar to follow.

## Notation

- `=` — production rule definition
- `|` — alternative
- `?` — zero or one
- `+` — one or more
- `*` — zero or more
- `"literal"` — terminal string
- `UPPERCASE` — lexer token (defined in Lexer Tokens section)
- _lowercase_ — non-terminal rule

---

## Lexer Tokens

```
NEWLINE     = end of line
INDENT      = increase in indentation level (relative to parent block)
DEDENT      = return to parent indentation level
IDENTIFIER  = [A-Z][A-Za-z0-9]+          # Capitalized, CamelCase — named artifacts (DD-013)
VERSION     = [0-9]+ "." [0-9]+           # e.g., 1.0, 2.3
STATUS      = "draft" | "active" | "deprecated"
FREE_TEXT   = any character sequence excluding NEWLINE
              # Colons and dashes permitted mid-line — disambiguated by position (DD-030)
              # A leading "- " (dash + space at line start after indent) is always a list-item marker, never FREE_TEXT
QUOTED_STR  = '"' any character* '"'
AT          = "@"                          # version pin operator; valid only in member-ref (DD-036)
```

> **DD-029:** Spaces only. No fixed unit — inferred from first indented block. Consistent per block. No mixing of tabs and spaces.
> **DD-030:** Colons and dashes permitted in FREE_TEXT. Both disambiguated by position — structural uses only occur at line start.

---

## Top-Level Rule

```
sigil-file          = sigil-declaration
```

A `.sigil` file contains exactly one sigil declaration.

---

## Sigil Declaration

```
sigil-declaration   = "sigil" IDENTIFIER ":" NEWLINE
                      INDENT sigil-body DEDENT
```

The sigil name is an IDENTIFIER (Capitalized, per DD-013). The colon and INDENT open the body block (DD-024).

---

## Sigil Body

```
sigil-body          = identity-section
                      vocabulary-section?
                      scope-section?
                      provision-declaration+
                      invariants-section?
```

`identity-section` is always first. At least one `provision-declaration` is required (DD-012). `vocabulary-section`, `scope-section`, and `invariants-section` are optional; their grammar follows below.

> **DD-031:** Section ordering is prescribed. Meta sections (`identity`, `vocabulary`, `scope`) precede spec sections (`provision`, `invariants`). Out-of-order sections are a syntax error.

---

## Identity Section

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

All identity fields use scalar `key: value` syntax (DD-025). `version` and `status` are required; `description` is optional (DD-020).

---

## Provision Declaration

```
provision-declaration = "provision" IDENTIFIER provision-subtype ":" NEWLINE
                        INDENT provision-body DEDENT

provision-subtype     = "behavior" | "rule"
```

The provision name is an IDENTIFIER. The subtype keyword follows immediately (DD-014). The colon and INDENT open the provision body (DD-024).

---

## Provision Body

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

Field requirements by subtype follow DD-017. `invariants-field` is optional on both (DD-015).

> **DD-032:** Field ordering within a provision body is prescribed. `behavior`: trigger → preconditions → postconditions → invariants. `rule`: preconditions → postconditions → invariants. Out-of-order fields are a syntax error.

---

## Trigger Field

```
trigger-field       = trigger-single | trigger-and | trigger-or

trigger-single      = "trigger" ":" NEWLINE
                      INDENT list-item DEDENT

trigger-and         = "trigger" "and" ":" NEWLINE
                      INDENT list-item list-item+ DEDENT

trigger-or          = "trigger" "or" ":" NEWLINE
                      INDENT list-item list-item+ DEDENT
```

All trigger variants use block form with `-` items (DD-026, DD-027). `trigger-single` takes exactly one item; `and`/`or` variants require at least two (the logical operator is meaningless on one item). `and` and `or` are lowercase keywords (DD-013, DD-028).

> **DD-033:** `trigger-single` accepts exactly one list item at the grammar level. A `trigger:` block with multiple items is a parse error. Authors must use `trigger and:` or `trigger or:` for multiple conditions.

---

## Preconditions and Postconditions

```
preconditions-field   = "preconditions" ":" NEWLINE
                        INDENT list-item+ DEDENT

postconditions-field  = "postconditions" ":" NEWLINE
                        INDENT list-item+ DEDENT
```

Implicitly conjunctive — all items must hold. No logical operator syntax (DD-028).

---

## Invariants Field

```
invariants-field    = "invariants" ":" NEWLINE
                      INDENT list-item+ DEDENT
```

Optional on both `behavior` and `rule` provisions (DD-015). Implicitly conjunctive.

---

## List Item

```
list-item           = "-" " " FREE_TEXT NEWLINE
```

The `-` marker is followed by a single space, then free-text content (DD-026). FREE_TEXT is interpreted by the consuming agent as natural language — it carries no formal parse structure beyond the line boundary.

---

## Vocabulary Section

```
vocabulary-section  = "vocabulary" ":" NEWLINE
                      INDENT vocabulary-entry+ DEDENT

vocabulary-entry    = IDENTIFIER ":" NEWLINE
                      INDENT definition-field DEDENT

definition-field    = "definition" ":" QUOTED_STR NEWLINE
```

At least one `vocabulary-entry` is required if the section is present — an empty `vocabulary:` block is a syntax error. Each entry key is an IDENTIFIER (Capitalized CamelCase per DD-013). The `definition` value is a `QUOTED_STR` — a human-readable, free-text description of the term.

A Capitalized identifier appearing in any provision within this Sigil that has no corresponding vocabulary entry in the Doctrine → Charter → Sigil resolution chain is a validation error (DD-013).

> **DD-034:** Vocabulary entry syntax uses block form: an IDENTIFIER key opens a block containing a single required `definition` field whose value is a QUOTED_STR. This is consistent with the block-form pattern used throughout the language and leaves the entry structure open to additional fields without a grammar change.

---

## Scope Section

```
scope-section       = "scope" ":" NEWLINE
                      INDENT excludes-block DEDENT

excludes-block      = "excludes" ":" NEWLINE
                      INDENT list-item+ DEDENT
```

At least one `list-item` is required under `excludes:` — a present `scope:` block with no exclusions is a syntax error. Exclusion items are free text (DD-021): they name adjacent concerns explicitly out of scope for this Sigil. They are not formal references to other Sigils or vocabulary terms.

> **DD-035:** Scope exclusion syntax uses a named `excludes:` sub-block containing free-text list items. The `excludes:` keyword makes the section self-describing and reserves the `scope:` block for future sub-blocks without a grammar change. Exclusion content is free text — exclusions are disavowals of responsibility, not machine-actionable references.

---

## Invariants Section

```
invariants-section  = "invariants" ":" NEWLINE
                      INDENT list-item+ DEDENT
```

At least one `list-item` is required if the section is present — an empty `invariants:` block is a syntax error. List items are free text, identical in form to provision field list items.

This production is shared across layers: at the Sigil level it expresses constraints that hold across all provisions; at the Charter level it expresses cross-Sigil constraints; at the Doctrine level it expresses platform-wide constraints. The grammar production is identical at all layers — the semantic scope is determined by the containing declaration.

Note: provision-level invariants use the `invariants-field` production (defined above), which has the same syntax. The naming difference signals context of use — `invariants-field` is contained within a provision body; `invariants-section` is a top-level section of a Sigil, Charter, or Doctrine body.

---

## Membership Reference

```
member-item = "-" " " member-ref NEWLINE

member-ref  = IDENTIFIER
            | IDENTIFIER "@" VERSION
```

`member-item` is structurally identical to `list-item` in appearance but produces a parsed reference rather than FREE_TEXT. Name-only (`- Checkout`) resolves to the current version of the named artifact. Version-pinned (`- Checkout@1.2`) resolves to the specified version. `@` is the version pin operator and is not valid in any other position in the language.

`member-item` is used in the `sigils-section` of a Charter and the `charters-section` of a Doctrine. It is not valid in provision fields — those use `list-item`.

> **DD-036:** Membership references use `IDENTIFIER` for name-only and `IDENTIFIER "@" VERSION` for version-pinned references. `@` is introduced as a single-purpose operator: it carries the semantics of "at version" and is familiar from package manager conventions without importing programming language connotations. Because `@` is unused elsewhere in the language, its presence unambiguously signals a version pin at parse time.

---

## Sections TBD

The following are defined in design decisions but not yet reflected in the grammar:

- Charter and Doctrine grammars — DD-022, DD-023 (see `spec/charter-grammar.md`, `spec/doctrine-grammar.md`)

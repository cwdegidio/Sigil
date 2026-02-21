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

`identity-section` is always first. At least one `provision-declaration` is required (DD-012). `vocabulary-section`, `invariants-section`, and `scope-section` are optional and their grammar is TBD.

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

## Sections TBD

The following sections are defined in design decisions but not yet reflected in the grammar:

- `vocabulary-section` — DD-010, DD-011
- `scope-section` — DD-021
- `invariants-section` (Sigil-level) — DD-008
- Charter and Doctrine grammars — DD-022, DD-023

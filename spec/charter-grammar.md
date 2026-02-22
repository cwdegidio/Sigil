# Charter Grammar — v0.1 (draft)

Covers the Charter layer. Lexer tokens and shared productions (`identity-section`, `vocabulary-section`, `scope-section`, `invariants-section`, `member-item`, `list-item`) are defined in [`spec/sigil-grammar.md`](sigil-grammar.md).

## Notation

Same as [`spec/sigil-grammar.md`](sigil-grammar.md).

---

## Top-Level Rule

```
charter-file        = charter-declaration
```

A `.charter` file contains exactly one charter declaration (DD-019).

---

## Charter Declaration

```
charter-declaration = "charter" IDENTIFIER ":" NEWLINE
                      INDENT charter-body DEDENT
```

The charter name is an IDENTIFIER (Capitalized CamelCase, per DD-013).

---

## Charter Body

```
charter-body        = identity-section
                      sigils-section
                      vocabulary-section?
                      scope-section?
                      invariants-section?
```

`identity-section` and `sigils-section` are required (DD-022). All other sections are optional. Section ordering is prescribed — out-of-order sections are a syntax error.

> **DD-037:** Charter section ordering follows the meta-before-spec principle established in DD-031. `identity` declares what the Charter is; `sigils` declares what it governs — both are meta. `vocabulary` and `scope` are definitional meta. `invariants` are the behavioral spec. Prescribed order: identity → sigils → vocabulary → scope → invariants. Out-of-order sections are a syntax error.

---

## Identity Section

Identical to the Sigil `identity-section`. See `spec/sigil-grammar.md`. Fields: `version` (required), `status` (required), `description` (optional) — DD-020, DD-022.

---

## Sigils Section

```
sigils-section      = "sigils" ":" NEWLINE
                      INDENT member-item+ DEDENT
```

At least one `member-item` is required (DD-022). An empty `sigils:` block is a validation error — a Charter with no member Sigils governs nothing. Member references use the `member-ref` production defined in `spec/sigil-grammar.md` (DD-036).

---

## Vocabulary Section

Identical to the Sigil `vocabulary-section`. See `spec/sigil-grammar.md`. Definitions at the Charter level fully replace Doctrine-level definitions for the same term within this Charter's scope (DD-011).

---

## Scope Section

Identical to the Sigil `scope-section`. See `spec/sigil-grammar.md`. Exclusions at the Charter level disavow responsibility at the bounded-context boundary.

---

## Invariants Section

Identical to the shared `invariants-section`. See `spec/sigil-grammar.md`. At the Charter level, invariants express constraints that apply across all member Sigils within this bounded context (DD-022).

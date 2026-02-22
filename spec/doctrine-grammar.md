# Doctrine Grammar — v0.1 (draft)

Covers the Doctrine layer. Lexer tokens and shared productions (`identity-section`, `vocabulary-section`, `scope-section`, `invariants-section`, `member-item`, `list-item`) are defined in [`spec/sigil-grammar.md`](sigil-grammar.md).

## Notation

Same as [`spec/sigil-grammar.md`](sigil-grammar.md).

---

## Top-Level Rule

```
doctrine-file       = doctrine-declaration
```

A `.doctrine` file contains exactly one doctrine declaration (DD-019).

---

## Doctrine Declaration

```
doctrine-declaration = "doctrine" IDENTIFIER ":" NEWLINE
                       INDENT doctrine-body DEDENT
```

The doctrine name is an IDENTIFIER (Capitalized CamelCase, per DD-013).

---

## Doctrine Body

```
doctrine-body       = identity-section
                      charters-section
                      vocabulary-section?
                      scope-section?
                      invariants-section?
```

`identity-section` and `charters-section` are required (DD-023). All other sections are optional. Section ordering is prescribed — out-of-order sections are a syntax error (DD-037, applied at the Doctrine layer).

---

## Identity Section

Identical to the Sigil `identity-section`. See `spec/sigil-grammar.md`. Fields: `version` (required), `status` (required), `description` (optional) — DD-020, DD-023.

---

## Charters Section

```
charters-section    = "charters" ":" NEWLINE
                      INDENT member-item+ DEDENT
```

At least one `member-item` is required (DD-023). An empty `charters:` block is a validation error — a Doctrine with no member Charters governs nothing. Member references use the `member-ref` production defined in `spec/sigil-grammar.md` (DD-036).

---

## Vocabulary Section

Identical to the Sigil `vocabulary-section`. See `spec/sigil-grammar.md`. Doctrine vocabulary is the root of the Doctrine → Charter → Sigil resolution chain — there is no higher layer that can override Doctrine-level definitions (DD-011).

---

## Scope Section

Identical to the Sigil `scope-section`. See `spec/sigil-grammar.md`. Exclusions at the Doctrine level disavow responsibility at the platform boundary.

---

## Invariants Section

Identical to the shared `invariants-section`. See `spec/sigil-grammar.md`. At the Doctrine level, invariants express platform-wide constraints that apply across all member Charters and their contained Sigils (DD-023).

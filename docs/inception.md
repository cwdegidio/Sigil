# Sigil — Formalized Specification Language for AI-Driven Development

**Project Inception Summary**
_Date: February 21, 2026 | Status: Working Document — Phase 0_

---

## 1. Background & Motivation

This project originated from a conversation exploring how AI is fundamentally reshaping software development workflows. The core observation is that AI is shifting developer effort upstream — away from syntax and boilerplate, toward problem definition, architecture, and requirements. This shift introduces a new critical bottleneck: the quality and precision of specifications.

The emerging AI-driven development model can be expressed as:

```
Specs → Implementation Plan → Agentic Execution → Scenario-Based Testing
```

In this model, the specification becomes the primary engineering artifact. Poor specs produce poor outcomes — just faster and at greater scale.

---

## 2. The Problem: Ambiguity in Specifications

Natural language specifications suffer from inherent ambiguity. The same sentence can be interpreted multiple ways by different developers — and by different AI agents. A viable specification language for this paradigm needs to be:

- **Unambiguous enough** for an AI agent to execute against reliably
- **Human-readable enough** for developers and stakeholders to write and review
- **Structured enough** to be machine-parseable and version-controlled
- **Flexible enough** to handle real-world iteration and incomplete knowledge upfront

---

## 3. Prior Art & Landscape

### Formal Specification Languages (High Rigor, Low Adoption)

- **TLA+** (Leslie Lamport) — used internally at AWS for distributed systems verification
- **Alloy** — relational modeling language for structural constraints
- **Z Notation / VDM** — mathematically precise but require specialized training

These solve the ambiguity problem but are too demanding for general team adoption.

### Lightweight Approaches (High Adoption, Low Rigor)

- **Gherkin / BDD (Cucumber)** — Given/When/Then patterns; readable but loose
- **OpenAPI** — good for API contracts, narrow scope
- **JSON Schema** — useful for data contracts, not system behavior
- **EARS** (Easy Approach to Requirements Syntax) — structured natural language using patterns like `WHEN [trigger] THE SYSTEM SHALL [response]`

These are more approachable but sacrifice the rigor needed for reliable agentic execution.

### The Gap

Neither extreme fits the AI-driven development paradigm. A middle path is needed — more rigorous than prose, less demanding than formal math notation.

---

## 4. What the AI Paradigm Changes

AI as the executor of specs opens a middle path that wasn't viable before. Unlike a human developer or a theorem prover, an AI agent can:

- Ask clarifying questions when a spec is underspecified
- Infer intent from context and convention
- Operate on structured natural language rather than requiring full mathematical formalism

This creates an opportunity to design a specification language that sits between prose and formal notation — something an AI can act on reliably while a human can still write without specialized training.

---

## 5. Design Goals for Sigil

Based on the conversation, Sigil should have the following properties:

| Property                                    | Description                                                         |
| ------------------------------------------- | ------------------------------------------------------------------- |
| **Structured natural language**             | Enforced patterns, not math notation                                |
| **Explicit preconditions & postconditions** | Every behavior defined with entry and exit state                    |
| **Invariants**                              | System-wide constraints that must always hold                       |
| **Named entities & shared vocabulary**      | Ubiquitous language (DDD-style) built into the spec                 |
| **Explicit scope boundaries**               | What the system does NOT do is as important as what it does         |
| **Machine-parseable**                       | Suitable for AI agents to reference during execution                |
| **Linkable & versioned**                    | Spec clauses are referenceable artifacts, not free-form prose       |
| **Scenario linkage**                        | Test scenarios are directly linked to spec clauses for traceability |

The target feel: somewhere between a legal contract and a YAML file.

---

## 6. Open Design Questions

The following questions were identified but not yet resolved — these will drive the first working sessions:

1. **Scope:** General-purpose language, or domain-targeted (e.g., backend service contracts, UI component behavior, full system specs)? Starting narrow and generalizing is safer than the reverse.

2. **Primary consumer:** Human developer, AI agent, or both equally? This significantly changes syntax and structure decisions.

3. **Adoption model:** Internal organizational standard, or designed for broader open use? Internal tools can afford more domain-specific conventions.

---

## 7. Next Steps

This project will be developed iteratively in a working directory using Claude Code. Specs written in Sigil are called **sigils**. The planned approach:

1. **Phase 1 — Language Design:** Define core constructs, syntax patterns, and grammar
2. **Phase 2 — Documentation:** Write formal spec for the spec language itself (dogfooding)
3. **Phase 3 — Testing:** Apply the language to real scenarios and identify gaps
4. **Phase 4 — Refinement:** Iterate based on what breaks in practice

The working directory will serve as the source of truth. Documentation and the language spec will be built and tested together, with Claude Code as both contributor and consumer.

---

## 8. Key Principles (Tentative)

These emerged from the conversation and should be treated as starting assumptions to be validated or challenged:

- The spec is a first-class engineering artifact — not a ticket or a comment
- Ambiguity is a defect in the spec, not a judgment call for the implementor
- The language must be writable by engineers who are not language theorists
- Scenario-based tests should be traceable back to specific spec clauses
- Scope exclusions are explicit, not implied

---

_This document is a starting point. All design decisions are subject to revision as the language takes shape._

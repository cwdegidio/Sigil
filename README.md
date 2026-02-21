# Sigil

> _A formalized specification language for AI-driven software development._

Software has always suffered from the gap between what we mean and what we write. In the age of agentic AI development, that gap becomes a fault line — vague specs don't just slow teams down, they produce confidently wrong systems at machine speed. Sigil is a specification language designed to close that gap. It sits between natural language prose and formal mathematical notation: precise enough for an AI agent to execute against reliably, readable enough for an engineer to write without a PhD. In Sigil, a specification — called a sigil — is a first-class engineering artifact that defines not just what a system does, but what it explicitly does not do, under what conditions, and what must always remain true. Ambiguity is a defect. A sealed sigil is a contract.

---

## Project Status

Early design phase. See `docs/inception.md` for background and motivation.

## Structure

```
sigil/
├── CLAUDE.md               # AI collaboration instructions
├── README.md
├── docs/
│   ├── inception.md        # Project background and design goals
│   ├── design-decisions.md # Logged decisions with rationale
│   └── examples/           # Annotated example sigils
├── spec/                   # The Sigil language spec (written in Sigil)
└── tests/
    └── scenarios/          # Scenario-based tests linked to spec clauses
```

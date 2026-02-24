# Sigil Trial Notes — PetHealth App

_Running notes from the Phase 2C real-world trial. Captured as the trial progresses. Not a polished document — raw observations, friction points, surprises, and questions for post-trial review._

---

## Trial Setup

- **Project:** PetHealth — Vue frontend, Spring Boot backend, H2 database
- **CLI install:** local path (`npm install -g /path/to/sigil/packages/cli`)
- **Agent:** Claude Code with `/author` and `/consumer` custom commands
- **Started:**

---

## Observations

- `sigil --version` did not work, return `Unknown command: '--version'`.
- Do we need to add anything to the CLAUDE.md or AGENT.md file? Since the project didn't start with one, I had to generate one. Should we output a block of text and say "Now add this to your agent file"? (similar to how sdkman! tell you to add a section to your .bashrc)
- Doctrine, Charter folder, and Sigil folder should be created in /spec folder. Only sigil.toml should be at root.

---

## Friction Points

- From Claude during first validation (done yesterday before we figured out a workflow and sigil init):

````The validator's vocabulary check is strict — every capitalized word in provision and invariant text must be defined in the resolution chain. I need to:
  1. Remove articles (The, An, No, All) from the start of list items by restructuring to lead with vocabulary terms
  2. Add Scheduled and Cancelled as vocabulary entries in Appointments.charter
  3. Fix plural forms (Appointments, Pets) to singular```

- From Claude during second validation: see file feedback.md



---

## Spec Defects Found

_Provisions that turned out to be ambiguous, incomplete, or contradictory during implementation._

---

## Implementation Failures

_Test or runtime failures, and whether they were traced to a spec defect or a code bug._

---

## Open Questions

_Questions about the language, tooling, or workflow that surfaced during the trial._

---

## Post-Trial Review

_To be filled in after the trial is complete._

### What worked well

### What needs revision

### Language changes warranted

### Tooling changes warranted
````

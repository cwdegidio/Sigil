# Sigil Trial Workflow — PetHealth App

_Step-by-step instructions for the Phase 2C real-world trial. Covers project creation through iterative spec-driven development._

---

## Prerequisites

The Sigil CLI is not yet published to npm. Install it from the local path before starting.

```bash
npm install -g /path/to/sigil/packages/cli
```

Verify the install:

```bash
sigil --version
```

---

## Part 1 — Bootstrap (One-Time)

### Step 1: Create the project folder

Create the external project folder and initialize it as a git repo. This lives outside the Sigil monorepo — it is the app under development, not Sigil itself.

```bash
mkdir PetHealth
cd PetHealth
git init
```

### Step 2: Bootstrap the Sigil project

Run `sigil init` with the project name. This produces the platform-agnostic scaffolding.

```bash
sigil init PetHealth
```

Files created:

```
SIGIL-AUTHOR.md       ← AI context for spec authoring mode
SIGIL-CONSUMER.md     ← AI context for implementation mode
sigil.toml            ← project manifest (points to doctrine, charters/, sigils/)
charters/             ← empty directory
sigils/               ← empty directory
```

The `sigil.toml` manifest will look like:

```toml
[project]
name = "PetHealth"
doctrine = "PetHealth.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
```

### Step 3: Add Claude Code scaffolding

```bash
sigil agent add claude-code
```

Files created:

```
.claude/commands/author.md     ← /author custom command
.claude/commands/consumer.md   ← /consumer custom command
```

These files define the behavior of the `/author` and `/consumer` slash commands in Claude Code. They load the right context artifact and enforce the right constraints for each mode.

### Step 4: Add a CLAUDE.md

Create a `CLAUDE.md` at the project root that tells Claude where to find the context artifacts and when to load each one. The content below is the minimum required:

```markdown
# CLAUDE.md — PetHealth

This project uses [Sigil](https://github.com/cwdegidio/sigil) for formal behavioral specification.

## Spec files
- `SIGIL-AUTHOR.md` — load this when entering spec authoring mode (`/author`)
- `SIGIL-CONSUMER.md` — load this when entering implementation mode (`/consumer`)
- `sigil.toml` — project manifest; start here to traverse the spec corpus

## Agent workflow
Use `/author` to write or revise spec files.
Use `/consumer` to implement against the spec.
Never do both in the same mode switch — finish authoring before implementing.
```

### Step 5: Write the Doctrine

Open Claude Code in the PetHealth project. Switch to author mode:

```
/author
```

Claude will load `SIGIL-AUTHOR.md` and restrict itself to spec file edits only.

Ask Claude to help write `PetHealth.doctrine`. The Doctrine covers:

- **Identity**: name (`PetHealth`), version (`1.0`), status (`draft`), optional description
- **Charters**: list the bounded contexts you intend to have (e.g., `Authentication`, `PetProfiles`, `Appointments`)
- **Vocabulary**: platform-wide terms shared across all charters (e.g., `Owner`, `Pet`, `Doctor`, `Appointment`)
- **Invariants**: platform-wide guarantees (e.g., "An Owner must be authenticated before any data mutation is permitted")
- **Scope**: explicit exclusions (e.g., billing, external calendar integration)

Example minimal structure:

```
doctrine:
  identity:
    name: PetHealth
    version: 1.0
    status: draft
  charters:
    - Authentication
    - PetProfiles
    - Appointments
  vocabulary:
    Owner:
      definition: "A registered user who owns one or more pets."
    Pet:
      definition: "An animal owned by an Owner and tracked within the system."
    Doctor:
      definition: "A licensed veterinarian available for appointments. The system supports exactly five doctors."
    Appointment:
      definition: "A scheduled visit between an Owner's Pet and a Doctor."
  invariants:
    - An Owner must be authenticated before any pet or appointment operation is permitted.
  scope:
    excludes:
      Billing: Payment processing and invoicing are out of scope.
      ExternalCalendar: Synchronization with external calendar services is out of scope.
```

After writing the doctrine, validate:

```bash
sigil validate sigil.toml
```

The validator will report missing charter and sigil files — this is expected at this stage. Fix any parse or structural errors in the doctrine itself before proceeding.

---

## Part 2 — Feature Loop (Per Feature)

Work one bounded context (Charter) at a time. Within each Charter, work one Sigil at a time. Do not spec the entire system before implementing — spec one feature, implement it, then move to the next.

### Recommended feature order for PetHealth

1. Authentication (Owner registration, login, session)
2. Pet Profiles (create, view, edit a pet)
3. Appointments (schedule, view, cancel an appointment)

---

### For each feature:

#### Step A — Write the Charter (in `/author` mode)

If this is the first Sigil for a Charter, write the Charter file first. If the Charter already exists, you may extend its `sigils:` list.

Charter lives at: `charters/<ContextName>.charter`

A Charter covers:
- **Identity**: name, version, status
- **Sigils**: list of Sigil names this Charter governs
- **Vocabulary**: terms specific to this bounded context (overrides Doctrine definitions within this scope)
- **Invariants**: constraints that hold across all Sigils in this context
- **Scope**: what this context explicitly does not own

Example for Authentication:

```
charter:
  identity:
    name: Authentication
    version: 1.0
    status: draft
  sigils:
    - OwnerRegistration
    - OwnerLogin
    - SessionManagement
  vocabulary:
    Credential:
      definition: "The combination of email address and password used to authenticate an Owner."
    Session:
      definition: "An authenticated context scoped to a single Owner, valid for the duration of a login."
  invariants:
    - A Session is invalidated immediately upon logout.
    - Credentials are never stored in plaintext.
```

#### Step B — Write the Sigil (in `/author` mode)

Sigil lives at: `sigils/<FeatureName>.sigil`

A Sigil covers:
- **Identity**: name, version, status (start at `draft`)
- **Vocabulary**: terms specific to this feature (overrides Charter and Doctrine within this scope)
- **Scope**: explicit exclusions for this feature
- **Provisions**: one or more `behavior` or `rule` blocks
- **Invariants**: constraints that hold across all provisions in this Sigil

Write provisions at this level of detail:

```
provision:
  name: RegisterOwner
  type: behavior
  trigger:
    - An Owner submits a registration form with a valid email and password.
  preconditions:
    - The email address is not already associated with an existing account.
    - The password meets minimum length requirements.
  postconditions:
    - A new Owner account is created.
    - The Owner receives a confirmation email.
    - The Owner is not yet authenticated.
  invariants:
    - The email address must be unique across all Owner accounts.
```

Rules (declarative, no trigger):

```
provision:
  name: PasswordMinimumLength
  type: rule
  preconditions:
    - A password is submitted for account creation or password change.
  postconditions:
    - The password is rejected if it is fewer than eight characters.
```

#### Step C — Validate

After writing or editing any spec file, run:

```bash
sigil validate sigil.toml
```

Fix all errors before switching to consumer mode. Parse errors and validation errors both block implementation. Ambiguity in a provision is a spec defect — rewrite it until there is exactly one valid interpretation.

#### Step D — Implement (switch to `/consumer` mode)

```
/consumer
```

Claude will:
1. Run `sigil validate sigil.toml` — aborts if errors exist
2. Traverse the corpus: `sigil.toml` → Doctrine → Charters → Sigils
3. Produce an implementation plan based on the provisions
4. Present the plan and wait for your approval before writing any code
5. Implement each provision precisely as specified

Your job during implementation review:
- Confirm the plan covers every provision
- Flag any provision Claude missed or misread
- Approve before implementation begins

If Claude hits an ambiguity in the spec during implementation, it must flag it and stop — it should not guess. Use `/author` to resolve the ambiguity, revalidate, then return to `/consumer`.

#### Step E — Assess failures

After implementation, run tests (however the project's test suite works). Failures fall into two categories:

| Failure type | Root cause | Action |
|---|---|---|
| Implementation bug | Code does not match a clear, unambiguous provision | Fix the code |
| Spec defect | Provision was ambiguous, incomplete, or contradictory | Switch to `/author`, fix the spec, revalidate, re-implement |

If you cannot tell which category a failure falls into, treat it as a spec defect — the spec should be clear enough to make the answer obvious.

#### Step F — Mark the Sigil active

Once the Sigil's provisions are all implemented and passing, update the Sigil's status:

```
identity:
  name: OwnerRegistration
  version: 1.0
  status: active    ← change from draft to active
```

A Sigil must be `active` before its version becomes meaningful for version-pinning purposes (DD-054). Do not bump the version number while the Sigil is in `draft`.

---

## Part 3 — Version Bumping Rules

These rules apply once a Sigil (or Charter/Doctrine) is `active`.

### Sigil versioning (DD-018)

| Change type | Version bump |
|---|---|
| Adding a provision, relaxing a precondition, expanding a postcondition | Minor (1.0 → 1.1) |
| Removing a provision, tightening a precondition, restricting a postcondition | Major (1.0 → 2.0) |

Revising a `draft` Sigil requires no version bump — there are no consumers yet.

### Charter and Doctrine versioning (DD-055)

A Charter's version is independent of its Sigils' versions. Bump the Charter version only when the Charter's own content changes:
- Its `sigils:` membership list changes
- Its `vocabulary:`, `invariants:`, or `scope:` sections change

The same principle applies to Doctrine relative to its Charters.

A Sigil bumping from 1.0 → 2.0 does NOT require a Charter bump.

### Version-pinned references

When you need to freeze a Sigil at a specific version in a Charter (e.g., because you are deliberately deferring an upgrade):

```
sigils:
  - OwnerRegistration@1.0    ← pinned
  - OwnerLogin               ← always current
```

The validator enforces that pinned versions exist on disk.

---

## Part 4 — Repeating the Loop

Work through each Charter in the recommended order. Within each Charter, work through each Sigil. The project is "spec-complete" when all Sigils are `active` and `sigil validate sigil.toml` reports zero errors.

The loop summary:

```
/author  →  write/extend Charter  →  write Sigil  →  validate
         →  /consumer  →  implement  →  test  →  assess failures
         →  (fix spec or fix code)  →  mark active  →  next Sigil
```

---

## Quick Reference — Commands

| Command | What it does |
|---|---|
| `sigil init <ProjectName>` | Bootstrap platform-agnostic scaffolding |
| `sigil agent add claude-code` | Add `.claude/commands/author.md` and `consumer.md` |
| `sigil validate sigil.toml` | Validate full corpus; report all parse and validation errors |
| `sigil context --role author` | Print `SIGIL-AUTHOR.md` content to stdout |
| `sigil context --role consumer` | Print `SIGIL-CONSUMER.md` content to stdout |
| `/author` | Enter spec authoring mode (Claude Code) |
| `/consumer` | Enter implementation mode (Claude Code) |

---

## Quick Reference — File Layout

After bootstrap and one Charter+Sigil:

```
PetHealth/
├── CLAUDE.md
├── SIGIL-AUTHOR.md
├── SIGIL-CONSUMER.md
├── sigil.toml
├── PetHealth.doctrine
├── charters/
│   └── Authentication.charter
├── sigils/
│   ├── OwnerRegistration.sigil
│   ├── OwnerLogin.sigil
│   └── SessionManagement.sigil
└── .claude/
    └── commands/
        ├── author.md
        └── consumer.md
```

Implementation files (Vue components, Spring Boot services, etc.) live alongside the spec files in the normal project structure — no special layout is required for the implementation side.

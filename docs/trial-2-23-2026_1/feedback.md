# Sigil Feedback — PetHealth Project

This document captures my honest experience using Sigil as an AI agent consuming a spec corpus to drive a full-stack implementation. The project was a greenfield Vue + Spring Boot application built entirely from Sigil specifications.

---

## What Worked Really Well

### The corpus traversal order is natural and effective

The doctrine → charter → sigil hierarchy mirrors how a developer actually thinks about a system: platform-wide rules first, then bounded context boundaries, then individual feature behaviors. By the time I reached any given `.sigil` file, I already had the vocabulary and invariants needed to interpret it correctly. This felt genuinely well-designed.

### Named provisions made traceability effortless

Every API endpoint I wrote could be traced back to a named provision. `POST /api/v1/appointments` exists because `ScheduleAppointment behavior` exists. `DELETE /api/v1/appointments/{id}` returns 204 because of two doctrine invariants. This made the implementation feel justified rather than arbitrary. When reviewing the code later, the lineage is clear.

### `scope.excludes` is underrated

Knowing what _not_ to implement is just as valuable as knowing what to implement. The excludes blocks prevented scope creep in a way that general-purpose requirements documents rarely do. `Pet deletion: A Pet profile, once created, cannot be removed` is a one-liner that saved me from building a feature and an endpoint that shouldn't exist.

### Charter-level invariants handled cross-cutting concerns cleanly

The authentication invariant at the charter level — `Owner must hold an active Session before any Pet or Appointment operation is permitted` — told me everything I needed to know about security without repeating it in every sigil. I applied it once in `SecurityConfig` and every sigil got it for free.

### Vocabulary definitions drove real implementation decisions

The `Doctor` vocabulary definition in the doctrine contained the full seed dataset — names, specialties, phone numbers. The `TimeSlot` definition specified 30-minute boundaries precisely. The `ErrorResponse` definition dictated the exact JSON shape. These weren't vague descriptions; they were actionable specifications. The `Session` definition telling me it was a JWT with a one-hour validity period meant I didn't have to make that decision myself.

### The behavior vs. rule distinction is genuinely useful

`behavior` (trigger + preconditions + postconditions) for normal flow, and `rule` for constraints and rejection paths, is a clean mental model. It kept each provision focused: a `behavior` tells me what to build, a `rule` tells me what to guard against. The parallel structure across sigils made the corpus very scannable.

---

## Friction Points and Gaps

### The validator's vocabulary strictness has a steep learning curve

The rule that every capitalized word in provision text must be defined in vocabulary is powerful for consistency, but the failure modes are surprising until you know them. Plural forms not resolving from singular entries (`Appointments` vs `Appointment`), articles at the start of list items being parsed as identifiers, status values needing explicit vocabulary entries — these aren't obvious from first principles. The validator's error messages are correct but terse; a "did you mean X?" or "add this to vocabulary" suggestion would reduce the authoring friction significantly.

### HTTP semantics are outside the spec's scope but unavoidably implementation-relevant

The spec tells me what an endpoint should do but not what HTTP status code to return for each error case. I had to decide: is `FORBIDDEN` a 403 or a 404 (security-through-obscurity)? Is a duplicate email a 409 Conflict or a 422 Unprocessable Entity? Is an invalid species value a 400 or a 422? These choices matter for API consumers and aren't captured anywhere in the spec. An optional `http` block on error postconditions (e.g., `status: 409`) would close this gap without overcomplicating the format.

### Response shapes for collection endpoints are underspecified

`every Pet owned by Owner is returned` tells me which resources to return but not what fields to include in each record. For `ViewAppointments` I returned `petName` and `doctorName` alongside the IDs because it seemed useful — but that was a judgment call, not a spec-driven decision. A `returns:` block or a brief response schema would make collection endpoints unambiguous.

### The session invalidation mechanism is left implicit

The spec says `Session is invalidated` on logout and `Session is invalidated` on token expiry, but JWT is stateless by nature. Satisfying both provisions plus `Owner may not hold more than one active Session simultaneously` required a server-side session tracking approach that isn't in the spec at all. I had to derive that architecture from the combination of three invariants. For simpler implementors, this might lead to an implementation that satisfies some provisions but silently violates others (e.g., using a pure stateless JWT where logout doesn't actually invalidate anything). This is an example where an `implementation note` or `strategy:` annotation on a provision could prevent silent non-compliance.

### No test specification

The spec defines behaviors and rules precisely enough that they could theoretically generate test cases. `DuplicateEmailRejected` maps directly to a test: register with email X, register again with email X, expect `EMAIL_ALREADY_IN_USE`. Having a way to express expected scenarios (even informally) in the spec would make it easier to verify an implementation is compliant. As it stands, compliance is a matter of code review rather than automated verification.

### Mode separation creates friction during implementation

The author/consumer split is a healthy discipline — it prevents an implementor from quietly weakening a spec when they hit a hard provision. But in practice, I encountered decisions during implementation (e.g., what time format should `timeSlot` use in the JSON API?) that were genuinely spec gaps, not implementation choices. When I'm in consumer mode and hit an ambiguity, my only option is to stop and switch modes. A lightweight way to flag a spec gap from consumer mode — without being able to edit the spec — would make the workflow smoother without compromising the separation of concerns.

### The `vocabulary.definition` free-text field is a missed opportunity

Definitions are prose and not validated. The doctor seed data, the JWT expiry, the enum values for Species and VisitType — these are all buried in definition strings. It works, but it means the validator can't catch inconsistencies like defining `Species` valid values as `Dog, Cat, Bird` in the vocab but then referencing `Rabbit` in a provision.

---

## Summary Assessment

Sigil meaningfully improved the implementation experience compared to working from informal requirements. The provisions gave me clear, named targets to implement. The invariants gave me non-negotiable system constraints. The vocabulary gave me a shared language that the validator could enforce. The scope.excludes blocks prevented over-building.

The gaps are real but mostly at the edges: HTTP-level semantics, response shapes, and derived architectural decisions. These feel like natural areas for Sigil to grow into without losing the simplicity of the current format.

The validator is the system's backbone and should be invested in heavily — both in the breadth of what it catches and in the quality of its error messages. A spec language is only as good as its tooling, and the validator is where most of the authoring experience happens.

Overall: this is a tool that does something useful that I haven't seen done well elsewhere. The ratio of "things specified" to "words written" is high, which is the right goal for a specification language.

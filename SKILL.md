---
name: simplify-codebase
description: Simplification audit or authorized codebase simplification whose stated objective is to remove accidental complexity. Use for evidence-backed deletion or consolidation of dead code, duplicate state, redundant APIs or layers, ownerless abstractions, obsolete compatibility or design records, over-engineering, and tests or checks that preserve an obsolete implementation shape; also use for 代码简化、熵回收、实现形态守卫审计或清理. Do not use for general code review, onboarding, style-only refactoring, or performance tuning.
---

# Simplify Codebase

Reduce the number of concepts and obligations a codebase must keep coherent. Line-count reduction is supporting evidence, not the objective. A successful run may conclude that the inspected surface is already justified.

## Select mode and scope

First choose the authority mode:

- **Survey** for simplification audit, investigation, or candidate-finding requests. Remain read-only and return ranked evidence.
- **Change** for explicit simplify, remove, consolidate, refactor, or repository-documentation edit requests. Prove each cut, implement it within the authorized scope, and validate the surviving contract.

A request that only mentions defensive, anti-regression, or AI-generated guardrails without an explicit edit verb or other change authority remains Survey. AI provenance is not deletion evidence and does not lower the proof burden. When a request combines an implementation-shape guardrail with another simplification, keep separate proof records and cut boundaries even when they are validated in the same run.

Then choose the coverage scope:

- **Focused** when the user names a subsystem, symbol, state machine, dependency, or suspected duplication. Cover that boundary thoroughly before expanding outward.
- **Broad** when the request spans the repository or asks for multiple candidates. Partition the system and account for every in-scope domain.

Deleting a reachable capability, supported interface, stored representation, or compatibility path is a product decision. Describe the consequence and obtain direction unless the user has already chosen it.

## Establish the contract

1. Read the repository's instructions, architecture and decision records, manifests, test guidance, and generated-file conventions.
2. Inspect version-control state and preserve unrelated work. Identify vendored, generated, migration, fixture, and public-package surfaces before classifying them.
3. Trace the runtime path from entrypoints through configuration, registration, dispatch, persistence, processes, and wire boundaries. Record public, dynamic, persisted, generated, and compatibility-sensitive contracts.
4. In Change mode, discover the repository's real verification commands and capture a proportional baseline when feasible. A failing baseline narrows what the final checks can prove.

Preserve authorization, trust-boundary validation, security isolation, accessibility essentials, data-loss prevention, stored-format compatibility, and cleanup that establishes quiescence. Treat changes to these protections as their own explicitly authorized objective, not an incidental simplification.

The contract map is complete when all in-scope entrypoints and authority boundaries are enumerated, each is traced far enough to name its owner and observable contract, and every uninspected or externally unknowable surface is recorded as a blind spot.

## Cover the relevant surface

For every Broad engagement, and for Focused work involving dynamic architecture or dependency substitution, read [investigation.md](references/investigation.md). Build a coverage map before ranking findings; the first plausible deletion must not end the survey.

Also read [investigation.md](references/investigation.md) when tests, source scans, inventories, import bans, or build/CI checks may preserve an implementation shape rather than observable behavior. Apply its implementation-shape guardrail lens within the ordinary proof workflow.

For concurrency, cancellation, readiness, cleanup, defensive copies, validation, authorization, security isolation, accessibility, data-loss prevention, or cross-process data, also read [boundaries-and-lifecycle.md](references/boundaries-and-lifecycle.md).

Use repository-native search, compiler and linter output, dependency metadata, and history as discovery instruments. Treat their findings as leads until runtime consumers and contracts have been examined.

## Build a proof record

For every in-scope lead that reaches consumer-map evidence or could retire a meaningful contract, record:

```text
Finding ID: a stable report-local identifier such as S1 or S2
Candidate: the exact contract, representation, or layer to remove or merge
Locus: the ownership boundary, symbols, and exact paths or lines when verified
Topology: confirmed node and relationship IDs, primary locus, related nodes, route, and cut set when useful; otherwise not applicable
Burden: the concepts, synchronization, publication, or testing cost it creates
Reachability: production, non-production, dynamic, external, and persisted consumers
Rationale: why it exists and whether that reason remains current
Cut: declarations, implementations, branches, artifacts, docs, and dependencies affected
Consequence: observable capability or compatibility behavior surrendered
Confidence / risk: evidence strength, uncertainty, blast radius, and reversibility
Proof: the smallest check that would expose an incorrect cut
Net effect: maintenance concepts removed minus replacement or migration machinery added
```

Keep Finding IDs stable within the run so the summary, proof record, source links, and any visual companion refer to the same candidate. Do not invent a line number, owner, relationship, or route to fill the location fields. Mark unknown facts as unresolved.

Prove cut boundaries below file granularity when the candidate shares an artifact with surviving consumers. Account for candidate-exclusive selectors, members, fields, keys, registry entries, generated fragments, and fixtures without disturbing the surviving owners.

Keep or downgrade the candidate when a real consumer exists, dynamic reachability remains unresolved, a current decision still owns the design, the change merely relocates complexity, the result is outside scope or retires no meaningful obligation, or the available check cannot distinguish success from accidental breakage.

Rank confidence separately from benefit. A high-value guess does not outrank a smaller proved cut.

Candidate proof is complete when every qualifying lead is classified as ranked, rejected, or unresolved, and every unresolved lead names the fact required to decide it.

## Decide and act

In Survey mode, stop after reporting the ranked evidence. Include important rejected candidates when the rejection teaches something or identifies a concrete missing fact.

In Change mode, read [execution-and-recovery.md](references/execution-and-recovery.md) and select the strongest authorized cut. One ownership boundary is the default batch size, not a run limit: for an explicitly requested set of cuts, finish and validate each boundary before starting the next.

If the user requests a simplification proposal, local cleanup annotation, or design-record consolidation, or if a selected change invalidates an ADR, RFC, design note, or architectural inventory, read [decision-records.md](references/decision-records.md). Do not turn an ordinary code audit into a repository-wide documentation purge.

If the user asks to combine findings from another branch, pull request, task, or agent run, read [integrating-findings.md](references/integrating-findings.md). Preserve evidence, not finding counts.

Generate a visual companion only when the user explicitly requests one or confirms an offer. If confirmed relationships would make a candidate clearer, explain what the map would clarify and ask before generating it. Without confirmation, complete the text report without a map; do not wait on visual delivery to finish the audit. For authorized visual delivery, read [visual-reporting.md](references/visual-reporting.md) and use the bundled cleanup-map renderer. The map is an optional companion to the proof records, not evidence by itself. Do not write Survey artifacts into the target repository unless the user requested repository files.

## Deliver the result

For a survey, report coverage, ranked proof records, rejected or unresolved high-value leads, and the next fact needed for each uncertainty. When a visual companion was requested or confirmed, report its status and cleanup-map Finding deep links separately.

Keep the handoff scan-friendly. Lead with the result, then include only the
proof records, decision-relevant uncertainty, visual links, and validation that
the user needs. Do not narrate the search process, repeat the same evidence
under several labels, append generic advice, or keep empty sections. Concision
does not remove required proof fields: write each field once, in the shortest
form that preserves its subject, evidence strength, consequence, and boundary.

For a change, complete the validation and operation receipt defined in [execution-and-recovery.md](references/execution-and-recovery.md). A Before/Cut/After/Verify cleanup map may explain a structural change, but it never replaces the operation receipt. Report each validation layer separately; a narrow green check does not establish broader runtime, deployment, or user acceptance.

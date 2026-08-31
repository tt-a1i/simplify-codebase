# Cleanup Map handoff example

This is a format example, not a finding about a real repository. Replace every
placeholder with verified facts and absolute artifact paths from the current
run. The written proof record remains authoritative.

## Survey

```text
Coverage: entrypoint, coordinator, worker lifecycle, state publication, tests
Blind spot: external plugin consumers were not available

Finding index
S1 · ranked · high confidence · <repo>/src/job-state.ts:<line>
     Duplicate readiness representation across one ownership boundary
     Locate: survey-cleanup-map.html#finding=S1&stage=locate
     Trace:  survey-cleanup-map.html#finding=S1&stage=trace
     Cut:    survey-cleanup-map.html#finding=S1&stage=cut

Finding ID: S1
Candidate: merge the legacy readiness flag into the canonical lifecycle state
Locus: JobRuntime; <repo>/src/job-state.ts:<line>; <repo>/src/publisher.ts:<line>
Topology: primary legacyReady; related worker, lifecycleState, legacyReady, publisher; confirmed route worker to publisher; cut legacyReady and its synchronization relationships
Burden: two representations must be synchronized before publication
Reachability: runtime publisher reads both; tests cover both; external plugins unresolved
Rationale: the flag predates the canonical lifecycle state; no current decision record owns both
Cut: declaration, write path, publication branch, dedicated fixture, and stale documentation
Consequence: the legacy readiness representation is no longer available
Confidence / risk: high repository confidence; external plugin uncertainty prevents Change authority
Proof: a publication test that fails if completion is emitted before canonical terminal state
Net effect: one state representation and one synchronization branch retired; no replacement layer

Visual companion: delivered
Reason: S1 spans four confirmed runtime concepts and is easier to locate as a cleanup decision map
Specification: <artifact-directory>/survey.cleanup-map.json
Artifact: <artifact-directory>/survey-cleanup-map.html
Finding links: S1 -> #finding=S1&stage=trace and #finding=S1&stage=cut
Evidence level: authored confirmed relationships
Validation: PASS cleanup-map contract validation; PASS all seven artifact checks
Visual review: passed at 1280x800 and 1440x900 after inspecting Locate, Trace, Cut, node passport, and route probe
Limitations: source links omitted because the example is not revision-pinned
```

Generate the artifact with the bundled renderer:

```bash
node <skill-root>/visualization/render-cleanup-map.mjs deliver \
  <artifact-directory>/survey.cleanup-map.json \
  <artifact-directory>/survey-cleanup-map.html
```

Lower-ranked, rejected, and unresolved Findings still belong in the text report
even when the map visualizes only the top five.

## Change

```text
Scope: JobRuntime lifecycle ownership boundary
Baseline: <commands and pre-existing failures>
Retired obligation: legacy readiness representation and synchronization branch
Artifacts: <exact changed and generated files>
Realized net effect: one state, one branch, one fixture, and one documentation obligation removed
Behavior: completion remains gated by the canonical terminal state
Verification: <residue, decisive, local, repository, boundary, and diff results>
Residual risk: <untested or external boundaries>
Retained candidates: <items kept and reasons>
Undo: <exact files or commit range and restoration steps>

Visual companion: delivered
Reason: the cut removes one state owner and reroutes publication to the surviving source
Specification: <artifact-directory>/change.cleanup-map.json
Artifact: <artifact-directory>/change-cleanup-map.html
Finding links: S1 -> #finding=S1&stage=before, #finding=S1&stage=cut, #finding=S1&stage=after, and #finding=S1&stage=verify
Evidence level: authored confirmed relationships
Validation: PASS cleanup-map contract validation; PASS all seven artifact checks
Visual review: passed at 1280x800 and 1440x900 after comparing Before, Cut, After, and Verify
Limitations: the uncommitted After snapshot is not revision-pinned; the map does not prove runtime correctness
```

If an implementation changes only local code inside one stable component, use
`Visual companion: skipped` and explain that no meaningful relationship context
changed. The Change operation receipt remains mandatory.

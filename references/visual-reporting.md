# Cleanup Map Companion

Purpose: make a proved simplification candidate easier to locate, trace, and
judge without turning graph reachability into deletion authority. The proof
records remain canonical. The bundled cleanup-map compiler targets a vendored
Archify Architecture renderer and desktop viewer. The interaction remains
specialized for cleanup; it is not a general diagram-authoring workflow.

## Preserve the authority boundary

- `simplify-codebase` owns discovery, consumer classification, contract proof,
  ranking, implementation, and validation.
- Render only nodes and directed relationships already supported by that
  evidence. Every rendered relationship must be classified `confirmed`.
- Put guessed consumers, unresolved dynamic wiring, missing external evidence,
  confidence, and risk in the Finding record. Never draw a guessed edge.
- Authored reachability is not measured runtime impact, blast radius,
  causality, or proof that a cut is safe.
- A visual artifact does not broaden Change authority or authorize commits,
  publication, deployment, migration, or durable-data changes.
- In Survey mode, keep the target worktree read-only. Write the JSON and HTML
  to an agent artifact directory or a user-selected location outside it.

The text report is complete without a map. The map is incomplete without the
text report.

## Decide whether a cleanup map helps

Create one when the user asks or when a Finding spans several confirmed owners,
consumers, states, stores, or boundaries. Good cases include a relay layer,
split truth, parallel lifecycle, duplicate representation, request/event path,
or a Change that removes or reroutes ownership.

Skip it when one source range already locates the issue, topology remains
unresolved, the candidate has no meaningful relationship context, or the map
would imply more confidence than the proof supports.

Visualize at most five ranked Findings and 18 primary nodes in one artifact.
Keep every lower-ranked Finding in the text report. Split a Broad Survey by
ownership boundary instead of building a repository hairball.

## Author the cleanup-map contract

Use [`../visualization/cleanup-map.schema.json`](../visualization/cleanup-map.schema.json)
and the examples under [`../visualization/examples/`](../visualization/examples/).
Do not generate generic Archify JSON and translate it afterward.

Map repository evidence into these concepts:

```text
meta: Survey or Change, Focused or Broad, title, repository, revision
nodes: real entrypoints, owners, candidates, consumers, state, stores, boundaries, or external systems
relationships: confirmed directed call, data, registration, publication, lifecycle, or dependency edges
findings: stable Finding ID, disposition, confidence, primary locus, related nodes, optional route, cut set, proof, consequence, unknowns
change: one Finding ID plus authored Before and After snapshots and a concise verification receipt
```

Keep visual copy within the contract limits enforced by the schema and
renderer. Titles name the concrete problem. The Finding summary states what is
redundant or conflicting and why that matters, in one or two sentences. Proof
names the check that can distinguish a safe cut from breakage. Consequence says
what behavior or compatibility disappears. Keep at most three unresolved items
that could change the decision; move background and investigation history to
the canonical text report.

Do not write process narration such as "we analyzed" or "the following diagram
shows." Do not repeat the route in prose when the graph already shows it. Avoid
value claims, generic recommendations, and conclusions that are not supported
by the Finding evidence. When `locale` is `zh-CN`, write native Chinese while
preserving IDs, symbols, paths, commands, and evidence strength exactly.

Keep Finding IDs in the Finding navigator rather than inventing problem-shaped
runtime components. A candidate node must still represent a real symbol,
contract, state, representation, or layer. Use repository-relative source paths
and verified lines; omit unknown lines. Visualize only ranked candidates in
Survey mode and one changed Finding in Change mode; every visualized Finding
must name a non-empty cut. Use optional `locus.href` or `report_url` only for
HTTPS URLs or portable relative/hash links.

The route endpoints must have a confirmed directed path, and the selected
Finding route must pass through its primary node. In Change mode, the single
Finding's cut must appear in Before and be absent from After; every snapshot
relationship must retain both endpoint nodes. The combined document may contain
both retired and new relationships, so use the Finding route to locate the old
candidate and use Before/After snapshots for the whole system path.

## Use the cleanup-specific interaction

Survey is not a slideshow. Each selected Finding follows four investigation
stages:

1. **Locate** isolates the primary ownership locus.
2. **Trace** follows the shortest confirmed authored route through it.
3. **Cut** marks the exact candidate nodes and relationships proposed for
   retirement.
4. **Decide** restores the related context and exposes the decisive proof,
   consequence, confidence, risk, and unresolved facts.

Change uses a different four-stage receipt:

1. **Before** shows the authored pre-change snapshot.
2. **Cut** marks what the implementation retired.
3. **After** shows the surviving authored snapshot with stable IDs.
4. **Verify** keeps the After topology visible while exposing the separate
   verification receipt.

Node selection opens a semantic passport containing the verified locus,
confirmed incoming/outgoing relationships, and related Findings. The route
probe may compare any two nodes, but it traverses only authored confirmed
relationships. A selected node must remain visibly selected even when the
cleanup stage de-emphasizes surrounding context. Preserve Archify's native
`focus`, `relation`, `route`, and reachability hashes; the cleanup hash handler
owns only `finding`, `stage`, and legacy Finding views.

Finding and stage transitions must clear any open semantic passport and must
never synthesize a node selection. Stage emphasis and camera framing are visual
guidance only. Open the passport only after an explicit node or relationship
interaction, or when restoring an explicit native `focus` or `relation` link.

Treat the diagram camera as one shared state. Direct node selection frames the
selected node with its immediate neighbors at a restrained automatic scale;
manual zoom is the only path to close inspection. Locate frames the primary locus, Trace frames the
authored route, Cut frames the exact cut set, and Decide or Verify fits the
related decision context. Manual `+`, `-`, and reset controls must interrupt an
in-flight semantic camera before calculating the next scale, and the camera
indicator must distinguish automatic framing from manual zoom. Refit after the
evidence rail changes the canvas width instead of preserving a stale transform.

Use progressive disclosure instead of repeating the proof record inside the
artifact. Keep the active Finding title and concise summary visible once as the
reading entry point, followed by disposition, confidence/risk, four stage
controls, a one-sentence stage guide, and the graph. The summary explains what
the user is looking at; the stage guide explains how to read the current visual
state. Neither should restate graph topology or detailed proof.

Let Locate reveal the source passport, Trace reveal the route probe, and Cut
communicate mainly through visual state. Preserve non-focused semantics as
readable gray context rather than making them disappear. Reveal proof,
consequence, and unresolved facts automatically at Decide or Verify, with one
visible Evidence control for earlier access. On desktop, show that detailed
evidence beside the graph so the decision text and visual context can be read
together; never let it push the graph below the fold. Do not render the same
Finding summary again as a long page subtitle or generic information card.

Load the report in a stable visual state. Do not enable Archify's ambient trace
animation for Cleanup Map: the sequential node pulse and canvas scan can read
as flicker and do not carry cleanup evidence. A stage change may use one short
opacity transition after initial state is settled; never animate SVG filters.

Deep links are stable within the artifact:

```text
#finding=S1&stage=trace
#finding=S1&stage=cut
#focus=runtimeOwner
#route=entrypoint~publisher
```

The canonical text index should link each visualized Finding to its most useful
stage, normally `trace` for location questions and `cut` for deletion-boundary
review.

## Render and validate

Resolve the installed Skill directory rather than assuming a sibling checkout.
The bundled renderer needs Node.js 18 or newer and has no npm package
dependency. It does not need a separate Archify installation because the
Architecture rendering and viewer core live under `visualization/archify-core/`.

```bash
node <skill-root>/visualization/render-cleanup-map.mjs validate <map.json>
node <skill-root>/visualization/render-cleanup-map.mjs deliver <map.json> <map.html>
node <skill-root>/visualization/render-cleanup-map.mjs check <map.html>
```

`deliver` performs input and artifact checks. Then open the HTML and visually
inspect it at the desktop acceptance sizes 1280×800 and 1440×900. Check:

- the two-level analysis header, cleanup stage rail, and native Archify canvas
  remain simultaneously readable without obscuring toolbar or diagram controls;
- each linked Finding and stage opens correctly;
- clicking a node produces a persistent selected state and keeps its semantic
  passport open, including after reloading a native focus deep link;
- repeated node clicks, stage changes, manual zoom, reset, and evidence-rail
  changes produce a consistent camera result and truthful mode/percentage;
- the primary node, confirmed route, and cut set match the proof record;
- Before and After hide the correct retired or newly authored semantics;
- Finding titles and summaries wrap without hard truncation, and long labels do
  not hide IDs, edge direction, source loci, proof, or unknowns;
- contextual nodes and relationships remain legible as secondary gray content;
- horizontal graph scrolling, when needed, preserves readable text.

Do not report visual review as passed from renderer output alone.

## Relationship to Archify

The bundled implementation directly vendors Archify's Architecture renderer,
Signal Flow visual system, layout gates, localization, and standalone desktop
viewer runtime. The cleanup surface keeps the native semantic passport, route
probe, finder, radar, pan/zoom, theme/motion controls, and export surface instead
of recreating their appearance. It hides Archify's generic legend, semantic
lens, style switcher, presentation/guide controls, guided story, and renderer
cards because they duplicate or mislabel cleanup concepts.

The cleanup layer owns a separate data contract and compiler. It adds stable
Finding navigation, the two four-stage investigation models, cut/snapshot
semantics, local repository loci, and an on-demand decision drawer. Archify's workflow,
sequence, dataflow, and lifecycle renderers; generic repository CLI; publishing
and gallery flows; and multi-diagram generated validator are intentionally
excluded. Attribution, adaptation notes, and the MIT license are preserved
under [`../visualization/`](../visualization/).

## Deliver a separate visual receipt

```text
Visual companion: delivered | skipped | failed
Reason: why the map added value, was omitted, or failed
Specification: absolute path when delivered
Artifact: absolute path when delivered
Finding links: Finding ID to finding/stage, node, or route deep link
Evidence level: authored confirmed relationships; revision-pinned only when separately established
Validation: exact cleanup-map validate/deliver/check results
Visual review: passed at 1280×800 and 1440×900 | skipped with reason | failed with defect
Limitations: unresolved topology, omitted findings, unsupported source links, dirty worktree, or horizontal overflow
```

A failed map does not invalidate a complete text audit, but its failure must
remain visible in the handoff.

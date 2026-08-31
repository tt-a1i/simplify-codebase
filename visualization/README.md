# Cleanup Map Visualizer

This directory contains the desktop-only visualization system for
`simplify-codebase`. It vendors Archify's Architecture renderer and standalone
viewer core, then compiles the cleanup-specific contract into that renderer.
Archify does not need to be installed separately, and there is no npm package
dependency.

## Architecture

The delivery path has three layers:

1. `cleanup-map.schema.json` describes proved cleanup semantics: Findings,
   confirmed relationships, source loci, cut sets, and Change snapshots.
2. `render-cleanup-map.mjs` validates that contract and compiles it to the
   vendored Archify Architecture intermediate representation.
3. `cleanup-extension.css` and `cleanup-extension.js` add cleanup-specific
   Survey and Change stages without replacing Archify's visual system.

`archify-core/` contains the trimmed Architecture renderer, layout and geometry
checks, localization, semantic viewer runtime, and viewer template. The upstream
multi-schema generated validator was replaced by a small Architecture-only
adapter because the other diagram types are not distributed here.

The result keeps Archify's Signal Flow visual preset, pan and zoom, semantic
passport, route probe, finder, radar, theme controls, and standalone
export runtime. Cleanup Map adds:

- Finding-oriented navigation rather than general architecture chapters;
- a compact analysis header that states what was found before the user reads
  the graph;
- Survey stages: `Locate → Trace → Cut → Decide`;
- Change stages: `Before → Cut → After → Verify`;
- a stage-aware reading guide beside the four controls;
- an on-demand decision drawer for proof, consequence, and uncertainty;
- repository loci in the semantic passport;
- a visible reminder that confirmed reachability is not runtime impact or
  deletion safety;
- strict rejection of guessed graph relationships.

The default surface contains the active Finding's concise analysis summary, its
decision state, the four cleanup stages, a one-sentence reading guide, and the
graph. The graph remains the primary visual surface. Progressive disclosure is
stage-driven: Locate opens the source passport, Trace opens the native route
probe, Cut carries the deletion boundary visually while preserving readable
gray context, and Decide or Verify reveals a detailed evidence rail beside the
graph. The evidence rail never pushes the primary canvas below it. Generic
surfaces that duplicate or mislabel this workflow are not compiled into the
viewer.

Cleanup Map compiles no ambient trace or sequential node animation. The report
loads into a stable graph; explicit stage changes retain a single 180ms opacity
transition, and SVG filters are not interpolated.

Only desktop layouts are supported. Acceptance sizes are 1280×800 and
1440×900.

## Commands

Node.js 18 or newer is sufficient.

```bash
node visualization/render-cleanup-map.mjs validate visualization/examples/survey.cleanup-map.json
node visualization/render-cleanup-map.mjs render visualization/examples/survey.cleanup-map.json /tmp/survey-cleanup-map.html
node visualization/render-cleanup-map.mjs check /tmp/survey-cleanup-map.html
```

`deliver` performs render and artifact checks in one command:

```bash
node visualization/render-cleanup-map.mjs deliver input.cleanup-map.json output.html
```

The renderer performs referential and mode-specific checks that JSON Schema
alone cannot express. The vendored Archify renderer then applies its own layout,
label-overlap, edge-obstacle, and clean-flow gates.

## Interaction contract

Cleanup deep links use hash parameters and remain meaningful when the HTML is
moved:

- `#finding=S1&stage=trace` opens one Finding at one investigation stage;
- `#focus=runtime-owner` opens Archify's semantic passport;
- `#route=entrypoint~publisher` opens Archify's shortest directed route probe.

The route is authored reachability, not measured runtime impact. Missing or
uncertain relationships must stay out of the graph and appear under the
Finding's unresolved facts.

## Deliberate scope cuts

The vendored core does not include Archify's workflow, sequence, dataflow, or
lifecycle renderers; repository-evidence and output-path authoring workflows;
remote brand capture or its brand catalog; publishing and gallery flows; example
catalog; or multi-diagram generated validator. Those are unrelated to locating
and judging a code-cleanup cut. Generated artifacts also make no external font
request, so they remain usable offline.

See [`NOTICE.md`](NOTICE.md), [`LICENSE.archify`](LICENSE.archify), the license
retained inside [`archify-core/`](archify-core/), and the pinned upstream
provenance in [`archify-core/UPSTREAM.md`](archify-core/UPSTREAM.md).

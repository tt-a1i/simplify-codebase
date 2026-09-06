<div align="center">

# Simplify Codebase

**Prove first. Delete second. Leave fewer facts, states, and contracts to maintain.**

[![Agent Skill](https://img.shields.io/badge/Agent-Skill-22c55e?style=flat-square)](./SKILL.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f172a?style=flat-square)](./LICENSE)
[![中文](https://img.shields.io/badge/README-中文-06b6d4?style=flat-square)](./README.md)
[![English](https://img.shields.io/badge/README-English-64748b?style=flat-square)](./README.en.md)

<img src="./assets/hero.png" alt="A complex software system passing through an evidence gate and emerging smaller and clearer" width="100%" />

</div>

`simplify-codebase` is an Agent Skill for finding and safely removing accidental complexity from an existing codebase while protecting behavior, boundaries, and compatibility that still matter.

It does not optimize for deletion volume. It asks whether a change reduces the number of concepts and obligations a team must keep coherent over time.

## Why it exists

Codebase entropy is rarely just an unused function. It can be duplicated state, an ownerless abstraction, an interface consumed only by tests, an obsolete compatibility path, or half of a retired feature still embedded in a shared artifact.

Static analysis can surface leads, but it cannot prove a deletion safe by itself. This Skill follows runtime consumers, dynamic registration, persisted formats, public interfaces, design history, and verification boundaries before classifying a candidate as remove, merge, retain, or unresolved.

It also recognizes implementation-shape guardrails: tests, static scans, inventories, and build/CI checks that constrain directory layout, literal source text, private defaults, exact component counts, or a historical implementation identity without protecting observable behavior. AI authorship is not removal evidence; business, API, security, persistence, concurrency, real deployment, integration behavior, and active engineering policy guards remain ordinary live contracts.

> **Core principle:** deleted lines are an outcome. The durable gain is deleting a fact, state, contract, or concept that no longer needs maintenance.

## How it works

| | `Focused` scope | `Broad` scope |
| --- | --- | --- |
| **`Survey` · read only** | Investigate one subsystem, state machine, or suspected duplication | Partition the repository and report candidates, counter-evidence, and blind spots |
| **`Change` · authorized edits** | Prove and complete one explicit simplification boundary | Work in independently validated ownership batches |

Every serious candidate receives a proof record covering:

- the exact ownership boundary, symbol, file, and verified source range where available;
- the maintenance burden it creates;
- production, test, dynamic, and external consumers;
- the complete cut, including candidate-owned members inside shared files;
- observable behavior or compatibility that would be surrendered;
- the smallest check capable of exposing an incorrect cut;
- whether complexity removed exceeds migration or replacement machinery added.

## Guardrails

The Skill treats these surfaces as first-class evidence:

- public APIs, dynamic loading, and plugin registration;
- stored formats, migrations, replay, and backward compatibility;
- authorization, isolation, validation, and data-loss protection;
- concurrency, cancellation, cleanup, and lifecycle ownership;
- generated artifacts, shared resources, and external consumers;
- current ADRs, RFCs, and architectural constraints.

When a real consumer exists, a boundary remains unresolved, or a proposal merely moves complexity elsewhere, the right result is to retain the code—not force a deletion.

## Install

Ask Codex to install it:

```text
Install the simplify-codebase skill from https://github.com/tt-a1i/simplify-codebase
```

Or clone it into the Codex user Skill directory:

```bash
git clone https://github.com/tt-a1i/simplify-codebase.git \
  ~/.codex/skills/simplify-codebase
```

Start a new task after installation so the Skill catalog refreshes. For other Agent environments that support `SKILL.md`, place the repository in that environment's Skill directory.

The interactive Cleanup Map is bundled with this Skill; Archify does not need to be installed separately. It vendors a trimmed Architecture renderer and desktop interaction core, then adds cleanup-specific compilation and Survey/Change behavior. The renderer requires Node.js 18 or newer, has no npm package dependency, and produces HTML without external font requests.

## Use

### Audit a repository without editing it

```text
Use $simplify-codebase to audit this repository and rank the safest high-impact simplification candidates. Do not modify files.
```

### Investigate a specific concern

```text
Use $simplify-codebase to determine whether these readiness flags represent distinct lifecycle guarantees or duplicated state.
```

### Apply a proved simplification

```text
Use $simplify-codebase to remove one high-confidence source of accidental complexity. Preserve the surviving contract, validate it, and provide an operation receipt with an undo path.
```

### Integrate findings from elsewhere

```text
Use $simplify-codebase to verify and integrate the simplification findings from this PR. Preserve evidence, not finding counts.
```

### Investigate implementation-shape guardrails

```text
Use $simplify-codebase to audit tests, build/CI, and static checks that only preserve an obsolete implementation shape. Do not modify files, and retain checks that still protect business, security, deployment, integration behavior, or active engineering policy.
```

### Add a visual companion

```text
Use $simplify-codebase to audit this repository and generate a Cleanup Map with deep links for each visualized Finding ID. Keep the written proof records authoritative. Draw only confirmed components and relationships; do not call authored graph reachability runtime impact.
```

## What it returns

A read-only survey returns coverage, ranked proof records, important counterexamples, unresolved questions, and the next fact needed for each uncertainty.

A change task also returns the implemented cut, validation results by layer, remaining risk, an operation receipt, and an executable undo path. A narrow green check is never presented as complete runtime or user acceptance.

The default delivery is a complete text report. An explicit request for visualization authorizes the Skill to generate a validated desktop interactive HTML artifact with its bundled renderer. Otherwise, even when a finding crosses several components, states, or consumers, the Skill first explains what a map would clarify and waits for confirmation before generating it. Without confirmation, it completes the text audit without a map.

Survey follows Locate, Trace, Cut, and Decide; Change follows Before, Cut, After, and Verify. The map remains a visual companion to the proof record, never a substitute for consumer evidence, the Change operation receipt, or the undo path. When topology remains unresolved or a map adds no explanatory value, the complete text report with exact source locations remains the delivery.

## Repository layout

```text
.
├── SKILL.md                    # Core workflow and decision rules
├── PRODUCT.md                  # Visualization product and disclosure principles
├── agents/openai.yaml          # Agent-facing metadata
├── references/
│   ├── investigation.md        # Broad investigation and discovery
│   ├── boundaries-and-lifecycle.md
│   ├── execution-and-recovery.md
│   ├── decision-records.md
│   ├── integrating-findings.md
│   └── visual-reporting.md     # Truth and delivery contract for optional visuals
├── visualization/
│   ├── cleanup-map.schema.json # Cleanup-specific semantic contract
│   ├── render-cleanup-map.mjs  # Cleanup Map to Archify Architecture compiler
│   ├── archify-core/           # Vendored Architecture renderer and desktop viewer
│   ├── cleanup-extension.*     # Survey and Change interaction extension
│   ├── examples/               # Survey and Change inputs
│   └── test/                   # Contract, route, and artifact tests
├── docs/validation.md          # Behavioral validation evidence
├── docs/fixtures/implementation-shape-guardrail/
│                                # Reproducible guardrail fixture, patches, and receipts
├── docs/visual-report-example.md
└── assets/hero.png             # Original hero artwork
```

## Quality and boundaries

This version has been exercised in Change, Broad, Integration, and Decision-record scenarios, including a full survey of a 973-file Python + TypeScript project. See [docs/validation.md](./docs/validation.md) for the method and known limits.

The visual companion directly vendors Archify's Architecture renderer, Signal Flow visual system, and desktop viewer runtime, then adds Findings, Survey/Change stages, cut boundaries, and an on-demand evidence drawer. The default surface first uses a concise analysis finding to orient the user, then discloses source, route, and decision evidence with the active stage while the graph keeps the primary visual space. Other general diagram renderers, the repository CLI, publishing, and gallery flows are not included. Attribution, adaptation notes, and the MIT license are preserved under [`visualization/`](./visualization/). See [docs/visual-report-example.md](./docs/visual-report-example.md) for the handoff format.

The Skill does not replace product judgment. Removing a reachable capability, supported interface, persisted representation, or compatibility path still requires explicit user authority.

## Contributing

Issues and pull requests are welcome. Reproducible failure cases, missed consumers, unsafe-deletion risks, and verification gaps are more valuable than adding rules without observed evidence.

## License

[MIT](./LICENSE)

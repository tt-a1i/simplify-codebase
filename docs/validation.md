# Validation / 验证记录

本文档记录 `simplify-codebase` 在首次开源前完成的行为验证。它不是永久质量声明；仓库和 Agent 运行时变化后，应重新验证相关结论。

This document records the behavioral validation completed before the initial open-source release. It is not a permanent quality claim; relevant results should be rechecked as repositories and Agent runtimes evolve.

## Scenarios / 场景

### Change

- Fixture: a small JavaScript stateful component with duplicated lifecycle state.
- Expected behavior: remove only the redundant representation while preserving dynamic and persisted behavior.
- Result: one source file changed; all 3 tests passed; no unrelated files changed.

### Broad

- Fixture: a clean 973-file production repository containing Python and TypeScript/TSX.
- Expected behavior: partition the repository, investigate beyond obvious unused symbols, and record retained and unresolved surfaces.
- Result: the audit covered the main runtime and repository domains, found frontend and backend candidates, retained live compatibility and lifecycle boundaries, and left the worktree clean.

### Integration and decision records

- Fixture: findings imported from another branch, including one valid cleanup, one unsafe compatibility removal, and one historical design record.
- Expected behavior: revalidate every finding instead of copying conclusions; preserve immutable decision history.
- Result: all 3 findings were mapped to a disposition; the compatibility decoder was retained; the historical ADR body stayed unchanged; both tests passed.

### Shared-artifact boundary

- Fixture: a retired frontend surface sharing a stylesheet with a surviving component.
- Expected behavior: prove the cut below file granularity.
- Result: the focused audit found 14 candidate-exclusive CSS classes, identified removable members inside mixed selectors, retained the shared stylesheet and surviving component, and found two stale documentation references.

### Cleanup Map renderer

- Fixture: one Survey and one Change cleanup-map document covering a confirmed dispatch path and an adapter cut.
- Expected behavior: reject guessed or dangling topology, unsafe links, and inconsistent Change snapshots; keep Finding IDs stable; trace only confirmed directed relationships; render distinct Survey and Change stages; progressively disclose stage-specific information without duplicate cards; keep first-paint and post-probe page geometry stable; and produce a portable standalone HTML artifact.
- Result: all 13 renderer tests passed on Node.js 18.20.8 and 26.7.0; both fixtures passed the dependency-free cleanup-map contract validator; and the checked-in Draft 2020-12 schema's authored surface is covered by a parity test. Both delivered artifacts passed all 7 structural checks. The suite also rejects overlong or duplicate unknowns, control-character URL obfuscation, unsafe URL schemes, incomplete or type-wrong cuts, route/cut semantics outside a Finding, retained cuts, dangling snapshot edges, and multi-Finding Change receipts. The vendored Archify clean-flow gate accepted node spacing, relationship-label placement, and the Change bypass route. Browser review passed at 1280×800 and 1440×900 in light and dark themes with no page-level overflow or console warnings/errors; repeated first-load, stage, evidence, focus, zoom, and rapid-switch sampling kept `scrollY`, document height, and the panel/workspace coordinates stable. Cut snapshot isolation, deep links, role labels, shortcut isolation, truth-boundary visibility, and small-text contrast were also checked directly.

## Mechanical checks / 机械检查

- Skill structure and frontmatter validation;
- YAML metadata validation;
- internal Markdown link validation;
- Markdown lint with line-length enforcement disabled for prose and long commands;
- upstream-name and attribution scan;
- clean-worktree checks for read-only scenarios;
- cleanup-map schema-parity, referential-integrity, Change-snapshot, link-scheme, shortest-path, script-injection, and offline portable-artifact tests;
- standalone artifact checks for the Archify runtime, one semantic SVG, cleanup workbench, passport, route probe, and truth boundary;

## Known limits / 已知边界

- These tests establish behavior for the exercised scenarios, not every language, build system, or Agent runtime.
- Dynamic consumers outside the inspected repository can remain unknowable without external evidence.
- Deployment, production health, and end-user acceptance remain separate gates from repository tests.
- A user must still authorize product or compatibility changes.
- The bundled Cleanup Map is desktop-only. It is intentionally bounded to five visualized Findings, 18 nodes, and 32 confirmed relationships per artifact.
- The renderer's structural checks do not replace visual review, repository evidence, runtime verification, or the canonical text proof records.
- Cleanup Map vendors Archify's Architecture renderer and desktop viewer core. Other diagram renderers, the generic repository CLI, publishing, gallery, and multi-diagram validator are outside this distribution.

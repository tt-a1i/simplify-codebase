# Attribution and vendoring notes

`archify-core/` contains source copied from
[Archify](https://github.com/Dreamaker-TA/archify), including its Architecture
renderer, visual template, desktop interaction runtime, geometry and layout
checks, localization, and supporting shared modules.

The copied visual core is used under Archify's MIT license. Copyright and
license text are preserved in [`LICENSE.archify`](LICENSE.archify) and
[`archify-core/LICENSE`](archify-core/LICENSE).

Simplify Codebase adds a separate cleanup contract, Architecture compiler, and
Survey/Change extension. The upstream generated multi-diagram validator is not
vendored; `archify-core/renderers/shared/validator.mjs` is an
Architecture-only adapter for this distribution.

Archify's other diagram renderers, generic CLI workflow, publishing, gallery,
and example corpus are intentionally excluded because they are not needed for
the cleanup decision map.

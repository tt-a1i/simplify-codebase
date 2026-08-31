# Upstream provenance

- Project: Archify
- Repository: <https://github.com/Dreamaker-TA/archify.git>
- Revision: `7fe139ebe2e532941eb4c315057294348e88a2c0`
- Package version: `2.16.0-dev.0`
- Source subtree: `archify/`

The following upstream areas supplied this trimmed core:

- `renderers/architecture/`;
- the shared renderer modules required by Architecture;
- `LICENSE`.

The template, Architecture renderer, `renderers/shared/cli.mjs`, and the viewer
i18n catalog are
intentionally adapted for Cleanup Map: they remove brand capture, repository
evidence, and generic output-path workflows, and apply the cleanup camera/focus
behavior. The renderer also keeps visual palette types separate from Cleanup
role labels. `renderers/shared/validator.mjs` is replaced with a dependency-free
Architecture-only adapter. Cleanup Map validation happens before the Architecture
compiler runs.

Use the revision above as the comparison base when refreshing this core. Review
the retained cleanup adaptations with template/runtime changes as one unit.

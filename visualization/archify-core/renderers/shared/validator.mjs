// simplify-codebase adaptation: the upstream generated validator includes all
// five Archify diagram types. This vendored core renders Architecture only, so
// keep the validation boundary small and dependency-free.
import { throwDiagnosticError } from './diagnostics.mjs';

const ID = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

function problem(path, message) {
  return {
    code: 'schema/cleanup-architecture',
    severity: 'error',
    message: `${path} ${message}`,
    subject: { diagramType: 'architecture', path },
    evidence: {},
    supportedFixes: [],
  };
}

export function validateSchema(diagramType, data) {
  if (diagramType !== 'architecture') {
    throw new Error(`validateSchema: vendored cleanup core supports architecture only, received "${diagramType}"`);
  }
  const diagnostics = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    diagnostics.push(problem('/', 'must be an object'));
  } else {
    if (data.schema_version !== 1) diagnostics.push(problem('/schema_version', 'must equal 1'));
    if (data.diagram_type !== 'architecture') diagnostics.push(problem('/diagram_type', 'must equal "architecture"'));
    if (!data.meta || typeof data.meta.title !== 'string' || !data.meta.title.trim()) {
      diagnostics.push(problem('/meta/title', 'must be a non-empty string'));
    }
    if (!Array.isArray(data.components) || data.components.length < 1) {
      diagnostics.push(problem('/components', 'must contain at least one component'));
    }
    if (!Array.isArray(data.connections)) diagnostics.push(problem('/connections', 'must be an array'));

    const componentIds = new Set();
    for (const [index, component] of (data.components || []).entries()) {
      const path = `/components/${index}`;
      if (!component || typeof component !== 'object') {
        diagnostics.push(problem(path, 'must be an object'));
        continue;
      }
      if (!ID.test(component.id || '')) diagnostics.push(problem(`${path}/id`, 'must be a stable semantic ID'));
      else if (componentIds.has(component.id)) diagnostics.push(problem(`${path}/id`, `duplicates "${component.id}"`));
      else componentIds.add(component.id);
      if (typeof component.label !== 'string' || !component.label.trim()) diagnostics.push(problem(`${path}/label`, 'must be non-empty'));
      if (!Array.isArray(component.pos) || component.pos.length !== 2 || component.pos.some((value) => !Number.isFinite(value))) {
        diagnostics.push(problem(`${path}/pos`, 'must contain two finite coordinates'));
      }
    }

    const connectionIds = new Set();
    for (const [index, connection] of (data.connections || []).entries()) {
      const path = `/connections/${index}`;
      if (!connection || typeof connection !== 'object') {
        diagnostics.push(problem(path, 'must be an object'));
        continue;
      }
      if (connection.id !== undefined) {
        if (!ID.test(connection.id)) diagnostics.push(problem(`${path}/id`, 'must be a stable semantic ID'));
        else if (connectionIds.has(connection.id)) diagnostics.push(problem(`${path}/id`, `duplicates "${connection.id}"`));
        else connectionIds.add(connection.id);
      }
      if (!componentIds.has(connection.from)) diagnostics.push(problem(`${path}/from`, `references unknown component "${connection.from}"`));
      if (!componentIds.has(connection.to)) diagnostics.push(problem(`${path}/to`, `references unknown component "${connection.to}"`));
    }

    for (const [index, view] of (data.meta?.views || []).entries()) {
      if (!ID.test(view.id || '')) diagnostics.push(problem(`/meta/views/${index}/id`, 'must be a stable semantic ID'));
      if (!Array.isArray(view.focus) || !view.focus.length) diagnostics.push(problem(`/meta/views/${index}/focus`, 'must contain semantic IDs'));
      for (const id of view.focus || []) {
        if (!componentIds.has(id) && !connectionIds.has(id)) diagnostics.push(problem(`/meta/views/${index}/focus`, `references unknown semantic ID "${id}"`));
      }
    }
  }

  if (diagnostics.length) {
    throwDiagnosticError(
      `architecture validation failed:\n${diagnostics.map((entry) => `  ${entry.message}`).join('\n')}`,
      diagnostics,
    );
  }
}

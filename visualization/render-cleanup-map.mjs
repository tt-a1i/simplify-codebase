#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const archifyRendererPath = path.join(moduleDir, 'archify-core/renderers/architecture/render-architecture.mjs');
const cleanupExtensionCssPath = path.join(moduleDir, 'cleanup-extension.css');
const cleanupExtensionJsPath = path.join(moduleDir, 'cleanup-extension.js');
const COLUMN_STEP = 258;
const ROW_STEP = 150;
const ID = /^[A-Za-z][A-Za-z0-9_-]*$/;
const FINDING_ID = /^S[1-9][0-9]*$/;
const ROLES = new Set(['entrypoint', 'owner', 'candidate', 'consumer', 'state', 'store', 'boundary', 'external']);
const KINDS = new Set(['call', 'data', 'registration', 'publication', 'lifecycle', 'dependency']);
const DISPOSITIONS = new Set(['ranked', 'retained', 'rejected', 'unresolved', 'changed']);
const LEVELS = new Set(['high', 'medium', 'low']);
const TEXT_LIMITS = Object.freeze({
  metaTitle: 72,
  nodeLabel: 30,
  relationshipLabel: 28,
  findingTitle: 56,
  findingSummary: 180,
  proof: 240,
  consequence: 160,
  unknown: 140,
  verification: 240,
});

function usage() {
  return `Usage:
  node visualization/render-cleanup-map.mjs validate <input.json>
  node visualization/render-cleanup-map.mjs render <input.json> [output.html]
  node visualization/render-cleanup-map.mjs deliver <input.json> [output.html]
  node visualization/render-cleanup-map.mjs check <output.html>`;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function rejectUnknownKeys(value, allowed, pointer, problems) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) problems.push(`${pointer}/${key} is not part of the cleanup-map contract.`);
  }
}

function rejectLongText(value, limit, pointer, problems) {
  if (typeof value === 'string' && value.trim().length > limit) {
    problems.push(`${pointer} must contain at most ${limit} characters; move detail to the canonical text report.`);
  }
}

function validateIdList(value, pointer, known, problems) {
  if (!Array.isArray(value)) {
    problems.push(`${pointer} must be an array.`);
    return;
  }
  for (const [index, id] of value.entries()) {
    if (typeof id !== 'string' || !ID.test(id)) problems.push(`${pointer}/${index} must be a stable semantic ID.`);
    else if (!known.has(id)) problems.push(`${pointer}/${index} references unknown ID ${JSON.stringify(id)}.`);
  }
  for (const duplicate of duplicateValues(value)) problems.push(`${pointer} duplicates ${JSON.stringify(duplicate)}.`);
}

function validatePortableLink(value, pointer, problems) {
  if (typeof value !== 'string' || !value.trim()) {
    problems.push(`${pointer} must be a non-empty portable link.`);
    return;
  }
  const link = value.trim();
  if (link !== value || /[\u0000-\u001F\u007F]/.test(link)) {
    problems.push(`${pointer} must not contain surrounding whitespace or control characters.`);
    return;
  }
  const hasScheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(link);
  if ((hasScheme && !link.toLowerCase().startsWith('https://')) || link.startsWith('//') || link.startsWith('\\')) {
    problems.push(`${pointer} must be an HTTPS URL or a relative/hash link.`);
  }
}

function validateSnapshot(snapshot, pointer, nodeIds, relationshipIds, relationshipById, problems) {
  if (!isObject(snapshot)) {
    problems.push(`${pointer} must be an object.`);
    return { nodes: new Set(), relationships: new Set() };
  }
  rejectUnknownKeys(snapshot, new Set(['nodes', 'relationships']), pointer, problems);
  validateIdList(snapshot.nodes, `${pointer}/nodes`, nodeIds, problems);
  validateIdList(snapshot.relationships, `${pointer}/relationships`, relationshipIds, problems);
  const nodes = new Set(Array.isArray(snapshot.nodes) ? snapshot.nodes : []);
  const relationships = new Set(Array.isArray(snapshot.relationships) ? snapshot.relationships : []);
  for (const relationshipId of relationships) {
    const relationship = relationshipById.get(relationshipId);
    if (relationship && (!nodes.has(relationship.from) || !nodes.has(relationship.to))) {
      problems.push(`${pointer}/relationships includes ${JSON.stringify(relationshipId)} without both endpoint nodes.`);
    }
  }
  return { nodes, relationships };
}

export function shortestDirectedPath(relationships, source, target) {
  if (source === target) return { nodes: [source], relationships: [] };
  const outgoing = new Map();
  for (const relationship of relationships) {
    const links = outgoing.get(relationship.from) || [];
    links.push(relationship);
    outgoing.set(relationship.from, links);
  }
  const previous = new Map([[source, null]]);
  const queue = [source];
  for (let cursor = 0; cursor < queue.length && !previous.has(target); cursor += 1) {
    for (const relationship of outgoing.get(queue[cursor]) || []) {
      if (previous.has(relationship.to)) continue;
      previous.set(relationship.to, { from: queue[cursor], relationship });
      queue.push(relationship.to);
      if (relationship.to === target) break;
    }
  }
  if (!previous.has(target)) return null;
  const nodes = [target];
  const route = [];
  let current = target;
  while (current !== source) {
    const step = previous.get(current);
    if (!step) return null;
    nodes.unshift(step.from);
    route.unshift(step.relationship.id);
    current = step.from;
  }
  return { nodes, relationships: route };
}

export function validateDocument(document) {
  const problems = [];
  if (!isObject(document)) return ['Document must be a JSON object.'];
  rejectUnknownKeys(document, new Set(['schema_version', 'map_type', 'meta', 'nodes', 'relationships', 'findings', 'change']), '', problems);
  if (document.schema_version !== 1) problems.push('/schema_version must equal 1.');
  if (document.map_type !== 'cleanup') problems.push('/map_type must equal "cleanup".');

  const meta = document.meta;
  if (!isObject(meta)) problems.push('/meta must be an object.');
  else {
    rejectUnknownKeys(meta, new Set(['title', 'mode', 'scope', 'repository', 'revision', 'locale']), '/meta', problems);
    if (typeof meta.title !== 'string' || !meta.title.trim()) problems.push('/meta/title must be non-empty.');
    rejectLongText(meta.title, TEXT_LIMITS.metaTitle, '/meta/title', problems);
    if (!['survey', 'change'].includes(meta.mode)) problems.push('/meta/mode must be survey or change.');
    if (!['focused', 'broad'].includes(meta.scope)) problems.push('/meta/scope must be focused or broad.');
    if (meta.repository !== undefined && typeof meta.repository !== 'string') problems.push('/meta/repository must be a string.');
    if (meta.revision !== undefined && typeof meta.revision !== 'string') problems.push('/meta/revision must be a string.');
    if (meta.locale !== undefined && !['en', 'zh-CN'].includes(meta.locale)) problems.push('/meta/locale must be en or zh-CN.');
  }

  const nodes = Array.isArray(document.nodes) ? document.nodes : [];
  if (!Array.isArray(document.nodes) || nodes.length < 1 || nodes.length > 18) problems.push('/nodes must contain 1 to 18 nodes.');
  const nodeIds = new Set();
  for (const [index, node] of nodes.entries()) {
    const pointer = `/nodes/${index}`;
    if (!isObject(node)) {
      problems.push(`${pointer} must be an object.`);
      continue;
    }
    rejectUnknownKeys(node, new Set(['id', 'label', 'role', 'locus', 'column']), pointer, problems);
    if (typeof node.id !== 'string' || !ID.test(node.id)) problems.push(`${pointer}/id must be a stable semantic ID.`);
    else if (nodeIds.has(node.id)) problems.push(`${pointer}/id duplicates ${JSON.stringify(node.id)}.`);
    else nodeIds.add(node.id);
    if (typeof node.label !== 'string' || !node.label.trim()) problems.push(`${pointer}/label must be non-empty.`);
    rejectLongText(node.label, TEXT_LIMITS.nodeLabel, `${pointer}/label`, problems);
    if (!ROLES.has(node.role)) problems.push(`${pointer}/role is unsupported.`);
    if (node.column !== undefined && (!Number.isInteger(node.column) || node.column < 0 || node.column > 5)) {
      problems.push(`${pointer}/column must be an integer from 0 to 5.`);
    }
    if (node.locus !== undefined) {
      if (!isObject(node.locus) || typeof node.locus.path !== 'string' || !node.locus.path.trim()) {
        problems.push(`${pointer}/locus must include a non-empty path.`);
      } else {
        rejectUnknownKeys(node.locus, new Set(['path', 'line', 'symbol', 'href']), `${pointer}/locus`, problems);
        if (node.locus.line !== undefined && (!Number.isInteger(node.locus.line) || node.locus.line < 1)) problems.push(`${pointer}/locus/line must be a positive integer.`);
        if (node.locus.symbol !== undefined && typeof node.locus.symbol !== 'string') problems.push(`${pointer}/locus/symbol must be a string.`);
        if (node.locus.href !== undefined) validatePortableLink(node.locus.href, `${pointer}/locus/href`, problems);
      }
    }
  }

  const relationships = Array.isArray(document.relationships) ? document.relationships : [];
  if (!Array.isArray(document.relationships) || relationships.length > 32) problems.push('/relationships must contain at most 32 relationships.');
  const relationshipIds = new Set();
  const relationshipById = new Map();
  for (const [index, relationship] of relationships.entries()) {
    const pointer = `/relationships/${index}`;
    if (!isObject(relationship)) {
      problems.push(`${pointer} must be an object.`);
      continue;
    }
    rejectUnknownKeys(relationship, new Set(['id', 'from', 'to', 'label', 'kind', 'evidence']), pointer, problems);
    if (typeof relationship.id !== 'string' || !ID.test(relationship.id)) problems.push(`${pointer}/id must be a stable semantic ID.`);
    else if (relationshipIds.has(relationship.id)) problems.push(`${pointer}/id duplicates ${JSON.stringify(relationship.id)}.`);
    else {
      relationshipIds.add(relationship.id);
      relationshipById.set(relationship.id, relationship);
    }
    if (!nodeIds.has(relationship.from)) problems.push(`${pointer}/from references unknown node ${JSON.stringify(relationship.from)}.`);
    if (!nodeIds.has(relationship.to)) problems.push(`${pointer}/to references unknown node ${JSON.stringify(relationship.to)}.`);
    if (relationship.from === relationship.to) problems.push(`${pointer} must not connect a node to itself.`);
    if (typeof relationship.label !== 'string' || !relationship.label.trim()) problems.push(`${pointer}/label must be non-empty.`);
    rejectLongText(relationship.label, TEXT_LIMITS.relationshipLabel, `${pointer}/label`, problems);
    if (!KINDS.has(relationship.kind)) problems.push(`${pointer}/kind is unsupported.`);
    if (relationship.evidence !== 'confirmed') problems.push(`${pointer}/evidence must equal "confirmed"; unresolved relationships belong in finding.unknowns.`);
  }

  const findings = Array.isArray(document.findings) ? document.findings : [];
  if (!Array.isArray(document.findings) || findings.length < 1 || findings.length > 5) problems.push('/findings must contain 1 to 5 visualized findings.');
  const findingIds = new Set();
  for (const [index, finding] of findings.entries()) {
    const pointer = `/findings/${index}`;
    if (!isObject(finding)) {
      problems.push(`${pointer} must be an object.`);
      continue;
    }
    rejectUnknownKeys(finding, new Set(['id', 'title', 'disposition', 'confidence', 'risk', 'summary', 'primary', 'related', 'route', 'cut', 'proof', 'consequence', 'unknowns', 'report_url']), pointer, problems);
    if (typeof finding.id !== 'string' || !FINDING_ID.test(finding.id)) problems.push(`${pointer}/id must match S1, S2, and so on.`);
    else if (findingIds.has(finding.id)) problems.push(`${pointer}/id duplicates ${JSON.stringify(finding.id)}.`);
    else findingIds.add(finding.id);
    if (typeof finding.title !== 'string' || !finding.title.trim()) problems.push(`${pointer}/title must be non-empty.`);
    rejectLongText(finding.title, TEXT_LIMITS.findingTitle, `${pointer}/title`, problems);
    if (!DISPOSITIONS.has(finding.disposition)) problems.push(`${pointer}/disposition is unsupported.`);
    if (!LEVELS.has(finding.confidence)) problems.push(`${pointer}/confidence must be high, medium, or low.`);
    if (finding.risk !== undefined && !LEVELS.has(finding.risk)) problems.push(`${pointer}/risk must be high, medium, or low.`);
    if (typeof finding.summary !== 'string' || !finding.summary.trim()) problems.push(`${pointer}/summary must be non-empty.`);
    rejectLongText(finding.summary, TEXT_LIMITS.findingSummary, `${pointer}/summary`, problems);
    if (!nodeIds.has(finding.primary)) problems.push(`${pointer}/primary references unknown node ${JSON.stringify(finding.primary)}.`);
    validateIdList(finding.related, `${pointer}/related`, nodeIds, problems);
    const related = new Set(Array.isArray(finding.related) ? finding.related : []);
    if (Array.isArray(finding.related) && !finding.related.includes(finding.primary)) problems.push(`${pointer}/related must include the primary node.`);
    if (typeof finding.proof !== 'string' || !finding.proof.trim()) problems.push(`${pointer}/proof must be non-empty.`);
    rejectLongText(finding.proof, TEXT_LIMITS.proof, `${pointer}/proof`, problems);
    if (finding.consequence !== undefined && typeof finding.consequence !== 'string') problems.push(`${pointer}/consequence must be a string.`);
    rejectLongText(finding.consequence, TEXT_LIMITS.consequence, `${pointer}/consequence`, problems);
    if (finding.report_url !== undefined) validatePortableLink(finding.report_url, `${pointer}/report_url`, problems);
    if (finding.route !== undefined) {
      if (!isObject(finding.route) || !nodeIds.has(finding.route.from) || !nodeIds.has(finding.route.to)) {
        problems.push(`${pointer}/route must reference two known nodes.`);
      } else {
        rejectUnknownKeys(finding.route, new Set(['from', 'to']), `${pointer}/route`, problems);
        const route = shortestDirectedPath(relationships, finding.route.from, finding.route.to);
        if (!route) problems.push(`${pointer}/route has no confirmed directed path.`);
        else if (!route.nodes.includes(finding.primary)) problems.push(`${pointer}/route must pass through the primary node.`);
        else if (route.nodes.some((nodeId) => !related.has(nodeId))) problems.push(`${pointer}/related must include every node on the route.`);
      }
    }
    if (!isObject(finding.cut)) problems.push(`${pointer}/cut must describe at least one retired node or relationship.`);
    else {
      rejectUnknownKeys(finding.cut, new Set(['nodes', 'relationships']), `${pointer}/cut`, problems);
      if (finding.cut.nodes !== undefined) validateIdList(finding.cut.nodes, `${pointer}/cut/nodes`, nodeIds, problems);
      if (finding.cut.relationships !== undefined) validateIdList(finding.cut.relationships, `${pointer}/cut/relationships`, relationshipIds, problems);
      const cutNodeCount = Array.isArray(finding.cut.nodes) ? finding.cut.nodes.length : 0;
      const cutRelationshipCount = Array.isArray(finding.cut.relationships) ? finding.cut.relationships.length : 0;
      if (cutNodeCount + cutRelationshipCount === 0) problems.push(`${pointer}/cut must contain at least one node or relationship.`);
      const cutNodes = new Set(Array.isArray(finding.cut.nodes) ? finding.cut.nodes : []);
      const cutRelationships = new Set(Array.isArray(finding.cut.relationships) ? finding.cut.relationships : []);
      for (const nodeId of cutNodes) {
        if (!related.has(nodeId)) problems.push(`${pointer}/related must include cut node ${JSON.stringify(nodeId)}.`);
        for (const relationship of relationships) {
          if ((relationship.from === nodeId || relationship.to === nodeId) && !cutRelationships.has(relationship.id)) {
            problems.push(`${pointer}/cut/relationships must include ${JSON.stringify(relationship.id)} incident to cut node ${JSON.stringify(nodeId)}.`);
          }
        }
      }
      for (const relationshipId of cutRelationships) {
        const relationship = relationshipById.get(relationshipId);
        if (relationship && (!related.has(relationship.from) || !related.has(relationship.to))) {
          problems.push(`${pointer}/related must include both endpoints of cut relationship ${JSON.stringify(relationshipId)}.`);
        }
      }
    }
    if (finding.unknowns !== undefined && (!Array.isArray(finding.unknowns) || finding.unknowns.some((item) => typeof item !== 'string' || !item.trim()))) {
      problems.push(`${pointer}/unknowns must be an array of non-empty strings.`);
    }
    if (Array.isArray(finding.unknowns)) {
      if (finding.unknowns.length > 3) problems.push(`${pointer}/unknowns must contain at most 3 decision-relevant items.`);
      for (const duplicate of duplicateValues(finding.unknowns)) problems.push(`${pointer}/unknowns duplicates ${JSON.stringify(duplicate)}.`);
      finding.unknowns.forEach((item, unknownIndex) => rejectLongText(item, TEXT_LIMITS.unknown, `${pointer}/unknowns/${unknownIndex}`, problems));
    }
  }

  if (meta?.mode === 'survey') {
    for (const [index, finding] of findings.entries()) {
      if (isObject(finding) && finding.disposition !== 'ranked') problems.push(`/findings/${index}/disposition must be ranked in Survey mode.`);
    }
  }

  if (meta?.mode === 'change') {
    const change = document.change;
    if (!isObject(change)) problems.push('/change is required in Change mode.');
    else {
      rejectUnknownKeys(change, new Set(['finding_id', 'before', 'after', 'verification']), '/change', problems);
      if (findings.length !== 1) problems.push('/findings must contain exactly one changed Finding in Change mode.');
      const finding = findings[0];
      if (isObject(finding) && finding.disposition !== 'changed') problems.push('/findings/0/disposition must be changed in Change mode.');
      if (!findingIds.has(change.finding_id)) problems.push('/change/finding_id must reference the visualized Finding.');
      else if (isObject(finding) && change.finding_id !== finding.id) problems.push('/change/finding_id must match /findings/0/id.');
      const before = validateSnapshot(change.before, '/change/before', nodeIds, relationshipIds, relationshipById, problems);
      const after = validateSnapshot(change.after, '/change/after', nodeIds, relationshipIds, relationshipById, problems);
      if (isObject(finding) && isObject(finding.cut)) {
        const cutNodeIds = Array.isArray(finding.cut.nodes) ? finding.cut.nodes : [];
        const cutRelationshipIds = Array.isArray(finding.cut.relationships) ? finding.cut.relationships : [];
        const cutNodes = new Set(cutNodeIds);
        const cutRelationships = new Set(cutRelationshipIds);
        for (const nodeId of cutNodeIds) {
          if (!before.nodes.has(nodeId)) problems.push(`/findings/0/cut/nodes includes ${JSON.stringify(nodeId)} outside /change/before.`);
          if (after.nodes.has(nodeId)) problems.push(`/findings/0/cut/nodes retains ${JSON.stringify(nodeId)} in /change/after.`);
        }
        for (const relationshipId of cutRelationshipIds) {
          if (!before.relationships.has(relationshipId)) problems.push(`/findings/0/cut/relationships includes ${JSON.stringify(relationshipId)} outside /change/before.`);
          if (after.relationships.has(relationshipId)) problems.push(`/findings/0/cut/relationships retains ${JSON.stringify(relationshipId)} in /change/after.`);
        }
        for (const nodeId of before.nodes) {
          if (!after.nodes.has(nodeId) && !cutNodes.has(nodeId)) problems.push(`/findings/0/cut/nodes omits removed node ${JSON.stringify(nodeId)}.`);
        }
        for (const relationshipId of before.relationships) {
          if (!after.relationships.has(relationshipId) && !cutRelationships.has(relationshipId)) problems.push(`/findings/0/cut/relationships omits removed relationship ${JSON.stringify(relationshipId)}.`);
        }
      }
      if (typeof change.verification !== 'string' || !change.verification.trim()) problems.push('/change/verification must be non-empty.');
      rejectLongText(change.verification, TEXT_LIMITS.verification, '/change/verification', problems);
    }
  } else if (document.change !== undefined) {
    problems.push('/change is only allowed when meta.mode is "change".');
  }
  return problems;
}

function safeScriptJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function truncate(value, length) {
  const text = String(value || '').trim();
  return text.length <= length ? text : `${text.slice(0, Math.max(1, length - 1)).trimEnd()}…`;
}

function roleVisualType(role) {
  return ({
    entrypoint: 'external',
    owner: 'backend',
    candidate: 'security',
    consumer: 'frontend',
    state: 'database',
    store: 'database',
    boundary: 'cloud',
    external: 'external',
  })[role] || 'external';
}

function roleLabel(role, locale) {
  if (locale !== 'zh-CN') return role;
  return ({
    entrypoint: '入口',
    owner: '所有者',
    candidate: '候选',
    consumer: '消费者',
    state: '状态',
    store: '存储',
    boundary: '边界',
    external: '外部',
  })[role] || role;
}

function architectureSubtitle(document) {
  if (document.meta.locale !== 'zh-CN') {
    return `${document.meta.mode.toUpperCase()} · ${document.meta.scope.toUpperCase()} · ${document.findings.length} ${document.findings.length === 1 ? 'FINDING' : 'FINDINGS'}`;
  }
  const mode = document.meta.mode === 'change' ? '修改结果' : '清理分析';
  const scope = document.meta.scope === 'broad' ? '全库范围' : '聚焦范围';
  return `${mode} · ${scope} · ${document.findings.length} 个问题`;
}

function layoutColumns(document) {
  const ranks = new Map();
  for (const node of document.nodes) if (Number.isInteger(node.column)) ranks.set(node.id, node.column);
  for (const node of document.nodes) if (!ranks.has(node.id)) ranks.set(node.id, 0);
  for (let pass = 0; pass < document.nodes.length; pass += 1) {
    for (const relationship of document.relationships) {
      const target = document.nodes.find((node) => node.id === relationship.to);
      if (Number.isInteger(target?.column)) continue;
      ranks.set(relationship.to, Math.min(5, Math.max(ranks.get(relationship.to), ranks.get(relationship.from) + 1)));
    }
  }
  const columns = new Map();
  for (const node of document.nodes) {
    const column = ranks.get(node.id);
    const list = columns.get(column) || [];
    list.push(node.id);
    columns.set(column, list);
  }
  return { ranks, columns };
}

export function compileArchitecture(document) {
  const problems = validateDocument(document);
  if (problems.length) throw new Error(`Cleanup map validation failed:\n- ${problems.join('\n- ')}`);

  const { ranks, columns } = layoutColumns(document);
  const findingIdsByNode = new Map();
  for (const finding of document.findings) {
    for (const nodeId of finding.related) {
      const ids = findingIdsByNode.get(nodeId) || [];
      ids.push(finding.id);
      findingIdsByNode.set(nodeId, ids);
    }
  }
  const components = document.nodes.map((node) => {
    const row = columns.get(ranks.get(node.id)).indexOf(node.id);
    const findingIds = findingIdsByNode.get(node.id) || [];
    return {
      id: node.id,
      type: roleVisualType(node.role),
      semantic_kind: node.role,
      label: truncate(node.label, 30),
      sublabel: truncate(node.locus?.symbol || node.role, 34),
      ...(findingIds.length ? { tag: truncate(`${findingIds.join(' · ')} · ${roleLabel(node.role, document.meta.locale)}`, 34) } : {}),
      pos: [50 + ranks.get(node.id) * COLUMN_STEP, 120 + row * ROW_STEP],
      size: [148, 74],
    };
  });
  const componentById = new Map(components.map((component) => [component.id, component]));
  const maxColumn = Math.max(...components.map((component) => Math.round((component.pos[0] - 50) / COLUMN_STEP)));
  const maxRows = Math.max(...[...columns.values()].map((nodes) => nodes.length));

  return {
    schema_version: 1,
    diagram_type: 'architecture',
    meta: {
      title: document.meta.title,
      subtitle: architectureSubtitle(document),
      locale: document.meta.locale || 'en',
      visual_preset: 'signal-flow',
      quality_profile: 'standard',
      viewBox: [Math.max(620, 100 + (maxColumn + 1) * COLUMN_STEP), Math.max(380, 200 + maxRows * ROW_STEP)],
    },
    components,
    connections: document.relationships.map((relationship, index) => {
      const from = componentById.get(relationship.from);
      const to = componentById.get(relationship.to);
      const skipsColumns = Math.abs(ranks.get(relationship.to) - ranks.get(relationship.from)) > 1;
      const sameRow = from.pos[1] === to.pos[1];
      const needsBypass = skipsColumns && sameRow;
      const corridorY = Math.max(from.pos[1] + from.size[1], to.pos[1] + to.size[1]) + 42 + (index % 2) * 22;
      return {
        id: relationship.id,
        from: relationship.from,
        to: relationship.to,
        label: truncate(relationship.label, 28),
        labelDy: needsBypass ? 18 : -34,
        route: 'auto',
        ...(needsBypass ? {
          fromSide: 'bottom',
          toSide: 'bottom',
          via: [
            [from.pos[0] + from.size[0] / 2, corridorY],
            [to.pos[0] + to.size[0] / 2, corridorY],
          ],
          labelSegment: 1,
        } : {}),
        variant: relationship.kind === 'publication' ? 'emphasis' : 'default',
      };
    }),
  };
}

function enhanceArchifyHtml(html, document) {
  const css = fs.readFileSync(cleanupExtensionCssPath, 'utf8');
  const javascript = fs.readFileSync(cleanupExtensionJsPath, 'utf8');
  const semanticData = `<script id="cleanup-map-data" type="application/json">${safeScriptJson(document)}</script>`;
  return html
    .replace('<html ', '<html data-cleanup-artifact="true" ')
    .replace('<meta name="generator"', '<meta name="cleanup-map-artifact" content="2">\n  <meta name="generator"')
    .replace('</head>', `  <style id="cleanup-map-extension-styles">\n${css}\n  </style>\n</head>`)
    .replace('</body>', `  ${semanticData}\n  <script id="cleanup-map-extension">\n${javascript}\n  </script>\n</body>`);
}

export function renderDocument(document) {
  const architecture = compileArchitecture(document);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanup-map-archify-'));
  const inputPath = path.join(directory, 'architecture.json');
  const outputPath = path.join(directory, 'architecture.html');
  try {
    fs.writeFileSync(inputPath, JSON.stringify(architecture, null, 2));
    const result = spawnSync(process.execPath, [archifyRendererPath, inputPath, outputPath], {
      encoding: 'utf8',
      env: { ...process.env, ARCHIFY_QUALITY_PROFILE: 'standard' },
    });
    if (result.status !== 0) {
      throw new Error(`Vendored Archify renderer failed:\n${(result.stderr || result.stdout || '').trim()}`);
    }
    return enhanceArchifyHtml(fs.readFileSync(outputPath, 'utf8'), document);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

export function checkArtifact(html) {
  const normalizedHtml = html.toLowerCase();
  const checks = [
    ['artifact marker', html.includes('name="cleanup-map-artifact" content="2"')],
    ['vendored Archify runtime', html.includes('name="generator" content="archify') && html.includes('Archify.routeProbe = (function ()')],
    ['embedded semantic data', html.includes('id="cleanup-map-data"')],
    ['single interactive SVG', (html.match(/<svg\b/g) || []).length === 1 && html.includes('data-node-id=')],
    ['cleanup stage workbench', html.includes("panel.id = 'cleanup-stage-panel'") && html.includes("stageControls.id = 'cleanup-stage-controls'")],
    ['semantic passport and route probe', html.includes('id="focus-chip"') && html.includes('id="route-probe"')],
    ['truth boundary', normalizedHtml.includes('authored reachability') && normalizedHtml.includes('deletion safety')],
  ];
  return checks;
}

function readJson(inputPath) {
  return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

function defaultOutput(inputPath) {
  return path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.html`);
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function main(argv) {
  const [command, rawInput, rawOutput] = argv;
  if (!command || !rawInput || !['validate', 'render', 'deliver', 'check'].includes(command)) fail(usage(), 2);
  if (command === 'check') {
    const artifactPath = path.resolve(rawInput);
    const checks = checkArtifact(fs.readFileSync(artifactPath, 'utf8'));
    for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (checks.some(([, ok]) => !ok)) process.exit(1);
    return;
  }
  const inputPath = path.resolve(rawInput);
  const document = readJson(inputPath);
  const problems = validateDocument(document);
  if (problems.length) fail(`Cleanup map validation failed:\n- ${problems.join('\n- ')}`);
  console.log(`PASS cleanup-map contract validation (${document.nodes.length} nodes, ${document.relationships.length} relationships, ${document.findings.length} findings)`);
  if (command === 'validate') return;
  const outputPath = path.resolve(rawOutput || defaultOutput(inputPath));
  const html = renderDocument(document);
  fs.writeFileSync(outputPath, html);
  console.log(`WROTE ${outputPath}`);
  if (command === 'deliver') {
    const checks = checkArtifact(html);
    for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (checks.some(([, ok]) => !ok)) process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  checkArtifact,
  compileArchitecture,
  renderDocument,
  shortestDirectedPath,
  validateDocument,
} from '../render-cleanup-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(root, 'examples', name), 'utf8'));
}

test('Survey and Change fixtures satisfy the cleanup-map contract', () => {
  assert.deepEqual(validateDocument(fixture('survey.cleanup-map.json')), []);
  assert.deepEqual(validateDocument(fixture('change.cleanup-map.json')), []);
});

test('bundled JSON Schema matches the authored contract surface', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'cleanup-map.schema.json'), 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.deepEqual(schema.properties.meta.required, ['title', 'mode', 'scope']);
  assert.equal('summary' in schema.properties.meta.properties, false);
  assert.equal('detail' in schema.$defs.node.properties, false);
});

test('renderer creates a checked standalone artifact for both modes', () => {
  for (const name of ['survey.cleanup-map.json', 'change.cleanup-map.json']) {
    const document = fixture(name);
    const architecture = compileArchitecture(document);
    const html = renderDocument(document);
    assert.ok(checkArtifact(html).every(([, ok]) => ok), name);
    assert.equal(architecture.meta.visual_preset, 'signal-flow');
    assert.equal('animation' in architecture.meta, false);
    assert.equal(architecture.meta.locale, 'zh-CN');
    assert.equal(architecture.components.find((component) => component.id === 'legacyRouter').semantic_kind, 'candidate');
    assert.match(architecture.meta.subtitle, /清理分析|修改结果/);
    assert.equal('legend' in architecture.meta, false);
    assert.equal('views' in architecture.meta, false);
    assert.equal('cards' in architecture, false);
    assert.match(html, /data-preset="signal-flow"/);
    assert.match(html, /data-node-id="legacyRouter"[^>]*data-node-kind="candidate"/);
    assert.doesNotMatch(html, /<svg[^>]*data-animation="trace"/);
    for (const retiredSurface of [
      /Archify\.(guidedViews|semanticLens|guide|presentation|preset)/,
      /archify-guided-views-data|class="cards"/,
      /id="(?:guided-views|semantic-lens|diagram-guide|btn-present|btn-preset)"/,
      /viewer\.(?:guided|lens|guide|present|preset)\./,
      /data-format="webm"|MediaRecorder|data-legend/,
    ]) {
      assert.doesNotMatch(html, retiredSurface);
    }
    assert.match(html, /setEvidenceOpen\(isDecisionStage\(stage\)\)/);
    assert.match(html, /findingSummary\.textContent = finding\.summary/);
    assert.match(html, /stageCaption\.textContent = stageCaptions\[currentStage\]/);
    assert.match(html, /\.cleanup-analysis-header \{/);
    assert.match(html, /\.cleanup-stage-rail \{/);
    assert.match(html, /html\[data-cleanup-artifact="true"\] \.header \{/);
    assert.match(html, /<html data-cleanup-artifact="true" /);
    assert.match(html, /html\[data-cleanup-artifact="true"\] body \{ padding-block: 0\.375rem; \}/);
    assert.doesNotMatch(html, /document\.documentElement\.setAttribute\('data-cleanup-artifact', 'true'\)/);
    assert.match(html, /title\.textContent = finding\.title/);
    assert.doesNotMatch(html, /title\.textContent = finding\.id \+ ' · ' \+ finding\.title/);
    assert.match(html, /\.cleanup-workspace\[data-evidence-open="true"\] \{/);
    assert.match(html, /workspace\.appendChild\(diagram\)/);
    assert.match(html, /workspace\.appendChild\(evidenceDrawer\)/);
    assert.doesNotMatch(html, /cleanup-finding-eyebrow/);
    assert.match(html, /opacity: 0\.36 !important/);
    assert.match(html, /opacity: 0\.3 !important/);
    assert.match(html, /\[data-node-id\]\[data-focus-selected\]/);
    assert.match(html, /stroke-width: 3\.25px !important/);
    assert.match(html, /if \(!ownsHash\)/);
    assert.match(html, /activate\(currentFinding\.id, currentStage, false, Boolean\(location\.hash/);
    assert.match(html, /if \(!preserveNativeFocus\) resetNative\(\)/);
    assert.match(html, /if \(!preserveNativeFocus\) scheduleStageCamera\(finding, stage\)/);
    assert.doesNotMatch(html, /Archify\?\.focus\?\.set\(finding\.primary/);
    assert.match(html, /click it to open its source passport/);
    assert.match(html, /function cutNodeIds\(finding\)/);
    assert.match(html, /function frameStage\(finding, stage\)/);
    assert.match(html, /border: 1px solid var\(--panel-border\)/);
    assert.match(html, /data-cleanup-ready/);
    assert.match(html, /html\[data-cleanup-ready="true"\] svg \[data-node-id\],[\s\S]*?transition: opacity 180ms cubic-bezier\(0\.22, 1, 0\.36, 1\);/);
    assert.doesNotMatch(html, /svg \[data-node-id\],\s*\nsvg \[data-edge-id\] \{ transition: opacity 180ms ease, filter 180ms ease; \}/);
    assert.doesNotMatch(html, /\.cleanup-finding-title \{[^}]*text-overflow:\s*ellipsis/s);
    assert.doesNotMatch(html, /\.cleanup-finding-title \{[^}]*white-space:\s*nowrap/s);
    assert.match(html, /params\.set\('finding'/);
    assert.match(html, /Archify\.routeProbe = \(function \(\)/);
    assert.match(html, /function zoomBy\(delta\)/);
    assert.match(html, /state\.mode !== 'manual' \|\| cameraTransaction \|\| cameraFrame \|\| cameraTimer/);
    assert.match(html, /zoomBy\(0\.25\)/);
    assert.match(html, /zoomBy\(-0\.25\)/);
    assert.match(html, /var semantic = state\.mode === 'semantic';/);
    assert.match(html, /set\(id, \{ toggle: false \}\)/);
    assert.match(html, /includeNeighbors: true, maxScale: 1\.4, reason: 'focus'/);
    assert.match(html, /options\.includeNeighbors \? 1\.4 : 1\.6/);
    assert.match(html, /maxScale: stage === 'locate' \? 1\.4 : 1\.35/);
    assert.match(html, /var containerObserver = new ResizeObserver/);
    assert.match(html, /outerHeight\(header\) \+ outerHeight\(cleanupPanel\)/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  }
});

test('authored route uses the shortest confirmed directed path', () => {
  const route = shortestDirectedPath(fixture('survey.cleanup-map.json').relationships, 'entrypoint', 'publisher');
  assert.deepEqual(route.nodes, ['entrypoint', 'coordinator', 'legacyRouter', 'handler', 'publisher']);
  assert.equal(route.relationships.length, 4);
});

test('validator rejects guessed and dangling topology', () => {
  const document = fixture('survey.cleanup-map.json');
  document.relationships[0].evidence = 'suspected';
  document.findings[0].related.push('ghost');
  document.findings[0].invented_score = 0.99;
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /must equal "confirmed"/);
  assert.match(problems, /references unknown ID "ghost"/);
  assert.match(problems, /invented_score is not part of the cleanup-map contract/);
});

test('validator keeps visual report copy concise', () => {
  const document = fixture('survey.cleanup-map.json');
  document.findings[0].summary = '冗'.repeat(181);
  document.findings[0].unknowns = ['a', 'b', 'c', 'a'];
  document.relationships[0].label = '过'.repeat(29);
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /summary must contain at most 180 characters/);
  assert.match(problems, /unknowns must contain at most 3 decision-relevant items/);
  assert.match(problems, /unknowns duplicates "a"/);
  assert.match(problems, /label must contain at most 28 characters/);
});

test('validator accepts only portable evidence links', () => {
  const document = fixture('survey.cleanup-map.json');
  document.nodes[0].locus.href = 'java\nscript:globalThis.compromised = true';
  document.findings[0].report_url = 'data:text/html,unsafe';
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /locus\/href must not contain surrounding whitespace or control characters/);
  assert.match(problems, /report_url must be an HTTPS URL or a relative\/hash link/);
});

test('Change receipt describes one actual cut with coherent snapshots', () => {
  const document = fixture('change.cleanup-map.json');
  document.change.after.nodes.push('legacyRouter');
  document.change.after.relationships.push('legacyDelegate');
  document.change.after.nodes = document.change.after.nodes.filter((id) => id !== 'publisher');
  document.change.after.relationships = document.change.after.relationships.filter((id) => id !== 'requestDispatch');
  document.findings.push({ ...structuredClone(document.findings[0]), id: 'S2' });
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /cut\/nodes retains "legacyRouter" in \/change\/after/);
  assert.match(problems, /includes "resultPublish" without both endpoint nodes/);
  assert.match(problems, /cut\/nodes omits removed node "publisher"/);
  assert.match(problems, /cut\/relationships omits removed relationship "requestDispatch"/);
  assert.match(problems, /must contain exactly one changed Finding in Change mode/);
});

test('Change validation reports type-wrong cut lists without throwing', () => {
  const document = fixture('change.cleanup-map.json');
  document.findings[0].cut.nodes = 7;
  document.findings[0].cut.relationships = {};
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /cut\/nodes must be an array/);
  assert.match(problems, /cut\/relationships must be an array/);
});

test('Survey maps visualize ranked candidates with a concrete cut', () => {
  const document = fixture('survey.cleanup-map.json');
  document.findings[0].disposition = 'unresolved';
  delete document.findings[0].cut;
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /disposition must be ranked in Survey mode/);
  assert.match(problems, /cut must describe at least one retired node or relationship/);
});

test('cut and route stay inside the finding boundary', () => {
  const document = fixture('survey.cleanup-map.json');
  document.findings[0].related = ['entrypoint', 'coordinator', 'legacyRouter', 'publisher'];
  document.findings[0].cut.relationships = ['legacyDelegate'];
  const problems = validateDocument(document).join('\n');
  assert.match(problems, /related must include every node on the route/);
  assert.match(problems, /cut\/relationships must include "canonicalDelegate" incident to cut node "legacyRouter"/);

  document.findings[0].cut.relationships.push('canonicalDelegate');
  assert.match(validateDocument(document).join('\n'), /related must include both endpoints of cut relationship "canonicalDelegate"/);
});

test('embedded report text cannot terminate the JSON script', () => {
  const document = fixture('survey.cleanup-map.json');
  document.findings[0].summary = '</script><script>globalThis.compromised = true</script>';
  const html = renderDocument(document);
  assert.doesNotMatch(html, /<script>globalThis\.compromised/);
  assert.match(html, /\\u003c\/script\\u003e/);
});

test('rendered artifact can be written as one portable HTML file', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanup-map-'));
  const output = path.join(directory, 'artifact.html');
  fs.writeFileSync(output, renderDocument(fixture('survey.cleanup-map.json')));
  const size = fs.statSync(output).size;
  assert.ok(size > 100_000, `artifact unexpectedly small: ${size} bytes`);
  assert.ok(size < 500_000, `retired viewer surfaces returned: ${size} bytes`);
  fs.rmSync(directory, { recursive: true, force: true });
});

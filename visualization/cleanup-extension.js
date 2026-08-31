(function () {
  'use strict';
  var source = document.getElementById('cleanup-map-data');
  var diagram = document.querySelector('.diagram-container');
  if (!source || !diagram) return;

  var data = JSON.parse(source.textContent);
  var isChinese = data.meta.locale === 'zh-CN';
  var findingById = new Map(data.findings.map(function (finding) { return [finding.id, finding]; }));
  var nodeById = new Map(data.nodes.map(function (node) { return [node.id, node]; }));
  var relationshipById = new Map(data.relationships.map(function (relationship) { return [relationship.id, relationship]; }));
  var currentFinding = data.findings[0];
  var currentStage = data.meta.mode === 'change' ? 'before' : 'locate';
  var cleanupInitialized = false;
  var cameraFrame = 0;

  var copy = isChinese ? {
    findings: '问题列表',
    stages: '分析步骤',
    showEvidence: '查看证据',
    hideEvidence: '收起证据',
    proof: '关键证据',
    verification: '验证结果',
    consequence: '删除影响',
    unknown: '待确认',
    report: '查看完整报告 ↗',
    confidence: '可信度',
    risk: '风险',
    truth: '图里只画已经确认的关系。能连通，不代表运行时一定受影响，也不代表可以安全删除。',
  } : {
    findings: 'Cleanup findings',
    stages: 'Cleanup stages',
    showEvidence: 'Show evidence',
    hideEvidence: 'Hide evidence',
    proof: 'Decisive proof',
    verification: 'Verification receipt',
    consequence: 'Consequence',
    unknown: 'Unresolved',
    report: 'Proof record ↗',
    confidence: 'confidence',
    risk: 'risk',
    truth: 'Only confirmed relationships are shown. Authored reachability is not runtime impact or deletion safety.',
  };

  var stageEntries = data.meta.mode === 'change'
    ? [['before', isChinese ? '改前' : 'BEFORE'], ['cut', isChinese ? '删除内容' : 'CUT'], ['after', isChinese ? '改后' : 'AFTER'], ['verify', isChinese ? '验证' : 'VERIFY']]
    : [['locate', isChinese ? '定位' : 'LOCATE'], ['trace', isChinese ? '追踪' : 'TRACE'], ['cut', isChinese ? '删除范围' : 'CUT'], ['decide', isChinese ? '判断' : 'DECIDE']];

  var stageCaptions = data.meta.mode === 'change'
    ? (isChinese ? {
        before: '这里是修改前已经确认的关系。',
        cut: '红色部分是这次实际删除的节点和关系。',
        after: '这里是修改后保留下来的所有者和消费者路径。',
        verify: '结合右侧验证结果，确认这次删除有没有破坏原有行为。',
      } : {
        before: 'Read the confirmed relationships before the change.',
        cut: 'See the nodes and relationships actually removed by this change.',
        after: 'Read the surviving owner-to-consumer path after the change.',
        verify: 'Judge the cut against an independent verification receipt.',
      })
    : (isChinese ? {
        locate: '先看高亮节点。点开节点可以查看对应的源码位置。',
        trace: '沿着高亮关系，看它从哪里接收调用，又影响了哪些消费者。',
        cut: '红色部分是建议删除的节点和关系，灰色部分是保留的上下文。',
        decide: '结合右侧的证据、删除影响和待确认项，决定是否进入修改。',
      } : {
        locate: 'Start with the highlighted candidate; click it to open its source passport.',
        trace: 'Follow confirmed relationships from the entrypoint through the candidate to its consumers.',
        cut: 'Highlighted semantics are proposed for removal; gray context remains visible.',
        decide: 'Return to full context and judge the candidate using proof, consequence, and unresolved facts.',
      });

  var dispositionLabels = isChinese ? {
    ranked: '建议清理', retained: '保留', rejected: '不处理', unresolved: '待确认', changed: '已完成',
  } : {};
  var levelLabels = isChinese ? { high: '高', medium: '中', low: '低' } : {};
  var roleLabels = isChinese ? {
    entrypoint: '入口', owner: '所有者', candidate: '候选', consumer: '消费者',
    state: '状态', store: '存储', boundary: '边界', external: '外部',
  } : {};

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function translatedDisposition(value) { return dispositionLabels[value] || value; }
  function translatedLevel(value) { return levelLabels[value] || value; }
  function isDecisionStage(stage) { return stage === 'decide' || stage === 'verify'; }

  var panel = element('section', 'cleanup-stage-panel no-print');
  panel.id = 'cleanup-stage-panel';
  panel.setAttribute('aria-label', copy.stages);
  panel.title = copy.truth;

  var analysisHeader = element('div', 'cleanup-analysis-header');
  var findingStrip = element('nav', 'cleanup-finding-strip');
  findingStrip.id = 'cleanup-finding-strip';
  findingStrip.setAttribute('aria-label', copy.findings);
  analysisHeader.appendChild(findingStrip);

  var identity = element('div', 'cleanup-finding-identity');
  var title = element('strong', 'cleanup-finding-title');
  title.id = 'cleanup-finding-title';
  var findingSummary = element('p', 'cleanup-finding-summary');
  findingSummary.id = 'cleanup-finding-summary';
  var findingMeta = element('div', 'cleanup-finding-meta');
  findingMeta.id = 'cleanup-finding-meta';
  identity.appendChild(title);
  identity.appendChild(findingSummary);
  identity.appendChild(findingMeta);
  analysisHeader.appendChild(identity);
  panel.appendChild(analysisHeader);

  var stageRail = element('div', 'cleanup-stage-rail');
  var stageControls = element('nav', 'cleanup-stage-controls');
  stageControls.id = 'cleanup-stage-controls';
  stageControls.setAttribute('aria-label', copy.stages);
  stageRail.appendChild(stageControls);

  var stageCaption = element('p', 'cleanup-stage-caption');
  stageCaption.id = 'cleanup-stage-caption';
  stageCaption.setAttribute('aria-live', 'polite');
  stageRail.appendChild(stageCaption);

  var evidenceToggle = element('button', 'cleanup-evidence-toggle', copy.showEvidence);
  evidenceToggle.id = 'cleanup-evidence-toggle';
  evidenceToggle.type = 'button';
  evidenceToggle.setAttribute('aria-controls', 'cleanup-evidence-drawer');
  evidenceToggle.setAttribute('aria-expanded', 'false');
  stageRail.appendChild(evidenceToggle);
  panel.appendChild(stageRail);
  panel.appendChild(element('p', 'cleanup-truth-boundary', copy.truth));

  var evidenceDrawer = element('aside', 'cleanup-evidence-drawer');
  evidenceDrawer.id = 'cleanup-evidence-drawer';
  evidenceDrawer.hidden = true;

  function evidenceItem(className, label) {
    var item = element('section', 'cleanup-evidence-item ' + className);
    item.appendChild(element('span', 'cleanup-evidence-label', label));
    var value = element('p', 'cleanup-evidence-value');
    item.appendChild(value);
    evidenceDrawer.appendChild(item);
    return { item: item, value: value };
  }

  var proofItem = evidenceItem('cleanup-evidence-proof', copy.proof);
  var consequenceItem = evidenceItem('cleanup-evidence-consequence', copy.consequence);
  var unknownItem = evidenceItem('cleanup-evidence-unknown', copy.unknown);

  var workspace = element('div', 'cleanup-workspace');
  workspace.id = 'cleanup-workspace';
  workspace.dataset.evidenceOpen = 'false';
  var reportHost = diagram.parentNode;
  reportHost.insertBefore(panel, diagram);
  reportHost.insertBefore(workspace, diagram);
  workspace.appendChild(diagram);
  workspace.appendChild(evidenceDrawer);

  var passportMeta = document.getElementById('focus-passport-meta');
  var passportId = document.getElementById('focus-id');
  var passportKind = document.getElementById('focus-kind');
  var passportLocus = element('a', 'cleanup-passport-locus');
  passportLocus.id = 'cleanup-passport-locus';
  passportLocus.hidden = true;
  if (passportMeta) passportMeta.appendChild(passportLocus);

  function updatePassportLocus() {
    if (!passportId || !passportLocus) return;
    var record = nodeById.get(passportId.textContent.trim());
    var locus = record && record.locus;
    if (record && passportKind) passportKind.textContent = roleLabels[record.role] || record.role;
    if (!locus) {
      passportLocus.hidden = true;
      passportLocus.removeAttribute('href');
      passportLocus.textContent = '';
      return;
    }
    passportLocus.textContent = locus.path + (locus.line ? ':' + locus.line : '') + (locus.symbol ? ' · ' + locus.symbol : '');
    if (locus.href) {
      passportLocus.href = locus.href;
      passportLocus.target = '_blank';
      passportLocus.rel = 'noopener noreferrer';
    } else passportLocus.removeAttribute('href');
    passportLocus.hidden = false;
  }
  if (passportId) new MutationObserver(updatePassportLocus).observe(passportId, { childList: true, characterData: true, subtree: true });

  function semanticNodes() { return Array.prototype.slice.call(document.querySelectorAll('svg [data-node-id]')); }
  function semanticEdges() { return Array.prototype.slice.call(document.querySelectorAll('svg [data-edge-id]')); }

  function clearMarks() {
    semanticNodes().concat(semanticEdges()).forEach(function (node) {
      ['data-cleanup-muted', 'data-cleanup-absent', 'data-cleanup-primary', 'data-cleanup-cut'].forEach(function (name) { node.removeAttribute(name); });
    });
  }

  function resetNative() {
    try { if (window.Archify?.routeProbe) window.Archify.routeProbe.clear({ updateUrl: false, restoreFocus: false }); } catch (_) {}
    try { if (window.Archify?.focus) window.Archify.focus.clear({ updateUrl: false, preserveView: true }); } catch (_) {}
  }

  function markFocused(nodeIds, edgeIds) {
    var nodes = new Set(nodeIds || []);
    var edges = new Set(edgeIds || []);
    semanticNodes().forEach(function (node) { if (!nodes.has(node.getAttribute('data-node-id'))) node.setAttribute('data-cleanup-muted', 'true'); });
    semanticEdges().forEach(function (edge) { if (!edges.has(edge.getAttribute('data-edge-id'))) edge.setAttribute('data-cleanup-muted', 'true'); });
  }

  function markCut(finding) {
    var cutNodes = new Set(finding.cut?.nodes || []);
    var cutEdges = new Set(finding.cut?.relationships || []);
    markFocused(Array.from(cutNodes), Array.from(cutEdges));
    semanticNodes().forEach(function (node) { if (cutNodes.has(node.getAttribute('data-node-id'))) node.setAttribute('data-cleanup-cut', 'true'); });
    semanticEdges().forEach(function (edge) { if (cutEdges.has(edge.getAttribute('data-edge-id'))) edge.setAttribute('data-cleanup-cut', 'true'); });
  }

  function applySnapshot(snapshot) {
    var nodes = new Set(snapshot.nodes);
    var edges = new Set(snapshot.relationships);
    semanticNodes().forEach(function (node) { if (!nodes.has(node.getAttribute('data-node-id'))) node.setAttribute('data-cleanup-absent', 'true'); });
    semanticEdges().forEach(function (edge) { if (!edges.has(edge.getAttribute('data-edge-id'))) edge.setAttribute('data-cleanup-absent', 'true'); });
  }

  function routeFor(finding) {
    if (!finding.route || !window.Archify?.routeProbe) return false;
    try {
      window.Archify.routeProbe.begin({ source: finding.route.from, focusNode: false });
      return window.Archify.routeProbe.choose(finding.route.to, { updateUrl: false });
    } catch (_) { return false; }
  }

  function uniqueIds(ids) {
    return Array.from(new Set((ids || []).filter(function (id) { return nodeById.has(id); })));
  }

  function cutNodeIds(finding) {
    var ids = (finding.cut?.nodes || []).slice();
    (finding.cut?.relationships || []).forEach(function (relationshipId) {
      var relationship = relationshipById.get(relationshipId);
      if (relationship) ids.push(relationship.from, relationship.to);
    });
    return uniqueIds(ids);
  }

  function stageNodeIds(finding, stage) {
    if (data.meta.mode === 'change') {
      if (stage === 'before') return uniqueIds(data.change.before.nodes);
      if (stage === 'cut') return cutNodeIds(finding);
      return uniqueIds(data.change.after.nodes);
    }
    if (stage === 'locate') return [finding.primary];
    if (stage === 'cut') return cutNodeIds(finding);
    return uniqueIds(finding.related);
  }

  function frameStage(finding, stage) {
    var ids = stageNodeIds(finding, stage);
    if (!ids.length || !window.Archify?.view?.reveal) return false;
    if (cameraFrame) window.cancelAnimationFrame(cameraFrame);
    cameraFrame = window.requestAnimationFrame(function () {
      cameraFrame = window.requestAnimationFrame(function () {
        cameraFrame = 0;
        window.Archify.view.reveal(ids, {
          includeNeighbors: stage === 'locate',
          maxScale: stage === 'locate' ? 1.4 : 1.35,
          duration: 260,
          reason: 'cleanup-' + stage,
        });
      });
    });
    return true;
  }

  function scheduleStageCamera(finding, stage) {
    if (stage === 'trace' && finding.route) {
      if (cameraFrame) window.cancelAnimationFrame(cameraFrame);
      cameraFrame = window.requestAnimationFrame(function () {
        cameraFrame = window.requestAnimationFrame(function () {
          cameraFrame = 0;
          if (!routeFor(finding)) {
            markFocused(finding.related, []);
            frameStage(finding, stage);
          }
        });
      });
      return;
    }
    frameStage(finding, stage);
  }

  function setEvidenceOpen(open) {
    evidenceDrawer.hidden = !open;
    workspace.dataset.evidenceOpen = String(open);
    evidenceToggle.textContent = open ? copy.hideEvidence : copy.showEvidence;
    evidenceToggle.setAttribute('aria-expanded', String(open));
  }

  function toggleEvidence() {
    setEvidenceOpen(evidenceDrawer.hidden);
    frameStage(currentFinding, currentStage);
  }

  function updateIdentity(finding) {
    title.textContent = finding.title;
    title.title = finding.title;
    findingSummary.textContent = finding.summary;
    findingMeta.replaceChildren();
    findingMeta.appendChild(element('span', '', translatedDisposition(finding.disposition)));
    findingMeta.appendChild(element('span', '', isChinese
      ? copy.confidence + '：' + translatedLevel(finding.confidence)
      : translatedLevel(finding.confidence) + ' ' + copy.confidence));
    if (finding.risk) findingMeta.appendChild(element('span', '', isChinese
      ? copy.risk + '：' + translatedLevel(finding.risk)
      : translatedLevel(finding.risk) + ' ' + copy.risk));
  }

  function updateEvidence(finding, stage) {
    var proofLabel = proofItem.item.querySelector('.cleanup-evidence-label');
    proofLabel.textContent = stage === 'verify' && data.change ? copy.verification : copy.proof;
    proofItem.value.textContent = stage === 'verify' && data.change ? data.change.verification : finding.proof;

    consequenceItem.item.hidden = !finding.consequence;
    consequenceItem.value.textContent = finding.consequence || '';
    var unknowns = finding.unknowns || [];
    unknownItem.item.hidden = unknowns.length === 0;
    unknownItem.value.textContent = unknowns.join(' · ');

    var previousLink = proofItem.item.querySelector('.cleanup-report-link');
    if (previousLink) previousLink.remove();
    if (finding.report_url) {
      var link = element('a', 'cleanup-report-link', copy.report);
      link.href = finding.report_url;
      proofItem.item.appendChild(link);
    }
  }

  function updateButtons() {
    findingStrip.replaceChildren();
    data.findings.forEach(function (finding) {
      var button = element('button', 'cleanup-finding-button', finding.id);
      button.type = 'button';
      button.dataset.disposition = finding.disposition;
      button.title = finding.title;
      button.setAttribute('aria-label', finding.id + ' · ' + finding.title);
      button.setAttribute('aria-pressed', String(finding.id === currentFinding.id));
      button.addEventListener('click', function () { activate(finding.id, stageEntries[0][0], true); });
      findingStrip.appendChild(button);
    });

    stageControls.replaceChildren();
    stageEntries.forEach(function (entry, index) {
      var button = element('button', 'cleanup-stage-button');
      button.type = 'button';
      button.appendChild(element('span', 'cleanup-stage-key', String(index + 1)));
      button.appendChild(document.createTextNode(entry[1]));
      button.setAttribute('aria-pressed', String(entry[0] === currentStage));
      button.addEventListener('click', function () { activate(currentFinding.id, entry[0], true); });
      stageControls.appendChild(button);
    });
    stageCaption.textContent = stageCaptions[currentStage] || '';
  }

  function updateHash() {
    var params = new URLSearchParams();
    params.set('finding', currentFinding.id);
    params.set('stage', currentStage);
    history.replaceState(null, '', '#' + params.toString());
  }

  function activate(findingId, stage, writeHash, preserveNativeFocus) {
    var finding = findingById.get(findingId) || data.findings[0];
    if (!stageEntries.some(function (entry) { return entry[0] === stage; })) stage = stageEntries[0][0];
    currentFinding = finding;
    currentStage = stage;
    panel.dataset.stage = stage;
    clearMarks();
    if (!preserveNativeFocus) resetNative();
    var svg = document.querySelector('svg');
    if (svg) svg.setAttribute('data-cleanup-stage', stage);

    if (data.meta.mode === 'change') {
      if (stage === 'before') applySnapshot(data.change.before);
      else if (stage === 'cut') {
        applySnapshot(data.change.before);
        markCut(finding);
      }
      else applySnapshot(data.change.after);
    } else if (stage === 'locate') {
      markFocused([finding.primary], []);
      var primary = document.querySelector('svg [data-node-id="' + CSS.escape(finding.primary) + '"]');
      if (primary) primary.setAttribute('data-cleanup-primary', 'true');
    } else if (stage === 'trace') {
      if (!finding.route) markFocused(finding.related, []);
    } else if (stage === 'cut') markCut(finding);
    else markFocused(finding.related, []);

    updateIdentity(finding);
    updateEvidence(finding, stage);
    updateButtons();
    setEvidenceOpen(isDecisionStage(stage));
    if (!preserveNativeFocus) scheduleStageCamera(finding, stage);
    if (writeHash) updateHash();
    cleanupInitialized = true;
    window.setTimeout(updatePassportLocus, 0);
  }

  function restoreFromHash() {
    var params = new URLSearchParams(location.hash.replace(/^#/, ''));
    var finding = params.get('finding');
    var stage = params.get('stage');
    var view = params.get('view');
    var findingView = view?.indexOf('finding-') === 0;
    if (!finding && findingView) finding = view.slice('finding-'.length).toUpperCase();
    var ownsHash = Boolean(finding || stage || findingView);
    if (!ownsHash) {
      if (!cleanupInitialized) activate(currentFinding.id, currentStage, false, Boolean(location.hash.replace(/^#/, '').trim()));
      return;
    }
    if (findingById.has(finding)) activate(finding, stage || (findingView ? (data.meta.mode === 'change' ? 'verify' : 'decide') : stageEntries[0][0]), false);
    else activate(currentFinding.id, stage || currentStage, false);
  }

  evidenceToggle.addEventListener('click', toggleEvidence);
  window.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '')) return;
    var index = Number(event.key) - 1;
    if (index >= 0 && index < stageEntries.length) activate(currentFinding.id, stageEntries[index][0], true);
    else if (event.key.toLowerCase() === 'e') {
      event.preventDefault();
      toggleEvidence();
    }
  });
  window.addEventListener('hashchange', function () { window.setTimeout(restoreFromHash, 0); });
  window.CleanupMap = {
    activate: activate,
    toggleEvidence: toggleEvidence,
    current: function () { return { finding: currentFinding.id, stage: currentStage, evidence: !evidenceDrawer.hidden }; },
  };
  restoreFromHash();
  window.requestAnimationFrame(function () {
    document.documentElement.setAttribute('data-cleanup-ready', 'true');
  });
}());

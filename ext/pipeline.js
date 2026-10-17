// Editing pipeline + Creative OS views. Data from state.ext.pipeline (plugins/pipeline.mjs).
// Real: stages, skills, project evidence, app status, call counts. Simulated: the "Simulate an edit" run.
(() => {
  const P = () => S?.ext?.pipeline;
  const raw = (p) => 'raw' + p.split('/').map(encodeURIComponent).join('/');
  const STATUS = { running: 'Running', review: 'Waiting on review', shipped: 'Shipped', idle: 'Idle' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let sel = null;          // { t: 'stage', i } | { t: 'project', id }
  let filter = 'all';
  let showAll = false;
  let sim = null;          // running simulation
  let coSel = null;        // selected app id in Creative OS
  let lastSig = '';

  const stageOf = (p) => P().stages[p.stage];
  const dots = (p) => `<span class="pl-dots" aria-label="Stage ${p.stage + 1} of 7">${P().stages.map((_, i) => `<i class="${i <= p.stage ? 'on' : ''}"></i>`).join('')}</span>`;
  const stat = (p) => `<span class="pl-status ${p.status}"><i></i>${STATUS[p.status]}</span>`;
  const short = (s, n = 22) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  // ---------------- pipeline ----------------
  function conveyor(mini) {
    const d = P(); const n = d.stages.length;
    const links = d.stages.map((_, i) => { const x = ((i + 0.5) / n) * 700; return `<path class="pl-link" data-i="${i}" d="M350 0 C350 46, ${x} 40, ${x} 90" vector-effect="non-scaling-stroke"/>`; }).join('');
    const particles = reduce ? '' : Array.from({ length: mini ? 6 : 10 }, (_, i) => `<span class="pl-particle" style="animation-delay:${(-i * (mini ? 1.1 : 0.72)).toFixed(2)}s"></span>`).join('');
    if (mini) {
      return `<div class="pl-mini"><div class="pl-track mini"><div class="pl-rail"></div>${particles}</div>
        <div class="pl-mini-row">${d.stages.map((s, i) => `<button class="pl-mini-node" data-go="pipeline"><span class="mono">${s.n}</span><b>${esc(s.name)}</b><span class="pl-mini-count">${d.counts[i]}</span></button>`).join('')}</div></div>`;
    }
    return `<section class="section pl-belt">
      <div class="pl-orch-wrap">
        <button class="pl-orch" data-pl-orch><span class="pl-orch-pulse"></span><span class="mono">Manager agent</span><b>${esc(d.orchestrator.name)}</b><span class="pl-orch-sub mono" id="pl-orch-sub">${sim ? 'running a simulated edit' : `routing ${fmt(d.total)} projects`}</span></button>
      </div>
      <svg class="pl-links" viewBox="0 0 700 90" preserveAspectRatio="none" aria-hidden="true">${links}</svg>
      <div class="pl-floor">
        <div class="pl-track"><div class="pl-rail"></div>${particles}<span class="pl-packet" id="pl-packet"></span></div>
        <div class="pl-nodes">${d.stages.map((s, i) => `
          <div class="pl-col">
            <button class="pl-node ${sel?.t === 'stage' && sel.i === i ? 'sel' : ''}" data-pl-stage="${i}" style="--i:${i}">
              <span class="pl-node-top"><span class="mono">${s.n}</span><span class="pl-node-agent mono">${esc(s.agent)}</span></span>
              <b>${esc(s.name)}</b>
              <span class="pl-node-count"><span class="pl-num">${d.counts[i]}</span><span class="mono">projects here</span></span>
              <span class="pl-node-state mono">${s.gate ? 'Review gate' : 'Automatic'}</span>
            </button>
            <div class="pl-packets">${d.projects.filter((p) => p.stage === i).slice(0, 3).map((p) => `<button class="pl-chip ${p.status}" data-pl-proj="${esc(p.id)}" title="${esc(p.id)}"><i></i>${esc(short(p.id, 20))}</button>`).join('')}${d.counts[i] > 3 ? `<button class="pl-chip more" data-pl-filter="stage:${i}">+${d.counts[i] - 3} more</button>` : ''}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>`;
  }

  function stageDetail(i) {
    const d = P(); const s = d.stages[i];
    const here = d.projects.filter((p) => p.stage === i);
    return `<div class="section-head"><h2><span class="mono pl-h-n">${s.n}</span>${esc(s.name)}</h2><span class="mono">${esc(s.agent)}${s.skill ? ` · /${esc(s.skill)}` : ''}</span></div>
      <p class="pl-what">${esc(s.what)}</p>
      <div class="pl-io">
        <div><span class="mono">Takes</span><b>${esc(s.input)}</b></div>
        <div><span class="mono">Hands off</span><b>${esc(s.output)}</b></div>
        <div><span class="mono">Gate</span><b>${esc(s.gate || 'None, runs straight through')}</b></div>
      </div>
      <div class="actions" style="margin-top:14px">${s.file ? `<button class="btn" data-file="${esc(s.file)}" data-kind="doc">Read SKILL.md</button>` : ''}<button class="btn" data-pl-filter="stage:${i}">Show the ${here.length} projects here</button></div>`;
  }

  function projectDetail(id) {
    const d = P(); const p = d.projects.find((x) => x.id === id);
    if (!p) return defaultDetail();
    return `<div class="section-head"><h2>${esc(p.id)}</h2><span class="mono">${esc(p.root)} · ${ago(p.last)}</span></div>
      <div class="pl-proj">
        <div class="pl-player">${p.video ? `<video src="${raw(p.video)}#t=1" ${p.poster ? `poster="${raw(p.poster)}"` : ''} controls preload="metadata" playsinline></video>` : p.poster ? `<img src="${raw(p.poster)}" alt="">` : `<div class="pl-noposter mono">No render yet</div>`}</div>
        <div>
          <div class="pl-proj-meta">${stat(p)}<span class="mono">At ${esc(stageOf(p).name)}</span><span class="mono">${p.renders} render${p.renders === 1 ? '' : 's'}</span></div>
          <ol class="pl-trail">${p.trail.map((t, i) => `<li class="${t.at ? 'done' : i === p.stage + 1 ? 'next' : ''}"><i></i><b>${esc(d.stages[i].name)}</b><span class="mono">${t.at ? (t.proof[0] ? esc(short(t.proof[0].split('/').pop(), 34)) : 'done') : i === p.stage + 1 ? 'next up' : ''}</span></li>`).join('')}</ol>
          <div class="actions" style="margin-top:12px"><button class="btn" data-act="reveal" data-path="${esc(p.dir)}">Open folder</button>${p.video ? `<button class="btn" data-act="open" data-path="${esc(p.video)}">Open render</button>` : ''}</div>
        </div>
      </div>`;
  }

  function defaultDetail() {
    const d = P();
    return `<div class="section-head"><h2>How a recording moves</h2><span class="mono">click any agent or project</span></div>
      <p class="pl-what">${esc(d.orchestrator.what || '')}</p>
      <div class="pl-io">
        <div><span class="mono">Shipped</span><b class="pl-big">${fmt(d.byStatus.shipped || 0)}</b></div>
        <div><span class="mono">Running today</span><b class="pl-big">${fmt(d.byStatus.running || 0)}</b></div>
        <div><span class="mono">Waiting on review</span><b class="pl-big">${fmt(d.byStatus.review || 0)}</b></div>
      </div>`;
  }

  function simPanel() {
    return `<div class="section-head"><h2>Simulated edit</h2><span class="mono"><span id="pl-file">raw-take-0412.mov</span> · <b id="pl-dur">18:42</b></span></div>
      <div class="pl-sim">
        <div class="pl-wave-wrap"><div class="pl-ghost"></div><div class="pl-wave" id="pl-wave"></div><div class="pl-ov" id="pl-ov"></div><div class="pl-sweep" id="pl-sweep"></div></div>
        <div class="pl-render"><i id="pl-render-fill"></i></div>
        <div class="pl-log" id="pl-log"></div>
      </div>`;
  }

  function projectRows() {
    const d = P();
    let list = d.projects;
    let label = 'All';
    if (filter.startsWith('stage:')) { const i = +filter.slice(6); list = list.filter((p) => p.stage === i); label = d.stages[i].name; }
    else if (filter !== 'all') { list = list.filter((p) => p.status === filter); label = STATUS[filter]; }
    const tabs = [['all', 'All', d.total], ['running', 'Running', d.byStatus.running || 0], ['review', 'Review', d.byStatus.review || 0], ['shipped', 'Shipped', d.byStatus.shipped || 0], ['idle', 'Idle', d.byStatus.idle || 0]];
    const shown = showAll ? list : list.slice(0, 14);
    return `<section class="section pl-list"><div class="section-head"><h2>Projects in the pipeline</h2>
      <div class="pl-tabs">${tabs.map(([k, l, c]) => `<button class="${filter === k ? 'on' : ''}" data-pl-filter="${k}">${l} <span class="mono">${c}</span></button>`).join('')}${filter.startsWith('stage:') ? `<button class="on" data-pl-filter="all">${esc(label)} ×</button>` : ''}</div></div>
      ${shown.map((p) => `<button class="row pl-row ${sel?.t === 'project' && sel.id === p.id ? 'sel' : ''}" data-pl-proj="${esc(p.id)}">
        <span class="pl-thumb">${p.poster ? `<img src="${raw(p.poster)}" loading="lazy" alt="">` : p.video ? `<video src="${raw(p.video)}#t=2" preload="metadata" muted playsinline></video>` : '<span class="mono">no render</span>'}</span>
        <span class="pl-row-name"><b>${esc(p.id)}</b><span class="mono muted">${esc(p.root)}</span></span>
        <span>${dots(p)}</span>
        <span class="mono pl-row-stage">${esc(stageOf(p).name)}</span>
        ${stat(p)}
        <span class="when">${ago(p.last)}</span></button>`).join('') || '<div class="empty">Nothing here.</div>'}
      ${list.length > shown.length ? `<button class="pl-more mono" data-pl-all>Show all ${list.length}</button>` : ''}</section>`;
  }

  function viewPipeline() {
    const d = P();
    if (!d) return `<div class="page"><h1>Editing pipeline</h1><p class="lede">Scanning projects…</p></div>`;
    crumbsSafe(['Editing pipeline']);
    return `<div class="page pl-page">
      <div class="eyebrow"><span class="tag">Editing OS</span><span>${esc(d.orchestrator.name)}</span><span>${fmt(d.total)} projects scanned</span></div>
      <h1>The editing pipeline</h1>
      <p class="lede">One manager agent hands every raw recording to six specialists in order: silences, mistakes, a passing agent that checks the cuts, motion graphics, b-roll and render. <b>${fmt(d.byStatus.shipped || 0)} shipped</b>, <b>${fmt(d.byStatus.running || 0)} moving today</b>.</p>
      <div class="actions"><button class="btn primary" data-pl-sim ${sim ? 'disabled' : ''}>${sim ? 'Simulating…' : 'Simulate an edit'}</button>${d.orchestrator.file ? `<button class="btn" data-file="${esc(d.orchestrator.file)}" data-kind="doc">Read the orchestrator</button>` : ''}<button class="btn" data-go="creative">Creative OS</button></div>
      ${window.editStatsHtml?.() || ''}
      ${conveyor(false)}
      <section class="section pl-detail" id="pl-detail">${sim ? simPanel() : sel?.t === 'stage' ? stageDetail(sel.i) : sel?.t === 'project' ? projectDetail(sel.id) : defaultDetail()}</section>
      ${window.latestEditsHtml?.() || ''}
      ${projectRows()}
    </div>`;
  }
  function crumbsSafe(parts) { if (typeof crumbs === 'function') return crumbs(parts); const c = $('#crumbs'); if (c) c.innerHTML = parts.map((p, i) => (i === parts.length - 1 ? `<b>${esc(p)}</b>` : `<span>${esc(p)}</span><span>/</span>`)).join(''); }

  // ---------------- simulation (made up, for the demo) ----------------
  const BARS = 132;
  const alive = () => route.view === 'pipeline' && document.getElementById('pl-wave');
  const wait = (ms) => new Promise((r, j) => setTimeout(() => (alive() ? r() : j(new Error('left'))), reduce ? Math.min(ms, 250) : ms));
  function buildWave() {
    const bars = []; let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const silences = new Set(); for (let k = 0; k < 11; k++) { const at = 4 + Math.floor(rnd() * (BARS - 8)); for (let j = 0; j < 2 + Math.floor(rnd() * 3); j++) silences.add(at + j); }
    const mistakes = new Set(); for (let k = 0; k < 4; k++) { let at = 6 + Math.floor(rnd() * (BARS - 12)); while (silences.has(at)) at++; for (let j = 0; j < 3; j++) if (!silences.has(at + j)) mistakes.add(at + j); }
    for (let i = 0; i < BARS; i++) bars.push({ i, h: silences.has(i) ? 0.06 + rnd() * 0.05 : 0.25 + rnd() * 0.75 * (0.6 + 0.4 * Math.sin(i / 5)), sil: silences.has(i), mis: mistakes.has(i) });
    return bars;
  }
  function layoutWave(bars) { let x = 0; for (const b of bars) { const el = b.el; if (b.gone) continue; el.style.setProperty('--x', x); x++; } }
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  function log(text, kind = '') {
    const l = $('#pl-log'); if (!l) return;
    const d = document.createElement('div'); d.className = 'pl-line ' + kind;
    d.innerHTML = `<span class="mono">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><span>${text}</span>`;
    l.appendChild(d); l.scrollTop = l.scrollHeight;
  }
  function setStage(i) {
    document.querySelectorAll('.pl-node').forEach((n) => { const k = +n.dataset.plStage; n.classList.toggle('on', k === i); n.classList.toggle('done', k < i); });
    document.querySelectorAll('.pl-link').forEach((n) => n.classList.toggle('on', +n.dataset.i === i));
    const pk = $('#pl-packet'); if (pk) { pk.classList.add('show'); pk.style.setProperty('--at', i < 0 ? -0.5 : i); }
    document.querySelectorAll('.pl-node').forEach((n) => { const k = +n.dataset.plStage; const st = n.querySelector('.pl-node-state'); if (st && k <= i) st.textContent = k === i ? 'Working' : 'Done'; });
  }
  async function simulate() {
    if (sim) return;
    sim = { dur: 1122 };
    sel = null;
    if (route.view !== 'pipeline') go('pipeline'); else renderMain();
    try { await runSim(); } catch { sim = null; }
  }
  async function runSim() {
    const wave = $('#pl-wave'); const ov = $('#pl-ov'); const dur = $('#pl-dur');
    const bars = buildWave();
    wave.innerHTML = bars.map((b) => `<i style="--h:${b.h.toFixed(3)};--x:${b.i}"></i>`).join('');
    [...wave.children].forEach((el, k) => (bars[k].el = el));
    const setDur = (s) => { sim.dur = s; if (dur) dur.textContent = fmtDur(s); };
    $('#pl-detail').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });

    setStage(0); await wait(500);
    log('<b>Manager</b> picked up raw-take-0412.mov and opened video-projects/raw-take-0412');
    wave.classList.add('in'); await wait(900);
    log('<b>Transcriber</b> probed the source: 18:42, 3840x2160, 30 fps');
    await wait(900); log('<b>Transcriber</b> wrote 2,914 words with word-level timestamps');
    await wait(700);

    setStage(1); log('<b>Agent 1</b> scanning gaps between words over 0.6s'); await wait(900);
    bars.filter((b) => b.sil).forEach((b) => b.el.classList.add('sil'));
    log('<b>Agent 1</b> found 47 silences, the longest 4.8s at 06:12'); await wait(1100);
    bars.filter((b) => b.sil).forEach((b) => { b.gone = true; b.el.classList.add('gone'); }); layoutWave(bars);
    setDur(930); log('<b>Agent 1</b> removed 3m12s of dead air, silence EDL and re-timed transcript handed off', 'ok');
    await wait(1000);

    setStage(2); log('<b>Agent 2</b> reading the transcript for stutters, false starts and retakes'); await wait(900);
    bars.filter((b) => b.mis).forEach((b) => b.el.classList.add('mis'));
    log('<b>Agent 2</b> flagged 6 retakes and 11 stutters for review'); await wait(900);
    log('<span class="pl-gate-tag mono">Review gate</span> Aidan approved 6 of 6 retakes and 9 of 11 stutters', 'gate'); await wait(900);
    bars.filter((b) => b.mis).forEach((b) => { b.gone = true; b.el.classList.add('gone'); }); layoutWave(bars);
    setDur(848); log('<b>Agent 2</b> cut 1m22s of mistakes in one ffmpeg encode', 'ok');
    await wait(900);

    setStage(3); log('<b>Passing agent</b> re-transcribed the clean render');
    const sw = $('#pl-sweep');
    for (const [k, name] of [[1, 'silence sweep'], [2, 'cuts sweep'], [3, 'ledger sweep']]) {
      sw.classList.remove('go'); void sw.offsetWidth; sw.classList.add('go');
      await wait(950); log(`<b>Passing agent</b> pass ${k}/3, ${name}: PASS`, 'ok');
    }
    await wait(400);

    setStage(4); log('<b>Agent 3</b> drafting a beat plan from the transcript'); await wait(900);
    const beats = [[6, 'Stat card', 1], [22, 'Lower third', 2], [38, 'Section takeover', 1], [55, 'Label', 2], [70, 'Stat card', 1], [84, 'Lower third', 2]];
    for (const [x, name, tier] of beats) { const b = document.createElement('span'); b.className = 'pl-beat t' + tier; b.style.setProperty('--x', x); b.textContent = name; ov.appendChild(b); await wait(240); }
    log('<b>Agent 3</b> beat plan: 9 beats, 3 tier-1 takeovers, glass lower thirds from the style library');
    await wait(800); log('<span class="pl-gate-tag mono">Gate 1</span> Studio preview approved', 'gate'); await wait(800);

    setStage(5); log('<b>Agent 4</b> found 7 visual moments in the transcript'); await wait(800);
    for (const [x, name] of [[14, 'Screenshot'], [31, 'Logo'], [47, 'Stock clip'], [63, 'Screenshot'], [78, 'Photo']]) { const b = document.createElement('span'); b.className = 'pl-beat br'; b.style.setProperty('--x', x); b.textContent = name; ov.appendChild(b); await wait(220); }
    log('<b>Agent 4</b> sourced 7 cutaways, all licensed, cached back to asset-library', 'ok'); await wait(900);

    setStage(6); log('<b>Render</b> drafting at 1080p');
    const fill = $('#pl-render-fill'); if (fill) fill.classList.add('go');
    await wait(1600); log('<b>Render</b> pulled 9 hero frames, nothing clipped, no faces covered'); await wait(800);
    log('<span class="pl-gate-tag mono">Gate 2</span> draft approved, renders/final.mp4 written', 'gate'); await wait(600);
    document.querySelectorAll('.pl-node').forEach((n) => { n.classList.remove('on'); n.classList.add('done'); const st = n.querySelector('.pl-node-state'); if (st) st.textContent = 'Done'; });
    document.querySelectorAll('.pl-link').forEach((n) => n.classList.remove('on'));
    log(`<b>Done.</b> 18:42 in, ${fmtDur(sim.dur)} out, 4m34s cut by six agents`, 'ok done');
    const pk = $('#pl-packet'); if (pk) pk.classList.add('arrived');
    toast('Simulated edit finished: 18:42 down to 14:08');
    sim = null;
    const btn = document.querySelector('[data-pl-sim]'); if (btn) { btn.disabled = false; btn.textContent = 'Run it again'; }
    const sub = $('#pl-orch-sub'); if (sub) sub.textContent = `routing ${fmt(P().total)} projects`;
  }

  // ---------------- creative OS ----------------
  const appStatus = (a) => (a.running ? ['s-live', 'Open now'] : a.last && Date.now() - a.last < 6 * 3600e3 ? ['s-recent', `Used ${ago(a.last)}`] : a.cloud ? ['s-cloud', 'Cloud bridge'] : ['s-off', 'Not open']);
  // how the tools hand work to each other (from the recipes and the skills that bridge them)
  const LINKS = [
    ['blender', 'higgsfield', 'grey previs becomes a Seedance shot'],
    ['tk:Seedance', 'higgsfield', 'runs inside Higgsfield'],
    ['tk:Kling', 'higgsfield', 'runs inside Higgsfield'],
    ['tk:GPT Image 2', 'higgsfield', 'runs inside Higgsfield'],
    ['figma', 'aftereffects', 'frames rebuilt as native AE layers'],
    ['tk:HyperFrames', 'aftereffects', 'compositions export to AE comps'],
    ['tk:Lottie', 'aftereffects', 'AE animation exported as Lottie JSON'],
    ['tk:Cinema 4D', 'aftereffects', '3D renders composited in AE'],
    ['aftereffects', 'premiere', 'motion comps dropped on the timeline'],
    ['tk:Descript', 'premiere', 'transcript-based rough cut to Premiere'],
    ['tk:Whisper', 'tk:Descript', 'transcripts with word timestamps'],
    ['tk:Whisper', 'tk:HyperFrames', 'word timing drives the motion beats'],
    ['tk:Artlist', 'premiere', 'music and effects on the timeline'],
    ['tk:ElevenLabs', 'premiere', 'voice pickups placed and leveled'],
    ['tk:Runway', 'premiere', 'generated b-roll cut in'],
    ['tk:Veo', 'premiere', 'generated shots cut in'],
    ['premiere', 'tk:Frame.io', 'renders uploaded for review'],
    ['blender', 'comfy', 'renders pushed toward photoreal'],
    ['tk:Unreal Engine', 'blender', 'scenes and assets move between engines'],
    ['tk:Nano Banana', 'photoshop', 'generated images composited'],
    ['tk:Midjourney', 'photoshop', 'concept art finished in Photoshop'],
    ['higgsfield', 'photoshop', 'headshots composited into thumbnails'],
    ['tk:Nano Banana', 'tk:Canva', 'images into social and slide layouts'],
    ['figma', 'tk:Canva', 'brand assets shared to Canva'],
    ['tk:Seedance', 'tk:Remotion', 'shots assembled into an ad in code'],
    ['tk:Suno', 'tk:Remotion', 'score laid under the spot'],
    ['tk:GSAP', 'tk:HyperFrames', 'animation engine inside compositions'],
    ['tk:GSAP', 'tk:Remotion', 'timing and easing in code'],
  ];
  const linksOf = (id) => LINKS.filter(([a, b]) => a === id || b === id);
  const TK_BRIDGED = { 'Premiere Pro': 1, 'After Effects': 1, Blender: 1, ComfyUI: 1, 'Higgsfield Soul ID': 1, Figma: 1, Photoshop: 1 };
  const outerTools = () => (S.ext?.creativetools?.groups || []).flatMap((g) => g.tools.filter((t) => !TK_BRIDGED[t.name]).map((t) => ({ ...t, group: g.name })));
  function hub() {
    const apps = P().apps; const W = 1160, H = 780, cx = 580, cy = 390, rx = 290, ry = 180, orx = 470, ory = 318;
    const pos = apps.map((a, i) => { const t = -Math.PI / 2 + (i / apps.length) * Math.PI * 2; return { a, x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) }; });
    // outer ring: every other creative tool, clustered by craft with a gap between crafts
    const outer = outerTools(); const groups = [...new Set(outer.map((t) => t.group))];
    const slots = outer.length + groups.length; let slot = 0, last = null;
    const opos = outer.map((t) => { if (t.group !== last) { slot++; last = t.group; } const ang = -Math.PI / 2 + ((slot++ + 0.5) / slots) * Math.PI * 2; return { t, ang, x: cx + orx * Math.cos(ang), y: cy + ory * Math.sin(ang) }; });
    const glabels = groups.map((g) => { const ps = opos.filter((o) => o.t.group === g); const ang = ps.reduce((n, o) => n + o.ang, 0) / ps.length; const x = Math.min(W - 70, Math.max(70, cx + (orx + 78) * Math.cos(ang))), y = Math.min(H - 8, Math.max(14, cy + (ory + 54) * Math.sin(ang) + (Math.sin(ang) > 0 ? 6 : 0))); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="co-craft">${esc(g.toUpperCase())}</text>`; }).join('');
    const ospokes = opos.map(({ t, x, y }, i) => { const d = `M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)}`; return `<path class="co-ospoke ${coSel === 'tk:' + t.name ? 'sel' : ''}" d="${d}" style="--c:${t.color}"/>${reduce || i % 2 ? '' : `<circle r="2.4" class="co-pulse" style="--c:${t.color}"><animateMotion dur="${(3.2 + (i % 5) * 0.5).toFixed(2)}s" begin="-${((i * 0.53) % 4).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>`}`; }).join('');
    const onodes = opos.map(({ t, x, y }) => `<g class="co-tk ${coSel === 'tk:' + t.name ? 'sel' : ''}" data-co-app="tk:${esc(t.name)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(t.name)}">
        <rect x="-19" y="-19" width="38" height="38" rx="11" fill="${t.color}" class="co-tk-tile"/><text y="5" text-anchor="middle" class="co-tk-s">${esc(t.short)}</text>
        <text y="34" text-anchor="middle" class="co-tk-n">${esc(t.name)}</text></g>`).join('');
    const spokes = pos.map(({ a, x, y }, i) => {
      const [st] = appStatus(a); const mx = (cx + x) / 2 + (y - cy) * 0.12, my = (cy + y) / 2 - (x - cx) * 0.12;
      const d = `M${cx} ${cy} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      const back = `M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${cx} ${cy}`;
      const dur = st === 's-live' ? 2.4 : st === 's-recent' ? 3.4 : 4.6;
      const pulses = reduce || st === 's-off' ? '' : [0, 1, 2].map((k) => `<circle r="3.6" class="co-pulse ${st}" style="--c:${a.color}"><animateMotion dur="${dur}s" begin="${(-k * dur / 3 - i * 0.37).toFixed(2)}s" repeatCount="indefinite" path="${k === 1 ? back : d}"/></circle>`).join('');
      return `<path class="co-spoke ${st} ${coSel === a.id ? 'sel' : ''}" d="${d}" style="--c:${a.color}"/>${pulses}`;
    }).join('');
    const nodes = pos.map(({ a, x, y }) => {
      const [st, label] = appStatus(a);
      return `<g class="co-node ${st} ${coSel === a.id ? 'sel' : ''}" data-co-app="${a.id}" transform="translate(${(x - 100).toFixed(1)} ${(y - 32).toFixed(1)})" tabindex="0" role="button" aria-label="${esc(a.name)}">
        <rect class="co-card" width="200" height="64" rx="16"/>
        <rect x="11" y="12" width="40" height="40" rx="11" fill="${a.color}"/>
        <text x="31" y="37" class="co-short" text-anchor="middle">${esc(a.short)}</text>
        <text x="62" y="29" class="co-name">${esc(a.name)}</text>
        <circle cx="66" cy="45" r="3.6" class="co-dot ${st}"/>
        <text x="75" y="49" class="co-sub">${esc(label)}${a.calls ? ` · ${fmt(a.calls)}` : ''}</text>
      </g>`;
    }).join('');
    const at = {}; pos.forEach(({ a, x, y }) => (at[a.id] = { x, y, c: a.color })); opos.forEach(({ t, x, y }) => (at['tk:' + t.name] = { x, y, c: t.color }));
    const tlinks = LINKS.filter(([a, b]) => at[a] && at[b]).map(([a, b, why], i) => {
      const A = at[a], B = at[b]; const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; const qx = mx + (cx - mx) * 0.35, qy = my + (cy - my) * 0.35;
      const d = `M${A.x.toFixed(1)} ${A.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}`;
      const on = coSel === a || coSel === b;
      return `<g class="co-link ${on ? 'on' : ''}" data-a="${esc(a)}" data-b="${esc(b)}"><path d="${d}" style="--c:${A.c}"><title>${esc(why)}</title></path>${reduce ? '' : `<circle r="2.6" style="--c:${A.c}"><animateMotion dur="${(2.6 + (i % 4) * 0.45).toFixed(2)}s" begin="-${((i * 0.47) % 3).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>`}</g>`;
    }).join('');
    return `<svg class="co-hub ${coSel ? 'has-sel' : ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <ellipse cx="${cx}" cy="${cy}" rx="${orx}" ry="${ory}" class="co-orbit"/>
      ${ospokes}${spokes}<g class="co-links">${tlinks}</g>
      <g class="co-core" transform="translate(${cx} ${cy})">
        ${reduce ? '' : '<circle r="78" class="co-ring"/><circle r="78" class="co-ring r2"/>'}
        <circle r="68" class="co-core-disc"/>
        <text y="-4" text-anchor="middle" class="co-core-t">Claude</text>
        <text y="18" text-anchor="middle" class="co-core-s">${apps.filter((a) => a.configured).length + outer.length} tools</text>
      </g>
      ${nodes}${onodes}${glabels}
    </svg>`;
  }
  // light up a tool and everything it works with
  function coFocus(id, sticky) {
    const svg = document.querySelector('svg.co-hub'); if (!svg) return;
    const partners = new Set(id ? [id, ...linksOf(id).map(([a, b]) => (a === id ? b : a))] : []);
    svg.classList.toggle('focus', !!id);
    svg.querySelectorAll('.co-link').forEach((g) => g.classList.toggle('on', !!id && (g.dataset.a === id || g.dataset.b === id)));
    svg.querySelectorAll('.co-node, .co-tk').forEach((n) => n.classList.toggle('lit', partners.has(n.dataset.coApp)));
    if (sticky) svg.dataset.sel = id || '';
  }
  document.addEventListener('pointerover', (e) => {
    const svg = e.target.closest?.('svg.co-hub'); if (!svg) return;
    const n = e.target.closest('[data-co-app]');
    coFocus(n ? n.dataset.coApp : svg.dataset.sel || null);
  });
  function worksWith(id) {
    const ls = linksOf(id); if (!ls.length) return '';
    const nm = (x) => (x.startsWith('tk:') ? x.slice(3) : (P().apps.find((a) => a.id === x)?.name || x));
    return `<div class="co-sub-h mono">Works with</div><div class="co-with">${ls.map(([a, b, why]) => { const other = a === id ? b : a; return `<button class="co-with-row" data-co-app="${esc(other)}"><span class="mono">${a === id ? 'to' : 'from'}</span><b>${esc(nm(other))}</b><span>${esc(why)}</span></button>`; }).join('')}</div>`;
  }
  function appDetail(id) {
    if (id && id.startsWith('tk:')) {
      const t = outerTools().find((x) => x.name === id.slice(3));
      if (t) {
        const uses = RECIPES.filter((r) => r.steps.includes(id));
        return `<div class="co-d-head"><span class="co-tile" style="background:${t.color}">${esc(t.short)}</span><div><b>${esc(t.name)}</b><span class="co-d-st s-cloud"><i></i>${esc(t.group)} · ${esc(t.how)}${t.installed ? ' · installed' : ''}</span></div></div>
          <div class="co-nums"><div><b>${t.files ? fmt(t.files) : '–'}</b><span class="mono">files use it</span></div><div><b>${esc(t.how)}</b><span class="mono">how Claude reaches it</span></div><div><b>${uses.length}</b><span class="mono">recipes</span></div></div>
          ${worksWith(id)}
          ${uses.length ? `<div class="co-sub-h mono">Part of</div><ul class="co-ex">${uses.map((r) => `<li>${esc(r.title)}: ${esc(r.what)}</li>`).join('')}</ul>` : `<p class="pl-what">Used across Aidan's skills and projects. Claude reaches it ${t.how === 'Web' ? 'through the browser' : t.how === 'Local' ? 'on this Mac' : 'through its ' + t.how}.</p>`}`;
      }
    }
    const a = P().apps.find((x) => x.id === id) || P().apps.find((x) => x.running) || P().apps[0];
    const [st, label] = appStatus(a);
    return `<div class="co-d-head"><span class="co-tile" style="background:${a.color}">${esc(a.short)}</span><div><b>${esc(a.name)}</b><span class="co-d-st ${st}"><i></i>${esc(label)} · ${esc(a.bridge)}</span></div></div>
      <p class="pl-what">${esc(a.how)}</p>
      <div class="co-nums"><div><b>${fmt(a.calls)}</b><span class="mono">tool calls</span></div><div><b>${fmt(a.sessions)}</b><span class="mono">sessions</span></div><div><b>${a.last ? ago(a.last) : 'never'}</b><span class="mono">last used</span></div></div>
      ${a.tools.length ? `<div class="co-sub-h mono">Most used</div><div class="co-tools">${a.tools.map(([t, n]) => `<span><span class="mono">${esc(t)}</span><b>${fmt(n)}</b></span>`).join('')}</div>` : ''}
      ${worksWith(a.id)}
      <div class="co-sub-h mono">Made with it</div><ul class="co-ex">${a.examples.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
      ${a.mcp.length || a.skills.length ? `<div class="co-sub-h mono">Wired through</div><div class="co-wire">${a.mcp.map((m) => `<span class="mono">mcp ${esc(m)}</span>`).join('')}${a.skills.map((s) => `<span class="mono">/${esc(s)}</span>`).join('')}</div>` : ''}`;
  }

  // ---------------- recipes: apps working together ----------------
  const CLAUDE = { short: 'C', name: 'Claude', color: '#0b1a30' };
  const PIPE = { short: 'OS', name: 'Editing OS', color: '#0a72b5' };
  const RECIPES = [
    { title: 'Previs to final shot', steps: ['claude', 'blender', 'higgsfield'], what: 'Claude blocks the camera move in Blender, renders a grey previs, and Seedance on Higgsfield turns it into the finished shot with the same framing.', skills: ['blender-to-seedance', 'previz-to-seedance'], example: 'GPT-6 Astra Blender series' },
    { title: 'Storyboard to motion', steps: ['figma', 'claude', 'aftereffects'], what: 'Frames come out of Figma as geometry, Claude rebuilds them as native shape and text layers in After Effects, every element ready to animate.', skills: ['figma-to-after-effects'], example: 'Figma to AE project, Aug' },
    { title: 'Raw take to finished edit', steps: ['claude', 'pipe', 'higgsfield', 'premiere'], what: 'The editing agents cut silences and mistakes, add motion graphics and generated b-roll, then hand a clean timeline to Premiere for the final pass.', skills: ['cut-silences', 'cut-mistakes', 'broll-generator'], example: 'CAIC booth offer' },
    { title: 'Kinetic type', steps: ['claude', 'aftereffects'], what: 'Claude writes a motion score as JSON, beat by beat, and drives After Effects through the AppleScript bridge to build the typography.', skills: ['kinetic-type'], example: 'motion score JSON' },
    { title: 'Code motion into AE', steps: ['claude', 'pipe', 'aftereffects'], what: 'Compositions built in HyperFrames export into After Effects comps, so code-first animation still lands in the editor\'s tool.', skills: ['hyperframes-to-ae', 'motion-graphics'], example: 'HyperFrames comps' },
    { title: 'Photoreal scene', steps: ['claude', 'blender', 'comfy'], what: 'Reference photos become a procedural Blender scene, then a ComfyUI realism pass pushes the render toward a photograph.', skills: ['photoreal-scene-recreation', 'nature-realism-setup'], example: 'Gothic cathedral, Rouen nave' },
    { title: 'Storyboard to video', steps: ['claude', 'higgsfield', 'premiere'], what: 'A written storyboard becomes shot prompts, Higgsfield generates each shot, and the cuts are laid onto a Premiere timeline in order.', skills: ['storyboard-to-video', 'higgsfield-generate'], example: 'ad spots' },
    { title: 'Sound bed and voice', steps: ['claude', 'tk:Artlist', 'tk:ElevenLabs', 'premiere'], what: 'Claude picks music and effects from Artlist to match the cut, ElevenLabs fills in voice lines, and everything lands on the Premiere timeline already leveled.', skills: ['motion-design', 'video-use'], example: 'AIS Live sizzles' },
    { title: 'AI ad spot', steps: ['claude', 'tk:Seedance', 'tk:Suno', 'tk:Remotion'], what: 'Seedance generates the shots from a storyboard, Suno writes a short score, and Remotion assembles the spot with type and timing in code.', skills: ['ad-spot-previs-seedance', 'ad-creator'], example: 'ad concepts' },
    { title: 'Thumbnail in three takes', steps: ['claude', 'higgsfield', 'photoshop'], what: 'Higgsfield generates the headshot and scene, Claude composites the title in Photoshop, and three distinct comps come back to pick from.', skills: ['youtube-thumbnail', 'headshot-bg-composite', 'photoshop-bridge'], example: 'AI Aidan uploads' },
  ];
  function recipesHtml() {
    const d = P(); if (!d) return '';
    const tk = (n) => (S.ext?.creativetools?.groups || []).flatMap((g) => g.tools).find((t) => t.name === n);
    const app = (id) => (id === 'claude' ? CLAUDE : id === 'pipe' ? PIPE : d.apps.find((a) => a.id === id) || tk(id.replace(/^tk:/, '')) || { short: '?', name: id, color: '#64748b' });
    return `<section class="section co-recipes"><div class="section-head"><h2>How they work together</h2><span class="mono">${RECIPES.length} recipes, each one a skill you can run</span></div>
      <div class="co-rec-grid">${RECIPES.map((r) => `<div class="co-rec">
        <div class="co-chain">${r.steps.map((id, i) => { const a = app(id); return `${i ? '<span class="co-arrow"><i></i></span>' : ''}<span class="co-step" title="${esc(a.name)}"><span class="co-tile sm" style="background:${a.color}">${esc(a.short)}</span><span class="co-step-n">${esc(a.name)}</span></span>`; }).join('')}</div>
        <h3>${esc(r.title)}</h3><p>${esc(r.what)}</p>
        <div class="co-rec-foot"><span class="co-skills">${r.skills.map((k) => `<span class="mono">/${esc(k)}</span>`).join('')}</span><span class="co-ex-tag mono">${esc(r.example)}</span></div>
      </div>`).join('')}</div></section>`;
  }

  function viewCreative() {
    const d = P();
    if (!d) return `<div class="page"><h1>Creative OS</h1><p class="lede">Checking your apps…</p></div>`;
    crumbsSafe(['Creative OS']);
    const live = d.apps.filter((a) => a.running);
    const total = d.apps.reduce((n, a) => n + a.calls, 0);
    return `<div class="page co-page">
      <div class="eyebrow"><span class="tag">Creative OS</span><span>${live.length ? `${live.map((a) => a.name).join(', ')} open now` : 'No creative apps open'}</span><span>${fmt(total)} tool calls</span></div>
      <h1>Claude in the creative apps</h1>
      <p class="lede">Every creative tool Claude reaches, from Premiere and Blender to HyperFrames, Remotion, Artlist, Seedance and ElevenLabs. The inner ring is live app bridges with <b>${fmt(total)}</b> calls so far; the outer ring is the rest of the toolkit, grouped by craft. Click any tool.</p>
      <div class="co-grid">
        <section class="section co-canvas">${hub()}</section>
        <section class="section co-detail" id="co-detail">${appDetail(coSel)}</section>
      </div>
      ${window.toolkitHtml?.() || ''}
      ${recipesHtml()}
      <section class="section"><div class="section-head"><h2>Bridges</h2><span class="mono">live status checked every 30s</span></div>
        ${d.apps.slice().sort((a, b) => b.calls - a.calls).map((a) => { const [st, label] = appStatus(a); return `<button class="row co-row" data-co-app="${a.id}"><span class="co-tile sm" style="background:${a.color}">${esc(a.short)}</span><b>${esc(a.name)}</b><span class="mono muted">${esc(a.bridge)}</span><span class="co-d-st ${st}"><i></i>${label}</span><span class="num">${fmt(a.calls)} calls</span><span class="when">${a.last ? ago(a.last) : 'never'}</span></button>`; }).join('')}
      </section>
    </div>`;
  }

  // ---------------- compact space block ----------------
  EXT.spaceExtras.push((s) => {
    if (!P() || (s.id !== 'editing-pipeline' && s.id !== 'video-automation')) return '';
    const d = P(); const live = d.apps.filter((a) => a.running);
    return `<div class="section pl-space"><div class="section-head"><h2>Editing pipeline</h2><button class="mono" data-go="pipeline" style="color:var(--blue-ink)">Open the pipeline</button></div>
      ${conveyor(true)}
      <div class="pl-space-foot"><span class="mono">${fmt(d.byStatus.shipped || 0)} shipped · ${fmt(d.byStatus.running || 0)} running today · ${fmt(d.total)} projects</span>
      <button class="mono" data-go="creative" style="color:var(--blue-ink)">Creative OS${live.length ? `: ${live.map((a) => a.name).join(', ')} open` : ''}</button></div></div>`;
  });

  // ---------------- registration ----------------
  const sig = () => { const d = P(); return d ? JSON.stringify([d.counts, d.byStatus, d.apps.map((a) => [a.running, a.calls])]) : ''; };
  EXT.views.pipeline = {
    label: 'Pipeline', wide: true,
    count: () => P()?.byStatus?.running || P()?.total || '',
    render: viewPipeline,
    after: () => { lastSig = sig(); },
    refresh: () => { if (!sim && sig() !== lastSig) renderMain(); },
  };
  EXT.views.creative = {
    label: 'Creative OS', wide: true,
    count: () => P()?.apps?.filter((a) => a.running).length || '',
    render: viewCreative,
    after: () => { lastSig = sig(); if (coSel) coFocus(coSel, true); },
    refresh: () => { if (sig() !== lastSig) renderMain(); },
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pl-stage],[data-pl-proj],[data-pl-sim],[data-pl-filter],[data-pl-all],[data-pl-orch],[data-co-app]');
    if (!t) return;
    if (t.hasAttribute('data-pl-sim')) return simulate();
    if (t.dataset.coApp) { coSel = t.dataset.coApp; if (route.view !== 'creative') return go('creative'); document.querySelectorAll('.co-node, .co-tk').forEach((n) => n.classList.toggle('sel', n.dataset.coApp === coSel)); coFocus(coSel, true); document.querySelectorAll('.co-spoke').forEach((n, i) => n.classList.toggle('sel', P().apps[i]?.id === coSel)); $('#co-detail').innerHTML = appDetail(coSel); return; }
    if (sim) return toast('Let the simulated edit finish first');
    if (t.dataset.plStage !== undefined) sel = sel?.t === 'stage' && sel.i === +t.dataset.plStage ? null : { t: 'stage', i: +t.dataset.plStage };
    else if (t.dataset.plProj) sel = { t: 'project', id: t.dataset.plProj };
    else if (t.hasAttribute('data-pl-orch')) sel = null;
    else if (t.dataset.plFilter) { filter = t.dataset.plFilter; showAll = false; }
    else if (t.hasAttribute('data-pl-all')) showAll = true;
    if (route.view !== 'pipeline') return go('pipeline');
    renderMain();
    if (t.dataset.plProj || t.dataset.plStage !== undefined) $('#pl-detail')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.co-node')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
})();

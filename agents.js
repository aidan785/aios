// Agents: the live agent network, research pipelines, the Humanly Possible lineage, ClickUp crew and Ask AIOS.
const rawUrl = (p) => 'raw' + p.split('/').map(encodeURIComponent).join('/');
const hhmm = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
let streamSeen = new Set();

// ---------- agent network ----------
function networkSvg() {
  const A = S.agents; if (!A?.roster) return '<div class="empty">Reading agent logs</div>';
  const R0 = A.roster;
  const mgrs = R0.managers.slice(0, 7);
  const roles = R0.roles.slice(0, 9);
  const conns = [...A.connectors.slice(0, 7), { label: 'Files + terminal', color: '#64748b', calls: 0 }];
  const W = 1100, rowH = 58;
  const H = Math.max(mgrs.length, roles.length, conns.length) * rowH + 70;
  const col = (list, x) => list.map((n, i) => ({ ...n, x, y: 60 + i * rowH + (H - 70 - list.length * rowH) / 2 }));
  const L = col(mgrs, 340), M = col(roles, 610), C = col(conns, 880);
  const edges = [];
  const curve = (a, b) => `M${a.x},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`;
  for (const m of L) for (const [role, n] of Object.entries(m.roles)) { const r = M.find((x) => x.role === role); if (r) edges.push({ a: m, b: r, kind: 'spawn', w: Math.min(6, 1.2 + Math.log2(n)), key: m.id + ' ' + role, n, what: `spawned ${n} ${role.toLowerCase()}` }); }
  for (const r of M) {
    for (const [c, n] of Object.entries(r.connectors || {})) { const t = C.find((x) => x.label === c); if (t) edges.push({ a: r, b: t, kind: 'use', w: Math.min(5, 1 + Math.log2(n) / 1.5), key: r.role + ' ' + c, n, what: `${n} calls` }); }
    edges.push({ a: r, b: C[C.length - 1], kind: 'use files', w: 1.2, key: r.role + ' Files + terminal', what: 'reads and writes files' });
  }
  const paths = edges.map((e, i) => {
    const d = curve(e.a, e.b);
    const pulse = e.kind === 'spawn' || i % 3 === 0 ? `<circle r="${e.kind === 'spawn' ? 3.2 : 2.6}" class="pulse-dot"><animateMotion dur="${(2.4 + (i % 5) * 0.45).toFixed(2)}s" begin="-${((i % 9) * 0.37 + 0.1).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>` : '';
    return `<g class="ng" data-k="${esc(e.key)}"><path class="nedge ${e.kind}" d="${d}" style="stroke-width:${e.w.toFixed(1)}"><title>${esc(e.what)}</title></path>${pulse}</g>`;
  }).join('');
  const clip = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);
  const left = L.map((m) => `<g class="nn" data-k="${m.id}"><rect x="${m.x - 8}" y="${m.y - 8}" width="16" height="16" rx="5" fill="var(--ink)"/><text x="${m.x - 20}" y="${m.y - 2}" text-anchor="end" class="nlabel sm">${esc(clip(m.title || crewName(m), 32))}</text><text x="${m.x - 20}" y="${m.y + 13}" text-anchor="end" class="nmeta">${m.total} subagents · ${ago(m.last)}</text></g>`).join('');
  const max = Math.max(...M.map((r) => r.count));
  const mid = M.map((r) => { const rad = 7 + 9 * Math.sqrt(r.count / max); return `<g class="nn role" data-k="${esc(r.role)}"><circle cx="${r.x}" cy="${r.y}" r="${rad + 5}" fill="${r.color}" opacity=".14"/><circle cx="${r.x}" cy="${r.y}" r="${rad}" fill="${r.color}"/><text x="${r.x + rad + 12}" y="${r.y - 2}" class="nlabel sm">${esc(r.role)} <tspan class="nnum">${fmt(r.count)}</tspan></text><text x="${r.x + rad + 12}" y="${r.y + 13}" class="nmeta">${esc(clip(r.examples[0] || '', 30))}</text></g>`; }).join('');
  const right = C.map((c) => `<g class="nn" data-k="${esc(c.label)}"><circle cx="${c.x}" cy="${c.y}" r="9" fill="${c.color}"/><text x="${c.x + 18}" y="${c.y - 2}" class="nlabel sm">${esc(c.label)}</text><text x="${c.x + 18}" y="${c.y + 13}" class="nmeta">${c.calls ? fmt(c.calls) + (c.calls === 1 ? ' call' : ' calls') + ' this week' : 'Read, Write, Edit, Bash'}</text></g>`).join('');
  const heads = `<text x="340" y="24" text-anchor="end" class="glabel">MANAGER AGENTS</text><text x="610" y="24" text-anchor="middle" class="glabel">SUBAGENTS BY ROLE</text><text x="880" y="24" class="glabel">CONNECTORS</text>`;
  return `<svg class="network" viewBox="0 0 ${W} ${H}" role="img" aria-label="Manager agents, the subagents they spawn by role, and the tools those subagents use">${heads}${paths}${left}${mid}${right}</svg>`;
}

function crewName(m) {
  const top = Object.entries(m.roles).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Agent';
  return `${top.replace(/s$/, '')} crew lead`;
}
// Every subagent ever spawned, grouped by role
function rosterHtml() {
  const R0 = S.agents?.roster; if (!R0) return '';
  const max = Math.max(...R0.roles.map((r) => r.count));
  return `<div class="roster">${R0.roles.map((r) => `<div class="roster-row" style="--rc:${r.color}">
    <span class="rr-name"><span class="sw" style="background:${r.color}"></span>${esc(r.role)}</span>
    <span class="rr-bar"><i style="transform:scaleX(${(r.count / max).toFixed(3)})"></i></span>
    <span class="rr-num mono">${fmt(r.count)}${r.week ? ` <span class="muted">· ${r.week} this week</span>` : ''}</span>
    <span class="rr-ex">${r.examples.slice(0, 3).map((x) => `<span>${esc(x)}</span>`).join('')}</span>
  </div>`).join('')}</div>`;
}
document.addEventListener('pointerover', (e) => {
  const svg = document.querySelector('svg.network'); if (!svg) return;
  const n = e.target.closest?.('svg.network .nn');
  const k = n?.dataset.k;
  svg.classList.toggle('focus', !!k);
  svg.querySelectorAll('.ng').forEach((g) => g.classList.toggle('on', !!k && g.dataset.k.split(' ').includes(k)));
  const on = new Set(k ? [k] : []);
  if (k) svg.querySelectorAll('.ng.on').forEach((g) => g.dataset.k.split(' ').forEach((x) => on.add(x)));
  svg.querySelectorAll('.nn').forEach((x) => x.classList.toggle('lit', on.has(x.dataset.k)));
});

// ---------- live stream ----------
function streamHtml(limit = 16) {
  const A = S.agents; if (!A) return '';
  return A.stream.slice(0, limit).map((e) => {
    const key = e.t + e.tool + e.detail;
    const fresh = streamSeen.size && !streamSeen.has(key);
    return `<div class="tick ${fresh ? 'new' : ''}"><span class="mono muted">${hhmm(e.t)}</span><span class="tick-body"><span class="chip" style="${e.color ? `--cc:${e.color}` : ''}">${esc(e.tool)}</span>${e.detail ? `<span class="tick-detail">${esc(e.detail)}</span>` : ''}<span class="tick-agent">${e.sub ? '<b>subagent</b> ' : ''}${esc((e.agent || e.project).slice(0, 40))}</span></span></div>`;
  }).join('') || '<div class="empty">No agent activity in the last 6 hours.</div>';
}
function rememberStream() { for (const e of S.agents?.stream || []) streamSeen.add(e.t + e.tool + e.detail); }

// ---------- research ----------
function researchRow(r) {
  const sp = space(r.feeds);
  const strip = r.samples.length ? `<div class="filmstrip"><div class="film-track">${[...r.samples, ...r.samples].map((p) => `<img src="${rawUrl(p)}" alt="" loading="lazy">`).join('')}</div></div>` : '';
  return `<button class="research" data-run="${r.id}">
    <div class="research-head">
      <div><b>${esc(r.name)}</b><p>${esc(r.what || '')}</p></div>
      <span class="feeds">feeds <span class="sw" style="background:${sp?.color || '#999'}"></span>${esc(sp?.name || r.feeds)}</span>
    </div>
    <div class="stages">${r.stages.map(([l, n], i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="stage"><b data-count="${n}">${fmt(n)}</b><span>${esc(l)}</span></span>`).join('')}<span class="arrow">→</span><span class="stage out"><b>${esc(r.output || 'Output')}</b><span>result</span></span></div>
    ${strip}
  </button>`;
}
function openResearch(id) {
  const r = (S.research || []).find((x) => x.id === id); if (!r) return;
  openPanel({ kind: 'RESEARCH AGENT', name: r.name, sub: r.dir.replace(/^\/Users\/[^/]+/, '~'), path: r.dir, html: `<div class="md">
    <p class="lede" style="font-size:16px">${esc(r.what || '')}</p>
    <div class="stages" style="margin:18px 0">${r.stages.map(([l, n], i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="stage"><b>${fmt(n)}</b><span>${esc(l)}</span></span>`).join('')}</div>
    ${r.findings.length ? `<h2>What the agents found</h2><ol class="findings">${r.findings.map((f) => `<li><b>${esc(f.title || '')}</b>${f.body ? `<p>${esc(f.body.slice(0, 320))}${f.body.length > 320 ? '…' : ''}</p>` : ''}</li>`).join('')}</ol>` : ''}
    ${r.shows.length ? `<h2>Shows studied</h2><div class="showchips">${r.shows.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
    ${r.samples.length ? `<h2>Evidence</h2><div class="mosaic">${r.samples.map((p) => `<img src="${rawUrl(p)}" alt="" loading="lazy">`).join('')}</div>` : ''}
  </div>` });
}

// ---------- lineage ----------
function lineageHtml(s) {
  if (!s?.lineage) return '';
  return `<div class="lineage">${s.lineage.map((st, i) => `<button class="lstep ${st.run ? 'has-run' : ''}" ${st.run ? `data-run="${st.run}"` : ''} style="--i:${i}"><span class="ldate mono">${esc(st.date)}</span><span class="ldot"></span><b>${esc(st.title)}</b><span class="ldetail">${esc(st.detail)}</span>${st.run ? '<span class="lrun mono">research agent</span>' : ''}</button>`).join('')}</div>`;
}

// ---------- ClickUp ----------
function clickupHtml() {
  const c = S.clickup;
  if (!c) return `<div class="empty">No pull yet. Run the ClickUp crew to have agents fetch your open commitments.</div>`;
  const today = new Date().toISOString().slice(0, 10);
  return c.tasks.map((t) => {
    const sp = space(t.space);
    const overdue = t.due && t.due < today;
    return `<div class="row task-row"><span class="tstatus mono ${/progress/i.test(t.status) ? 'on' : ''}">${esc(t.status || '')}</span><span style="min-width:0"><div class="fname">${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.name)}</a>` : esc(t.name)}</div>${sp ? `<div class="fpath"><span class="sw" style="background:${sp.color};width:7px;height:7px;margin-right:6px"></span>${esc(sp.name)}</div>` : ''}</span><span class="when ${overdue ? 'overdue' : ''}">${t.due ? (overdue ? 'was due ' : 'due ') + new Date(t.due + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'no date'}</span></div>`;
  }).join('');
}

// ---------- the view ----------
function viewAgents() {
  crumbs(['Agents']);
  const A = S.agents || { stats: {}, sessions: [], connectors: [] };
  const R = S.research || [];
  const frames = R.reduce((n, r) => n + (r.stages.find(([l]) => l === 'Frames captured')?.[1] || 0), 0);
  const shows = R.reduce((n, r) => n + (r.stages.find(([l]) => l === 'Shows picked')?.[1] || 0), 0);
  rememberStream();
  return `<div class="page agents-page">
    <div class="eyebrow"><span class="tag">Agents</span><span>live from Claude Code logs</span></div>
    <h1>Your agents at work.</h1>
    <p class="lede"><b>${A.roster?.managerCount || 0} manager agents</b> have handed work to <b>${fmt(A.roster?.total || 0)} subagents</b> across ${A.roster?.roles.length || 0} roles. Each subagent does one job, then reports back.</p>
    <div class="actions">
      <button class="btn primary" data-run-mode="crew">Run the ClickUp crew</button>
      <button class="btn" data-ask>Ask AIOS</button>
    </div>
    ${window.pyramidHtml?.() || ''}
    <div class="section net-wrap"><div class="section-head"><h2>Agent network</h2><span class="mono">manager agents delegate to subagents, subagents use the tools · hover to trace</span></div><div id="network">${networkSvg()}</div></div>
    <div class="section"><div class="section-head"><h2>Subagent roster</h2><span class="mono">every subagent ever spawned, by role</span></div>${rosterHtml()}</div>
    <div class="agents-grid">
      <div class="section"><div class="section-head"><h2>Live</h2><span class="mono"><span class="live-dot"></span>${A.stats.callsHour || 0} calls in the last hour</span></div><div id="stream" class="stream">${streamHtml(12)}</div></div>
      <div class="section"><div class="section-head"><h2>ClickUp, pulled by agents</h2><span class="mono">${S.clickup ? 'last pull ' + ago(S.clickup.at) : 'read-only'}</span></div>${clickupHtml()}</div>
    </div>
    <div class="group-title"><h2>Research agents</h2><span>pipelines that watch, capture, analyze and report</span></div>
    <div class="research-list">${R.filter((r) => !r.missing).map(researchRow).join('')}</div>
    <div class="group-title"><h2>How research became Humanly Possible</h2><span>Oct 5 to Oct 15</span></div>
    <div class="section">${lineageHtml(space('humanly-possible'))}</div>
  </div>`;
}

// live refresh of the stream and network without re-rendering the page
function refreshAgents() {
  if (route.view !== 'agents') return;
  const st = document.getElementById('stream');
  if (st) { st.innerHTML = streamHtml(12); rememberStream(); }
}

// ---------- drawer panels ----------
function openPanel({ kind, name, sub, html, path }) {
  drawerPath = path || null;
  $('#drawer-kind').textContent = kind; $('#drawer-name').textContent = name; $('#drawer-path').textContent = sub || '';
  $('#drawer').querySelectorAll('.drawer-actions [data-act]').forEach((b) => (b.style.display = path ? '' : 'none'));
  $('#drawer-body').innerHTML = html;
  $('#drawer').classList.add('open');
}

// ---------- live runs ----------
let running = false;
const SUGGEST = ['What is due this week and what is overdue?', 'How does the podcast feed AIS?', 'What did the research agents find for Humanly Possible?', 'What changed in AIS Live October today?'];
function openAsk() {
  openPanel({ kind: 'ASK AIOS', name: 'Ask your OS anything', sub: 'A read-only Claude agent with your context and ClickUp', html: `<div class="ask">
    <form id="ask-form"><input id="ask-input" class="field" placeholder="Ask about your projects, deadlines or connections" autocomplete="off"><button class="btn primary">Ask</button></form>
    <div class="suggest">${SUGGEST.map((q) => `<button class="btn" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
  </div><div id="run-out"></div>` });
  setTimeout(() => $('#ask-input')?.focus(), 350);
}
const PHASES = {
  crew: [[0, 'Brief', 'Briefing the orchestrator'], [12, 'Delegate', 'Spawning scouts'], [22, 'Scout', 'Scouts reading ClickUp and files'], [68, 'Report', 'Scouts reporting back'], [82, 'Write', 'Writing the briefing'], [100, 'Done', 'Done']],
  ask: [[0, 'Brief', 'Loading your context'], [15, 'Read', 'Reading your projects'], [70, 'Write', 'Writing the answer'], [100, 'Done', 'Done']],
};
async function startRun(mode, question) {
  if (running) return toast('An agent run is already going');
  running = true;
  if (mode === 'crew') openPanel({ kind: 'AGENT CREW', name: 'ClickUp crew', sub: 'Orchestrator + ClickUp scout + Workspace scout, read-only', html: '<div id="run-out"></div>' });
  const out = $('#run-out');
  out.innerHTML = `<div class="run">
    ${question ? `<div class="run-q">${esc(question)}</div>` : ''}
    <div class="prog" id="prog"><div class="prog-head"><span class="prog-label" id="prog-label">Starting</span><span class="prog-pct mono" id="prog-pct">0%</span></div>
      <div class="prog-track"><i class="prog-fill" id="prog-fill"></i></div>
      <div class="prog-steps">${PHASES[mode].map((p, i) => `<span data-i="${i}">${p[1]}</span>`).join('')}</div></div>
    <div class="crew" id="crew"><div class="agent-card lead" data-agent="Orchestrator"><div class="ac-head"><span class="ac-icon"></span><b>Orchestrator</b><span class="ac-state mono">thinking</span></div><div class="ac-steps"></div></div></div>
    <div class="run-answer" id="run-answer"></div>
    <div class="run-foot mono muted" id="run-foot">Starting agent</div>
  </div>`;
  const card = (who) => {
    let c = out.querySelector(`.agent-card[data-agent="${CSS.escape(who)}"]`);
    if (!c) {
      c = document.createElement('div'); c.className = 'agent-card sub'; c.dataset.agent = who;
      c.innerHTML = `<div class="ac-head"><span class="ac-icon"></span><b>${esc(who)}</b><span class="ac-state mono">working</span></div><div class="ac-steps"></div>`;
      $('#crew').appendChild(c);
    }
    return c;
  };
  const addStep = (who, html) => { const s = card(who).querySelector('.ac-steps'); const d = document.createElement('div'); d.className = 'ac-step'; d.innerHTML = html; s.appendChild(d); while (s.children.length > 6) s.firstChild.remove(); };
  const t0 = Date.now();
  let finished = false;
  // Progress: each phase has a floor; steps and time creep toward the next floor but never reach it
  const ph = PHASES[mode]; let phase = 0, pct = 0;
  const paint = () => {
    $('#prog-fill').style.transform = `scaleX(${pct / 100})`;
    $('#prog-pct').textContent = `${Math.round(pct)}%`;
    $('#prog-label').textContent = ph[phase][2];
    out.querySelectorAll('.prog-steps span').forEach((s) => { const i = +s.dataset.i; s.classList.toggle('on', i <= phase); s.classList.toggle('now', i === phase && !finished); });
  };
  const toPhase = (n) => { if (n > phase) { phase = n; pct = Math.max(pct, ph[n][0]); } paint(); };
  const creep = (k) => { const cap = (ph[phase + 1]?.[0] ?? 100) - 2; pct += Math.max(0, cap - pct) * k; paint(); };
  const step = { crew: (t) => t === 'spawn' ? 1 : t === 'step' ? 2 : t === 'report' ? 3 : t === 'text' ? 4 : 0, ask: (t) => t === 'step' ? 1 : t === 'text' ? 2 : 0 }[mode];
  paint();
  const timer = setInterval(() => { const f = $('#run-foot'); if (f && running && !finished) { f.textContent = `Running ${((Date.now() - t0) / 1000).toFixed(0)}s`; creep(phase === 0 ? 0.09 : 0.03); } }, 500);
  try {
    const res = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, question }) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Could not start'); }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i).replace(/^data: /, ''); buf = buf.slice(i + 2);
        let ev; try { ev = JSON.parse(chunk); } catch { continue; }
        if (ev.type !== 'done') { const n = step(ev.type); if (n) toPhase(n); creep(ev.type === 'text' ? 0.01 : 0.08); }
        if (ev.type === 'spawn') { card(ev.child); addStep(ev.agent, `<span class="chip spawn">spawned</span> ${esc(ev.child)}`); out.querySelector('.lead .ac-state').textContent = 'delegating'; }
        if (ev.type === 'step') { const c = card(ev.agent); c.querySelector('.ac-state').textContent = 'working'; addStep(ev.agent, `<span class="chip">${esc(ev.tool)}</span> ${esc(ev.detail || '')}`); }
        if (ev.type === 'report') { const c = card(ev.agent); c.classList.add('done'); c.querySelector('.ac-state').textContent = 'reported back'; addStep('Orchestrator', `<span class="chip spawn">report</span> from ${esc(ev.agent)}`); }
        if (ev.type === 'text') { const a = $('#run-answer'); a.textContent += ev.delta; out.querySelector('.lead .ac-state').textContent = 'writing'; }
        if (ev.type === 'done') {
          finished = true;
          phase = ph.length - 1; pct = 100; paint(); $('#prog').classList.add(ev.ok ? 'complete' : 'stopped');
          if (!ev.ok) $('#prog-label').textContent = 'Stopped';
          const a = $('#run-answer');
          if (ev.result) a.textContent = ev.result.replace(/`/g, '').replace(/\*\*/g, '');
          out.querySelectorAll('.ac-state').forEach((s) => (s.textContent = 'done')); out.querySelectorAll('.agent-card').forEach((c) => c.classList.add('done'));
          $('#run-foot').textContent = `${ev.ok ? 'Done' : 'Stopped'} in ${(ev.ms / 1000).toFixed(1)}s · $${ev.cost.toFixed(2)}${ev.tasks ? ` · ${ev.tasks} ClickUp tasks saved to AIOS` : ''}`;
        }
      }
    }
  } catch (e) { $('#run-foot').textContent = e.message; $('#prog')?.classList.add('stopped'); }
  clearInterval(timer); running = false;
  await load(); if (route.view === 'agents') renderMain();
}

document.addEventListener('click', (e) => {
  const run = e.target.closest('[data-run]'); if (run) { e.preventDefault(); return openResearch(run.dataset.run); }
  const rm = e.target.closest('[data-run-mode]'); if (rm) return startRun(rm.dataset.runMode);
  if (e.target.closest('[data-ask]')) return openAsk();
  const q = e.target.closest('[data-q]'); if (q) return startRun('ask', q.dataset.q);
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'ask-form') return;
  e.preventDefault(); const q = $('#ask-input').value.trim(); if (q) startRun('ask', q);
});

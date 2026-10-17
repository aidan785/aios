// Four Cs view: the AIS "Build Your AI OS" framework, scored live from what is on disk and in the agent logs.
(() => {
  const F = () => S.ext?.fourcs;
  const routinesList = () => { const m = S.ext?.media; const r = m?.routines?.list || m?.routines || []; return Array.isArray(r) ? r : []; };
  const connCalls = (label) => (S.agents?.connectors || []).find((c) => c.label === label)?.calls || 0;
  const toolState = (t) => (t.connector && connCalls(t.connector) ? 'live' : t.wired ? 'wired' : 'gap');
  const CREATIVE = [['Premiere Pro', 'Premiere'], ['Blender', 'Blender'], ['After Effects', null], ['Figma', 'Figma'], ['Higgsfield', 'Higgsfield'], ['ComfyUI', 'ComfyUI']];

  function scores() {
    const f = F(); if (!f) return null;
    const c = f.context;
    const fresh = c.files.find((x) => x.label === 'Priorities');
    const ctx = Math.round(
      (c.files.some((x) => x.label === 'CLAUDE.md') ? 5 : 0) + Math.min(5, c.files.length - 1) + Math.min(5, c.memories / 10) + Math.min(5, c.decisions / 15) +
      (fresh && Date.now() - fresh.mtime < 7 * 864e5 ? 5 : 3));
    const covered = f.buckets.map((b) => { const st = b.tools.map(toolState); return st.includes('live') ? 1 : st.includes('wired') ? 0.85 : 0; });
    const con = Math.round((covered.reduce((a, b) => a + b, 0) / f.buckets.length) * 25);
    const skills = S.skills.length, subs = S.agents?.roster?.total || 0;
    const cap = Math.round(Math.min(14, skills / 4) + Math.min(6, subs / 40) + 5);
    const n = routinesList().length;
    const real = routinesList().filter((r) => !r.sample).length || 1;
    const cad = Math.round(Math.min(25, 6 + real * 4 + Math.max(0, n - real) * 1));
    const gaps = [];
    f.buckets.forEach((b) => b.tools.filter((t) => toolState(t) === 'gap').forEach((t) => gaps.push(`Connect ${t.name} to bring ${b.name.toLowerCase()} into the OS`)));
    if (cad < 25) gaps.push('Turn a daily skill into a cloud routine so it runs with the laptop closed');
    return { ctx, con, cap, cad, total: ctx + con + cap + cad, gaps, skills, subs, routines: n };
  }

  const ring = (v, max, color, size = 132) => {
    const r = size / 2 - 9, C = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-track"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-val" style="stroke:${color};--C:${C.toFixed(1)};--off:${(C * (1 - v / max)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  };


  // ---------- live answers, one per bucket ----------
  const B = () => S.ext?.briefing || {};
  const money = (n) => '$' + (n >= 1000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K' : n);
  const dayLabel = (iso) => { const d = new Date(iso.length === 10 ? iso + 'T12:00' : iso); const t = new Date(); const diff = Math.round((new Date(d.toDateString()) - new Date(t.toDateString())) / 864e5); return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
  const timeLabel = (e) => (e.allDay ? 'All day' : new Date(e.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
  const late = (due) => Math.max(0, Math.floor((Date.now() - due) / 864e5));
  const ANSWERS = {
    revenue() {
      const r = B().revenue; if (!r) return '';
      const last = r.mrr[r.mrr.length - 1], prev = r.mrr[r.mrr.length - 2], max = Math.max(...r.mrr), floor = Math.min(...r.mrr) * 0.6;
      return `<div class="ans-grid"><div class="ans-kpi"><b>${money(last)}</b><span>monthly revenue</span><em class="up">+${(((last - prev) / prev) * 100).toFixed(1)}% vs last month</em>${r.sample ? '<span class="ans-sample mono">sample data</span>' : ''}</div>
        <div class="ans-bars">${r.mrr.map((v, i) => `<span><i style="height:${((v - floor) / (max - floor)) * 100}%"></i><em>${r.months[i]}</em></span>`).join('')}</div>
        <div class="ans-split">${r.streams.map((x) => `<div><span>${esc(x.name)}</span><b>${Math.round(x.share * 100)}%</b></div>`).join('')}</div></div>
`;
    },
    customer() {
      const a = B().asks; if (!a) return '';
      const max = a.themes[0]?.count || 1;
      return `<p class="ans-lead"><b>${a.asking}</b> of ${a.total} comments on Nate's last ${a.source?.videos || 8} uploads ask for something. The top asks:</p>
        <div class="ans-themes">${a.themes.slice(0, 4).map((t) => `<div class="ans-theme"><div class="ans-theme-top"><b>${esc(t.theme)}</b><span class="mono">${t.count}</span></div><span class="ans-meter"><i style="transform:scaleX(${(t.count / max).toFixed(2)})"></i></span><q>${esc(t.quotes[0] || '')}</q><span class="ans-idea"><span class="mono">idea</span>${esc(t.idea)}</span></div>`).join('')}</div>`;
    },
    calendar() {
      const c = B().calendar; if (!c?.events?.length) return '<p class="ans-lead">Calendar is loading.</p>';
      return `<div class="ans-cal">${c.events.slice(0, 7).map((e) => `<div class="ans-ev ${/vip room/i.test(e.title) ? 'hl' : ''}"><span class="mono">${dayLabel(e.start)}</span><span class="mono t">${timeLabel(e)}</span><b>${esc(e.title)}</b></div>`).join('')}</div>`;
    },
    comms() {
      const k = B().clickup; if (!k) return '';
      return `<div class="ans-list">${k.asks.slice(0, 5).map((x) => `<div class="ans-li"><span class="mono">${ago(x.at)}</span><b>${esc(x.text)}</b><span class="mono muted">${esc(x.where)}</span></div>`).join('')}</div>`;
    },
    tasks() {
      const k = B().clickup; if (!k) return '';
      return `<p class="ans-lead"><b>${k.overdue.length} tasks</b> are past due in ClickUp.</p><div class="ans-list">${k.overdue.map((t) => `<a class="ans-li" href="${esc(t.url)}" target="_blank" rel="noopener"><span class="mono late">${late(t.due)}d late</span><b>${esc(t.name)}</b><span class="mono muted">${esc(t.list)} · ${esc(t.status)}${t.note ? ' · ' + esc(t.note) : ''}</span></a>`).join('')}</div>`;
    },
    meetings() {
      const c = B().calendar; const calls = (c?.events || []).filter((e) => !e.allDay && new Date(e.end) - new Date(e.start) <= 3 * 3600e3).slice(0, 4);
      return `<div class="ans-cal">${calls.map((e) => `<div class="ans-ev"><span class="mono">${dayLabel(e.start)}</span><span class="mono t">${timeLabel(e)}</span><b>${esc(e.title)}</b></div>`).join('') || '<p class="ans-lead">No calls on the calendar this week.</p>'}</div>
        <p class="ans-note">Recordings get transcribed with Whisper or Descript. Connecting Fireflies would add the decisions from each call here automatically.</p>`;
    },
    knowledge() {
      return `<form class="ans-find" data-find><input class="field" name="q" value="VSL" autocomplete="off" spellcheck="false" placeholder="Find any file across the drive and projects"><button class="btn">Find</button></form><div class="ans-results" id="find-out"></div>`;
    },
  };

  function connectionsHtml(full) {
    const f = F(); if (!f) return '';
    const tile = (t) => { const st = toolState(t); const n = t.connector ? connCalls(t.connector) : 0; return `<div class="cx-tool t-${st}">
      <div class="cx-top"><span class="cx-dot"></span><b>${esc(t.name)}</b><span class="cx-how mono">${esc(t.how)}</span></div>
      <span class="cx-note">${esc(t.note)}</span>${n ? `<span class="cx-calls mono">${fmt(n)} calls this week</span>` : ''}</div>`; };
    const creative = CREATIVE.map(([n, c]) => ({ name: n, how: c ? 'MCP' : 'Bridge', note: n === 'After Effects' ? 'ExtendScript bridge' : 'creative app', wired: true, connector: c }));
    const rows = [...f.buckets.map((b, i) => ({ ...b, n: String(i + 1).padStart(2, '0') })), { id: 'creative', name: 'Creative', ask: 'Cut the silences in this take.', tools: creative, n: '+', go: 'creative' }];
    return `<div class="cx">${rows.map((b) => `<div class="cx-row">
      <div class="cx-head"><span class="cx-n mono">${b.n}</span><b>${esc(b.name)}</b>${full ? `<span class="cx-ask">&ldquo;${esc(b.ask)}&rdquo;</span>` : ''}${b.go ? `<button class="cx-go mono" data-go="${b.go}">Open Creative OS</button>` : ''}</div>
      <div class="cx-tools">${b.tools.map(tile).join('')}</div>
      ${full && ANSWERS[b.id] ? `<div class="cx-answer">${ANSWERS[b.id]()}</div>` : ''}</div>`).join('')}</div>`;
  }

  function contextHtml() {
    const c = F()?.context; if (!c) return '';
    return `<div class="ctx-files">${c.files.map((x) => `<button class="ctx-file" data-file="${esc(x.path)}" data-kind="doc"><b>${esc(x.label)}</b><span>${esc(x.what)}</span><span class="mono muted">${x.lines} lines · ${ago(x.mtime)}</span></button>`).join('')}
      <button class="ctx-file" data-file="${esc(c.decisionsPath)}" data-kind="doc"><b>Decision log</b><span>Append-only record of what was decided and why</span><span class="mono muted">${c.decisions} decisions</span></button>
      ${S.ext?.wiki ? `<a class="ctx-file wiki" href="obsidian://open?path=${encodeURIComponent(S.ext.wiki.path)}"><b>Knowledge wiki</b><span>Every space, skill, agent and connection as linked notes. Opens in Obsidian.</span><span class="mono muted">${S.ext.wiki.pages} pages · ${ago(S.ext.wiki.at)}</span></a>` : ''}
      <div class="ctx-file still"><b>Memory</b><span>Facts Claude saved across sessions</span><span class="mono muted">${c.memories} memories</span></div></div>`;
  }

  window.fourcsScores = scores;
  window.fourcsRoutines = routinesList;
  EXT.views.os = {
    label: 'Four Cs',
    wide: true,
    count: () => scores()?.total ?? '',
    render() {
      crumbs(['Four Cs']);
      const sc = scores();
      if (!sc) return '<div class="page"><h1>Four Cs</h1><div class="empty">Reading your OS</div></div>';
      const C = [
        ['Context', sc.ctx, 'What it knows about you', `${F().context.files.length} context files, ${F().context.memories} memories, ${F().context.decisions} decisions`, 'brain', '#0a72b5'],
        ['Connections', sc.con, 'What data it can reach', `${F().buckets.filter((b) => b.tools.some((t) => toolState(t) !== 'gap')).length} of 7 tier-one buckets wired`, 'connections', '#37bdf8'],
        ['Capabilities', sc.cap, 'What it can produce', `${sc.skills} skills, ${fmt(sc.subs)} subagents spawned`, 'agents', '#2dd4bf'],
        ['Cadence', sc.cad, 'When it acts on its own', `${sc.routines} routines on a schedule`, 'routines', '#a78bfa'],
      ];
      return `<div class="page fourcs-page">
        <div class="eyebrow"><span class="tag">Build Your AI OS</span><span>the Four Cs, scored live from disk and agent logs</span></div>
        <h1>Context, Connections, Capabilities, Cadence.</h1>
        <p class="lede">The same audit the course runs with <b>/audit</b>, computed from what this machine actually has. <b>${sc.total} out of 100</b> today.</p>
        <div class="audit">
          <div class="audit-total">${ring(sc.total, 100, 'var(--blue-ink)', 188)}<div class="audit-num"><b data-count="${sc.total}">${sc.total}</b><span class="mono">of 100</span></div></div>
          <div class="audit-cs">${C.map(([n, v, sub, ev, go, col], i) => `<button class="c-card" data-go="${go}" style="--cc:${col}">
            <div class="c-ring">${ring(v, 25, col, 96)}<b>${v}</b></div>
            <div class="c-text"><span class="mono muted">${i + 1} · ${v}/25</span><h3>${n}</h3><p>${sub}</p><span class="c-ev">${esc(ev)}</span></div></button>`).join('')}</div>
        </div>
        ${sc.gaps.length ? `<div class="levelup"><span class="mono">/level-up</span><b>Next to wire up</b><span>${esc(sc.gaps[0])}</span></div>` : ''}
        <div class="group-title"><h2><span class="c-num">1</span>Context</h2><span>loaded into every session</span></div>
        ${contextHtml()}
        <div class="group-title"><h2><span class="c-num">2</span>Connections</h2><span>the seven tier-one buckets, plus creative</span></div>
        ${connectionsHtml()}
        <div class="group-title"><h2><span class="c-num">3</span>Capabilities</h2><span>skills, agents and pipelines</span></div>
        <div class="c-links">
          <button class="c-link" data-go="skills"><b>${sc.skills}</b><span>skills</span></button>
          <button class="c-link" data-go="agents"><b>${fmt(sc.subs)}</b><span>subagents spawned</span></button>
          <button class="c-link" data-go="pipeline"><b>${EXT.views.pipeline ? '7' : ''}</b><span>stage editing pipeline</span></button>
          <button class="c-link" data-go="creative"><b>${CREATIVE.length}</b><span>creative apps bridged</span></button>
        </div>
        <div class="group-title"><h2><span class="c-num">4</span>Cadence</h2><span>what runs while you sleep</span></div>
        <div class="c-links">
          <button class="c-link" data-go="routines"><b>${sc.routines}</b><span>routines</span></button>
          <button class="c-link" data-go="routines"><b>${routinesList().filter((r) => !r.sample).length || 1}</b><span>running on cron right now</span></button>
        </div>
      </div>`;
    },
    after(same) {
      if (same) return;
      const b = $('#main .audit-num b'); if (!b) return;
      const to = +b.dataset.count, t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1100); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    },
  };

  async function runFind(q) {
    const out = document.getElementById('find-out'); if (!out) return;
    out.innerHTML = '<span class="mono muted">Searching</span>';
    const r = await fetch('/api/find?q=' + encodeURIComponent(q)).then((x) => x.json()).catch(() => null);
    if (!r) { out.innerHTML = '<span class="mono muted">Search failed</span>'; return; }
    out.innerHTML = `<span class="mono muted">${r.total} matches in ${r.ms}ms, videos first, then newest</span>` + r.results.map((f) => `<button class="ans-file" data-act="reveal" data-path="${esc(f.path)}"><b>${esc(f.name)}</b><span class="mono muted">${esc(f.dir)}</span><span class="mono">${f.size > 1e9 ? (f.size / 1e9).toFixed(1) + ' GB' : (f.size / 1e6).toFixed(f.size > 1e7 ? 0 : 1) + ' MB'} · ${ago(f.mtime)}</span></button>`).join('');
  }
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-find]'); if (!f) return; e.preventDefault(); runFind(f.q.value.trim()); });

  EXT.views.connections = {
    label: 'Connections',
    wide: true,
    after(same) { if (!same) runFind('VSL'); },
    count: () => (F() ? F().buckets.filter((b) => b.tools.some((t) => toolState(t) !== 'gap')).length + '/7' : ''),
    render() {
      crumbs(['Connections']);
      const live = (S.agents?.connectors || []).reduce((a, c) => a + c.calls, 0);
      return `<div class="page">
        <div class="eyebrow"><span class="tag">2 · Connections</span><span>what data the OS can reach</span></div>
        <h1>Everything it can see and touch.</h1>
        <p class="lede">The seven things every business tracks, each mapped to the tools this OS can read. On the left, a question it can now answer. Agents made <b>${fmt(live)} connector calls</b> this week.</p>
        <div class="cx-legend mono"><span class="t-live"><span class="cx-dot"></span>used this week</span><span class="t-wired"><span class="cx-dot"></span>connected</span><span class="t-gap"><span class="cx-dot"></span>not connected yet</span></div>
        ${connectionsHtml(true)}
      </div>`;
    },
  };
})();

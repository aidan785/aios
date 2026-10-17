// ClickUp agents: six agents reading Aidan's real ClickUp workspace and handing findings to each other.
// The workspace map and tasks are real (read-only pull). The agent activity on this page is a simulation for the demo;
// the "Run the ClickUp crew" button runs the real read-only crew.
(() => {
  const M = () => S.ext?.clickupmap;
  const clean = (s) => String(s).replace(/[^\x20-\x7EÀ-ɏ]/g, '').trim();
  const AGENTS = [
    { id: 'chat', name: 'Chat listener', short: 'CL', color: '#2dd4bf', role: 'Reads every ClickUp chat for asks aimed at Aidan', task: 'New asks in team chat', steps: [
      ['Virtual Events', 'Reading Virtual Events chat, 7 new messages'],
      ['Virtual Events', 'Ask for Aidan: add Jillian as the panel moderator'],
      ['Media Projects', 'Reading Media & Community chat, 3 new messages'],
      ['Media Projects', 'Ask for Aidan: upload the Matt pod to YouTube and Spotify'],
    ], hand: [['event', 'Jillian needs to be listed as moderator on her session'], ['media', 'Nate wants the Matt pod on YouTube and Spotify']] },
    { id: 'deadline', name: 'Deadline watcher', short: 'DW', color: '#f59e0b', role: 'Checks every due date against today', task: 'Weekly Commitment and Certification', steps: [
      ['Weekly Commitment', 'Scanning Weekly Commitment, 9 open tasks'],
      ['Weekly Commitment', 'Define editing style is 7 days past due'],
      ['Certification', 'Scanning Certification, 2 open tasks'],
      ['Certification', 'Lesson Video Editing is 23 days past due'],
    ], hand: [['standup', '6 tasks past due, the two Certification edits are the oldest']] },
    { id: 'event', name: 'Event ops', short: 'EO', color: '#37bdf8', role: 'Keeps AIS Live sessions, pages and assets in sync', task: 'AIS Live, Oct 17 and 18', steps: [
      ['Virtual Events', 'Checking 14 sessions for tomorrow'],
      ['Virtual Events', 'Moderator missing on Jillian\'s session'],
      ['Media Projects', 'Comparing descriptions with the run of show'],
      ['Virtual Events', 'One description does not match the live build roleplay'],
    ], hand: [['standup', 'AIS Live: 1 moderator to add, 1 description to fix before 8 AM']] },
    { id: 'podcast', name: 'Podcast booker', short: 'PB', color: '#ec4899', role: 'Tracks guests from outreach to published episode', task: 'Sirish Chandrasekaran, record Nov 13', steps: [
      ['Podcast Guest Outreach', 'Reading Podcast Guest Outreach, 2 bookings'],
      ['Podcast Guest Outreach', 'Sirish records Nov 13 at 11:00 AM CT'],
      ['Guest Pipeline', 'Pulling guest background for a prep brief'],
      ['Episodes', 'Matt Pocock episode is live on YouTube'],
    ], hand: [['deadline', 'Matt Pocock record task can close, the episode published Oct 16']] },
    { id: 'media', name: 'Media router', short: 'MR', color: '#a78bfa', role: 'Triages media requests into the editing pipeline', task: 'Edit VSL and breakout videos', steps: [
      ['Internal Media Requests', 'Triaging Internal Media Requests'],
      ['Media Projects', 'Edit VSL and Edit breakout videos are in progress'],
      ['Sponsorship Integrations', 'Checking sponsor reads for the next uploads'],
      ['Episodes', 'Routing the Matt pod upload to the publish pack'],
    ], hand: [['podcast', 'Publish pack for the Matt pod is queued, titles and chapters next']] },
    { id: 'standup', name: 'Standup writer', short: 'SW', color: '#0a72b5', role: 'Turns every handoff into Aidan\'s day update for Nate', task: 'Day update for Nate', steps: [
      ['Weekly Commitment', 'Collecting handoffs from 4 agents'],
      ['Weekly Commitment', 'Drafting today\'s update for Nate'],
      ['Weekly Commitment', 'Draft ready, waiting on Aidan\'s yes. Nothing posted'],
    ], hand: [['aidan', 'Day update drafted: 3 wins, 2 blockers, 1 ask for Nate']] },
  ];
  const byId = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  const st = Object.fromEntries(AGENTS.map((a) => [a.id, { i: -1, pct: 0, log: [] }]));
  const feed = [];
  let reads = 1284 + Math.floor((Date.now() % 864e5) / 864e5 * 600), timer = null, turn = 0;

  // a few earlier handoffs so the feed is never empty on arrival
  [[12, 'deadline', 'standup', '6 tasks past due, the two Certification edits are the oldest'], [9, 'podcast', 'deadline', 'Matt Pocock record task can close, the episode published Oct 16'], [6, 'chat', 'event', 'Jillian needs to be listed as moderator on her session'], [3, 'media', 'podcast', 'Publish pack for the Matt pod is queued, titles and chapters next']]
    .forEach(([m, from, to, text]) => feed.unshift({ t: Date.now() - m * 60e3, from, to, text }));
  const hhmmss = (t) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const avatar = (a, cls = '') => `<span class="cu-av ${cls}" style="--ac:${a.color}">${a.short}</span>`;

  function mapHtml() {
    const m = M(); if (!m) return '';
    return `<div class="cu-map">${m.spaces.map((s) => `<div class="cu-space"><b>${esc(clean(s.name))}</b>
      <div class="cu-lists">${s.lists.map((l) => `<span class="cu-list" data-list="${esc(clean(l))}"><span class="cu-list-n">${esc(clean(l))}</span><span class="cu-here"></span></span>`).join('')}</div></div>`).join('')}</div>`;
  }
  function cardHtml(a) {
    const s = st[a.id];
    return `<div class="cu-agent" data-agent="${a.id}" style="--ac:${a.color}">
      <div class="cu-agent-head">${avatar(a)}<span><b>${esc(a.name)}</b><span class="cu-role">${esc(a.role)}</span></span><span class="cu-state mono">${s.i < 0 ? 'starting' : 'working'}</span></div>
      <div class="cu-task"><span class="mono">on</span> ${esc(a.task)}</div>
      <span class="cu-bar"><i style="transform:scaleX(${s.pct / 100})"></i></span>
      <div class="cu-steps">${s.log.slice(-3).map((x) => `<div>${esc(x)}</div>`).join('') || '<div class="muted">Waiting for its first read</div>'}</div></div>`;
  }
  function feedHtml() {
    return feed.slice(0, 9).map((f) => { const a = byId[f.from], b = byId[f.to]; return `<div class="cu-msg ${f.fresh ? 'fresh' : ''}"><span class="mono muted">${hhmmss(f.t)}</span>
      <span class="cu-route">${avatar(a, 'sm')}<i class="cu-arrow"></i>${b ? avatar(b, 'sm') : '<span class="cu-av sm you">You</span>'}</span>
      <span class="cu-msg-body"><b>${esc(a.name)} to ${b ? esc(b.name) : 'Aidan'}</b><span>${esc(f.text)}</span></span></div>`; }).join('') || '<div class="empty">Agents are reading the workspace.</div>';
  }
  function tasksHtml() {
    const m = M(); if (!m) return '';
    const watcher = (t) => (/Podcast/.test(t.list) ? byId.podcast : /Certification|Weekly/.test(t.list) && t.due && t.due < Date.now() ? byId.deadline : /Media|Episodes/.test(t.list) ? byId.media : byId.standup);
    return m.tasks.map((t) => { const w = watcher(t); const late = t.due && t.due < Date.now() ? Math.floor((Date.now() - t.due) / 864e5) : 0; return `<a class="cu-trow" href="${esc(t.url)}" target="_blank" rel="noopener">
      <b>${esc(t.name)}</b><span class="mono muted">${esc(t.list)}</span><span class="cu-status mono s-${t.status.replace(/\s/g, '-')}">${esc(t.status)}</span>
      <span class="mono ${late ? 'late' : 'muted'}">${late ? late + 'd late' : t.due ? 'due ' + new Date(t.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'no date'}</span>
      <span class="cu-watch">${avatar(w, 'sm')}<span class="mono">${esc(w.name)}</span></span></a>`; }).join('');
  }

  function tick() {
    if (route.view !== 'clickup' || !document.getElementById('cu-feed')) { clearInterval(timer); timer = null; return; }
    const a = AGENTS[turn++ % AGENTS.length]; const s = st[a.id];
    s.i++;
    if (s.i >= a.steps.length) {
      s.i = -1; s.pct = 0; s.log = [];
      for (const [to, text] of a.hand) { feed.unshift({ t: Date.now(), from: a.id, to: to === 'aidan' ? null : to, text, fresh: true }); }
      if (feed.length > 30) feed.length = 30;
    } else {
      const [list, text] = a.steps[s.i];
      s.log.push(text); s.pct = ((s.i + 1) / a.steps.length) * 100;
      reads += 3 + Math.floor(Math.random() * 11);
      // move this agent's marker on the map
      document.querySelectorAll(`.cu-list[data-a="${a.id}"]`).forEach((el) => { el.classList.remove('on'); el.removeAttribute('data-a'); el.style.removeProperty('--ac'); el.querySelector('.cu-here').innerHTML = ''; });
      const el = document.querySelector(`.cu-list[data-list="${CSS.escape(list)}"]`);
      if (el) { el.classList.add('on'); el.dataset.a = a.id; el.style.setProperty('--ac', a.color); el.querySelector('.cu-here').innerHTML = avatar(a, 'xs'); }
    }
    const card = document.querySelector(`.cu-agent[data-agent="${a.id}"]`); if (card) card.outerHTML = cardHtml(a);
    const f = document.getElementById('cu-feed'); if (f) { f.innerHTML = feedHtml(); feed.forEach((x) => (x.fresh = false)); }
    const r = document.getElementById('cu-reads'); if (r) r.textContent = fmt(reads);
  }

  EXT.views.clickup = {
    label: 'ClickUp',
    wide: true,
    render() {
      crumbs(['ClickUp']);
      const m = M();
      if (!m) return '<div class="page"><h1>ClickUp</h1><p class="lede">Reading the workspace.</p></div>';
      const lists = m.spaces.reduce((n, s) => n + s.lists.length, 0);
      return `<div class="page cu-page">
        <div class="eyebrow"><span class="tag">2 · Connections</span><span>${esc(m.workspace)} workspace, read-only</span></div>
        <h1>Agents inside ClickUp.</h1>
        <p class="lede">Six agents read the whole workspace, every list and every chat, then hand what they find to each other. The Standup writer turns it all into a draft for Nate. Nothing in ClickUp changes without Aidan's yes.</p>
        <div class="actions"><button class="btn primary" data-run-mode="crew">Run the real ClickUp crew</button><button class="btn" data-go="agents">All agents</button></div>
        <div class="ed-stats"><div><b>${m.spaces.length}</b><span>spaces</span><em>from Marketing to Media</em></div><div><b>${lists}</b><span>lists watched</span><em>tasks, chats and docs</em></div><div><b>${m.tasks.length}</b><span>open tasks for Aidan</span><em>pulled live from ClickUp</em></div><div><b id="cu-reads">${fmt(reads)}</b><span>reads today</span><em>across 6 agents</em></div></div>
        <div class="cu-grid">
          <section class="section"><div class="section-head"><h2>The workspace</h2><span class="mono">a dot shows where each agent is reading</span></div>${mapHtml()}</section>
          <section class="section"><div class="section-head"><h2>Agents talking</h2><span class="mono"><span class="live-dot"></span>handoffs · simulated</span></div><div class="cu-feed" id="cu-feed">${feedHtml()}</div></section>
        </div>
        <div class="group-title"><h2>The crew</h2><span>what each agent is working on right now · simulated</span></div>
        <div class="cu-agents">${AGENTS.map(cardHtml).join('')}</div>
        <div class="group-title"><h2>Aidan's open tasks</h2><span>real, from ClickUp, with the agent watching each one</span></div>
        <div class="section cu-tasks">${tasksHtml()}</div>
      </div>`;
    },
    after() {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 1400);
      for (let i = 0; i < AGENTS.length; i++) tick(); // land with every agent already busy
    },
  };
})();

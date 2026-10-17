// Workforce: five departments, four teams each, named agents, and named workers under every agent.
// Same structure for every department. The work is drawn from Aidan's real projects; the agents doing it are a simulation.
(() => {
  const RT = {
    claude: { name: 'Claude Code', color: '#d97757' },
    codex: { name: 'Codex', color: '#10a37f' },
    grok: { name: 'Grok Bot', color: '#475569' },
    muse: { name: 'Muse', color: '#0866ff' },
    dots: { name: 'Dots', color: '#7c3aed' },
  };
  // department -> teams -> agents [name, runtime, what the agent's workers do]
  const DEPTS = [
    { id: 'edit', name: 'Editing', space: 'editing-pipeline', head: ['Edit director', 'Opus 5.5'], list: 'Media & Community / Media Projects', teams: [
      ['Cut', [['Silence cutter', 'claude', ['trimming dead air in take 3', 'tightening pauses to 0.2s', 're-timing the transcript']], ['Mistake finder', 'claude', ['flagging a false start', 'keeping the clean retake', 'logging a stutter at 12:41']], ['Verify agent', 'codex', ['pass 2 of 3 on the clean render', 'reading every join back', 'checking the silence sweep']], ['Transcriber', 'claude', ['word timestamps for the raw take', 'speaker labels', 'fixing names in the transcript']], ['Pacing coach', 'grok', ['scoring each minute for pace', 'marking slow sections', 'suggesting two tighter cuts']]]],
      ['Motion', [['Card builder', 'claude', ['tier 1 card for the thesis', 'lower third for the guest', 'stat card from the script']], ['Kinetic type', 'claude', ['motion score for the hook', 'word timing to the beat', 'AE comp from the score']], ['Lottie animator', 'muse', ['icon loop for the outro', 'checkmark sting', 'exporting the JSON']], ['B-roll finder', 'muse', ['4 cutaways for the setup', 'tool screenshots cached', 'license check on each clip']], ['Logo wrangler', 'dots', ['pulling brand logos as pixels', 'sizing logos to the card', 'checking clear space']]]],
      ['Sound', [['Music picker', 'grok', ['searching Artlist for a build', 'cutting the track to 2:10', 'ducking under voice']], ['Mixer', 'claude', ['leveling voice to -16 LUFS', 'removing room tone', 'matching two mics']], ['Voice agent', 'codex', ['ElevenLabs pickup line', 'matching the tone', 'placing the pickup']], ['SFX designer', 'muse', ['whooshes on card entries', 'subtle hits on stats', 'muting under dialogue']], ['Caption agent', 'dots', ['burned captions for shorts', 'line breaks by phrase', 'checking spelling of names']]]],
      ['Finishing', [['Colorist', 'muse', ['matching camera A to B', 'skin tone pass', 'LUT for the outro']], ['Render agent', 'claude', ['draft render 1080p', 'final render, standard quality', 'hero frames for review']], ['Premiere handoff', 'claude', ['building the sequence from the EDL', 'markers for every cut', 'exporting XML']], ['Delivery agent', 'codex', ['uploading to Frame.io', 'naming files by version', 'posting the review link']], ['QA agent', 'codex', ['checking frames for clipping', 'black frame scan', 'audio peaks under -1 dB']]]],
    ] },
    { id: 'hp', name: 'Humanly Possible', space: 'humanly-possible', head: ['Showrunner', 'Claude Fable 5.1'], list: 'Media & Community / Humanly Possible', teams: [
      ['Research', [['Guest researcher', 'grok', ['background on a Guest Pipeline name', 'their best past interview clip', 'three questions nobody asked']], ['Show analyst', 'grok', ['studying an interview show cold open', 'logging edit patterns', 'scoring retention moments']], ['Frame capture', 'codex', ['capturing frames from episode 3', 'building a contact sheet', 'tagging shot types']], ['Trend scout', 'grok', ['what remote AI shows are doing', 'clips over 5x their channel', 'formats worth testing']], ['Fact checker', 'codex', ['checking a guest claim', 'source links for the show notes', 'dates and numbers in the script']]]],
      ['Design', [['Layout designer', 'muse', ['Bordered Cards for episode 2', 'card grid at 16:9', 'safe areas for captions']], ['Thumbnail designer', 'dots', ['three thumbnail comps', 'oxblood vs brick background', 'headshot cutout pass']], ['Motion designer', 'claude', ['intro animation timing', 'Mark B reveal', 'transition between segments']], ['Type designer', 'muse', ['title type for the outro', 'kerning on the wordmark', 'lower third type scale']], ['Set designer', 'claude', ['virtual set from the brand kit', 'lighting the backdrop', 'camera framing guide']]]],
      ['Branding', [['Brand keeper', 'muse', ['Pulse Combined on every card', 'checking the palette', 'clear space on Mark B']], ['Palette agent', 'muse', ['oxblood, cream, brick, orange, gold', 'contrast checks', 'dark mode swatches']], ['Logo agent', 'dots', ['Mark B lockups', 'favicon and social avatars', 'one-color versions']], ['Voice and tone', 'codex', ['show description in brand voice', 'episode titles', 'cutting AI phrases']], ['Brand QA', 'codex', ['14 assets against the rules', 'old Pulse palette found twice', 'fix list to the Logo agent']]]],
      ['Production', [['Producer', 'claude', ['November pilot schedule', 'two episodes, two guests', 'editor coverage for December']], ['Scripting agent', 'codex', ['cold open for episode 1', 'three 12 second hooks', 'segment outline']], ['Pilot editor', 'claude', ['cutting the pilot raw', 'pilot at 41:20 from 58:06', 'retakes flagged for review']], ['Outro agent', 'claude', ['outro template v3', 'blur and noisy gradient pass', '8 second render']], ['Publish agent', 'claude', ['titles and chapters', 'Spotify and YouTube upload', 'clips to AIS Media']]]],
    ] },
    { id: 'live', name: 'AIS Live', space: 'ais-live-october', head: ['Event director', 'GPT-6 Sol'], list: 'AIS / Virtual Events', teams: [
      ['Program', [['Session planner', 'claude', ['14 sessions for Oct 17', 'Day 2 agenda', 'breaks and buffers']], ['Speaker liaison', 'grok', ['confirming speakers', 'bios and headshots', 'tech checks scheduled']], ['Run of show', 'dots', ['timing every block', 'block 6 runs long', 'buffer into the lunch fill']], ['Moderator matcher', 'grok', ['moderators to panels', 'Jillian on her session', 'backup moderators']], ['Agenda writer', 'codex', ['session descriptions', 'matching the live build roleplay', 'speaker order']]]],
      ['Stage', [['Sizzle editor', 'claude', ['Block 13 opening sizzle v4', 'cuts on the music hits', 'export for playback']], ['Sting animator', 'claude', ['session stings in white and blue', 'countdown loops', 'doors open loop']], ['Title cards', 'muse', ['18 speaker cards', '4 to go', 'handoff to the stage team']], ['Lower thirds', 'muse', ['names and titles', 'session lower thirds', 'checking spellings']], ['Playback agent', 'codex', ['ordering the playback list', 'loop timings', 'backup files on the SSD']]]],
      ['Pages', [['Page builder', 'codex', ['session pages for Oct 17', 'Day 2 page', 'mobile check']], ['VSL agent', 'claude', ['October VSL cut', 'inserts for VIP rooms', 'poster frame']], ['Email agent', 'codex', ['reminder emails', 'replay email draft', 'nothing sent without a yes']], ['Tracking guard', 'codex', ['trackers untouched', 'checkout links unchanged', 'guard script passes']], ['Copy agent', 'dots', ['headline options', 'FAQ answers', 'cutting AI phrases']]]],
      ['Live ops', [['Chat moderator', 'grok', ['watching live chat', 'pinning questions', 'flagging spam']], ['Q&A curator', 'grok', ['ranking audience questions', 'sending top 5 to the host', 'answering repeats']], ['Wins collector', 'muse', ['member wins from chat', 'screenshots for the recap', 'quotes for the page']], ['Replay agent', 'claude', ['marking replay chapters', 'clipping highlights', 'replay page']], ['Stream watcher', 'codex', ['bitrate and dropped frames', 'audio levels', 'backup stream ready']]]],
    ] },
    { id: 'pod', name: 'Podcast', space: 'podcast', head: ['Podcast producer', 'Opus 5.5'], list: 'Media & Community / Podcast Guest Outreach', teams: [
      ['Booking', [['Outreach agent', 'grok', ['shortlisting guests', 'personal outreach drafts', 'follow-ups in 5 days']], ['Vetting agent', 'grok', ['scoring a guest lead', 'audience overlap', 'logging the shortlist']], ['Scheduler', 'codex', ['Sirish on Nov 13, 11 AM CT', 'calendar holds', 'reminder the day before']], ['Brief writer', 'codex', ['prep brief for Sirish', 'ten questions ranked', 'past clips to reference']], ['Guest care', 'claude', ['recording setup guide', 'mic and lighting checks', 'thank you note draft']]]],
      ['Edit', [['Episode editor', 'claude', ['cutting the Matt Pocock episode', 'removing the tangents', '44:50 final']], ['Cold open agent', 'claude', ['cold open draft 17', 'no clicks version', 'stand out intro']], ['Chapter agent', 'codex', ['chapters from the transcript', 'timestamps with the new integration', 'chapter titles']], ['Audio agent', 'muse', ['leveling two guests', 'removing echo', 'loudness to spec']], ['Intro sound', 'muse', ['sound design for the intro', 'riser into the hook', 'matching the AIS sting']]]],
      ['Clips', [['Clip hunter', 'codex', ['12 clips from the Matt episode', 'scoring by audience bucket', '5 picked for AIS']], ['Packaging agent', 'dots', ['titles for 5 clips', 'thumbnail per clip', 'decision logic check']], ['Caption agent', 'dots', ['captions for vertical clips', 'emphasis words', 'safe zones']], ['Tracking links', 'codex', ['tracked link per clip', 'audience tag', 'UTM check']], ['Reframe agent', 'claude', ['9:16 reframe', 'speaker tracking', 'export for shorts']]]],
      ['Publish', [['YouTube uploader', 'claude', ['Matt pod to Nate\'s dashboard', 'description and chapters', 'scheduled premiere']], ['Spotify agent', 'claude', ['Spotify upload', 'episode art', 'show notes']], ['Newsletter agent', 'codex', ['episode blurb', 'three takeaways', 'draft only']], ['Analytics agent', 'grok', ['views per day', 'retention at 30s', 'compare to last 5 episodes']], ['Comment miner', 'grok', ['top comments', 'requests for more podcasts', 'questions for the next guest']]]],
    ] },
    { id: 'caic', name: 'CAIC', space: 'caic', head: ['Course director', 'Sonnet 5.5'], list: 'AIS / Certification', teams: [
      ['Curriculum', [['Lesson planner', 'claude', ['lesson map p10 to p52', 'learning outcomes', 'prerequisites']], ['Script writer', 'codex', ['lesson p52 script', 'nine steps, one idea each', 'cutting filler']], ['Quiz writer', 'muse', ['8 questions per lesson', 'answer checks', 'distractors that teach']], ['Example builder', 'codex', ['worked example for evals', 'sample client brief', 'starter files']], ['Glossary agent', 'dots', ['terms for each module', 'plain definitions', 'cross links']]]],
      ['Lesson edit', [['Recording cleaner', 'claude', ['silences out of p51', 'retakes removed', 'clean transcript']], ['Motion cards', 'claude', ['step cards for p52', 'term cards', 'outcome card']], ['Screen editor', 'claude', ['trimming screen recordings', 'zooms on clicks', 'cursor highlights']], ['Render agent', 'codex', ['p52 render', 'p51 render', 'upload to the classroom']], ['Lesson QA', 'codex', ['audio levels', 'card typos', 'matching the script']]]],
      ['Evals', [['Demo builder', 'codex', ['evals demo part 2', 'test set of 20 cases', 'scoring script']], ['Rubric writer', 'codex', ['capstone rubric', 'pass and fail examples', 'reviewer notes']], ['Edit agent', 'claude', ['rough cut of part 2', 'cutting to the script', 'ready for review']], ['Benchmark agent', 'grok', ['comparing model outputs', 'scoring consistency', 'flagging weak cases']], ['Docs agent', 'dots', ['evals guide', 'setup steps', 'FAQ']]]],
      ['Certification', [['Capstone reviewer', 'grok', ['reading new capstones', 'scoring against the rubric', 'notes for borderline cases']], ['Certificate agent', 'dots', ['next certificate IDs', 'certificate PDFs', 'drafts, nothing sent']], ['Email agent', 'codex', ['congrats email drafts', 'resubmit guidance', 'waiting for a yes']], ['Booth agent', 'claude', ['CAIC booth offer video', 'MG preview', 'final pass']], ['Directory agent', 'muse', ['certified consultant listing', 'profile cards', 'search tags']]]],
    ] },
  ];
  const DEPT_COLOR = { edit: '#f97316', hp: '#8a2b2b', live: '#0a72b5', pod: '#c2417a', caic: '#6b4fd8' };

  // named workers, deterministic so the same names appear every time
  const CODENAMES = 'Ada Arlo Bea Bodhi Cass Cleo Dax Dune Echo Ezra Fern Finn Gale Gus Hale Hux Indy Iris Jade Jett Juno Kai Kit Lark Lev Lumi Mae Milo Nell Nico Nova Oak Odin Ora Pax Pip Quin Rae Reed Remy Rio Rook Sage Sol Tate Tess Theo Uma Vale Vera Wren Xan Yara Zed Zion Briar Cove Ember Flint Halo Ivo Kestrel Lux Moss Onyx Penn Quill Ridge Sable Tarn Ulla Vesper Wynn'.split(' ');
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let n = 0; const TAKEN = new Set();
  for (const d of DEPTS) for (const [, agents] of d.teams) for (const a of agents) {
    const count = 14 + Math.floor(rnd() * 24);
    a.workers = Array.from({ length: count }, (_, i) => {
      const base = CODENAMES[(n * 7 + i * 13) % CODENAMES.length]; let num = ((n + i) * 37) % 100;
      while (TAKEN.has(`${base}-${String(num).padStart(2, '0')}`)) num = (num + 1) % 100;
      const name = `${base}-${String(num).padStart(2, '0')}`; TAKEN.add(name);
      return { name, task: a[2][i % a[2].length], on: rnd() < 0.55 };
    });
    n++;
  }
  const allAgents = DEPTS.flatMap((d) => d.teams.flatMap(([t, ag]) => ag.map((a) => ({ d, team: t, a }))));
  const TOTAL = allAgents.reduce((s, x) => s + x.a.workers.length, 0) + allAgents.length + DEPTS.length * 4 + DEPTS.length + 1;
  window.WF = { RT, DEPTS, TOTAL };

  const CHIEFS = { fable: 'Claude Fable 5.1', astra: 'GPT-6 Astra' };
  let chief = 'fable', openDept = 'hp', openAgent = null, ticker = [], timer = null, done = 4210 + Math.floor((Date.now() % 864e5) / 864e5 * 1800);
  const SHORT = { claude: 'Claude', codex: 'Codex', grok: 'Grok', muse: 'Muse', dots: 'Dots' };
  const badge = (rt, short) => `<span class="wf-rt" style="--rc:${RT[rt].color}" title="${RT[rt].name}"><i></i>${short ? SHORT[rt] : RT[rt].name}</span>`;

  // ---------- the pyramid ----------
  window.pyramidHtml = () => {
    const VW = 1160, X0 = 50, X1 = VW - 20, Y = [60, 170, 292, 400, 470];
    const colW = (X1 - X0) / DEPTS.length;
    const top = { x: X0 + (X1 - X0) / 2, y: Y[0] };
    const curve = (a, b) => `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}`;
    let k = 0, edges = '', nodes = '', workers = '', maxRows = 0;
    const edge = (a, b, w) => { const d = curve(a, b), i = k++; edges += `<path d="${d}" class="py-edge" style="stroke-width:${w}"/>` + (i % 2 === 0 ? `<circle r="2.4" class="py-down"><animateMotion dur="${(2.2 + (i % 5) * 0.35).toFixed(2)}s" begin="-${((i * 0.41) % 3).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>` : '') + (i % 3 === 0 ? `<circle r="2" class="py-up"><animateMotion dur="${(2.8 + (i % 4) * 0.4).toFixed(2)}s" begin="-${((i * 0.67) % 3).toFixed(2)}s" repeatCount="indefinite" path="${curve(b, a)}"/></circle>` : ''); };
    DEPTS.forEach((d, di) => {
      const cx = X0 + colW * (di + 0.5);
      edge({ x: top.x, y: top.y + 26 }, { x: cx, y: Y[1] - 22 }, 2);
      nodes += `<g class="py-div ${openDept === d.id ? 'on' : ''}" data-dept="${d.id}" style="--dc:${DEPT_COLOR[d.id]}"><rect x="${cx - 92}" y="${Y[1] - 22}" width="184" height="44" rx="12"/><text x="${cx}" y="${Y[1] - 3}" text-anchor="middle" class="py-t">${esc(d.name)}</text><text x="${cx}" y="${Y[1] + 12}" text-anchor="middle" class="py-s">${esc(d.head[0])} · ${esc(d.head[1])}</text></g>`;
      d.teams.forEach(([t, agents], ti) => {
        const tx = cx - colW / 2 + (colW * (ti + 0.5)) / 4;
        edge({ x: cx, y: Y[1] + 22 }, { x: tx, y: Y[2] - 10 }, 1.4);
        nodes += `<g class="py-lead"><rect x="${tx - 25}" y="${Y[2] - 10}" width="50" height="20" rx="6"/><text x="${tx}" y="${Y[2] + 4}" text-anchor="middle" class="py-l">${esc(t.length > 9 ? t.slice(0, 8) + '.' : t)}</text><title>${esc(t)} team · ${esc(d.name)}</title></g>`;
        agents.forEach((a, ai) => {
          const ax = tx - 20 + ai * 10;
          edge({ x: tx, y: Y[2] + 10 }, { x: ax, y: Y[3] - 4 }, 0.8);
          nodes += `<g class="py-spec"><circle cx="${ax}" cy="${Y[3]}" r="4" fill="${RT[a[1]].color}"/><title>${esc(a[0])} · ${esc(t)} · ${esc(d.name)} · ${a.workers.length} workers</title></g>`;
        });
      });
      const ws = d.teams.flatMap(([, ag]) => ag.flatMap((a) => a.workers.map((w) => ({ w, a }))));
      const per = Math.floor((colW - 18) / 5.2);
      ws.forEach(({ w, a }, i) => { const r = Math.floor(i / per), c = i % per; maxRows = Math.max(maxRows, r + 1); workers += `<circle cx="${(cx - colW / 2 + 9 + c * 5.2).toFixed(1)}" cy="${Y[4] + r * 5.2}" r="1.7" fill="${RT[a[1]].color}" class="py-w" style="animation-delay:-${((i * 0.137) % 3).toFixed(2)}s"><title>${esc(w.name)} · ${esc(a[0])}</title></circle>`; });
    });
    const H = Y[4] + maxRows * 5.2 + 20;
    const svg = `<svg class="pyramid" viewBox="0 0 ${VW} ${H}" role="img" aria-label="Agent org chart">
      ${['Chief agent', 'Departments', 'Teams', 'Agents', 'Workers'].map((t, i) => `<text x="0" y="${Y[i] - (i === 4 ? 12 : i === 3 ? 14 : 28)}" class="py-lvl">${t.toUpperCase()}</text>`).join('')}
      <g>${edges}</g>
      <g class="py-chief"><rect x="${top.x - 150}" y="${top.y - 26}" width="300" height="52" rx="16"/><text x="${top.x}" y="${top.y - 3}" text-anchor="middle" class="py-t w">Chief of Staff</text><text x="${top.x}" y="${top.y + 13}" text-anchor="middle" class="py-s">${CHIEFS[chief]}</text></g>
      ${nodes}<g>${workers}</g></svg>`;
    return `<section class="section py-wrap"><div class="section-head"><h2>The org chart</h2><span class="mono"><span class="py-key d"></span>tasks down <span class="py-key u"></span>reports up · click a department · simulated</span></div>
      <div class="py-bar"><span class="mono muted">Chief agent runs on</span>${Object.entries(CHIEFS).map(([k2, v]) => `<button class="seg ${chief === k2 ? 'on' : ''}" data-pyr="${k2}">${v}</button>`).join('')}
        <span class="py-sum mono">1 chief · ${DEPTS.length} departments · ${DEPTS.length * 4} teams · ${allAgents.length} agents · ${fmt(TOTAL)} total</span></div>
      ${svg}</section>`;
  };

  // ---------- one department, drilled down ----------
  function deptHtml(id) {
    const d = DEPTS.find((x) => x.id === id); if (!d) return '';
    const count = d.teams.reduce((s, [, ag]) => s + ag.reduce((t, a) => t + a.workers.length + 1, 0), 0);
    return `<section class="section wf-dept" style="--dc:${DEPT_COLOR[d.id]}">
      <div class="wf-dept-head"><div><span class="mono muted">department</span><h3>${esc(d.name)}</h3><span class="mono muted">${esc(d.list)}</span></div>
        <div class="wf-lead"><span class="mono">head</span><b>${esc(d.head[0])}</b><span class="wf-model mono">${esc(d.head[1])}</span></div>
        <span class="wf-count"><b>${fmt(count)}</b><span class="mono">agents</span></span></div>
      <div class="wf-teams">${d.teams.map(([t, agents]) => `<div class="wf-team"><div class="wf-team-h"><b>${esc(t)}</b><span class="mono muted">${agents.reduce((s, a) => s + a.workers.length + 1, 0)}</span></div>
        ${agents.map((a, ai) => { const key = `${d.id}|${t}|${ai}`; const busy = a.workers.filter((w) => w.on).length; return `<button class="wf-ag ${openAgent === key ? 'open' : ''}" data-ag="${key}" style="--rc:${RT[a[1]].color}">
          <span class="wf-ag-top"><b>${esc(a[0])}</b>${badge(a[1], true)}</span><span class="wf-ag-task">${esc(a[2][0])}</span>
          <span class="wf-ag-crew"><span class="wf-mini">${a.workers.slice(0, 24).map((w) => `<i class="${w.on ? 'on' : ''}"></i>`).join('')}</span><span class="mono muted">${busy}/${a.workers.length}</span></span></button>`; }).join('')}</div>`).join('')}</div>
      ${openAgent && openAgent.startsWith(d.id + '|') ? workersHtml(openAgent) : '<p class="wf-hint mono muted">Click any agent to see its named workers.</p>'}
    </section>`;
  }
  function workersHtml(key) {
    const [did, t, ai] = key.split('|'); const d = DEPTS.find((x) => x.id === did); const a = d.teams.find(([n2]) => n2 === t)[1][+ai];
    return `<div class="wf-workers" style="--rc:${RT[a[1]].color}"><div class="wf-workers-h"><b>${esc(a[0])}'s crew</b><span class="mono muted">${a.workers.length} workers · ${esc(t)} team · ${esc(d.name)}</span></div>
      <div class="wf-wgrid">${a.workers.map((w) => `<div class="wf-w ${w.on ? 'on' : ''}"><span class="wf-w-dot"></span><b>${esc(w.name)}</b><span>${esc(w.on ? w.task : 'idle, waiting for a task')}</span></div>`).join('')}</div></div>`;
  }
  function tickerHtml() { return ticker.slice(0, 7).map((t) => `<div class="wf-tk ${t.fresh ? 'fresh' : ''}"><span class="mono muted">${new Date(t.t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>${badge(t.rt)}<span><b>${esc(t.who)}</b> ${esc(t.what)}</span><span class="mono muted">${esc(t.where)}</span></div>`).join(''); }

  function step() {
    if (!document.querySelector('.wf-dept, .wf-ticker')) { clearInterval(timer); timer = null; return; }
    const x = allAgents[Math.floor(Math.random() * allAgents.length)];
    const w = x.a.workers[Math.floor(Math.random() * x.a.workers.length)];
    w.on = !w.on || Math.random() < 0.6; if (w.on) w.task = x.a[2][Math.floor(Math.random() * x.a[2].length)];
    done += 1 + Math.floor(Math.random() * 5);
    ticker.unshift({ t: Date.now(), rt: x.a[1], who: w.name, what: w.task, where: `${x.a[0]} · ${x.team} · ${x.d.name}`, fresh: true }); ticker = ticker.slice(0, 20);
    const tk = document.getElementById('wf-ticker'); if (tk) { tk.innerHTML = tickerHtml(); ticker.forEach((y) => (y.fresh = false)); }
    const dn = document.getElementById('wf-done'); if (dn) dn.textContent = fmt(done);
    document.querySelectorAll('.py-w').forEach((c) => { if (Math.random() < 0.04) c.classList.toggle('hot'); });
    if (openAgent) { const [did, t, ai] = openAgent.split('|'); const a = DEPTS.find((y) => y.id === did).teams.find(([n2]) => n2 === t)[1][+ai]; const box = document.querySelector('.wf-workers'); if (box && a === x.a) box.outerHTML = workersHtml(openAgent); }
  }
  const start = () => { if (!timer) timer = setInterval(step, 900); };

  EXT.views.workforce = {
    label: 'Workforce',
    wide: true,
    render() {
      crumbs(['Workforce']);
      return `<div class="page wf-page">
        <div class="eyebrow"><span class="tag">3 · Capabilities</span><span>departments, teams, agents and their workers · simulated</span></div>
        <h1>${fmt(TOTAL)} agents, five departments.</h1>
        <p class="lede">Editing, Humanly Possible, AIS Live, Podcast and CAIC each run the same shape: a head agent, four teams, five agents per team, and a named crew under every agent. Work comes in from ClickUp and goes back for a yes.</p>
        <div class="ed-stats"><div><b>${fmt(TOTAL)}</b><span>agents</span><em>every one has a name</em></div><div><b>${allAgents.length}</b><span>team agents</span><em>across ${DEPTS.length * 4} teams</em></div><div><b id="wf-done">${fmt(done)}</b><span>tasks finished today</span><em>each waits for review</em></div><div><b>0</b><span>changes without a yes</span><em>drafts only</em></div></div>
        ${window.pyramidHtml()}
        <div class="wf-tabs" id="wf-tabs">${DEPTS.map((d) => `<button class="seg ${openDept === d.id ? 'on' : ''}" data-dept="${d.id}" style="--dc:${DEPT_COLOR[d.id]}"><i></i>${esc(d.name)}</button>`).join('')}</div>
        <div class="wf-under"><div id="wf-dept-host">${deptHtml(openDept)}</div>
          <section class="section"><div class="section-head"><h2>Just finished</h2><span class="mono"><span class="live-dot"></span>live</span></div><div id="wf-ticker" class="wf-ticker">${tickerHtml()}</div></section></div>
      </div>`;
    },
    after() { start(); for (let i = 0; i < 7; i++) step(); },
  };

  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pyr]');
    if (p) { chief = p.dataset.pyr; const host = p.closest('.py-wrap'); if (host) host.outerHTML = window.pyramidHtml(); return; }
    const dp = e.target.closest('[data-dept]');
    if (dp) {
      openDept = dp.dataset.dept; openAgent = null;
      if (route.view !== 'workforce') return go('workforce');
      document.querySelectorAll('#wf-tabs .seg').forEach((b) => b.classList.toggle('on', b.dataset.dept === openDept));
      document.querySelectorAll('.py-div').forEach((g) => g.classList.toggle('on', g.dataset.dept === openDept));
      const host = document.getElementById('wf-dept-host'); if (host) { host.innerHTML = deptHtml(openDept); document.getElementById('wf-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    const ag = e.target.closest('[data-ag]');
    if (ag) { openAgent = openAgent === ag.dataset.ag ? null : ag.dataset.ag; const host = ag.closest('.wf-dept'); if (host) host.outerHTML = deptHtml(ag.dataset.ag.split('|')[0]); }
  });

  // each department's own org on its space page
  EXT.spaceExtras.push((sp) => {
    const d = DEPTS.find((x) => x.space === sp.id); if (!d) return '';
    setTimeout(start, 50);
    return `<div class="wf-space">${deptHtml(d.id)}<div class="wf-space-foot"><span></span><button class="mono" data-go="workforce" style="color:var(--blue-ink)">See all ${fmt(TOTAL)} agents</button></div></div>`;
  });
})();

// Media extension: Nate's YouTube channel + podcast episodes, Humanly Possible artifacts, routines.
(() => {
  const M = () => S?.ext?.media || {};
  const rawUrl = (abs) => 'raw' + abs.split('/').map(encodeURIComponent).join('/');
  const thumb = (id, q = 'maxresdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const compact = (n) => (n == null ? '–' : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.?0+$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n));
  const dur = (s) => { if (!s) return ''; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const day = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Premiere');
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const per1k = (v, k) => (v.views && v[k] != null ? (v[k] / v.views) * 1000 : null);
  const imgFallback = `onerror="if(!this.dataset.f){this.dataset.f=1;this.src=this.src.replace('maxresdefault','hqdefault')}"`;

  // ---------- shared pieces ----------
  const ytMedia = (id, q) => `<div class="mx-media" data-yt="${id}"><img src="${thumb(id, q)}" alt="" loading="lazy" ${imgFallback}><span class="mx-play" aria-hidden="true"></span></div>`;
  const localTile = (v, label) => `<button class="mx-local" data-vid="${esc(rawUrl(v.abs))}" title="${esc(v.rel || v.name)}">
      <video muted loop playsinline preload="metadata" src="${esc(rawUrl(v.abs))}#t=1"></video>
      <span class="mx-local-name">${esc(label || v.name.replace(/\.[^.]+$/, ''))}</span></button>`;

  // ---------- YouTube dashboard ----------
  function chart(list) {
    const vids = list.filter((v) => v.views != null).slice().reverse();
    if (!vids.length) return '';
    const max = Math.max(...vids.map((v) => v.views));
    const mean = avg(vids.map((v) => v.views));
    return `<div class="mx-chart" style="--avg:${(mean / max) * 100}%">
      <div class="mx-bars"><div class="mx-avg"><span class="mono">avg ${compact(Math.round(mean))}</span></div>${vids.map((v, i) => `<button class="mx-bar ${v.podcast ? 'pod' : ''}" data-yt-pop="${v.id}" style="--h:${Math.max(1.5, (v.views / max) * 100)}%;--i:${i}" aria-label="${esc(v.title)}, ${fmt(v.views)} views"><i></i></button>`).join('')}</div>
      <div class="mx-axis mono">${vids.map((v, i) => `<span>${i % 5 === 0 || i === vids.length - 1 ? day(v.date) : ''}</span>`).join('')}</div>
      <div class="mx-tip" hidden></div>
    </div>`;
  }
  function compare(uploads) {
    const groups = [['Podcast episodes', uploads.filter((v) => v.podcast)], ['Everything else', uploads.filter((v) => !v.podcast)]];
    const rows = [
      ['Avg views', (g) => avg(g.map((v) => v.views || 0)), compact],
      ['Views per day', (g) => avg(g.filter((v) => v.perDay).map((v) => v.perDay)), compact],
      ['Likes per 1K views', (g) => avg(g.map((v) => per1k(v, 'likes')).filter((x) => x != null)), (x) => x.toFixed(1)],
      ['Comments per 1K views', (g) => avg(g.map((v) => per1k(v, 'comments')).filter((x) => x != null)), (x) => x.toFixed(2)],
      ['Avg length', (g) => avg(g.map((v) => v.duration || 0)), dur],
    ];
    return `<div class="mx-compare">
      <div class="mx-cmp-legend mono"><span><i class="pod"></i>${groups[0][1].length} podcast</span><span><i></i>${groups[1][1].length} other uploads</span></div>
      ${rows.map(([label, f, show]) => {
        const a = f(groups[0][1]), b = f(groups[1][1]), m = Math.max(a, b) || 1;
        return `<div class="mx-cmp-row"><span class="mx-cmp-label">${label}</span>
          <div class="mx-cmp-bars"><div class="mx-cmp-bar pod" style="--w:${(a / m) * 100}%"><b>${show(a)}</b></div><div class="mx-cmp-bar" style="--w:${(b / m) * 100}%"><b>${show(b)}</b></div></div></div>`;
      }).join('')}
    </div>`;
  }
  function videoCard(v, big) {
    return `<article class="mx-card ${big ? 'big' : ''}">
      ${ytMedia(v.id)}
      <div class="mx-card-body">
        ${v.podcast ? '<span class="mx-badge">Podcast</span>' : ''}
        <h3>${esc(v.title)}</h3>
        <div class="mx-meta mono"><span><b>${compact(v.views)}</b> views</span><span>${v.perDay ? compact(v.perDay) + '/day' : 'Premiered today'}</span><span>${dur(v.duration)}</span><span>${day(v.date)}</span></div>
      </div></article>`;
  }
  function viewYoutube() {
    const y = M().youtube;
    crumbs(['YouTube']);
    if (!y) return `<div class="page"><h1>YouTube</h1><p class="lede">No channel data yet.</p></div>`;
    const ups = y.uploads;
    const total = ups.reduce((a, v) => a + (v.views || 0), 0);
    const pods = ups.filter((v) => v.podcast);
    const top = ups.filter((v) => v.views).sort((a, b) => b.views - a.views).slice(0, 5);
    const likeRate = avg(ups.map((v) => per1k(v, 'likes')).filter((x) => x != null));
    const fastest = ups.filter((v) => v.perDay && v.ageDays >= 1).sort((a, b) => b.perDay - a.perDay)[0];
    return `<div class="page mx-wide">
      <div class="eyebrow"><span class="tag">${esc(y.channel?.name || 'Nate Herk')}</span><span>${esc(y.channel?.handle || '')}</span><span>public data, refreshed ${ago(y.at)}${y.refreshing ? ' · refreshing now' : ''}</span></div>
      <h1>Nate's channel</h1>
      <p class="lede"><b>${compact(y.channel?.subscribers)}</b> subscribers. The last ${ups.length} uploads pulled <b>${compact(total)}</b> views, about <b>${compact(Math.round(total / ups.length))}</b> each. ${fastest ? `<b>${esc(fastest.title)}</b> is moving fastest at ${compact(fastest.perDay)} views a day.` : ''}</p>
      <div class="stats">
        <div class="stat"><b>${compact(y.channel?.subscribers)}</b><span>subscribers</span></div>
        <div class="stat"><b>${compact(total)}</b><span>views, last ${ups.length} uploads</span></div>
        <div class="stat"><b>${compact(Math.round(total / ups.length))}</b><span>avg per upload</span></div>
        <div class="stat"><b>${likeRate.toFixed(1)}</b><span>likes per 1K views</span></div>
        <div class="stat"><b>${pods.length}</b><span>podcast episodes in the last ${ups.length}</span></div>
      </div>
      <div class="section"><div class="section-head"><h2>Views by upload</h2><span class="mono"><i class="mx-key pod"></i>podcast <i class="mx-key"></i>other · oldest to newest · hover a bar</span></div>${chart(ups)}</div>
      <div class="section"><div class="section-head"><h2>Top performers</h2><span class="mono">click to play</span></div><div class="mx-grid three">${top.map((v, i) => videoCard(v, i === 0)).join('')}</div></div>
      <div class="mx-two">
        <div class="section"><div class="section-head"><h2>Podcast vs everything else</h2><span class="mono">last ${ups.length} uploads</span></div>${compare(ups)}</div>
        <div class="section"><div class="section-head"><h2>Podcast episodes</h2><button class="mono" data-go="space" data-id="podcast" style="color:var(--blue-ink)">Open Podcast space</button></div>${podcastList()}</div>
      </div>
      <div class="section"><div class="section-head"><h2>All uploads</h2><span class="mono">${ups.length}</span></div>
        ${ups.map((v) => `<div class="row mx-up-row"><div class="mx-up-thumb">${ytMedia(v.id, 'mqdefault')}</div><span class="mx-up-title">${v.podcast ? '<span class="mx-badge">Podcast</span>' : ''}${esc(v.title)}</span><span class="num">${fmt(v.views)}</span><span class="num">${v.likes != null ? fmt(v.likes) + ' likes' : ''}</span><span class="num">${v.comments != null ? fmt(v.comments) + ' comments' : ''}</span><span class="num">${v.perDay ? compact(v.perDay) + '/day' : ''}</span><span class="num">${dur(v.duration)}</span><span class="when">${day(v.date)}</span></div>`).join('')}
      </div>
    </div>`;
  }

  // ---------- Podcast ----------
  function episodes() {
    const m = M(); const y = m.youtube; const p = m.podcast;
    if (!p) return [];
    const all = [...(y?.uploads || []), ...(y?.extra || [])];
    return p.episodes.map((e) => ({ ...e, v: all.find((v) => v.id === e.id) || { id: e.id } }));
  }
  function podcastList() {
    return episodes().map((e) => `<div class="row mx-pod-row" data-yt-pop="${e.id}"><span class="mx-pod-avatar"><img src="${thumb(e.id, 'mqdefault')}" alt=""></span><span><b>${esc(e.guest)}</b><span class="muted mx-sub">${esc(e.v.title || '')}</span></span><span class="num">${compact(e.v.views)}</span><span class="when">${day(e.v.date)}</span></div>`).join('');
  }
  function podcastExtra(s) {
    if (s.id !== 'podcast') return '';
    const m = M(); const eps = episodes();
    if (!eps.length) return '';
    const withViews = eps.filter((e) => e.v.views);
    const total = withViews.reduce((a, e) => a + e.v.views, 0);
    const best = withViews.slice().sort((a, b) => b.v.views - a.v.views)[0];
    const latest = eps[0];
    return `<div class="section mx-pod">
      <div class="section-head"><h2>Episodes on YouTube</h2><button class="mono" data-go="youtube" style="color:var(--blue-ink)">Channel performance</button></div>
      <div class="mx-pod-stats">
        <div><b>${eps.length}</b><span>published episodes</span></div>
        <div><b>${compact(total)}</b><span>total views</span></div>
        <div><b>${compact(Math.round(total / (withViews.length || 1)))}</b><span>avg per episode</span></div>
        <div><b>${best ? compact(best.v.views) : '–'}</b><span>best: ${best ? esc(best.guest) : ''}</span></div>
      </div>
      <div class="mx-grid two">${eps.map((e, i) => `<article class="mx-card mx-ep ${i === 0 ? 'big' : ''}">
          ${ytMedia(e.id)}
          <div class="mx-card-body">
            <div class="mx-ep-head"><span class="mx-guest">${esc(e.guest)}</span>${i === 0 ? '<span class="mx-badge live">Latest</span>' : ''}</div>
            <h3>${esc(e.v.title || '')}</h3>
            <div class="mx-meta mono"><span><b>${compact(e.v.views)}</b> views</span>${e.v.likes != null ? `<span>${compact(e.v.likes)} likes</span>` : ''}${e.v.comments != null ? `<span>${fmt(e.v.comments)} comments</span>` : ''}<span>${e.v.perDay ? compact(e.v.perDay) + '/day' : ''}</span><span>${dur(e.v.duration)}</span><span>${day(e.v.date)}</span></div>
            ${e.local && !e.local.missing ? `<div class="mx-ep-local">
              <div class="mx-ep-local-head mono"><span>${fmt(e.local.videos)} cuts on the SSD · edited ${ago(e.local.last)}</span><button class="mx-link" data-act="reveal" data-path="${esc(e.local.abs)}">Open folder</button></div>
              ${i === 0 ? `<div class="mx-locals">${e.local.previews.slice(0, 4).map((v) => localTile(v)).join('')}</div>` : ''}</div>` : ''}
          </div></article>`).join('')}
      </div>
      ${(m.podcast.production || []).filter((p) => p.local && !p.local.missing).map((p) => `<div class="mx-prod"><span class="mx-badge">In production</span><b>${esc(p.folder)}</b><span class="mono muted">${fmt(p.local.videos)} video files · edited ${ago(p.local.last)}</span><button class="mx-link" data-act="reveal" data-path="${esc(p.local.abs)}">Open folder</button></div>`).join('')}
      ${m.podcast.cuts?.length ? `<div class="mx-sub-head mono">Latest cuts in renders/</div><div class="mx-locals wide">${m.podcast.cuts.map((v) => localTile(v)).join('')}</div>` : ''}
      ${!m.podcast.mounted ? '<p class="empty">The Extreme SSD is not mounted, so local cuts are hidden.</p>' : ''}
    </div>`;
  }

  // ---------- Humanly Possible ----------
  function hpExtra(s) {
    if (s.id !== 'humanly-possible') return '';
    const h = M().hp; if (!h) return '';
    return `<div class="section mx-hp">
      <div class="section-head"><h2>Artifacts</h2><span class="mono">${h.artifacts.length} on claude.ai · opens in a new tab</span></div>
      <div class="mx-gallery">${h.artifacts.map((a, i) => `<a class="mx-art ${i === 0 ? 'big' : ''}" href="${esc(a.url)}" target="_blank" rel="noopener">
          <span class="mx-art-shot"><img src="media/preview/${esc(a.preview)}" alt="" loading="lazy"></span>
          <span class="mx-art-body"><span class="mx-art-kind mono">${esc(a.kind)} · ${day(a.updated)}</span><b>${esc(a.title)}</b><span class="muted">${esc(a.about)}</span></span></a>`).join('')}
        ${(h.local || []).map((a) => `<button class="mx-art" data-file="${esc(a.abs)}" data-kind="page"><span class="mx-art-shot"><img src="media/preview/${esc(a.preview)}" alt="" loading="lazy"></span><span class="mx-art-body"><span class="mx-art-kind mono">Local page · preview here</span><b>${esc(a.title)}</b><span class="muted">${esc(a.about)}</span></span></button>`).join('')}
        ${h.repo ? `<a class="mx-art repo" href="${esc(h.repo.url)}" target="_blank" rel="noopener"><span class="mx-art-shot code"><span class="mono">$ git clone ${esc(h.repo.name)}</span><span class="mono">design-system/ · tokens · Claude + Codex</span></span><span class="mx-art-body"><span class="mx-art-kind mono">GitHub · repo</span><b>${esc(h.repo.name)}</b><span class="muted">${esc(h.repo.about)}</span></span></a>` : ''}
      </div>
      ${h.videos?.length ? `<div class="mx-sub-head mono">Motion · hover to play, click for sound</div><div class="mx-locals wide">${h.videos.map((v) => localTile(v, v.title)).join('')}</div>` : ''}
    </div>`;
  }

  // ---------- Routines ----------
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function human(cron) {
    if (cron === '@upload') return 'After each upload';
    const [m, h, , , dw] = cron.split(' ');
    if (m.startsWith('*/')) return `Every ${m.slice(2)} min`;
    if (h === '*') return 'Hourly';
    const t = `${h}:${m.padStart(2, '0')}`;
    if (dw === '*') return `Daily ${t}`;
    if (dw === '1-5') return `Weekdays ${t}`;
    const days = dw.split(',').map((d) => DOW[+d]);
    return days.length === 1 ? `${days[0]}s ${t}` : `${days.map((d) => d.slice(0, 3)).join(' and ')} ${t}`;
  }
  const until = (t) => {
    if (!t) return 'on next upload';
    const s = Math.max(0, Math.round((t - Date.now()) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(x).padStart(2, '0')}`;
  };
  const clock = (t) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const sod = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const pctOfDay = (t) => ((t - sod()) / 864e5) * 100;
  const spaceName = (id) => (typeof space === 'function' && space(id)?.name) || id;
  const statusLabel = { ok: 'Healthy', warn: 'Warning', stalled: 'Stalled', idle: 'Idle', missed: 'Missed' };

  function spark(hist) {
    const h = hist.slice().reverse();
    const max = Math.max(...h.map((x) => x.sec), 1);
    return `<span class="mx-spark">${h.map((x) => `<i class="${x.status}" style="--h:${x.status === 'missed' ? 18 : Math.max(18, (x.sec / max) * 100)}%" title="${esc(new Date(x.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))} · ${x.status}${x.sec ? ' · ' + x.sec + 's' : ''}"></i>`).join('')}</span>`;
  }
  function lanes(rs) {
    const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24];
    return `<div class="mx-lanes">
      <div class="mx-lane head"><span></span><div class="mx-track">${hours.map((h) => `<span class="mx-hour mono" style="left:${(h / 24) * 100}%">${h === 24 ? '' : h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : h - 12 + 'p'}</span>`).join('')}</div></div>
      ${rs.map((r) => `<div class="mx-lane"><span class="mx-lane-name">${esc(r.name)}</span><div class="mx-track">${hours.map((h) => `<i class="mx-grid-line" style="left:${(h / 24) * 100}%"></i>`).join('')}${r.today.map((t) => `<i class="mx-tick ${t <= Date.now() ? (r.status === 'stalled' ? 'missed' : 'done') : 'up'} ${r.today.length > 30 ? 'dense' : ''}" style="left:${pctOfDay(t)}%" title="${esc(r.name)} · ${clock(t)}"></i>`).join('')}</div></div>`).join('')}
      <div class="mx-now" style="--xf:${pctOfDay(Date.now()) / 100}"><span class="mono" data-now-label>${clock(Date.now())}</span></div>
    </div>`;
  }
  function routineRow(r, compactRow) {
    return `<div class="mx-rt ${compactRow ? 'compact' : ''}" data-rt="${r.id}">
      <div class="mx-rt-main">
        <span class="mx-dot ${r.status}"></span>
        <span class="mx-rt-name"><b>${esc(r.name)}</b>${compactRow ? '' : `<span class="muted">${esc(r.what)}</span>`}${r.note ? `<span class="mx-note">${esc(r.note)}</span>` : ''}</span>
        ${compactRow ? '' : `<span class="mx-rt-meta mono"><span>${esc(human(r.cron))}</span><span>${esc(r.skill)}</span><span class="mx-rt-space">${esc(spaceName(r.space))}</span></span>`}
        ${compactRow ? '' : spark(r.history)}
        <span class="mx-rt-last mono">${r.last ? `${statusLabel[r.status] || r.status} · ${ago(r.last)}${r.lastSec ? ` · ${r.lastSec}s` : ''}` : 'never'}</span>
        <span class="mx-rt-next mono"><span class="muted">next</span> <b data-next="${r.next || ''}">${until(r.next)}</b></span>
        <button class="btn mx-run" data-run-routine="${r.id}">Run now</button>
      </div>
      <div class="mx-rt-run" hidden></div>
    </div>`;
  }
  function viewRoutines() {
    const rs = M().routines || [];
    crumbs(['Routines']);
    const next = rs.filter((r) => r.next).sort((a, b) => a.next - b.next)[0];
    const ranToday = rs.reduce((a, r) => a + r.today.filter((t) => t <= Date.now()).length, 0);
    const flagged = rs.filter((r) => r.status !== 'ok');
    return `<div class="page mx-wide">
      <div class="eyebrow"><span class="tag">Scheduled agents</span><span>cron + skill + Claude Code</span></div>
      <h1>Routines</h1>
      <p class="lede"><b>${rs.length}</b> routines keep the OS current. <b>${ranToday}</b> runs so far today. Next up is <b>${esc(next?.name || '')}</b> in <b data-next="${next?.next || ''}">${until(next?.next)}</b>.${flagged.length ? ` ${flagged.length} need a look.` : ''}</p>
      <div class="section"><div class="section-head"><h2>Today</h2><span class="mono"><i class="mx-key done"></i>ran <i class="mx-key up"></i>scheduled <i class="mx-key missed"></i>missed</span></div>${lanes(rs)}</div>
      <div class="section"><div class="section-head"><h2>All routines</h2><span class="mono">last 14 runs · countdown to next</span></div>${rs.map((r) => routineRow(r)).join('')}</div>
    </div>`;
  }
  function routinesExtra(s) {
    const rs = M().routines || [];
    const mine = s.id === 'video-automation' ? rs.filter((r) => r.next).sort((a, b) => a.next - b.next).slice(0, 5) : rs.filter((r) => r.space === s.id);
    if (!mine.length) return '';
    return `<div class="section"><div class="section-head"><h2>${s.id === 'video-automation' ? 'Next routines across the OS' : 'Routines'}</h2><button class="mono" data-go="routines" style="color:var(--blue-ink)">All routines</button></div>${mine.map((r) => routineRow(r, true)).join('')}</div>`;
  }

  // Simulated run: animates the same staged progress bar as agent runs. Nothing executes.
  const RUN_STEPS = [['Queue', 'Queued'], ['Context', 'Loading context'], ['Run', 'Running the skill'], ['Write', 'Writing results'], ['Done', 'Done']];
  function simulate(id) {
    const row = document.querySelector(`.mx-rt[data-rt="${CSS.escape(id)}"]`); if (!row || row.classList.contains('running')) return;
    const r = (M().routines || []).find((x) => x.id === id);
    const box = row.querySelector('.mx-rt-run');
    row.classList.add('running'); box.hidden = false;
    box.innerHTML = `<div class="prog"><div class="prog-head"><span class="prog-label">Queued</span><span class="prog-pct mono">0%</span></div><div class="prog-track"><i class="prog-fill"></i></div><div class="prog-steps">${RUN_STEPS.map((s, i) => `<span data-i="${i}">${s[0]}</span>`).join('')}</div></div><div class="mx-rt-log mono"></div>`;
    const total = Math.min(7000, 2600 + (r?.avg || 30) * 25);
    const t0 = performance.now();
    const log = box.querySelector('.mx-rt-log');
    const lines = [`spawn ${r?.skill || id}`, 'read context and recent files', 'tools: Read, Grep, ClickUp (read-only)', 'write summary to the AIOS feed'];
    let shown = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / total);
      const eased = 1 - Math.pow(1 - p, 2.2);
      const phase = Math.min(RUN_STEPS.length - 1, Math.floor(p * (RUN_STEPS.length - 1) + (p >= 1 ? 1 : 0)));
      box.querySelector('.prog-fill').style.transform = `scaleX(${eased})`;
      box.querySelector('.prog-pct').textContent = `${Math.round(eased * 100)}%`;
      box.querySelector('.prog-label').textContent = RUN_STEPS[phase][1];
      box.querySelectorAll('.prog-steps span').forEach((s) => { const i = +s.dataset.i; s.classList.toggle('on', i <= phase); s.classList.toggle('now', i === phase && p < 1); });
      while (shown < lines.length && p > (shown + 0.4) / (lines.length + 0.5)) { log.insertAdjacentHTML('beforeend', `<div>${esc(lines[shown])}</div>`); shown++; }
      if (p < 1) return requestAnimationFrame(tick);
      box.querySelector('.prog').classList.add('complete');
      log.insertAdjacentHTML('beforeend', `<div class="ok">finished in ${(total / 1000).toFixed(1)}s</div>`);
      row.querySelector('.mx-dot').className = 'mx-dot ok';
      row.querySelector('.mx-rt-last').textContent = `Healthy · just now · ${(total / 1000).toFixed(0)}s`;
      setTimeout(() => { row.classList.remove('running'); box.hidden = true; }, 2600);
    };
    requestAnimationFrame(tick);
  }

  // Live countdowns and the now-marker, without re-rendering.
  setInterval(() => {
    document.querySelectorAll('[data-next]').forEach((el) => { const t = Number(el.dataset.next) || null; el.textContent = until(t); });
    const now = document.querySelector('.mx-now');
    if (now) { now.style.setProperty('--xf', pctOfDay(Date.now()) / 100); const l = now.querySelector('[data-now-label]'); if (l) l.textContent = clock(Date.now()); }
  }, 1000);

  // ---------- events ----------
  document.addEventListener('click', (e) => {
    const yt = e.target.closest('.mx-media[data-yt]');
    if (yt && !yt.querySelector('iframe')) {
      yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${yt.dataset.yt}?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      yt.classList.add('playing');
      return;
    }
    const pop = e.target.closest('[data-yt-pop]');
    if (pop) { openPlayer(pop.dataset.ytPop); return; }
    const vid = e.target.closest('.mx-local');
    if (vid) {
      const v = vid.querySelector('video');
      if (vid.classList.contains('live')) { v.pause(); v.muted = true; v.controls = false; vid.classList.remove('live'); }
      else { document.querySelectorAll('.mx-local.live video').forEach((o) => { o.pause(); o.muted = true; o.controls = false; o.closest('.mx-local').classList.remove('live'); }); v.muted = false; v.controls = true; v.currentTime = 0; v.play().catch(() => {}); vid.classList.add('live'); }
      return;
    }
    const run = e.target.closest('[data-run-routine]');
    if (run) { simulate(run.dataset.runRoutine); return; }
    if (e.target.closest('.mx-player-close') || e.target.classList.contains('mx-player')) closePlayer();
  });
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('.mx-local:not(.live)');
    if (t && !t.contains(e.relatedTarget)) t.querySelector('video')?.play().catch(() => {});
    const bar = e.target.closest('.mx-bar');
    if (bar) showTip(bar);
  });
  document.addEventListener('mouseout', (e) => {
    const t = e.target.closest('.mx-local:not(.live)');
    if (t && !t.contains(e.relatedTarget)) { const v = t.querySelector('video'); v?.pause(); }
    if (e.target.closest('.mx-bar') && !e.relatedTarget?.closest?.('.mx-bar')) document.querySelectorAll('.mx-tip').forEach((x) => (x.hidden = true));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePlayer(); });

  function showTip(bar) {
    const chartEl = bar.closest('.mx-chart'); const tip = chartEl.querySelector('.mx-tip');
    const v = [...(M().youtube?.uploads || [])].find((x) => x.id === bar.dataset.ytPop); if (!v) return;
    tip.innerHTML = `<img src="${thumb(v.id, 'mqdefault')}" alt=""><div><b>${esc(v.title)}</b><span class="mono">${fmt(v.views)} views · ${day(v.date)}${v.perDay ? ' · ' + compact(v.perDay) + '/day' : ''}</span></div>`;
    tip.hidden = false;
    const cr = chartEl.getBoundingClientRect(), br = bar.getBoundingClientRect();
    const ir = bar.querySelector('i').getBoundingClientRect();
    const x = Math.min(Math.max(br.left - cr.left + br.width / 2, 150), cr.width - 150);
    tip.style.left = x + 'px';
    tip.style.top = Math.max(0, ir.top - cr.top - 10) + 'px';
  }
  function openPlayer(id) {
    closePlayer();
    const v = [...(M().youtube?.uploads || []), ...(M().youtube?.extra || [])].find((x) => x.id === id) || { id, title: '' };
    const el = document.createElement('div');
    el.className = 'mx-player';
    el.innerHTML = `<div class="mx-player-box"><div class="mx-player-head"><b>${esc(v.title)}</b><button class="ghost mx-player-close">Close</button></div><div class="mx-player-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      <div class="mx-meta mono"><span><b>${fmt(v.views)}</b> views</span>${v.likes != null ? `<span>${fmt(v.likes)} likes</span>` : ''}${v.comments != null ? `<span>${fmt(v.comments)} comments</span>` : ''}<span>${dur(v.duration)}</span><span>${day(v.date)}</span></div></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
  }
  function closePlayer() { document.querySelectorAll('.mx-player').forEach((p) => p.remove()); }

  // ---------- register ----------
  EXT.views.youtube = { label: 'YouTube', wide: true, count: () => compact(M().youtube?.channel?.subscribers), render: viewYoutube };
  EXT.views.routines = { label: 'Routines', wide: true, count: () => (M().routines || []).length || '', render: viewRoutines };
  EXT.spaceExtras.push(podcastExtra, hpExtra, routinesExtra);
})();

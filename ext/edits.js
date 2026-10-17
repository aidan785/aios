// Real edit stats for the Pipeline view and pipeline spaces, from the cut lists the editing agents write.
(() => {
  const E = () => S.ext?.edits;
  const hm = (sec) => { sec = Math.round(sec || 0); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`; };
  const pretty = (id) => id.replace(/-(\d{4}|\d{2}-\d{2})$/, '').replace(/-/g, ' ').replace(/\b(caic|ais|ai|mg|vfx)\b/gi, (w) => w.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());

  // a stacked bar: kept footage, silences cut, mistakes cut
  const split = (p) => {
    const total = p.source || (p.final + p.silenceSec + p.mistakeSec) || 1;
    const k = Math.max(0, total - p.silenceSec - p.mistakeSec);
    return `<span class="ed-split" title="${hm(k)} kept, ${hm(p.silenceSec)} silence, ${hm(p.mistakeSec)} mistakes"><i class="k" style="flex:${k}"></i><i class="s" style="flex:${p.silenceSec}"></i><i class="m" style="flex:${p.mistakeSec}"></i></span>`;
  };

  window.editStatsHtml = (compact) => {
    const e = E(); if (!e) return '';
    const t = e.totals;
    const saved = t.silenceSec + t.mistakeSec;
    return `<div class="ed-stats ${compact ? 'compact' : ''}">
      <div><b>${fmt(t.silences)}</b><span>silences cut</span><em>${hm(t.silenceSec)} of dead air</em></div>
      <div><b>${fmt(t.mistakes)}</b><span>mistakes cut</span><em>retakes, false starts, stutters</em></div>
      <div><b>${hm(saved)}</b><span>cut by agents</span><em>${hm(t.source)} raw to ${hm(t.final)} final</em></div>
      <div><b>${fmt(t.edited)}</b><span>edits through the pipeline</span><em>${t.month} touched this month</em></div>
    </div>`;
  };

  window.latestEditsHtml = (n = 6) => {
    const e = E(); if (!e?.recent?.length) return '';
    return `<section class="section ed-latest"><div class="section-head"><h2>Latest edits</h2><span class="mono"><i class="ed-key k"></i>kept <i class="ed-key s"></i>silence cut <i class="ed-key m"></i>mistakes cut</span></div>
      ${e.recent.slice(0, n).map((p, i) => `<button class="ed-row" ${p.render ? `data-file="${esc(p.render)}" data-kind="video"` : `data-act="reveal" data-path="${esc(p.dir)}"`}>
        <span class="ed-name"><b>${esc(pretty(p.id))}</b>${i === 0 ? '<span class="ed-new mono">latest</span>' : ''}<span class="mono muted">${ago(p.last)}${p.render ? ' · plays the latest render' : ''}</span></span>
        ${split(p)}
        <span class="ed-nums mono"><span>${p.silences} silences</span><span>${p.mistakes} mistakes</span></span>
        <span class="ed-dur mono">${p.source ? `${hm(p.source)} <span class="muted">to</span> <b>${hm(p.final)}</b>` : ''}</span>
      </button>`).join('')}
    </section>`;
  };

  // pipeline spaces get the numbers too
  const isPipe = (s) => (s.id === 'editing-pipeline' || s.id === 'video-automation') && E();
  EXT.spaceTop.push((s) => (isPipe(s) ? editStatsHtml(true) : ''));
  EXT.spaceExtras.push((s) => (isPipe(s) ? latestEditsHtml(4) : ''));
})();

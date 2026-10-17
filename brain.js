// Brain: how every space connects. Ring layout by group, the Executive Assistant at the center.
const BW = 1100, BH = 760, BCX = 550, BCY = 380, RX = 340, RY = 285;
let brainHover = null;

function brainLayout(list) {
  const pos = {};
  const ring = list.filter((s) => s.id !== 'ea');
  const groups = groupsWithSpaces(ring);
  const slots = ring.length + groups.length; // one empty slot between groups
  let k = 0;
  for (const g of groups) {
    for (const s of g.items) {
      const a = -Math.PI / 2 + (k / slots) * Math.PI * 2 + 0.34;
      pos[s.id] = { x: BCX + Math.cos(a) * RX, y: BCY + Math.sin(a) * RY, a };
      k++;
    }
    k++;
  }
  pos.ea = { x: BCX, y: BCY, a: 0 };
  for (const [id, p] of Object.entries(O.brainPos || {})) if (pos[id]) Object.assign(pos[id], p);
  return pos;
}

function edgePath(a, b) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const cx = mx + (BCX - mx) * 0.45, cy = my + (BCY - my) * 0.45;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

function brainSvg() {
  const list = spaces();
  const ids = new Set(list.map((s) => s.id));
  const pos = brainLayout(list);
  const links = S.links.filter((l) => ids.has(l.from) && ids.has(l.to));
  const order = Object.fromEntries(list.map((s, i) => [s.id, i]));
  const edges = links.map((l, i) => {
    const d = l.kind === 'hub' ? `M${pos[l.from].x.toFixed(1)},${pos[l.from].y.toFixed(1)} L${pos[l.to].x.toFixed(1)},${pos[l.to].y.toFixed(1)}` : edgePath(pos[l.from], pos[l.to]);
    const delay = 350 + (l.kind === 'hub' ? 0 : 300) + i * 35;
    const pulse = l.kind === 'curated' ? `<circle r="3.2" class="pulse-dot" opacity="0"><animateMotion dur="${(3.2 + (i % 4) * 0.7).toFixed(1)}s" begin="${(1.8 + (i % 7) * 0.45).toFixed(2)}s" repeatCount="indefinite" path="${d}"/><animate attributeName="opacity" values="0;.95;.95;0" keyTimes="0;.15;.85;1" dur="${(3.2 + (i % 4) * 0.7).toFixed(1)}s" begin="${(1.8 + (i % 7) * 0.45).toFixed(2)}s" repeatCount="indefinite"/></circle>` : '';
    return `<g class="eg" data-from="${l.from}" data-to="${l.to}"><path class="edge ${l.kind}" d="${d}" style="--d:${delay}ms"><title>${esc(space(l.from).name)} to ${esc(space(l.to).name)}: ${esc(l.kind === 'auto' ? l.evidence.join(', ') : l.label)}</title></path>${pulse}</g>`;
  }).join('');
  const groupLabels = groupsWithSpaces(list.filter((s) => s.id !== 'ea')).map((g) => {
    const as = g.items.map((s) => pos[s.id].a);
    const a = as.reduce((x, y) => x + y, 0) / as.length;
    const x = BCX + Math.cos(a) * (RX + 175), y = BCY + Math.sin(a) * (RY + 80);
    return `<text class="glabel" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${esc(g.name.toUpperCase())}</text>`;
  }).join('');
  const nodes = list.map((s) => {
    const p = pos[s.id];
    const center = s.id === 'ea';
    const right = p.x >= BCX + 4, left = p.x <= BCX - 4;
    const anchor = center ? 'middle' : right ? 'start' : left ? 'end' : 'middle';
    const tx = center ? 0 : right ? 20 : left ? -20 : 0;
    const ty = center ? 46 : (!right && !left ? (p.y < BCY ? -22 : 30) : 4);
    const size = center ? 22 : 12;
    const halo = center ? 56 : 26;
    const deg = linksFor(s.id).filter((l) => l.kind !== 'hub').length;
    return `<g class="node" data-node="${s.id}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})"><g class="nbody" style="--d:${center ? 150 : 200 + order[s.id] * 45}ms">
      <rect class="halo" x="${-halo / 2}" y="${-halo / 2}" width="${halo}" height="${halo}" rx="${center ? 16 : 8}"/>
      <rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="${center ? 6 : 3.5}" fill="${center ? 'var(--ink)' : s.color}"/>
      ${center ? `<rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5" fill="var(--blue)"/>` : ''}
      <text x="${tx}" y="${ty}" text-anchor="${anchor}" class="nlabel ${center ? 'center' : ''}">${esc(center ? 'Executive Assistant' : s.name)}</text>
      ${center ? `<text x="0" y="${ty + 17}" text-anchor="middle" class="nmeta">the brain</text>` : `<text x="${tx}" y="${ty + 17}" text-anchor="${anchor}" class="nmeta">${deg} link${deg === 1 ? '' : 's'} · ${ago(s.last)}</text>`}
    </g></g>`;
  }).join('');
  return `<svg class="brain" viewBox="0 0 ${BW} ${BH}" role="img" aria-label="Map of how the spaces connect">${groupLabels}<g>${edges}</g>${O.brainAgents ? agentLayer(pos) : ''}${nodes}</svg>`;
}

// Research agents orbit inside the ring, wired to the space they feed; the ClickUp crew sits under the brain.
function agentLayer(pos) {
  const runs = (S.research || []).filter((r) => !r.missing && pos[r.feeds]);
  const byTarget = {};
  for (const r of runs) (byTarget[r.feeds] ||= []).push(r);
  let out = '', i = 0;
  for (const [t, list] of Object.entries(byTarget)) {
    const a0 = pos[t].a;
    list.forEach((r, j) => {
      const a = a0 + (j - (list.length - 1) / 2) * 0.2;
      const f = list.length > 2 ? 0.6 + (j % 2) * 0.1 : 0.62;
      const x = BCX + Math.cos(a) * RX * f, y = BCY + Math.sin(a) * RY * f;
      const d = `M${x.toFixed(1)},${y.toFixed(1)} L${pos[t].x.toFixed(1)},${pos[t].y.toFixed(1)}`;
      const right = x >= BCX;
      out += `<g class="sat" data-run="${r.id}"><path class="sat-edge" d="${d}"/><circle r="2.6" class="pulse-dot"><animateMotion dur="${(2.2 + (i % 3) * 0.5).toFixed(1)}s" begin="-${(i * 0.3 + 0.1).toFixed(1)}s" repeatCount="indefinite" path="${d}"/></circle>
        <rect x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12" rx="2.5" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})" class="sat-node"/>
        <text x="${(x + (right ? -12 : 12)).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${right ? 'end' : 'start'}" class="sat-label">${esc(r.name)}</text></g>`;
      i++;
    });
  }
  const ex = BCX, ey = BCY + 92;
  const d = `M${ex},${ey} L${BCX},${BCY + 14}`;
  out += `<g class="sat" data-run-mode="crew"><path class="sat-edge" d="${d}"/><circle r="2.6" class="pulse-dot"><animateMotion dur="1.8s" repeatCount="indefinite" path="${d}"/></circle><rect x="${ex - 6}" y="${ey - 6}" width="12" height="12" rx="2.5" transform="rotate(45 ${ex} ${ey})" class="sat-node crew"/><text x="${ex}" y="${ey + 22}" text-anchor="middle" class="sat-label">ClickUp crew</text></g>`;
  return out;
}

// Highlight the focused space's connections in place, so the flow animation keeps running.
function applyBrainFocus() {
  const svg = document.querySelector('svg.brain'); if (!svg) return;
  const focus = brainHover || route.id;
  const near = new Set([focus]);
  svg.querySelectorAll('.eg').forEach((g) => {
    const on = focus && (g.dataset.from === focus || g.dataset.to === focus);
    if (on) { near.add(g.dataset.from); near.add(g.dataset.to); }
    const path = g.querySelector('path');
    path.classList.toggle('on', !!on);
    path.classList.toggle('dim', !!focus && !on);
    const dot = g.querySelector('.pulse-dot');
    if (dot) dot.style.visibility = !focus || on ? 'visible' : 'hidden';
  });
  svg.querySelectorAll('.node').forEach((n) => {
    n.classList.toggle('dim', !!focus && !near.has(n.dataset.node));
    n.classList.toggle('sel', n.dataset.node === route.id);
  });
}

function drawBrain(animate) {
  const c = document.getElementById('brain-canvas'); if (!c) return;
  c.innerHTML = brainSvg();
  if (animate) {
    c.querySelectorAll('path.edge').forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
    c.classList.add('drawing');
    clearTimeout(drawBrain.t);
    drawBrain.t = setTimeout(() => c.classList.remove('drawing'), 3400);
  }
  applyBrainFocus();
}

function brainDetail() {
  const s = route.id && space(route.id);
  if (!s) {
    const curated = S.links.filter((l) => l.kind === 'curated').length;
    const auto = S.links.filter((l) => l.kind === 'auto').length;
    return `<div class="brain-detail">
      <h2>How to read it</h2>
      <p class="about" style="font-size:13.5px">The Executive Assistant sits at the center: it holds the context, priorities and decisions every space runs on. Solid lines are connections you wrote down. Dashed lines are ones the scan found on its own, from shared folders or shared skills.</p>
      <div class="kv"><span>Written connections</span><span>${curated}</span></div>
      <div class="kv"><span>Found by scan</span><span>${auto}</span></div>
      <div class="kv"><span>Tracked by the EA</span><span>${S.links.filter((l) => l.kind === 'hub').length}</span></div>
      <p class="muted" style="font-size:12.5px;margin-top:14px">Click a space to trace it. ${editing ? 'Drag nodes to rearrange.' : 'Press Edit to rearrange or add connections.'}</p>
    </div>`;
  }
  const ls = linksFor(s.id);
  const others = spaces().filter((o) => o.id !== s.id);
  return `<div class="brain-detail">
    <div class="eyebrow"><span class="tag" style="color:${s.color}">${idx(s.id)}</span><span>${esc(s.status)}</span></div>
    <h2 style="font-size:20px;margin:6px 0 4px">${esc(s.name)}</h2>
    <p class="muted" style="margin:0 0 10px;font-size:13px">${esc(s.tagline)}</p>
    <button class="btn" data-go="space" data-id="${s.id}" style="margin-bottom:14px">Open space</button>
    ${ls.map((l) => {
      const o = space(l.from === s.id ? l.to : l.from); if (!o) return '';
      const removable = editing && l.kind === 'curated';
      return `<div class="conn static"><span class="conn-dir mono">${l.kind === 'hub' ? 'brain' : l.from === s.id ? 'to' : 'from'}</span><span style="min-width:0"><b><span class="sw" style="background:${o.color}"></span>${esc(o.name)}</b><p>${esc(l.kind === 'auto' ? l.evidence.join(' · ') : l.label)}${l.kind === 'curated' && l.evidence.length ? ` <span class="mono" style="color:var(--muted)">· ${esc(l.evidence.join(' · '))}</span>` : ''}</p></span>${removable ? `<button class="mono unlink" data-unlink="${l.from}>${l.to}">Remove</button>` : ''}</div>`;
    }).join('')}
    ${editing ? `<div class="new-link">
      <h4 class="mono muted" style="margin:18px 0 8px;font-weight:400">New connection</h4>
      <select class="field" id="nl-to">${others.map((o) => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select>
      <input class="field" id="nl-label" placeholder="How does ${esc(s.name)} feed it?">
      <button class="btn primary" id="nl-add">Connect</button>
    </div>` : ''}
  </div>`;
}

function brainList() {
  const list = spaces();
  return groupsWithSpaces(list).map((g) => `<div class="section"><div class="section-head"><h2>${esc(g.name)}</h2><span class="mono">${esc(g.note || '')}</span></div>
    ${g.items.map((s) => {
      const out = S.links.filter((l) => l.from === s.id && l.kind !== 'hub' && space(l.to));
      if (!out.length) return '';
      return `<div class="brain-row"><button class="brain-from" data-go="brain" data-id="${s.id}"><span class="sw" style="background:${s.color}"></span>${esc(s.name)}</button><div>${out.map((l) => `<div class="brain-edge"><span class="mono muted">→</span> <button class="brain-to" data-go="brain" data-id="${l.to}">${esc(space(l.to).name)}</button><span class="muted"> ${esc(l.kind === 'auto' ? l.evidence.join(', ') : l.label)}</span></div>`).join('')}</div></div>`;
    }).join('')}</div>`).join('');
}

function viewBrain() {
  crumbs(route.id && space(route.id) ? ['Brain', space(route.id).name] : ['Brain']);
  return `<div class="page brain-page">
    <div class="eyebrow"><span class="tag">Brain</span><span>${S.links.filter((l) => l.kind !== 'hub').length} connections across ${spaces().length} spaces</span></div>
    <h1>How it all connects</h1>
    <p class="lede">One map of what feeds what: the events, the podcast, CAIC, the show, and the pipelines that build all of it.</p>
    <div class="brain-grid">
      <div class="brain-canvas" id="brain-canvas"></div>
      <div id="brain-detail">${brainDetail()}</div>
    </div>
    <div class="actions"><button class="btn ${O.brainAgents ? 'primary' : ''}" id="brain-agents">${O.brainAgents ? 'Hide' : 'Show'} the agents layer</button>${editing ? `<button class="btn" id="brain-reset">Reset layout</button>` : ''}</div>
    <div class="section"><div class="section-head"><h2>Every connection</h2><span class="mono">reads like a map of the business</span></div></div>
    ${brainList()}
  </div>`;
}

function refreshBrain() { applyBrainFocus(); }

// hover, select, drag
let brainDrag = null, brainMoved = false;
document.addEventListener('pointerover', (e) => {
  const n = e.target.closest?.('[data-node]');
  if (!document.getElementById('brain-canvas') || brainDrag) return;
  const id = n ? n.dataset.node : null;
  if (id !== brainHover) { brainHover = id; applyBrainFocus(); }
});
document.addEventListener('pointerdown', (e) => {
  const n = e.target.closest?.('[data-node]');
  if (!n) return;
  brainMoved = false;
  if (editing) { brainDrag = n.dataset.node; e.preventDefault(); }
});
document.addEventListener('pointermove', (e) => {
  if (!brainDrag) return;
  const svg = document.querySelector('svg.brain'); if (!svg) return;
  const r = svg.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * BW, y = ((e.clientY - r.top) / r.height) * BH;
  O.brainPos = { ...(O.brainPos || {}), [brainDrag]: { x: Math.max(20, Math.min(BW - 20, x)), y: Math.max(20, Math.min(BH - 20, y)) } };
  brainMoved = true; drawBrain(false);
});
document.addEventListener('pointerup', (e) => {
  const n = e.target.closest?.('[data-node]');
  if (brainDrag && brainMoved) { save({ brainPos: O.brainPos }, true); brainDrag = null; return; }
  brainDrag = null;
  if (n && document.getElementById('brain-canvas')) {
    route = { view: 'brain', id: route.id === n.dataset.node ? undefined : n.dataset.node };
    brainHover = null;
    document.getElementById('brain-detail').innerHTML = brainDetail();
    crumbs(route.id && space(route.id) ? ['Brain', space(route.id).name] : ['Brain']);
    applyBrainFocus(); renderRail();
  }
});
document.addEventListener('dblclick', (e) => { const n = e.target.closest?.('[data-node]'); if (n) go('space', { id: n.dataset.node }); });

async function relink(patch) {
  Object.assign(O, patch);
  await fetch('/api/overrides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(O) });
  await fetch('/api/relink', { method: 'POST' });
  await load(); renderMain(); renderRail();
}
document.addEventListener('click', async (e) => {
  if (e.target.id === 'nl-add') {
    const to = document.getElementById('nl-to').value, label = document.getElementById('nl-label').value.trim();
    if (!label) return toast('Say how they connect');
    await relink({ links: [...(O.links || []), { from: route.id, to, label }] });
    toast('Connected');
  }
  if (e.target.dataset?.unlink) {
    const key = e.target.dataset.unlink;
    const [from, to] = key.split('>');
    const inOverrides = (O.links || []).some((l) => l.from === from && l.to === to);
    await relink(inOverrides ? { links: O.links.filter((l) => !(l.from === from && l.to === to)) } : { removedLinks: [...(O.removedLinks || []), key] });
    toast('Removed');
  }
  if (e.target.id === 'brain-agents') { O.brainAgents = !O.brainAgents; save({ brainAgents: O.brainAgents }, true); renderMain.last = null; renderMain(); $('#main').scrollTop = 0; return; }
  if (e.target.id === 'brain-reset') { O.brainPos = {}; save({ brainPos: {} }, true); drawBrain(true); }
});

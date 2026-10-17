// Creative OS toolkit: every creative tool in use, grouped by craft.
(() => {
  window.toolkitHtml = () => {
    const t = S.ext?.creativetools; if (!t) return '';
    const total = t.groups.reduce((n, g) => n + g.tools.length, 0);
    const calls = { 'Premiere Pro': 'premiere', 'After Effects': 'aftereffects', Blender: 'blender', ComfyUI: 'comfy', 'Higgsfield Soul ID': 'higgsfield', Figma: 'figma', Photoshop: 'photoshop' };
    const use = (x) => { const a = S.ext?.pipeline?.apps?.find((p) => p.id === calls[x.name]); return a?.calls ? `${fmt(a.calls)} ${a.calls === 1 ? "call" : "calls"}` : x.files ? `${fmt(x.files)} files` : ''; };
    return `<section class="section tk"><div class="section-head"><h2>The full toolkit</h2><span class="mono">${total} creative tools across ${t.groups.length} crafts, calls from Claude, or files that use it</span></div>
      <div class="tk-grid">${t.groups.map((g) => `<div class="tk-group"><span class="tk-g-n mono">${esc(g.name)}</span>
        ${g.tools.map((x) => `<div class="tk-tool"><span class="co-tile sm" style="background:${x.color}">${esc(x.short)}</span><span class="tk-t"><b>${esc(x.name)}</b><span class="mono">${esc(x.how)}${x.installed ? ' · installed' : ''}</span></span><span class="tk-n mono">${use(x)}</span></div>`).join('')}</div>`).join('')}</div></section>`;
  };
})();

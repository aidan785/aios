// Static snapshot shim: answers the AIOS server's API from files so the app runs on GitHub Pages.
(() => {
  const real = window.fetch.bind(window);
  const json = (o) => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const RUNS = {
    crew: [
      ['spawn', { agent: 'Orchestrator', child: 'ClickUp scout' }], ['spawn', { agent: 'Orchestrator', child: 'Calendar scout' }], ['spawn', { agent: 'Orchestrator', child: 'Pipeline scout' }],
      ['step', { agent: 'ClickUp scout', tool: 'ClickUp', detail: 'Weekly Commitments, open tasks due this week' }],
      ['step', { agent: 'Calendar scout', tool: 'Calendar', detail: 'Next 7 days' }],
      ['step', { agent: 'Pipeline scout', tool: 'Read', detail: 'video-projects, newest renders' }],
      ['report', { agent: 'Calendar scout' }], ['report', { agent: 'ClickUp scout' }], ['report', { agent: 'Pipeline scout' }],
      ['text', { delta: 'This week: the AIS Live VIP Room session on Saturday, two Humanly Possible pilot edits in progress, and the CAIC lesson renders waiting on review. ' }],
      ['text', { delta: 'Biggest risk is the pilot edit standard, which blocks editor training.' }],
    ],
    ask: [
      ['step', { agent: 'Orchestrator', tool: 'Read', detail: 'AIOS state snapshot' }],
      ['step', { agent: 'Orchestrator', tool: 'Grep', detail: 'projects, skills, sessions' }],
      ['text', { delta: 'This is a static snapshot of AIOS, so answers here are pre-recorded. ' }],
      ['text', { delta: 'On the live version the question goes to a headless Claude Code session that reads the same folders, logs and tools you see on screen.' }],
    ],
  };
  function run(mode) {
    const enc = new TextEncoder(); const t0 = Date.now();
    return new Response(new ReadableStream({ async start(c) {
      const send = (o) => c.enqueue(enc.encode('data: ' + JSON.stringify(o) + '\n\n'));
      send({ type: 'start', mode });
      for (const [type, ev] of RUNS[mode] || RUNS.ask) { await wait(type === 'text' ? 500 : 900); send({ type, ...ev }); }
      await wait(400); send({ type: 'done', ok: true, result: '', ms: Date.now() - t0, cost: 0 }); send({ type: 'closed', code: 0 }); c.close();
    } }), { headers: { 'Content-Type': 'text/event-stream' } });
  }
  window.fetch = async (input, init = {}) => {
    const u = typeof input === 'string' ? input : input.url;
    if (!u.startsWith('/api/')) return real(input, init);
    const p = u.split('?')[0];
    if (p === '/api/state') return real('state.json');
    if (p === '/api/find') { const q = new URLSearchParams(u.split('?')[1]).get('q') || '';
      if (/^vsl$/i.test(q)) return real('find-vsl.json');
      return json({ total: 0, ms: 0, results: [] }); }
    if (p === '/api/run') { const { mode } = JSON.parse(init.body || '{}'); return run(mode === 'crew' ? 'crew' : 'ask'); }
    if (p === '/api/text') return json({ error: 'File contents stay on the local machine in this snapshot.' });
    return json({ ok: true, snapshot: true }); // overrides, rescan, relink, action: no-ops
  };
})();

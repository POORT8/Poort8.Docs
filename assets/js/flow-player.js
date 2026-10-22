// Interactive flow player for the sequence diagrams in the guides.
// A guide embeds <div data-flow-player="media/<page>.scene.json"></div>; index.html mounts it.
// Parties, arrows and phases come from the page's Mermaid sequenceDiagram (a `rect` block is a phase);
// the scene file adds the intro, roles, phase frequencies, annotations and the closing card.

const W = 1280, H = 720, M = 48;
const NS = 'http://www.w3.org/2000/svg';

const STRINGS = {
  en: { phase: 'Phase', party: ['party', 'parties'], phaseWord: ['phase', 'phases'], openPoint: 'Open point',
        play: 'Play', pause: 'Pause', prev: 'Previous step', next: 'Next step', position: 'Position', intro: 'Intro', step: 'Step',
        numbers: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'] },
  nl: { phase: 'Fase', party: ['partij', 'partijen'], phaseWord: ['fase', 'fases'], openPoint: 'Open punt',
        play: 'Afspelen', pause: 'Pauzeren', prev: 'Vorige stap', next: 'Volgende stap', position: 'Positie', intro: 'Intro', step: 'Stap',
        numbers: ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'] },
};
let instances = 0;

const STYLE = `
.flow {
  --bg: #f4f6f9; --ink: #232a5c; --text: #3a4257; --muted: #7d879b; --line: #c3cad6;
  --card: #ffffff; --card-border: #3a4660; --hl: #d7e7f2; --hl-border: #7fa9c7;
  --arrow: #2f8fc4; --code: #1f7fb3; --chip: #e2b33c; --chip-line: #9c7a1c; --chip-ink: #3d300a;
  --badge: #f1e2ad; --badge-ink: #4a3d12; --banner: #f1eedf; --banner-line: #e2dcc0; --banner-ink: #6b5d2e;
  --ill: #dfe3ec; --ill-dark: #cfd5e1; --control: #ffffff; --focus: #0a7fb3;
  --font-display: 'Poppins', 'Inter', system-ui, sans-serif;
  --font-body: 'IBM Plex Sans', 'Inter', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
  max-width: 1280px; margin: 1.5em 0; display: grid; gap: 12px; color: var(--text); font-family: var(--font-body);
}
.flow > svg { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; }
.flow .caption { margin: 0; min-height: 2.6em; font-size: 15px; line-height: 1.4; color: var(--text); }
.flow .caption b { color: var(--ink); font-weight: 600; }
.flow .caption code { font-family: var(--font-mono); font-size: 0.93em; color: var(--code); background: none; padding: 0; }
.flow .bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.flow .bar button, .flow .phases button {
  font: inherit; color: var(--ink); background: var(--control); border: 1.3px solid var(--card-border);
  border-radius: 4px; cursor: pointer;
}
.flow .bar button { width: 40px; height: 36px; display: grid; place-items: center; padding: 0; }
.flow .bar button svg { width: 18px; height: 18px; fill: currentColor; }
.flow .bar [data-role="play"] { width: 48px; background: var(--ink); color: var(--bg); border-color: var(--ink); }
.flow .bar input[type=range] { flex: 1 1 160px; min-width: 0; accent-color: var(--arrow); }
.flow .bar .time { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; min-width: 6.5em; text-align: right; }
.flow .phases { display: flex; gap: 8px; flex-wrap: wrap; }
.flow .phases button { font-size: 13px; padding: 5px 10px; }
.flow .phases button[aria-current="step"] { background: var(--hl); border-color: var(--hl-border); font-weight: 600; }
.flow button:focus-visible, .flow input:focus-visible, .flow:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.flow .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.flow svg text { font-family: var(--font-body); }
.flow .title { font-family: var(--font-display); font-weight: 700; fill: var(--ink); }
.flow .h2 { font-family: var(--font-display); font-weight: 600; fill: var(--ink); font-size: 26px; }
.flow .sub { fill: var(--text); font-size: 17px; }
.flow .badge-text { font-size: 12px; font-weight: 600; fill: var(--badge-ink); }
.flow .freq { fill: var(--text); font-size: 13px; }
.flow .card-name { font-size: 15px; font-weight: 600; fill: var(--ink); }
.flow .card-role { font-size: 12px; fill: var(--muted); }
.flow .label { font-size: 15px; fill: var(--text); }
.flow .code { font-family: var(--font-mono); fill: var(--code); font-size: 14px; }
.flow .banner-text { font-size: 13px; fill: var(--banner-ink); }
.flow .chip-text { font-size: 13px; font-weight: 600; fill: var(--chip-ink); }
.flow .card-line { font-size: 13px; fill: var(--text); }
.flow .footer { font-size: 14px; fill: var(--muted); }
`;

const TEMPLATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img">
  <defs></defs>
  <rect width="1280" height="720" fill="var(--bg)"/>
</svg>
<div class="controls" style="display: contents">
  <p class="caption" data-role="caption" aria-live="polite"></p>
  <div class="bar">
    <button data-role="prev" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg></button>
    <button data-role="play" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path data-role="play-icon" d="M7 5v14l12-7z"/></svg></button>
    <button data-role="next" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg></button>
    <input data-role="scrub" type="range" min="0" max="1" step="0.01" value="0">
    <span class="time" data-role="time">0:00 / 0:00</span>
  </div>
  <div class="phases" data-role="phases"></div>
</div>
`;

export async function mountFlowPlayer(container, scene, markdown, section) {
  const data = sceneData(scene, markdown, section);
  if (!document.getElementById('flow-player-style')) {
    const style = document.createElement('style');
    style.id = 'flow-player-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }
  container.classList.add('flow');
  container.tabIndex = 0;
  container.innerHTML = TEMPLATE;
  await document.fonts.ready;
  mount(container, container.querySelector('svg'), data, `flow${++instances}`);
}

function mount(container, svg, SCENE, prefix) {
  const defs = svg.querySelector('defs');
  const tracks = [];
  const stops = []; // { t, phase, html }: the moments the player pauses on when stepping
  let duration = 0;

  function el(name, attrs = {}, parent = svg, text) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    // Page stylesheets that size svg text override a font-size attribute, but not an inline style.
    if (attrs['font-size']) node.style.fontSize = `${attrs['font-size']}px`;
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  // Keyframe tracks: each property interpolates over [[time, value], ...].
  function animate(node, prop, keys) {
    tracks.push({ node, prop, keys: keys.slice().sort((a, b) => a[0] - b[0]) });
  }
  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  function sample(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) return t1 === t0 ? v1 : v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
    return keys[keys.length - 1][1];
  }
  function fade(node, tIn, tOut, dIn = 0.5, dOut = 0.4, peak = 1) {
    const keys = [[tIn, 0], [tIn + dIn, peak]];
    if (tOut !== undefined) keys.push([tOut - dOut, peak], [tOut, 0]);
    animate(node, 'opacity', keys);
  }

  const renderAt = t => {
    for (const { node, prop, keys } of tracks) {
      const v = sample(keys, t);
      if (prop === 'opacity') node.style.opacity = v;
      else if (prop === 'scale') node.setAttribute('transform', `translate(${node.dataset.cx} ${node.dataset.cy}) scale(${v}) translate(${-node.dataset.cx} ${-node.dataset.cy})`);
      else if (prop === 'rise') node.setAttribute('transform', `translate(0 ${v})`);
      else if (prop === 'draw') {
        const from = +node.dataset.from, to = +node.dataset.to;
        const x = to >= from ? from : from - (from - to) * v;
        node.setAttribute('x', x);
        node.setAttribute('width', Math.abs(to - from) * v + 1);
      } else if (prop === 'pos') {
        const from = +node.dataset.from, to = +node.dataset.to;
        node.setAttribute('transform', `translate(${from + (to - from) * v} 0)`);
      } else if (prop === 'grow') {
        node.setAttribute('y2', +node.dataset.y1 + (+node.dataset.len) * v);
      }
    }
  };

  function textWidth(node) { return node.getComputedTextLength(); }

  function badge(parent, x, y, text) {
    const g = el('g', {}, parent);
    const t = el('text', { x: x + 8, y: y + 15, class: 'badge-text' }, g, text);
    const w = textWidth(t) + 16;
    g.insertBefore(el('rect', { x, y, width: w, height: 22, rx: 3, fill: 'var(--badge)' }, g), t);
    return { g, w };
  }

  function drawBuilding(parent, ox, oy, tags) {
    const s = { stroke: 'var(--card-border)', 'stroke-width': 2, fill: 'var(--ill)' };
    const g = el('g', {}, parent);
    el('line', { x1: ox - 30, y1: oy + 330, x2: ox + 380, y2: oy + 330, stroke: 'var(--card-border)', 'stroke-width': 2 }, g);
    el('rect', { x: ox + 30, y: oy + 70, width: 290, height: 260, ...s }, g);
    el('rect', { x: ox + 15, y: oy + 60, width: 320, height: 12, ...s, fill: 'var(--ill-dark)' }, g);
    el('line', { x1: ox + 30, y1: oy + 150, x2: ox + 320, y2: oy + 150, ...s }, g);
    el('line', { x1: ox + 30, y1: oy + 240, x2: ox + 320, y2: oy + 240, ...s }, g);
    for (const row of [95, 180]) for (const col of [110, 170, 230]) el('rect', { x: ox + col, y: oy + row, width: 34, height: 38, ...s, fill: 'var(--hl)' }, g);
    el('rect', { x: ox + 255, y: oy + 18, width: 90, height: 44, ...s, fill: 'var(--hl)' }, g);
    el('circle', { cx: ox + 282, cy: oy + 40, r: 12, ...s, fill: 'none' }, g);
    el('circle', { cx: ox + 318, cy: oy + 40, r: 12, ...s, fill: 'none' }, g);
    el('rect', { x: ox + 330, y: oy + 160, width: 32, height: 52, rx: 4, ...s, fill: 'var(--hl)' }, g);
    for (const dy of [175, 186, 197]) el('line', { x1: ox + 338, y1: oy + dy, x2: ox + 354, y2: oy + dy, stroke: 'var(--card-border)', 'stroke-width': 1.5 }, g);
    el('rect', { x: ox + 50, y: oy + 262, width: 80, height: 68, ...s, fill: 'var(--hl)' }, g);
    el('circle', { cx: ox + 90, cy: oy + 296, r: 18, ...s, fill: 'none' }, g);
    el('rect', { x: ox + 210, y: oy + 272, width: 50, height: 58, ...s, fill: 'var(--hl)' }, g);
    return addTags(g, [[ox + 330, oy + 8], [ox + 345, oy + 152], [ox + 70, oy + 252]], tags);
  }

  const ILLUSTRATIONS = { building: drawBuilding };

  function addTags(g, spots, tags) {
    const pops = [];
    (tags ?? []).slice(0, spots.length).forEach((text, i) => {
      const [cx, cy] = spots[i];
      const tg = el('g', {}, g);
      tg.dataset.cx = cx; tg.dataset.cy = cy;
      const t = el('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'chip-text', 'font-size': 12 }, tg, text);
      const w = textWidth(t) + 18;
      tg.insertBefore(el('rect', { x: cx - w / 2, y: cy - 11, width: w, height: 22, rx: 11, fill: 'var(--chip)' }, tg), t);
      pops.push(tg);
    });
    return { g, pops };
  }

  function build(scene) {
    const S = STRINGS[scene.lang] ?? STRINGS.en;
    const count = (n, words) => `${S.numbers[n] ?? n} ${words[n === 1 ? 0 : 1]}`;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    let t = 0;

    // Intro
    if (scene.title) {
      const g = el('g');
      let y = 230;
      if (scene.badge) { badge(g, M + 8, y - 70, scene.badge); }
      const title = el('text', { x: M + 8, y, class: 'title', 'font-size': 42 }, g, scene.title);
      const sub = el('g', {}, g);
      for (const line of wrap(scene.subtitle ?? '', 54)) { y += 28; el('text', { x: M + 8, y: y + 14, class: 'sub' }, sub, line); }
      fade(g, 0, 5.2, 0.6, 0.5);
      fade(sub, 0.4, 5.2, 0.6, 0.5);
      animate(title, 'rise', [[0, 12], [0.8, 0]]);
      const draw = ILLUSTRATIONS[scene.illustration?.type];
      if (draw) {
        const { g: b, pops } = draw(g, 760, 160, scene.illustration.tags);
        fade(b, 0.6, 5.2, 0.8, 0.5);
        animate(b, 'rise', [[0.6, 20], [1.6, 0]]);
        pops.forEach((p, i) => animate(p, 'scale', [[0, 0], [1.6 + i * 0.4, 0], [1.9 + i * 0.4, 1.15], [2.05 + i * 0.4, 1]]));
      }
      stops.push({ t: 2.8, phase: -1, html: `<b>${esc(scene.title)}</b>${scene.subtitle ? ' · ' + esc(scene.subtitle) : ''}` });
      t = 5.4;
    }

    // Participant cards and lifelines
    const n = scene.participants.length;
    const gap = 14;
    const cw = Math.min(168, (W - 2 * M - gap * (n - 1)) / n);
    const ch = 58, cy = 104;
    const x0 = M + (W - 2 * M - (n * cw + (n - 1) * gap)) / 2;
    const cols = {};
    const cards = scene.participants.map((p, i) => {
      const x = x0 + i * (cw + gap);
      cols[p.id] = x + cw / 2;
      const line = el('line', { x1: x + cw / 2, y1: cy + ch, x2: x + cw / 2, y2: cy + ch, stroke: 'var(--line)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' });
      line.dataset.y1 = cy + ch; line.dataset.len = H - 24 - (cy + ch);
      const g = el('g');
      el('rect', { x, y: cy, width: cw, height: ch, rx: 4, fill: 'var(--card)', stroke: 'var(--card-border)', 'stroke-width': 1.3 }, g);
      const hl = el('rect', { x, y: cy, width: cw, height: ch, rx: 4, fill: 'var(--hl)', stroke: 'var(--hl-border)', 'stroke-width': 1.5 }, g);
      hl.style.opacity = 0;
      const lines = wrapPx(g, p.name, cw - 20, 'card-name');
      lines.forEach((l, j) => el('text', { x: x + 10, y: cy + 21 + j * 16, class: 'card-name' }, g, l));
      el('text', { x: x + 10, y: cy + 21 + lines.length * 16 - 1, class: 'card-role' }, g, p.role ?? '');
      return { g, hl, line, keys: [] };
    });

    const castStart = t;
    const castHeader = el('text', { x: M + 8, y: 72, class: 'h2' }, svg,
      scene.castTitle ?? `${cap(count(n, S.party))}, ${count(scene.phases.length, S.phaseWord)}`);
    cards.forEach((c, i) => {
      const ti = castStart + 0.3 + i * 0.25;
      c.keys.push([ti, 0], [ti + 0.4, 1]);
      animate(c.line, 'grow', [[ti + 0.2, 0], [ti + 1.0, 1]]);
    });
    t = castStart + 0.3 + n * 0.25 + 2.0;
    fade(castHeader, castStart, t + 0.2, 0.5, 0.4);
    stops.push({ t: t - 0.6, phase: -1, html: `<b>${esc(castHeader.textContent)}</b>: ${scene.participants.map(p => esc(p.name)).join(', ')}` });
    const nameOf = id => esc(scene.participants.find(p => p.id === id)?.name ?? id);

    // Phases
    const ROW_TOP = 214, ROW_BOTTOM = H - 40;
    scene.phases.forEach((phase, k) => {
      const ps = t + 0.2;
      const header = el('g');
      const label = `${S.phase} ${k + 1}`;
      const { w } = badge(header, M + 8, 52, label);
      el('text', { x: M + 8 + w + 12, y: 72, class: 'h2' }, header, phase.title || '');
      if (phase.frequency) el('text', { x: W - M - 8, y: 70, 'text-anchor': 'end', class: 'freq' }, header, phase.frequency);
      stops.push({ t: ps + 0.8, phase: k, html: `<b>${S.phase} ${k + 1} · ${esc(phase.title || '')}</b>${phase.frequency ? ' · ' + esc(phase.frequency) : ''}` });

      const involved = new Set();
      for (const s of phase.steps) if (s.kind === 'message') { involved.add(s.from); involved.add(s.to); }
      cards.forEach((c, i) => {
        const on = involved.has(scene.participants[i].id);
        c.keys.push([ps, c.keys.at(-1)[1]], [ps + 0.5, on ? 1 : 0.42]);
        if (on) c.hlKeys = (c.hlKeys ?? []).concat([[ps, c.hlOn ? 1 : 0], [ps + 0.5, 1]]);
        else if (c.hlOn) c.hlKeys.push([ps, 1], [ps + 0.5, 0]);
        c.hlOn = on;
      });

      const rows = phase.steps.reduce((sum, s) => sum + (s.kind === 'card' ? 2.2 : 1), 0);
      const rowH = Math.min(52, (ROW_BOTTOM - ROW_TOP) / Math.max(rows, 1));
      let y = ROW_TOP;
      let st = ps + 0.9;
      const items = [];

      for (const step of phase.steps) {
        const g = el('g');
        let dur = 1.6;
        if (step.kind === 'message') {
          const a = cols[step.from], b = cols[step.to];
          if (a === undefined || b === undefined) throw new Error(`Unknown participant in ${step.from} -> ${step.to}`);
          if (a === b) {
            el('path', { d: `M ${a} ${y - 8} h 20 v 14 h -16`, fill: 'none', stroke: 'var(--arrow)', 'stroke-width': 1.6 }, g);
            el('path', { d: `M ${a + 4} ${y + 2} l -6 4 l 6 4 z`, fill: 'var(--arrow)' }, g);
            const txt = labelText(g, step, a + 30, y + 3);
            if (a + 30 + textWidth(txt) > W - 24) { txt.setAttribute('x', a - 10); txt.setAttribute('text-anchor', 'end'); }
          } else {
            const clipId = `${prefix}-c${defs.children.length}`;
            const clip = el('clipPath', { id: clipId }, defs);
            const r = el('rect', { x: Math.min(a, b), y: y - 6, width: 0, height: 12 }, clip);
            r.dataset.from = a; r.dataset.to = b;
            const lg = el('g', { 'clip-path': `url(#${clipId})` }, g);
            el('line', { x1: a, y1: y, x2: b, y2: y, stroke: 'var(--arrow)', 'stroke-width': 1.6, ...(step.dashed ? { 'stroke-dasharray': '5 4' } : {}) }, lg);
            const dir = b > a ? -1 : 1;
            const head = el('path', { d: `M ${b} ${y} l ${dir * 8} -4.5 l 0 9 z`, fill: 'var(--arrow)' }, g);
            animate(r, 'draw', [[st, 0], [st + 0.7, 1]]);
            fade(head, st + 0.6, undefined, 0.1);
            const left = Math.min(a, b) + 10;
            const txt = labelText(g, step, left, y - 9);
            const width = textWidth(txt);
            if (left + width > W - 24) txt.setAttribute('x', Math.max(24, W - 24 - width));
            fade(txt, st + 0.25, undefined, 0.5);

            const chip = el('g');
            chip.dataset.from = a; chip.dataset.to = b;
            el('rect', { x: -7, y: y - 5, width: 14, height: 10, rx: 2, fill: 'var(--chip)', stroke: 'var(--chip-line)', 'stroke-width': 1 }, chip);
            animate(chip, 'pos', [[st, 0], [st + 0.7, 1]]);
            animate(chip, 'opacity', [[st - 0.01, 0], [st, 1], [st + 0.75, 1], [st + 0.95, 0]]);
          }
          y += rowH;
        } else if (step.kind === 'banner') {
          const over = (step.over ?? []).map(id => cols[id]).filter(v => v !== undefined);
          const x1 = over.length ? Math.min(...over) - cw / 2 + 6 : M;
          const x2 = over.length ? Math.max(...over) + cw / 2 - 6 : W - M;
          el('rect', { x: x1, y: y - 16, width: x2 - x1, height: 22, rx: 3, fill: 'var(--banner)', stroke: 'var(--banner-line)' }, g);
          let text = step.text;
          if (/^\[TBD\]\s*/i.test(text)) { text = text.replace(/^\[TBD\]\s*/i, ''); text = `${S.openPoint}: ${text.charAt(0).toLowerCase()}${text.slice(1)}`; }
          el('text', { x: x1 + 10, y: y - 1, class: 'banner-text' }, g, text);
          dur = 1.4;
          y += rowH;
        } else if (step.kind === 'chip') {
          const cx = cols[step.at] ?? M + 40;
          g.dataset.cx = cx; g.dataset.cy = y - 4;
          const txt = el('text', { x: cx, y, 'text-anchor': 'middle', class: 'chip-text' }, g, step.text);
          const w = textWidth(txt) + 30;
          g.insertBefore(el('rect', { x: cx - w / 2, y: y - 16, width: w, height: 24, rx: 12, fill: 'var(--chip)', stroke: 'var(--chip-line)' }, g), txt);
          animate(g, 'scale', [[st, 0], [st + 0.3, 1.12], [st + 0.45, 1]]);
          dur = 1.2;
          y += rowH;
        } else if (step.kind === 'card') {
          const ax = cols[step.at] ?? W / 2;
          const lines = step.lines ?? [];
          const h = 42 + lines.length * 18;
          const gt = el('g', {}, g);
          const texts = lines.map(l => el('text', { x: 0, y: 0, class: 'card-line' }, gt, l));
          const bw = Math.max(...texts.map(textWidth), 120) + 28;
          const bx = Math.min(Math.max(ax - bw / 2, M), W - M - bw);
          const by = y - 18;
          g.insertBefore(el('rect', { x: bx, y: by, width: bw, height: h + 6, rx: 4, fill: 'var(--hl)', stroke: 'var(--hl-border)', 'stroke-width': 1.4 }, g), gt);
          badge(g, bx + 12, by + 8, step.title ?? '');
          texts.forEach((tx, i) => { tx.setAttribute('x', bx + 14); tx.setAttribute('y', by + 50 + i * 18); });
          animate(g, 'rise', [[st, 10], [st + 0.6, 0]]);
          dur = 2.0;
          y += rowH * 2.2;
        }
        // Arrows reveal through their own children; other steps fade in as a whole.
        const reveal = step.kind === 'message' && cols[step.from] !== cols[step.to] ? 0.01 : 0.5;
        items.push({ g, st, reveal });
        stops.push({ t: st + dur - 0.25, phase: k, html: stepHtml(step, nameOf, S) });
        st += dur;
      }

      const pe = st + 1.6;
      items.forEach((it, i) => {
        const next = items[i + 1]?.st;
        const keys = [[it.st, 0], [it.st + it.reveal, 1]];
        if (next !== undefined) keys.push([next, 1], [next + 0.4, 0.55]);
        keys.push([pe - 0.45, keys.at(-1)[1]], [pe, 0]);
        animate(it.g, 'opacity', keys);
      });
      fade(header, ps, pe + 0.3, 0.5, 0.45);
      t = pe;
    });

    // Closing
    const cs = t + 0.3;
    cards.forEach(c => {
      c.keys.push([cs - 0.3, c.keys.at(-1)[1]], [cs, 0]);
      animate(c.g, 'opacity', c.keys);
      animate(c.line, 'opacity', [[castStart, 1], [cs - 0.3, 1], [cs, 0]]);
      if (c.hlKeys) { c.hlKeys.push([cs - 0.3, c.hlOn ? 1 : 0], [cs, 0]); animate(c.hl, 'opacity', c.hlKeys); }
    });
    const closing = scene.closing ?? {};
    const cg = el('g');
    let y = 300;
    if (closing.badge) badge(cg, M + 8, y - 40, closing.badge);
    const lines = closing.lines?.length ? closing.lines : [scene.title];
    const lineEls = lines.map(l => { y += 54; return el('text', { x: M + 8, y, class: 'title', 'font-size': 40 }, cg, l); });
    lineEls.forEach((l, i) => fade(l, cs + 0.3 + i * 0.5, undefined, 0.6));
    y += 34;
    let cx = M + 8;
    scene.phases.forEach((p, i) => {
      const chip = el('g', {}, cg);
      const txt = el('text', { x: cx + 8, y: y + 15, class: 'freq', 'font-weight': 500, fill: 'var(--ink)' }, chip, `${i + 1} · ${p.title}`);
      const w = textWidth(txt) + 16;
      chip.insertBefore(el('rect', { x: cx, y, width: w, height: 22, rx: 3, fill: 'none', stroke: 'var(--card-border)', 'stroke-width': 1.2 }, chip), txt);
      fade(chip, cs + 1.2 + i * 0.2, undefined, 0.4);
      cx += w + 10;
    });
    if (scene.footer) fade(el('text', { x: M + 8, y: y + 54, class: 'footer' }, cg, scene.footer), cs + 1.8, undefined, 0.6);
    fade(cg, cs, undefined, 0.4);
    duration = cs + 5;
    stops.push({ t: duration - 0.05, phase: scene.phases.length, html: lines.map(l => `<b>${esc(l)}</b>`).join(' ') });
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

  function stepHtml(step, nameOf, S) {
    if (step.kind === 'message') {
      const what = `${step.code ? `<code>${esc(step.code)}</code> ` : ''}${esc(step.text ?? '')}`;
      return step.from === step.to ? `<b>${nameOf(step.from)}</b>: ${what}` : `<b>${nameOf(step.from)} → ${nameOf(step.to)}</b>: ${what}`;
    }
    if (step.kind === 'banner') return esc(step.text.replace(/^\[TBD\]\s*/i, `${S.openPoint}: `));
    if (step.kind === 'card') return `<b>${esc(step.title ?? '')}</b>: ${(step.lines ?? []).map(esc).join(' · ')}`;
    return `<b>${esc(step.text ?? '')}</b>`;
  }

  function labelText(parent, step, x, y) {
    const txt = el('text', { x, y, class: 'label' }, parent);
    if (step.code) el('tspan', { class: 'code' }, txt, step.code + (step.text ? ' ' : ''));
    if (step.text) el('tspan', {}, txt, step.text);
    return txt;
  }

  function wrap(text, max) {
    const out = [];
    let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      if ((line + ' ' + word).trim().length > max) { out.push(line); line = word; }
      else line = (line + ' ' + word).trim();
    }
    if (line) out.push(line);
    return out;
  }

  function wrapPx(parent, text, maxPx, cls) {
    const probe = el('text', { class: cls }, parent);
    const out = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      probe.textContent = (line + ' ' + word).trim();
      if (line && textWidth(probe) > maxPx) { out.push(line); line = word; }
      else line = probe.textContent;
    }
    out.push(line);
    probe.remove();
    return out.slice(0, 2);
  }

  function startPlayer(S) {
    const $ = role => container.querySelector(`[data-role="${role}"]`);
    const scrub = $('scrub'), play = $('play'), caption = $('caption'), time = $('time');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    svg.setAttribute('aria-label', SCENE.title ?? '');
    $('prev').setAttribute('aria-label', S.prev);
    $('next').setAttribute('aria-label', S.next);
    scrub.setAttribute('aria-label', S.position);
    scrub.max = duration;

    // Phase chips: intro, one per phase, jump to the phase start.
    const chips = [{ label: S.intro, phase: -1 }, ...SCENE.phases.map((p, i) => ({ label: `${i + 1} · ${p.title}`, phase: i }))].map(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c.label;
      b.addEventListener('click', () => seek(stops.find(s => s.phase === c.phase).t));
      $('phases').appendChild(b);
      return { ...c, b };
    });

    let t = stops[0].t, playing = false, target = null, last = 0;
    const current = () => stops.reduce((i, s, j) => (s.t <= t + 0.01 ? j : i), 0);

    function show() {
      renderAt(t);
      scrub.value = t;
      time.textContent = `${fmt(t)} / ${fmt(duration)}`;
      const i = current();
      caption.innerHTML = `<span class="sr">${S.step} ${i + 1}/${stops.length}: </span>${stops[i].html}`;
      const phase = Math.min(stops[i].phase, SCENE.phases.length - 1);
      for (const c of chips) {
        if (c.phase === phase) c.b.setAttribute('aria-current', 'step');
        else c.b.removeAttribute('aria-current');
      }
      $('play-icon').setAttribute('d', playing ? 'M6 5h4v14H6zM14 5h4v14h-4z' : 'M7 5v14l12-7z');
      play.setAttribute('aria-label', playing ? S.pause : S.play);
    }
    function frame(now) {
      if (!playing) return;
      t = Math.min(t + (now - last) / 1000, target ?? duration);
      last = now;
      if (t >= (target ?? duration)) playing = false;
      show();
      if (playing) requestAnimationFrame(frame);
    }
    function start(to = null) {
      target = to;
      if (reduced && to !== null) { t = to; playing = false; show(); return; }
      playing = true;
      last = performance.now();
      requestAnimationFrame(frame);
      show();
    }
    function seek(to) { playing = false; target = null; t = to; show(); }
    function next() {
      // A click during a step's animation finishes that step at once, so repeated clicks skip ahead.
      if (playing && target !== null) t = target;
      const s = stops.find(s => s.t > t + 0.05);
      if (s) start(s.t);
      else seek(t);
    }
    function prev() { const s = [...stops].reverse().find(s => s.t < t - 0.05); seek(s ? s.t : 0); }

    play.addEventListener('click', () => {
      if (playing) { playing = false; show(); return; }
      if (t >= duration - 0.06) t = 0;
      start();
    });
    $('next').addEventListener('click', next);
    $('prev').addEventListener('click', prev);
    scrub.addEventListener('input', () => seek(+scrub.value));
    container.addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement && e.key !== ' ') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); play.click(); }
    });
    show();
  }

  build(SCENE);
  startPlayer(STRINGS[SCENE.lang] ?? STRINGS.en);
}

// Merges the scene file with the diagram: participant roles, phase titles and frequencies,
// and annotations inserted after the n-th message of a phase (1-based).
function sceneData(scene, markdown, section) {
  const source = extractSequenceDiagrams(markdown)[scene.diagram ?? 0];
  if (!source) throw new Error(`no Mermaid sequenceDiagram #${scene.diagram ?? 0} on this page`);
  const parsed = parseSequenceDiagram(source);
  const participants = parsed.participants.map(p => ({ ...p, ...(scene.participants?.[p.id] ?? {}) }));
  const phases = parsed.phases.map((phase, i) => ({
    title: scene.phases?.[i]?.title ?? cleanPhaseTitle(phase.title),
    frequency: scene.phases?.[i]?.frequency ?? '',
    steps: [...phase.steps],
  }));
  for (const a of [...(scene.annotations ?? [])].sort((x, y) => y.after - x.after)) {
    const steps = phases[a.phase - 1]?.steps;
    let seen = 0;
    const index = steps ? steps.findIndex(s => s.kind === 'message' && ++seen === a.after) : -1;
    if (index === -1) throw new Error(`annotation refers to message ${a.after} of missing phase ${a.phase}`);
    steps.splice(index + 1, 0, { kind: a.type, ...a });
  }
  const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? scene.title;
  return {
    ...scene,
    lang: scene.lang ?? 'en',
    participants,
    phases,
    footer: scene.footer ?? `docs.poort8.nl · ${section.toUpperCase()} · ${h1}`,
  };
}

const ARROW = /^(\w+(?:-\w+)*)\s*(-->>|->>|-->|->|--x|-x|--\)|-\))\s*[+-]?(\w+(?:-\w+)*)\s*:\s*(.*)$/;
const HTTP = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/;

function extractSequenceDiagrams(markdown) {
  const blocks = [];
  const fence = /```mermaid\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = fence.exec(markdown)) !== null) {
    if (/^\s*sequenceDiagram\b/m.test(match[1])) blocks.push(match[1]);
  }
  return blocks;
}

function parseSequenceDiagram(source) {
  const participants = [];
  const phases = [];
  const stack = [];
  let current = null;

  const ensurePhase = () => {
    if (!current) {
      current = { title: null, steps: [] };
      phases.push(current);
    }
    return current;
  };

  for (const raw of source.split('\n')) {
    const line = raw.trim().replace(/\s*<br\s*\/?>\s*/gi, ' ');
    if (!line || line.startsWith('%%') || line === 'sequenceDiagram' || line === 'autonumber') continue;

    const participant = line.match(/^(participant|actor)\s+([\w-]+)(?:\s+as\s+(.+))?$/);
    if (participant) {
      participants.push(parseParticipant(participant[2], participant[3] ?? participant[2]));
      continue;
    }

    if (/^rect\b/.test(line)) {
      current = { title: null, steps: [] };
      phases.push(current);
      stack.push('rect');
      continue;
    }

    const block = line.match(/^(alt|opt|loop|par|critical|break)\s*(.*)$/);
    if (block) {
      stack.push(block[1]);
      if (block[2]) ensurePhase().steps.push({ kind: 'banner', text: block[2], over: [] });
      continue;
    }

    const branch = line.match(/^(else|and|option)\s*(.*)$/);
    if (branch) {
      if (branch[2]) ensurePhase().steps.push({ kind: 'banner', text: branch[2], over: [] });
      continue;
    }

    if (line === 'end') {
      if (stack.pop() === 'rect') current = null;
      continue;
    }

    const note = line.match(/^note\s+(?:over|left of|right of)\s+([\w-]+(?:\s*,\s*[\w-]+)?)\s*:\s*(.*)$/i);
    if (note) {
      const phase = ensurePhase();
      const over = note[1].split(',').map(s => s.trim());
      if (phase.title === null && phase.steps.length === 0) phase.title = note[2];
      else phase.steps.push({ kind: 'banner', text: note[2], over });
      continue;
    }

    const arrow = line.match(ARROW);
    if (arrow) {
      ensurePhase().steps.push({
        kind: 'message',
        from: arrow[1],
        to: arrow[3],
        dashed: arrow[2].startsWith('--'),
        ...splitLabel(arrow[4]),
      });
    }
  }

  return { participants, phases: phases.filter(p => p.steps.length > 0 || p.title) };
}

function parseParticipant(id, label) {
  const m = label.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (!m) return { id, name: label, role: '' };
  return { id, name: m[1], role: m[2].charAt(0).toUpperCase() + m[2].slice(1) };
}

// "POST /connect/token (signed client assertion)" -> code "POST /connect/token", text "signed client assertion"
function splitLabel(label) {
  if (!HTTP.test(label)) return { code: '', text: label };
  const paren = label.indexOf('(');
  if (paren === -1) return { code: label.trim(), text: '' };
  const code = label.slice(0, paren).trim();
  const text = label.slice(paren).replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  return { code, text };
}

// "Phase 1 – Owner approval (once per building)" -> "Owner approval"
function cleanPhaseTitle(title) {
  if (!title) return '';
  return title
    .replace(/^(phase|fase|stap|step)\s*\d+\s*[–—:-]\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

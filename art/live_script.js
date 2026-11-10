// Animation timeline for the poster scene. Everything is periodic in TOTAL seconds so GIF loops are seamless.
window.TOTAL = 5;
// GIF regions (page coordinates). Each becomes one image visual placed exactly here.
window.REGIONS = [
  { name: 'live_ghost', x: 260, y: 190, w: 440, h: 194 },
  { name: 'live_room',  x: 260, y: 384, w: 440, h: 386 },
  { name: 'live_city',    x: 700, y: 0,   w: 657, h: 770 },
  { name: 'live_bar_left',   x: 36,  y: 793,  w: 640,  h: 20 },
  { name: 'live_bar_right',  x: 696, y: 793,  w: 625,  h: 20 },
  { name: 'live_bar_bottom', x: 36,  y: 1383, w: 1285, h: 20 },
  { name: 'live_footer',     x: 0,   y: 1800, w: 1357, h: 120 }
];
const T = window.TOTAL, TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const sin = (t, period, phase = 0) => Math.sin(TAU * (t / period + phase));
// smooth periodic noise in [-1,1] built from harmonics of the loop
const flick = (t, seed) => (sin(t, T / 5, seed) * 0.5 + sin(t, T / 13, seed * 2.1) * 0.3 + sin(t, T / 29, seed * 3.7) * 0.2);
const pulse = (t, at, dur) => { let d = ((t - at) % T + T) % T; return d < dur ? Math.sin(Math.PI * d / dur) : 0; }; // 0..1..0 bump

// ---- static setup: window covers, twinkle stars, pulse dots, steam ----
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const WIN = [];
const grid = (xs, y0, dys) => xs.forEach(x => dys.forEach(dy => WIN.push([x, y0 + dy])));
grid([730, 750, 770], 440, [0, 30, 60, 120, 180, 240]); grid([810, 835], 350, [0, 30, 90, 150, 210, 300]);
grid([880, 905, 930], 400, [0, 40, 100, 160, 220, 280]); grid([980, 1000], 290, [0, 40, 80, 140, 200, 260, 320, 380]);
grid([1045, 1070, 1095], 370, [0, 40, 100, 160, 240, 300]); grid([1135, 1160], 320, [0, 40, 80, 140, 200, 260, 340]);
grid([1205, 1230, 1255], 420, [0, 40, 100, 160, 220]); grid([1300, 1325], 360, [0, 40, 100, 160, 220, 300]);
let seed = 7; const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
const covers = [];
for (let i = 0; i < 16; i++) {
  const [x, y] = WIN[Math.floor(rnd() * WIN.length)];
  const el = mk('rect', { x: x - 1, y: y - 1, width: 10, height: 14 }, $('covers'));
  // each window: off for a window of time [a, a+len) within the loop; some stay off and flick on briefly
  covers.push({ el, a: rnd() * T, len: 0.6 + rnd() * 2.4, invert: rnd() < 0.3 });
}
const stars = [];
const STAR_POS = [[740, 40], [790, 120], [850, 70], [905, 150], [960, 30], [1020, 110], [1080, 60], [1150, 20], [1320, 60], [1290, 180], [1200, 230], [1100, 200], [780, 200], [860, 230], [1340, 130], [720, 160]];
STAR_POS.forEach(([x, y], i) => stars.push({ el: mk('circle', { cx: x, cy: y, r: 1.2 + (i % 3) * 0.4 }, $('twinkle')), ph: i / STAR_POS.length, per: (i % 2 ? T / 2 : T / 3) }));
const path = $('pathline'), LEN = path.getTotalLength();
const dots = [];
for (let k = 0; k < 2; k++) {
  const halo = mk('circle', { r: 16, fill: '#F5F1E8', opacity: 0.35, filter: 'url(#blur8)' }, $('pulse'));
  const trail = []; for (let i = 5; i >= 1; i--) trail.push(mk('circle', { r: 2 + i * 0.6, fill: '#F5F1E8', opacity: 0.12 * (6 - i) }, $('pulse')));
  const head = mk('circle', { r: 6, fill: '#FFFFFF' }, $('pulse'));
  dots.push({ halo, trail, head, off: k * 0.5 });
}
const steam = []; for (let i = 0; i < 3; i++) steam.push({ el: mk('circle', { r: 2.5 }, $('steam')), ph: i / 3 });
const bats = Array.from(document.querySelectorAll('.bat')).map(el => ({ el, x: +el.dataset.x, y: +el.dataset.y, s: +el.dataset.s, p: +el.dataset.p }));

// ---- per-frame render ----
window.render = function (t) {
  t = ((t % T) + T) % T;
  // ghosts drift
  $('g1').setAttribute('transform', `translate(0 ${(10 * sin(t, T / 2)).toFixed(2)}) rotate(${(-8 + 4 * sin(t, T)).toFixed(2)} 360 255)`);
  $('g2').setAttribute('transform', `translate(${(6 * sin(t, T)).toFixed(2)} ${(8 * sin(t, T / 2, 0.3)).toFixed(2)}) scale(0.7) translate(430 110)`);
  // bats: flap + drift
  for (const b of bats) {
    const flap = 0.35 + 0.65 * Math.abs(sin(t, T / 18, b.p));
    b.el.setAttribute('transform', `translate(${(b.x + 10 * sin(t, T, b.p)).toFixed(2)} ${(b.y + 6 * sin(t, T / 2, b.p)).toFixed(2)}) scale(${b.s} ${(b.s * flap).toFixed(3)})`);
  }
  // monster: eyes glow and pulse, blink once per loop, claws twitch twice
  const glow = 0.5 + 0.5 * sin(t, T / 3);
  const blink = pulse(t, 3.6, 0.3);
  for (const id of ['me1', 'me2']) { const e = $(id); e.setAttribute('rx', (5 + 1.2 * glow).toFixed(2)); e.setAttribute('ry', ((5 + 1.2 * glow) * (1 - 0.9 * blink)).toFixed(2)); }
  $('meg').setAttribute('opacity', (0.12 + 0.2 * glow).toFixed(3));
  $('claws').setAttribute('transform', `translate(${(-7 * (pulse(t, 1.2, 0.5) + pulse(t, 4.6, 0.5))).toFixed(2)} 0)`);
  $('dglow').setAttribute('opacity', (0.35 + 0.05 * flick(t, 1)).toFixed(3));
  // lamp flicker
  $('lampg').setAttribute('opacity', (0.78 + 0.14 * flick(t, 2)).toFixed(3));
  // city windows
  for (const c of covers) { let on = ((t - c.a + T) % T) < c.len; if (c.invert) on = !on; c.el.setAttribute('opacity', on ? 1 : 0); }
  // monitors & glow
  $('mon1').setAttribute('opacity', (0.5 + 0.07 * flick(t, 3)).toFixed(3));
  $('mon2').setAttribute('opacity', (0.5 + 0.07 * flick(t, 4)).toFixed(3));
  $('sglow').setAttribute('opacity', (0.18 + 0.05 * sin(t, T / 2)).toFixed(3));
  // moon halo breathing
  // twinkle
  for (const s of stars) s.el.setAttribute('opacity', (0.35 + 0.55 * (0.5 + 0.5 * sin(t, s.per, s.ph))).toFixed(3));
  // steam
  for (const s of steam) { const ph = ((t / 2 + s.ph) % 1); s.el.setAttribute('cx', (1304 + 3 * Math.sin(ph * TAU)).toFixed(2)); s.el.setAttribute('cy', (486 - 22 * ph).toFixed(2)); s.el.setAttribute('opacity', (0.45 * (1 - ph) * Math.min(1, ph * 4)).toFixed(3)); }
  // pulses along the path from childhood to adulthood
  for (const d of dots) {
    const p = ((t / T) + d.off) % 1;
    const fade = Math.min(1, p * 12, (1 - p) * 12); // ease in/out at the ends
    const P = path.getPointAtLength(p * LEN);
    d.head.setAttribute('cx', P.x.toFixed(2)); d.head.setAttribute('cy', P.y.toFixed(2)); d.head.setAttribute('opacity', fade.toFixed(3));
    d.halo.setAttribute('cx', P.x.toFixed(2)); d.halo.setAttribute('cy', P.y.toFixed(2)); d.halo.setAttribute('opacity', (0.35 * fade).toFixed(3));
    d.trail.forEach((c, i) => { const q = Math.max(0, p - (5 - i) * 0.012); const Q = path.getPointAtLength(q * LEN); c.setAttribute('cx', Q.x.toFixed(2)); c.setAttribute('cy', Q.y.toFixed(2)); c.setAttribute('opacity', (0.12 * (i + 1) * fade).toFixed(3)); });
  }
  // light pulses along the accent bars (fade in/out at the ends)
  const bar = (id, x0, x1, ph) => { const p = ((t / T) + ph) % 1; const e = $(id); const w = +e.getAttribute('width'); e.setAttribute('x', (x0 + (x1 - x0 - w) * p).toFixed(1)); e.setAttribute('opacity', (0.55 * Math.min(1, p * 8, (1 - p) * 8)).toFixed(3)); };
  bar('ap1', 36, 676, 0); bar('ap2', 696, 1321, 0.5); bar('ap3', 36, 1321, 0.25);
  // footer: ghost drifts right-to-left behind the footer text (fog is static to keep the GIF small)
  const gp = t / T; // 0..1 across the loop
  $('fghost').setAttribute('transform', `translate(${(1420 - 1500 * gp).toFixed(1)} ${(1838 + 8 * sin(t, T / 2)).toFixed(1)}) rotate(${(6 * sin(t, T / 3)).toFixed(1)}) scale(0.42)`);
  // pumpkin candle
  const f = flick(t, 5);
  $('pkg').setAttribute('opacity', (0.75 + 0.2 * f).toFixed(3));
  $('pke').setAttribute('opacity', (0.85 + 0.15 * f).toFixed(3));
  $('pkm').setAttribute('opacity', (0.85 + 0.15 * f).toFixed(3));
};
window.render(0);

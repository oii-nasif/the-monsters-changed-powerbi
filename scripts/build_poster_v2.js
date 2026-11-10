// Cinematic portrait poster: "The monsters changed. The fear didn't."
// usage: node build_poster_v2.js <extractedBaseDir> <outDir> <backgroundPng>
const fs = require('fs'), path = require('path');
const [srcDir, outDir, bgPng] = process.argv.slice(2);

const ORANGE = '#FF7A32', BLUE = '#39A0FF', CYAN = '#5CE1D6', INK = '#F5F1E8', INK2 = '#A6B0C0', WARM = '#FFB36B', COOL = '#8CD0FF', GREY = '#8A94A6';
const PAGE = 'a602c84c5fe643e1debd'; // Report Page Portrait 1357 x 1920
const BG_NAME = 'poster_bg.png';
const HEAD = 'Arial Black', SERIF = 'Georgia', SANS = 'Segoe UI';

// ---------- helpers ----------
const lit = v => ({ expr: { Literal: { Value: v } } });
const str = s => lit(`'${String(s).replace(/'/g, "''")}'`);
const num = n => lit(`${n}D`);
const bool = b => lit(b ? 'true' : 'false');
const color = hex => ({ solid: { color: { expr: { Literal: { Value: `'${hex}'` } } } } });
const col = (entity, prop) => ({ Column: { Expression: { SourceRef: { Entity: entity } }, Property: prop } });
const meas = (entity, prop) => ({ Measure: { Expression: { SourceRef: { Entity: entity } }, Property: prop } });
const proj = (field, entity, prop, extra = {}) => ({ field, queryRef: `${entity}.${prop}`, nativeQueryRef: prop, ...extra });
const colProj = (entity, prop, extra) => proj(col(entity, prop), entity, prop, extra);
const measProj = (entity, prop, extra) => proj(meas(entity, prop), entity, prop, extra);
let idCounter = 0;
const newId = () => (Date.now().toString(16) + (idCounter++).toString(16).padStart(4, '0') + 'b7c6d5e4f3a2').slice(0, 20);

function inFilter(entity, prop, values) {
  return { name: newId(), field: col(entity, prop), type: 'Categorical', filter: { Version: 2, From: [{ Name: 't', Entity: entity, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 't' } }, Property: prop } }], Values: values.map(v => [{ Literal: { Value: `'${String(v).replace(/'/g, "''")}'` } }]) } } }] } };
}
const noChrome = () => ({
  background: [{ properties: { show: bool(false) } }],
  border: [{ properties: { show: bool(false) } }],
  dropShadow: [{ properties: { show: bool(false) } }],
  title: [{ properties: { show: bool(false) } }],
  subTitle: [{ properties: { show: bool(false) } }],
  visualHeader: [{ properties: { show: bool(false) } }],
  padding: [{ properties: { top: num(0), bottom: num(0), left: num(0), right: num(0) } }]
});

let z = 0; const visuals = [];
function add(v, pos, altText) {
  const name = newId(); z += 100;
  const vc = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.13.0/schema.json', name, position: { x: pos.x, y: pos.y, z, height: pos.h, width: pos.w, tabOrder: z }, visual: v.visual };
  if (v.filters && v.filters.length) vc.filterConfig = { filters: v.filters };
  vc.visual.visualContainerObjects = vc.visual.visualContainerObjects || noChrome();
  if (altText) vc.visual.visualContainerObjects.general = [{ properties: { altText: str(altText) } }];
  vc.visual.drillFilterOtherVisuals = false;
  visuals.push(vc); return name;
}

// ---------- textbox ----------
const NO_FONT = !!process.env.NO_FONT, NO_BG = !!process.env.NO_BG;
const run = (value, size, extra = {}) => { const ts = { fontSize: `${size}pt`, color: INK, fontFamily: SANS, ...extra }; if (NO_FONT) delete ts.fontFamily; return { value, textStyle: ts }; };
const para = (runs, align = 'left') => ({ textRuns: runs, horizontalTextAlignment: align });
function textbox(paragraphs, pos, alt) {
  return add({ visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs } }] }, visualContainerObjects: noChrome() } }, pos, alt);
}

// ---------- card ----------
function card({ measure, pos, filters = [], size = 44, colorHex = INK, label = null, alt, displayName }) {
  const p = measProj('_Measures', measure, displayName ? { displayName } : {});
  const v = { visual: { visualType: 'card', query: { queryState: { Values: { projections: [p] } } }, objects: {
    labels: [{ properties: { fontSize: str(String(size)), color: color(colorHex), fontFamily: str(HEAD) } }],
    categoryLabels: [{ properties: { show: bool(!!label), fontSize: str('12'), color: color(INK), fontFamily: str(SANS) } }],
    wordWrap: [{ properties: { show: bool(true) } }]
  }, visualContainerObjects: noChrome() }, filters };
  return add(v, pos, alt);
}

// ---------- horizontal bars ----------
function bars({ measure, fears, pos, colorHex, alt, filters = [], displayName }) {
  const v = { visual: { visualType: 'clusteredBarChart', query: { queryState: { Category: { projections: [colProj('DimFear', 'Fear')] }, Y: { projections: [measProj('_Measures', measure, displayName ? { displayName } : {})] } }, sortDefinition: { sort: [{ field: meas('_Measures', measure), direction: 'Descending' }], isDefaultSort: false } }, objects: {
    dataPoint: [{ properties: { fill: color(colorHex) } }],
    labels: [{ properties: { show: bool(true), fontSize: str('13'), color: color(INK), labelPosition: str('OutsideEnd'), fontFamily: str(HEAD) } }],
    categoryAxis: [{ properties: { show: bool(true), fontSize: str('12'), labelColor: color(INK), fontFamily: str(SANS), maxMarginFactor: num(50), innerPadding: num(30), concatenateLabels: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false) } }],
    valueAxis: [{ properties: { show: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false) } }],
    legend: [{ properties: { show: bool(false) } }],
    plotArea: [{ properties: { transparency: num(100) } }]
  }, visualContainerObjects: noChrome() }, filters: [inFilter('DimFear', 'Fear', fears), ...filters] };
  return add(v, pos, alt);
}

// ---------- slope chart ----------
function slope({ pos, alt }) {
  const cats = [['Dark, Unknown & Supernatural', ORANGE], ['Confined & Physical Spaces', ORANGE], ['Animals & Insects', ORANGE], ['Nature & Environment', ORANGE], ['Body, Health & Death', GREY], ['Social & Emotional', GREY], ['Separation & Loss', BLUE], ['Performance & Future', BLUE]];
  const dataPoint = cats.map(([c, hex]) => ({ properties: { fill: color(hex) }, selector: { data: [{ scopeId: { Comparison: { ComparisonKind: 0, Left: col('DimFear', 'Category'), Right: { Literal: { Value: `'${c}'` } } } } }] } }));
  const v = { visual: { visualType: 'lineChart', query: { queryState: {
    Category: { projections: [colProj('FactFearSelection', 'LifeStage')] },
    Series: { projections: [colProj('DimFear', 'Category')] },
    Y: { projections: [measProj('_Measures', 'Pct of People', { displayName: '% of people' })] } },
    sortDefinition: { sort: [{ field: col('FactFearSelection', 'LifeStage'), direction: 'Descending' }], isDefaultSort: false } }, objects: {
    dataPoint,
    lineStyles: [{ properties: { strokeWidth: num(4), showMarker: bool(true), markerSize: num(9), lineStyle: str('solid') } }],
    labels: [{ properties: { show: bool(true), fontSize: str('12'), color: color(INK), fontFamily: str(HEAD), labelDensity: num(100) } }],
    seriesLabels: [{ properties: { show: bool(true), fontSize: str('11'), fontFamily: str(SANS), position: str('Right'), labelDensity: num(100) } }],
    categoryAxis: [{ properties: { show: bool(true), axisType: str('Categorical'), fontSize: str('14'), labelColor: color(INK), fontFamily: str(HEAD), showAxisTitle: bool(false), gridlineShow: bool(false) } }],
    valueAxis: [{ properties: { show: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false), start: num(0), end: num(0.56) } }],
    legend: [{ properties: { show: bool(false) } }],
    plotArea: [{ properties: { transparency: num(100) } }]
  }, visualContainerObjects: noChrome() }, filters: [inFilter('DimFear', 'Category', cats.map(c => c[0]))] };
  return add(v, pos, alt);
}

// ---------- paired bars per category: childhood vs adult share of people ----------
function categoryBars({ pos, alt }) {
  const cats = ['Dark, Unknown & Supernatural', 'Confined & Physical Spaces', 'Animals & Insects', 'Nature & Environment', 'Body, Health & Death', 'Social & Emotional', 'Separation & Loss', 'Performance & Future'];
  const v = { visual: { visualType: 'clusteredBarChart', query: { queryState: {
    Category: { projections: [colProj('DimFear', 'Category')] },
    Y: { projections: [measProj('_Measures', 'Pct of People Childhood', { displayName: 'As a child' }), measProj('_Measures', 'Pct of People Adult', { displayName: 'As an adult' })] } },
    sortDefinition: { sort: [{ field: meas('_Measures', 'Pct of People Childhood'), direction: 'Descending' }], isDefaultSort: false } }, objects: {
    dataPoint: [{ properties: { fill: color(ORANGE) }, selector: { metadata: '_Measures.Pct of People Childhood' } }, { properties: { fill: color(BLUE) }, selector: { metadata: '_Measures.Pct of People Adult' } }],
    labels: [{ properties: { show: bool(true), fontSize: str('10'), color: color(INK), labelPosition: str('OutsideEnd'), fontFamily: str(HEAD), labelOverflow: bool(true), enableBackground: bool(false) } }],
    categoryAxis: [{ properties: { show: bool(true), fontSize: str('11'), labelColor: color(INK), fontFamily: str(SANS), maxMarginFactor: num(50), innerPadding: num(20), concatenateLabels: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false) } }],
    valueAxis: [{ properties: { show: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false), start: num(0), end: num(0.6) } }],
    legend: [{ properties: { show: bool(true), position: str('Top'), fontSize: str('12'), labelColor: color(INK), fontFamily: str(SANS), showTitle: bool(false) } }],
    plotArea: [{ properties: { transparency: num(100) } }]
  }, visualContainerObjects: noChrome() }, filters: [inFilter('DimFear', 'Category', cats)] };
  return add(v, pos, alt);
}

// ---------- image (animated GIF layers) ----------
// GIFS=<manifest.json from build_gifs.js>: each region becomes a native image visual placed pixel-exact over the
// same spot of the static background, so the scene stays crisp and only these rectangles move.
const GIFS = process.env.GIFS ? JSON.parse(fs.readFileSync(process.env.GIFS, "utf8")) : null;
const gifFiles = [];
function image({ file, pos, alt }) {
  const v = { visual: { visualType: "image", objects: { image: [{ properties: { sourceFile: { image: { name: str(file), url: { expr: { ResourcePackageItem: { PackageName: "RegisteredResources", PackageType: 1, ItemName: file } } }, scaling: str('Normal') } } } }] }, visualContainerObjects: noChrome() } };
  const name = add(v, pos, alt);
  visuals[visuals.length - 1].position.tabOrder = -1; // decorative: hidden from tab order (contest accessibility rule)
  return name;
}
if (GIFS) for (const r of GIFS.regions) {
  gifFiles.push({ src: path.join(path.dirname(process.env.GIFS), r.file), name: r.file });
  image({ file: r.file, pos: { x: r.x, y: r.y, w: r.w, h: r.h }, alt: ({ live_ghost: "Decorative animation: a ghost and bats drift above the childhood bedroom.", live_room: "Decorative animation: the childhood bedroom. The lamp flickers, the monster in the doorway blinks and a light travels along the path toward adulthood.", live_bedroom: "Decorative animation: the childhood bedroom. A ghost drifts, the lamp flickers, the monster in the doorway blinks and a light travels along the path toward adulthood.", live_city: "Decorative animation: the adult city at night. Stars twinkle, office windows switch on and off, screens flicker and the light arrives at the office.", live_bar_left: "Decorative animation: a light runs along the orange accent bar.", live_bar_right: "Decorative animation: a light runs along the blue accent bar.", live_bar_bottom: "Decorative animation: a light runs along the bottom panel accent bar.", live_footer: "Decorative animation: a small ghost drifts through fog along the footer and the jack-o-lantern candle flickers." })[r.name] || "Decorative animation" });
}

// =====================================================================
// HERO
// =====================================================================
textbox([
  para([run('THE MONSTERS ', 46, { fontFamily: HEAD, fontWeight: 'bold', color: WARM }), run('CHANGED.', 46, { fontFamily: HEAD, fontWeight: 'bold', color: INK })], 'center'),
  para([run('THE FEAR ', 46, { fontFamily: HEAD, fontWeight: 'bold', color: INK }), run('DIDN’T.', 46, { fontFamily: HEAD, fontWeight: 'bold', color: COOL })], 'center'),
], { x: 60, y: 22, w: 1237, h: 200 }, 'Title: The monsters changed. The fear did not.');
textbox([para([run('105 people. One childhood survey. Two versions of fear.', 19, { fontFamily: SERIF, fontStyle: 'italic', color: INK })], 'center')], { x: 160, y: 206, w: 1037, h: 50 }, 'Subtitle');
textbox([para([run('Different monsters.', 14, { fontFamily: SERIF, fontStyle: 'italic', color: COOL })], 'right'), para([run('Same fear.', 14, { fontFamily: SERIF, fontStyle: 'italic', color: COOL })], 'right')], { x: 1100, y: 250, w: 220, h: 56 }, 'Caption: different monsters, same fear');
textbox([para([run('The dark.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: WARM })]), para([run('Monsters.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: WARM })]), para([run('Being trapped.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: WARM })]), para([run('What if?', 15, { fontFamily: SERIF, fontStyle: 'italic', color: WARM })])], { x: 40, y: 244, w: 220, h: 130 }, 'Caption listing childhood fears: the dark, monsters, being trapped, what if');
textbox([para([run('War.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: COOL })], 'right'), para([run('Uncertainty.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: COOL })], 'right'), para([run('Money. Health.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: COOL })], 'right'), para([run('Not being good enough.', 15, { fontFamily: SERIF, fontStyle: 'italic', color: COOL })], 'right')], { x: 1020, y: 320, w: 300, h: 120 }, 'Caption listing adult fears: war, uncertainty, money, health, not being good enough');

// 43% block (centre, between bedroom and city)
card({ measure: 'Pct Keeping A Childhood Fear', pos: { x: 560, y: 326, w: 360, h: 118 }, size: 72, colorHex: WARM, alt: 'Card: 43 percent of people carried at least one childhood fear into adulthood.' });
card({ measure: 'People Keeping A Childhood Fear', pos: { x: 560, y: 444, w: 360, h: 62 }, size: 22, colorHex: INK, label: true, displayName: 'of 105 people', alt: 'Card: 45 of 105 people.' });
textbox([para([run('carried at least one', 15, { fontFamily: SERIF, fontWeight: 'bold', color: INK })], 'center'), para([run('childhood fear into adulthood.', 15, { fontFamily: SERIF, fontWeight: 'bold', color: INK })], 'center')], { x: 560, y: 512, w: 360, h: 64 }, 'Label for the 43 percent card');

// 57% block (over the office floor)
card({ measure: 'Pct Keeping None', pos: { x: 960, y: 560, w: 360, h: 100 }, size: 60, colorHex: COOL, alt: 'Card: 57 percent of people kept none of their childhood fears.' });
card({ measure: 'People Keeping None', pos: { x: 960, y: 655, w: 360, h: 56 }, size: 20, colorHex: INK, label: true, displayName: 'of 105 people kept none of their childhood fears', alt: 'Card: 60 of 105 people kept none of their childhood fears.' });

// =====================================================================
// PANEL A: FEARS EVOLVE (x 36..676, y 800..1360)
// =====================================================================
textbox([para([run('FEARS ', 30, { fontFamily: HEAD, fontWeight: 'bold', color: ORANGE }), run('EVOLVE', 30, { fontFamily: HEAD, fontWeight: 'bold', color: BLUE })])], { x: 56, y: 814, w: 600, h: 64 }, 'Section heading: Fears evolve');
textbox([para([run('Every kind of fear we could point at shrank. Every kind we carry inside grew.', 13, { color: INK2 })]), para([run('Share of the 105 people naming each category, as a child vs as an adult.', 11, { color: INK2 })])], { x: 56, y: 872, w: 600, h: 60 }, 'Section subtitle');
categoryBars({ pos: { x: 46, y: 930, w: 622, h: 424 }, alt: 'Slope chart of fear categories, childhood versus adult, as a share of people. Dark, unknown and supernatural falls from 46 percent to 13 percent and every other concrete category falls, while performance and future rises from 10 percent to 42 percent and separation and loss rises from 19 percent to 36 percent.' });

// =====================================================================
// PANEL B: TODAY'S TOP FEARS (x 696..1321, y 800..1360)
// =====================================================================
textbox([para([run('TODAY’S TOP FEARS', 30, { fontFamily: HEAD, fontWeight: 'bold', color: BLUE })])], { x: 716, y: 814, w: 590, h: 64 }, 'Section heading: Today\'s top fears');
textbox([para([run('What people pick today, but did not pick as children.', 13, { color: INK2 })]), para([run('Number of people naming each fear today but not in childhood.', 11, { color: INK2 })])], { x: 716, y: 872, w: 590, h: 60 }, 'Section subtitle');
bars({ measure: 'Adult-Only Fear Selections', displayName: 'people', fears: ['War', 'Uncertainty about the future', 'Financial insecurity/poverty', 'Cancer or another serious diagnosis', 'Not being good enough', 'Wasting one’s life/potential', 'Conflict/confrontation', 'Radioactivity/nuclear disaster'], pos: { x: 706, y: 940, w: 605, h: 410 }, colorHex: BLUE, alt: 'Bar chart of fears gained in adulthood: war 14 people, uncertainty about the future 12, financial insecurity 11, cancer 9, not being good enough 9, wasting potential 9, conflict 7, nuclear disaster 7.' });

// =====================================================================
// PANEL C: WHAT STAYED. WHAT CHANGED. (x 36..1321, y 1390..1820)
// =====================================================================
textbox([para([run('WHAT STAYED. ', 34, { fontFamily: HEAD, fontWeight: 'bold', color: ORANGE }), run('WHAT CHANGED.', 34, { fontFamily: HEAD, fontWeight: 'bold', color: BLUE })], 'center')], { x: 56, y: 1400, w: 1245, h: 76 }, 'Section heading: What stayed, what changed');
textbox([para([run('Childhood fears that still haunt us', 16, { fontWeight: 'bold', color: INK })], 'center'), para([run('Of the people who feared this as a child, how many still do.', 11, { color: INK2 })], 'center')], { x: 56, y: 1470, w: 600, h: 56 }, 'Left column heading');
textbox([para([run('New fears in adult life', 16, { fontWeight: 'bold', color: INK })], 'center'), para([run('Things that rarely scared us as kids, but do now.', 11, { color: INK2 })], 'center')], { x: 700, y: 1470, w: 600, h: 56 }, 'Right column heading');

function mini({ x, emoji, name, fear, topMeasure, topLabel, bottomMeasure, bottomLabel, topColor, bottomColor, alt }) {
  const w = 190;
  textbox([para([run(emoji, 32)], 'center')], { x, y: 1528, w, h: 64 }, `Icon for ${name}`);
  textbox([para([run(name, 12, { fontWeight: 'bold', color: INK })], 'center')], { x, y: 1590, w, h: 46 }, `Label: ${name}`);
  const f = [inFilter('DimFear', 'Fear', [fear])];
  card({ measure: topMeasure, displayName: topLabel, label: true, filters: f, pos: { x, y: 1632, w, h: 84 }, size: 34, colorHex: topColor, alt: `${name}: ${alt[0]}` });
  card({ measure: bottomMeasure, displayName: bottomLabel, label: true, filters: f, pos: { x, y: 1720, w, h: 84 }, size: 34, colorHex: bottomColor, alt: `${name}: ${alt[1]}` });
}
// left: stayed
mini({ x: 66, emoji: '🐍', name: 'Snakes', fear: 'Snakes', topMeasure: 'Childhood Selections', topLabel: 'feared it as a child', bottomMeasure: 'Still Afraid', bottomLabel: 'still afraid today', topColor: WARM, bottomColor: ORANGE, alt: ['11 feared snakes as a child', '6 still do'] });
mini({ x: 266, emoji: '🚪', name: 'Being trapped', fear: 'Being trapped / small spaces', topMeasure: 'Childhood Selections', topLabel: 'feared it as a child', bottomMeasure: 'Still Afraid', bottomLabel: 'still afraid today', topColor: WARM, bottomColor: ORANGE, alt: ['14 feared being trapped as a child', '5 still do'] });
mini({ x: 466, emoji: '🏔️', name: 'Heights', fear: 'Heights', topMeasure: 'Childhood Selections', topLabel: 'feared it as a child', bottomMeasure: 'Still Afraid', bottomLabel: 'still afraid today', topColor: WARM, bottomColor: ORANGE, alt: ['13 feared heights as a child', '4 still do'] });
// right: changed
mini({ x: 706, emoji: '💣', name: 'War', fear: 'War', topMeasure: 'Childhood Selections', topLabel: 'feared it as a child', bottomMeasure: 'Adult Selections', bottomLabel: 'fear it now as an adult', topColor: GREY, bottomColor: BLUE, alt: ['5 feared war as a child', '19 fear it today'] });
mini({ x: 906, emoji: '🔮', name: 'Uncertainty about the future', fear: 'Uncertainty about the future', topMeasure: 'Childhood Selections', topLabel: 'feared it as a child', bottomMeasure: 'Adult Selections', bottomLabel: 'fear it now as an adult', topColor: GREY, bottomColor: BLUE, alt: ['4 feared uncertainty as a child', '14 fear it today'] });
mini({ x: 1106, emoji: '🧠', name: 'Not being good enough', fear: 'Not being good enough', topMeasure: 'Childhood Selections', topLabel: 'feared it as a child', bottomMeasure: 'Adult Selections', bottomLabel: 'fear it now as an adult', topColor: GREY, bottomColor: BLUE, alt: ['3 feared not being good enough as a child', '10 fear it today'] });

// footer
textbox([para([run('Anonymous Fabric Community survey, 27 Sep to 11 Oct 2026, 105 self-selected respondents from 28 countries. Each person named up to 3 childhood fears and up to 3 current fears from the same 75 options. “Still afraid” means the same person named the same fear at both stages. Categories are the survey author’s. Source values unchanged; no outside data.', 9, { color: INK2 })], 'center')], { x: 150, y: 1838, w: 1057, h: 60 }, 'Method note');

// =====================================================================
// write out
// =====================================================================
fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(srcDir, outDir, { recursive: true });
const defDir = path.join(outDir, 'Report', 'definition');
const pagesDir = path.join(defDir, 'pages');
for (const p of fs.readdirSync(pagesDir)) { const full = path.join(pagesDir, p); if (fs.statSync(full).isDirectory() && p !== PAGE) fs.rmSync(full, { recursive: true, force: true }); }
fs.writeFileSync(path.join(pagesDir, 'pages.json'), JSON.stringify({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.1.0/schema.json', pageOrder: [PAGE], activePageName: PAGE }));
// register background image
const resDir = path.join(outDir, 'Report', 'StaticResources', 'RegisteredResources');
if (!process.env.NO_IMG) {
  fs.copyFileSync(bgPng, path.join(resDir, BG_NAME));
  const report = JSON.parse(fs.readFileSync(path.join(defDir, 'report.json'), 'utf8'));
  const rr = report.resourcePackages.find(p => p.name === 'RegisteredResources');
  if (!rr.items.some(i => i.name === BG_NAME)) rr.items.push({ name: BG_NAME, path: BG_NAME, type: 'Image' });
  for (const g of gifFiles) { fs.copyFileSync(g.src, path.join(resDir, g.name)); if (!rr.items.some(i => i.name === g.name)) rr.items.push({ name: g.name, path: g.name, type: 'Image' }); }
  fs.writeFileSync(path.join(defDir, 'report.json'), JSON.stringify(report));
}
const pageDir = path.join(pagesDir, PAGE);
fs.writeFileSync(path.join(pageDir, 'page.json'), JSON.stringify({
  $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json',
  name: PAGE, displayName: 'The monsters changed. The fear didn’t.', displayOption: 'FitToPage', height: 1920, width: 1357,
  objects: { background: [{ properties: NO_BG ? { color: color('#05070D'), transparency: num(0) } : {
    color: color('#05070D'),
    image: { image: { name: str(BG_NAME), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: BG_NAME } } }, scaling: str('Fit') } },
    transparency: num(0)
  } }] }
}));
const vdir = path.join(pageDir, 'visuals');
fs.rmSync(vdir, { recursive: true, force: true }); fs.mkdirSync(vdir);
for (const vc of visuals) { fs.mkdirSync(path.join(vdir, vc.name)); fs.writeFileSync(path.join(vdir, vc.name, 'visual.json'), JSON.stringify(vc)); }
for (const f of ['SecurityBindings']) { const p = path.join(outDir, f); if (fs.existsSync(p)) fs.rmSync(p); }
const ct = path.join(outDir, '[Content_Types].xml'); fs.writeFileSync(ct, fs.readFileSync(ct, 'utf8').replace('<Override PartName="/SecurityBindings" ContentType="" />', ''));
// OPC needs a content type per extension or Desktop will not expose the part: without this the GIF image visuals render as broken images.
if (gifFiles.length) { let x = fs.readFileSync(ct, 'utf8'); if (!x.includes('Extension="gif"')) x = x.replace('<Default Extension="png"', '<Default Extension="gif" ContentType="" /><Default Extension="png"'); fs.writeFileSync(ct, x); }
// drop registered resources that nothing on the page references (the starter ships 4.3 MB of backgrounds for pages we deleted)
{
  const report = JSON.parse(fs.readFileSync(path.join(defDir, 'report.json'), 'utf8'));
  const rr = report.resourcePackages.find(p => p.name === 'RegisteredResources');
  let used = JSON.stringify(report.themeCollection || {});
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.json')) used += fs.readFileSync(f, 'utf8'); } };
  walk(pagesDir);
  const dropped = [];
  rr.items = rr.items.filter(i => { if (used.includes(i.name)) return true; dropped.push(i.name); const f = path.join(resDir, i.path); if (fs.existsSync(f)) fs.rmSync(f); return false; });
  fs.writeFileSync(path.join(defDir, 'report.json'), JSON.stringify(report));
  if (dropped.length) console.log('dropped unused resources:', dropped.join(', '));
}
console.log(`wrote ${visuals.length} visuals; background registered as ${BG_NAME}; gifs: ${gifFiles.map(g => g.name).join(", ") || "none"}`);

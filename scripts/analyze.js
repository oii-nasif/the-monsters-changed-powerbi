const fs = require('fs');
const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');

// RFC4180-ish CSV parser
function parseCSV(s) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const rows = parseCSV(text);
const header = rows[0];
const data = rows.slice(1).filter(r => r.length === header.length).map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
const J = s => { try { return JSON.parse(s); } catch { return []; } };
data.forEach(d => { d.child = J(d.childhoodFearsJson); d.now = J(d.currentFearsJson); d.tools = J(d.fabricToolsJson); });

const count = (arr) => { const m = {}; arr.forEach(x => m[x] = (m[x] || 0) + 1); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
const show = (title, entries, n = 100) => { console.log(`\n## ${title}`); entries.slice(0, n).forEach(([k, v]) => console.log(`${String(v).padStart(4)}  ${k}`)); };

console.log(`rows: ${data.length}  columns: ${header.join(', ')}`);
show('ageGroup', count(data.map(d => d.ageGroup)));
show('gender', count(data.map(d => d.gender)));
show('countryNow', count(data.map(d => d.countryNow)));
show('countryChildhood', count(data.map(d => d.countryChildhood)));
const moved = data.filter(d => d.countryChildhood && d.countryNow && d.countryChildhood !== d.countryNow);
console.log(`\nmoved country: ${moved.length} / ${data.length}`);
show('childhood fears', count(data.flatMap(d => d.child)));
show('current fears', count(data.flatMap(d => d.now)));
show('fear count per person (child)', count(data.map(d => d.child.length)));
show('fear count per person (now)', count(data.map(d => d.now.length)));

// Category map
const cat = {};
const put = (c, ...xs) => xs.forEach(x => cat[x] = c);
put('Animals', 'Spiders', 'Snakes', 'Bats', 'Dogs', 'Bees/wasps', 'Sharks', 'Rats/mice', 'Birds', 'Insects/bugs in general');
put('Places & situations', 'Heights', 'Basements / Attics', 'Elevators', 'Tunnels', 'Cemeteries', 'Deep/open water', 'Drowning', 'Open/empty spaces', 'Abandoned buildings', 'Bridges', 'Crowded spaces', 'Being trapped / small spaces', 'The dark', 'Getting lost', 'The unknown/unfamiliar', 'Thunderstorms/lightning', 'Natural disasters generally', 'Fire', 'Flying', 'Choking');
put('Medical & body', 'Blood', 'Needles/shots', 'Doctors/hospitals', 'Dentists', 'Cancer or another serious diagnosis', 'Getting sick/illness', 'Losing a limb or developing a disability', 'Germs/contamination');
put('Supernatural & intruders', 'Ghosts', 'Demons/the devil', 'Aliens', 'Zombies', 'Monsters under the bed', 'Clowns', 'Dolls/mannequins', 'Being watched', 'Intruders/home invasion');
put('Death & loss', 'Death (your own or a loved one’s)', 'Pets dying', 'Abandonment', 'Separation from friends or family', 'Divorce/breakup', 'Being forgotten', 'Being alone / Loneliness');
put('Social', 'Being laughed at', 'Being judged', 'Being disliked', 'Rejection', 'Embarrassment', 'Public speaking', 'Conflict/confrontation', 'Not being good enough');
put('Life, work & future', 'Failing at work/school', 'Missing deadlines', 'Job loss', 'Wasting one’s life/potential', 'Financial insecurity/poverty', 'Uncertainty about the future', 'Commitment');
put('Global threats', 'Radioactivity/nuclear disaster', 'War');
const catOf = f => cat[f] || (f.startsWith('Something else') ? 'Other' : (/Prefer not|None of these/.test(f) ? 'No answer' : 'UNMAPPED:' + f));

show('childhood by category', count(data.flatMap(d => d.child.map(catOf))));
show('current by category', count(data.flatMap(d => d.now.map(catOf))));

// Per-person transitions
let kept = [], outgrown = [], gained = [];
data.forEach(d => {
  const c = new Set(d.child), n = new Set(d.now);
  d.child.forEach(f => (n.has(f) ? kept : outgrown).push(f));
  d.now.forEach(f => { if (!c.has(f)) gained.push(f); });
});
const keptPeople = data.filter(d => d.child.some(f => d.now.includes(f))).length;
console.log(`\npeople keeping >=1 childhood fear: ${keptPeople}/${data.length}`);
show('fears KEPT (same person, child & now)', count(kept));
show('fears OUTGROWN', count(outgrown), 15);
show('fears GAINED', count(gained), 15);
const childCounts = Object.fromEntries(count(data.flatMap(d => d.child)));
const keptCounts = Object.fromEntries(count(kept));
console.log('\n## retention rate (kept / had as child), fears with >=4 childhood mentions');
Object.entries(childCounts).filter(([f, c]) => c >= 4).map(([f, c]) => [f, c, keptCounts[f] || 0]).sort((a, b) => (b[2] / b[1]) - (a[2] / a[1])).forEach(([f, c, k]) => console.log(`${String(k).padStart(3)}/${String(c).padEnd(3)} ${(100 * k / c).toFixed(0).padStart(3)}%  ${f}`));

// Category flow
console.log('\n## category flow (each person: every child-cat x now-cat pair)');
const flow = {};
data.forEach(d => { const cs = [...new Set(d.child.map(catOf))], ns = [...new Set(d.now.map(catOf))]; cs.forEach(a => ns.forEach(b => { const k = a + ' -> ' + b; flow[k] = (flow[k] || 0) + 1; })); });
Object.entries(flow).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(`${String(v).padStart(4)}  ${k}`));

// Age group x current category
console.log('\n## current fear category by age group (share of mentions)');
const ages = count(data.map(d => d.ageGroup)).map(x => x[0]).sort();
const cats = [...new Set(Object.values(cat))];
console.log(''.padEnd(26) + ages.map(a => a.padStart(8)).join(''));
cats.forEach(c => {
  const line = ages.map(a => { const ms = data.filter(d => d.ageGroup === a).flatMap(d => d.now.map(catOf)); const n = ms.filter(x => x === c).length; return ms.length ? (100 * n / ms.length).toFixed(0) + '%' : '-'; });
  console.log(c.padEnd(26) + line.map(x => x.padStart(8)).join(''));
});
console.log('\n## childhood fear category by age group (share of mentions)');
console.log(''.padEnd(26) + ages.map(a => a.padStart(8)).join(''));
cats.forEach(c => {
  const line = ages.map(a => { const ms = data.filter(d => d.ageGroup === a).flatMap(d => d.child.map(catOf)); const n = ms.filter(x => x === c).length; return ms.length ? (100 * n / ms.length).toFixed(0) + '%' : '-'; });
  console.log(c.padEnd(26) + line.map(x => x.padStart(8)).join(''));
});

show('dataNightmare', count(data.map(d => d.dataNightmare)));
show('fabric tools', count(data.flatMap(d => d.tools)));
show('tools per person', count(data.map(d => d.tools.length)));
show('submittedAt (date)', count(data.map(d => d.submittedAt.slice(0, 10))));

console.log('\n## current fear category by gender (share of mentions)');
const gs = count(data.map(d => d.gender)).map(x => x[0]);
console.log(''.padEnd(26) + gs.map(a => a.padStart(20)).join(''));
cats.forEach(c => {
  const line = gs.map(g => { const ms = data.filter(d => d.gender === g).flatMap(d => d.now.map(catOf)); const n = ms.filter(x => x === c).length; return ms.length ? `${n}/${ms.length} ${(100 * n / ms.length).toFixed(0)}%` : '-'; });
  console.log(c.padEnd(26) + line.map(x => x.padStart(20)).join(''));
});

// Concrete vs abstract: tangible (animals, places, medical, supernatural) vs intangible (death/loss, social, life/work, global)
const tangible = new Set(['Animals', 'Places & situations', 'Medical & body', 'Supernatural & intruders']);
const tang = arr => { const ms = arr.filter(x => tangible.has(x) || ['Death & loss', 'Social', 'Life, work & future', 'Global threats'].includes(x)); const t = ms.filter(x => tangible.has(x)).length; return `${t}/${ms.length} tangible = ${(100 * t / ms.length).toFixed(0)}%`; };
console.log('\n## tangible share: childhood', tang(data.flatMap(d => d.child.map(catOf))));
console.log('## tangible share: current  ', tang(data.flatMap(d => d.now.map(catOf))));

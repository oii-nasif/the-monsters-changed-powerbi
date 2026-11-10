// Validate generated PBIR JSON against Microsoft's published schemas.
// usage: node validate_pbir.js <schemaDir> <reportDefinitionDir>
const fs = require('fs'), path = require('path');
const Ajv = require('C:/Users/USER/AppData/Local/Temp/val/node_modules/ajv');
const addFormats = require('C:/Users/USER/AppData/Local/Temp/val/node_modules/ajv-formats');
const [schemaDir, defDir] = process.argv.slice(2);

const BASE = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const ajv = new Ajv({ strict: false, allErrors: true, allowUnionTypes: true });
addFormats(ajv);
// load every schema file with its canonical URL as $id
for (const f of fs.readdirSync(schemaDir).filter(f => f.endsWith('.json'))) {
  const s = JSON.parse(fs.readFileSync(path.join(schemaDir, f), 'utf8'));
  const id = BASE + f.replace(/_/g, '/');
  s.$id = id;
  try { ajv.addSchema(s, id); } catch (e) { console.log('addSchema failed', f, e.message); }
}
function check(file, schemaUrl) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const url = schemaUrl || data.$schema;
  const validate = ajv.getSchema(url);
  if (!validate) { console.log(`NO SCHEMA for ${url} (${path.relative(defDir, file)})`); return; }
  const ok = validate(data);
  if (ok) console.log(`OK   ${path.relative(defDir, file)}`);
  else {
    console.log(`FAIL ${path.relative(defDir, file)}`);
    const seen = new Set();
    for (const e of validate.errors) { const k = e.instancePath + ' ' + e.message; if (seen.has(k)) continue; seen.add(k); console.log(`     ${e.instancePath || '/'} : ${e.message} ${e.params ? JSON.stringify(e.params).slice(0, 120) : ''}`); if (seen.size > 12) { console.log('     ...'); break; } }
  }
}
check(path.join(defDir, 'report.json'));
check(path.join(defDir, 'pages', 'pages.json'));
for (const p of fs.readdirSync(path.join(defDir, 'pages'))) {
  const pd = path.join(defDir, 'pages', p);
  if (!fs.statSync(pd).isDirectory()) continue;
  check(path.join(pd, 'page.json'));
  const vd = path.join(pd, 'visuals');
  if (fs.existsSync(vd)) for (const v of fs.readdirSync(vd)) check(path.join(vd, v, 'visual.json'));
}

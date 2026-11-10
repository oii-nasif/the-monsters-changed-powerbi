// Full-page frames of the animated scene (no data visuals), used to build the LinkedIn video.
// usage: node render_page_frames.js <poster_live.html> <outDir> <fps>
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const [html, outDir, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg || 10);
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1'] });
  const p = await b.newPage(); await p.setViewport({ width: 1357, height: 1920, deviceScaleFactor: 1 });
  const url = 'file:///' + path.resolve(html).split(path.sep).join('/');
  await p.goto(url, { waitUntil: 'networkidle0' });
  const total = await p.evaluate(() => window.TOTAL); const n = Math.round(total * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.render(t), i / fps);
    await p.screenshot({ path: path.join(outDir, 'f' + String(i).padStart(4, '0') + '.png'), clip: { x: 0, y: 0, width: 1357, height: 1920 } });
  }
  await b.close(); console.log('frames', n, '->', outDir);
})().catch(e => { console.error(e); process.exit(1); });

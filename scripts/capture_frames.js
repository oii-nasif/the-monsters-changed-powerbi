// usage: node capture.js <html> <outDir> <fps> [sampleTimesCommaSeparated]
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const [html, outDir, fpsArg, samples] = process.argv.slice(2);
const fps = Number(fpsArg || 30);
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  await page.goto('file:///' + html, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => window.TOTAL);
  const times = samples ? samples.split(',').map(Number) : Array.from({ length: Math.round(total * fps) }, (_, i) => i / fps);
  let i = 0;
  for (const t of times) {
    await page.evaluate(tt => window.render(tt), t);
    const name = samples ? ('sample_' + String(t).replace('.', '_') + '.png') : ('f' + String(i).padStart(5, '0') + '.png');
    await page.screenshot({ path: path.join(outDir, name), type: 'png' });
    i++;
    if (i % 60 === 0) console.log('frames', i, '/', times.length);
  }
  await browser.close();
  console.log('done', times.length, 'frames ->', outDir);
})();

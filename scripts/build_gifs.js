// Renders the animated poster scene to looping GIFs, one per region declared in the HTML (window.REGIONS),
// plus the static t=0 full-page PNG used as the page background.
// usage: node build_gifs.js <poster_live.html> <outDir> [fps=10]
// output: <outDir>/<region>.gif, <outDir>/poster_bg.png, <outDir>/manifest.json
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [html, outDir, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg || 10);
const FFMPEG = process.env.FFMPEG || path.join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1357, height: 1920, deviceScaleFactor: 1 });
  await page.goto('file:///' + path.resolve(html).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => window.TOTAL);
  const regions = await page.evaluate(() => window.REGIONS);
  const n = Math.round(total * fps);

  // static background = frame 0
  await page.evaluate(() => window.render(0));
  await page.screenshot({ path: path.join(outDir, 'poster_bg.png'), type: 'png', clip: { x: 0, y: 0, width: 1357, height: 1920 } });

  for (const r of regions) {
    const fdir = path.join(outDir, 'frames_' + r.name);
    fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir);
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.render(t), i / fps);
      await page.screenshot({ path: path.join(fdir, 'f' + String(i).padStart(4, '0') + '.png'), type: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h } });
    }
    const gif = path.join(outDir, r.name + '.gif');
    // one palette for the whole loop; ordered dither keeps static pixels identical between frames so the
    // encoder only stores the changed rectangle of each frame.
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(fdir, 'f%04d.png'),
      '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=' + (process.env.GIF_COLORS || 128) + ':stats_mode=diff[p];[b][p]paletteuse=dither=' + (process.env.GIF_DITHER || 'none') + ':diff_mode=rectangle',
      '-loop', '0', gif]);
    r.file = r.name + '.gif'; r.bytes = fs.statSync(gif).size;
    console.log(`${r.name}: ${r.w}x${r.h} ${n} frames -> ${(r.bytes / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ fps, total, regions }, null, 2));
  console.log('manifest ->', path.join(outDir, 'manifest.json'));
})().catch(e => { console.error(e); process.exit(1); });

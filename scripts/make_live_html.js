// Builds art/poster_live.html from art/poster_bg.html (static scene) + art/live_script.js (animation).
// usage: node make_live_html.js <poster_bg.html> <live_script.js> <out.html>
const fs = require('fs');
const [src, scriptFile, out] = process.argv.slice(2);
let s = fs.readFileSync(src, 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); s = s.replace(a, b); }
rep(`<circle cx="1230" cy="120" r="110" fill="url(#moonhalo)"/>`, `<circle id="halo" cx="1230" cy="120" r="110" fill="url(#moonhalo)"/>`);
rep(`<rect x="445" y="345" width="120" height="355" fill="#FFB36B" opacity="0.35"/>`, `<rect id="dglow" x="445" y="345" width="120" height="355" fill="#FFB36B" opacity="0.35"/>`);
rep(`<circle cx="496" cy="470" r="5" fill="#FFE28A"/><circle cx="516" cy="470" r="5" fill="#FFE28A"/>`,
  `<circle id="meg" cx="506" cy="470" r="22" fill="#FFE28A" opacity="0.22" filter="url(#blur8)"/><ellipse id="me1" cx="496" cy="470" rx="5" ry="5" fill="#FFE28A"/><ellipse id="me2" cx="516" cy="470" rx="5" ry="5" fill="#FFE28A"/>`);
rep(`<path d="M462 560 L440 548 M462 575 L438 572 M462 590 L442 598" stroke="#1B0B05" stroke-width="5" stroke-linecap="round"/>`,
  `<path id="claws" d="M462 560 L440 548 M462 575 L438 572 M462 590 L442 598" stroke="#1B0B05" stroke-width="5" stroke-linecap="round"/>`);
rep(`<circle cx="375" cy="600" r="70" fill="url(#lamp)" opacity="0.8"/>`, `<circle id="lampg" cx="375" cy="600" r="70" fill="url(#lamp)" opacity="0.8"/>`);
rep(`  <!-- office floor -->`, `  <g id="covers" fill="#0A1326"></g>\n  <!-- office floor -->`);
rep(`<rect x="1066" y="436" width="98" height="60" fill="#8CD0FF" opacity="0.5"/>`, `<rect id="mon1" x="1066" y="436" width="98" height="60" fill="#8CD0FF" opacity="0.5"/>`);
rep(`<rect x="1196" y="446" width="88" height="50" fill="#8CD0FF" opacity="0.5"/>`, `<rect id="mon2" x="1196" y="446" width="88" height="50" fill="#8CD0FF" opacity="0.5"/>`);
rep(`<ellipse cx="1175" cy="380" rx="170" ry="0" fill="#39A0FF" opacity="0.18" filter="url(#blur20)"/>`, `<ellipse id="sglow" cx="1175" cy="380" rx="170" ry="0" fill="#39A0FF" opacity="0.18" filter="url(#blur20)"/>`);
rep(`<rect x="1295" y="490" width="18" height="20" rx="3" fill="#F5F1E8" opacity="0.85"/>`, `<rect x="1295" y="490" width="18" height="20" rx="3" fill="#F5F1E8" opacity="0.85"/><g id="steam" fill="#F5F1E8"></g>`);
rep(`<path d="M330 735 C 500 760, 560 640, 700 660 S 900 720, 1010 640" fill="none" stroke="url(#path)" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`,
  `<path id="pathline" d="M330 735 C 500 760, 560 640, 700 660 S 900 720, 1010 640" fill="none" stroke="url(#path)" stroke-width="5" stroke-linecap="round" opacity="0.9"/>\n<g id="pulse"></g>`);
rep(`<use href="#ghost" x="360" y="255" opacity="0.85" transform="rotate(-8 360 255)"/>`, `<use id="g1" href="#ghost" x="360" y="255" opacity="0.85" transform="rotate(-8 360 255)"/>`);
rep(`<use href="#ghost" x="1000" y="250" opacity="0.55" transform="scale(0.7) translate(430 110)"/>`, `<use id="g2" href="#ghost" x="1000" y="250" opacity="0.55" transform="scale(0.7) translate(430 110)"/>`);
rep(`<use href="#bat" x="300" y="250"/><use href="#bat" x="360" y="210" transform="scale(0.8) translate(90 50)"/><use href="#bat" x="900" y="200"/><use href="#bat" x="950" y="170" transform="scale(0.7) translate(400 70)"/><use href="#bat" x="1200" y="230"/>`,
  `<use class="bat" href="#bat" data-x="300" data-y="250" data-s="1" data-p="0"/><use class="bat" href="#bat" data-x="360" data-y="208" data-s="0.8" data-p="1.7"/><use class="bat" href="#bat" data-x="900" data-y="200" data-s="1" data-p="3.1"/><use class="bat" href="#bat" data-x="945" data-y="168" data-s="0.7" data-p="4.4"/><use class="bat" href="#bat" data-x="1200" data-y="230" data-s="1" data-p="2.3"/>`);
rep(`<circle cx="1214" cy="108" r="7" fill="#A9C4EA" opacity="0.5"/><circle cx="1242" cy="132" r="5" fill="#A9C4EA" opacity="0.5"/>`,
  `<circle cx="1214" cy="108" r="7" fill="#A9C4EA" opacity="0.5"/><circle cx="1242" cy="132" r="5" fill="#A9C4EA" opacity="0.5"/>\n<g id="twinkle" fill="#fff"></g>`);
rep(`<circle cx="0" cy="0" r="60" fill="url(#pumpkinglow)" opacity="0.8"/>`, `<circle id="pkg" cx="0" cy="0" r="60" fill="url(#pumpkinglow)" opacity="0.8"/>`);
rep(`<path d="M-18 -8 L-8 -2 L-18 2 Z M18 -8 L8 -2 L18 2 Z" fill="#FFE28A"/>`, `<path id="pke" d="M-18 -8 L-8 -2 L-18 2 Z M18 -8 L8 -2 L18 2 Z" fill="#FFE28A"/>`);
rep(`<path d="M-16 10 L-8 16 L-2 10 L4 16 L10 10 L16 14 L12 20 L-12 20 Z" fill="#FFE28A"/>`, `<path id="pkm" d="M-16 10 L-8 16 L-2 10 L4 16 L10 10 L16 14 L12 20 L-12 20 Z" fill="#FFE28A"/>`);
rep(`</svg>\n</body></html>`, `</svg>\n<script>\n${fs.readFileSync(scriptFile, 'utf8')}\n</script>\n</body></html>`);
fs.writeFileSync(out, s);
console.log('wrote', out, s.length);

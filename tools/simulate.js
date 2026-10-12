// Renders a card as if some entities were missing: node simulate.js ../.env <url> <out.png> '<{"entity_id":"unavailable"}>' [shiftHours]
// shiftHours moves the page's clock forward, to test "no recent reading" warnings.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const [url, out, overrides = '{}', shiftHours = '0'] = process.argv.slice(3);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 372, height: 440, deviceScaleFactor: 2 });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  const origin = new URL(url).origin;
  await p.goto(origin + '/manifest.json');
  await p.evaluate(t => localStorage.setItem('hassTokens', JSON.stringify({ access_token: t, expires: Date.now() + 1e9 })), env.HOMEASSISTANT_TOKEN);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const text = await p.evaluate(async (fake, shift) => {
    const original = statesOf;
    statesOf = async ids => { const s = await original(ids); for (const [id, v] of Object.entries(fake)) if (id in s) s[id] = v === 'null' ? null : v; return s; };
    if (shift) { const now = Date.now.bind(Date); Date.now = () => now() + shift * 3600e3; }
    await render();
    const box = document.getElementById('problems');
    return box.hidden ? '(no warnings)' : box.innerText.replace(/\n/g, ' | ');
  }, JSON.parse(overrides), +shiftHours);
  console.log(text);
  await p.screenshot({ path: out });
  await b.close();
})();

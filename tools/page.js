// Render any card page standalone: node page.js ../.env <url> <out.png> [width] [height]
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const [url, out, w = 372, h = 440] = process.argv.slice(3);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 2 });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  const origin = new URL(url).origin;
  await p.goto(origin + '/manifest.json');
  await p.evaluate(t => localStorage.setItem('hassTokens', JSON.stringify({ access_token: t, token_type: 'Bearer', expires: Date.now() + 1e9 })), env.HOMEASSISTANT_TOKEN);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  console.log((await p.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '));
  await p.screenshot({ path: out });
  await b.close();
})();

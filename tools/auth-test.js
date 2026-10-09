const puppeteer = require('puppeteer-core');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const url = process.argv[3];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1500, height: 900 });
  const origin = new URL(url).origin;
  await p.goto(origin + '/manifest.json');
  await p.evaluate((t, o) => localStorage.setItem('hassTokens', JSON.stringify({ access_token: t, token_type: 'Bearer', expires_in: 1e9, expires: Date.now() + 1e9, hassUrl: o, clientId: o + '/', refresh_token: 'x' })), env.HOMEASSISTANT_TOKEN, origin);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 4000));
  for (const match of ['mode=total', 'mode=spot', 'temperatur.html']) {
    const frame = p.frames().find(f => f.url().includes(match));
    if (!frame) { console.log(match, 'frame not found'); continue; }
    const result = await frame.evaluate(async () => {
      localStorage.removeItem('hassTokens');      // the old code path would now fail
      await render();
      const err = document.getElementById('error');
      return { error: err.hidden ? '(none)' : err.textContent, values: [...document.querySelectorAll('.stat-value, .room-temp')].map(e => e.textContent) };
    });
    console.log(match, JSON.stringify(result));
  }
  await b.close();
})();

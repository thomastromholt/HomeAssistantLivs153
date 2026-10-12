// Prints what the price card actually plots: hour, price, and whether the hour is in the peak-shaving plan.
// node chart-points.js ../.env "<card url>" <fromHour> <toHour>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const [url, fromHour = 0, toHour = 23] = process.argv.slice(3);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 372, height: 440 });
  const origin = new URL(url).origin;
  await p.goto(origin + '/manifest.json');
  await p.evaluate(t => localStorage.setItem('hassTokens', JSON.stringify({ access_token: t, expires: Date.now() + 1e9 })), env.HOMEASSISTANT_TOKEN);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const rows = await p.evaluate((from, to) => {
    const now = Date.now();
    return chart.data.datasets[0].data.slice(0, -1).map(pt => {
      const t = new Date(now + pt.x * 3600e3);
      return { day: t.toLocaleDateString('sv-SE'), hour: t.getHours(), price: Math.round(pt.y), shaving: isPeakShaving(now, pt.x) };
    }).filter(r => r.hour >= from && r.hour <= to);
  }, +fromHour, +toHour);
  const byDay = {};
  for (const r of rows) (byDay[r.day] ??= []).push(`${String(r.hour).padStart(2, '0')}:${r.price}${r.shaving ? '*' : ''}`);
  for (const [day, items] of Object.entries(byDay)) console.log(day, items.join('  '));
  console.log('(* = in the peak-shaving plan)');
  await b.close();
})();

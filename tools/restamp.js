// Gives the card URLs of one dashboard a fresh ?v= stamp through Home Assistant's websocket, so no HA restart is needed.
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const urlPath = process.argv[3], stamp = Math.floor(Date.now() / 1000);
const ws = new WebSocket(env.HOMEASSISTANT_URL.replace(/^http/, 'ws') + '/api/websocket');
let id = 1; const pending = new Map();
const call = p => new Promise(r => { const i = id++; pending.set(i, r); ws.send(JSON.stringify({ id: i, ...p })); });
ws.onmessage = async ev => {
  const m = JSON.parse(ev.data);
  if (m.type === 'auth_required') return ws.send(JSON.stringify({ type: 'auth', access_token: env.HOMEASSISTANT_TOKEN }));
  if (m.type === 'auth_ok') {
    const cfg = await call({ type: 'lovelace/config', url_path: urlPath });
    if (!cfg.success) { console.log('read failed', cfg.error); process.exit(1); }
    let n = 0;
    const text = JSON.stringify(cfg.result).replace(/(\/local\/[^"]*?[?&]v=)\d+/g, (_, a) => { n++; return a + stamp; });
    const save = await call({ type: 'lovelace/config/save', url_path: urlPath, config: JSON.parse(text) });
    console.log(save.success ? `restamped ${n} card urls to v=${stamp}` : 'save failed ' + JSON.stringify(save.error));
    process.exit(0);
  }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};

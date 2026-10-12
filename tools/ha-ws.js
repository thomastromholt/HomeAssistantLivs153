// Run one or more Home Assistant WebSocket commands: node ha-ws.js ../.env '<json>' ['<json>' ...]
// Each argument is a command object such as {"type":"input_select/list"}; results are printed as JSON.
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const commands = process.argv.slice(3).map(c => JSON.parse(c));

const ws = new WebSocket(env.HOMEASSISTANT_URL.replace(/^http/, 'ws') + '/api/websocket');
let nextId = 1;
const pending = new Map();
const call = payload => new Promise(resolve => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, ...payload })); });
ws.onmessage = async event => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'auth_required') return ws.send(JSON.stringify({ type: 'auth', access_token: env.HOMEASSISTANT_TOKEN }));
  if (msg.type === 'auth_invalid') { console.log('auth failed'); process.exit(1); }
  if (msg.type === 'auth_ok') {
    for (const command of commands) {
      const reply = await call(command);
      console.log(JSON.stringify(reply.success ? reply.result : { error: reply.error }));
    }
    process.exit(0);
  }
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};

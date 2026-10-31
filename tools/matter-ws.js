// Talks to the Matter Server add-on (port 5580, not reachable from outside) by running nc on the box over ssh and speaking
// a minimal websocket client over it:  node matter-ws.js [ssh-host] get_nodes   (prints the raw JSON result)
const { spawn } = require('child_process'), crypto = require('crypto');
const host = process.argv[2] || process.env.HA_SSH_HOST || 'root@192.168.1.77';
const command = process.argv[3] || 'get_nodes';
const p = spawn('ssh', ['-o', 'ConnectTimeout=10', host, 'nc core-matter-server 5580']);
let buf = Buffer.alloc(0), upgraded = false;
const frame = text => {
  const data = Buffer.from(text), mask = crypto.randomBytes(4);
  const head = data.length < 126 ? Buffer.from([0x81, 0x80 | data.length]) : Buffer.from([0x81, 0x80 | 126, data.length >> 8, data.length & 255]);
  return Buffer.concat([head, mask, Buffer.from(data.map((b, i) => b ^ mask[i % 4]))]);
};
p.stdin.write(`GET /ws HTTP/1.1\r\nHost: core-matter-server:5580\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${crypto.randomBytes(16).toString('base64')}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
let sent = false;
p.stdout.on('data', chunk => {
  buf = Buffer.concat([buf, chunk]);
  if (!upgraded) { const i = buf.indexOf('\r\n\r\n'); if (i < 0) return; buf = buf.subarray(i + 4); upgraded = true; }
  for (;;) {
    if (buf.length < 2) return;
    let len = buf[1] & 127, off = 2;
    if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
    if (buf.length < off + len) return;
    const text = buf.subarray(off, off + len).toString(); buf = buf.subarray(off + len);
    let m; try { m = JSON.parse(text); } catch { continue; }
    if (m.fabric_id !== undefined && !sent) { sent = true; p.stdin.write(frame(JSON.stringify({ message_id: '1', command }))); }
    else if (m.message_id === '1') { console.log(JSON.stringify(m.result ?? m)); process.exit(0); }
  }
});
setTimeout(() => { console.error('timeout'); process.exit(1); }, 30000);

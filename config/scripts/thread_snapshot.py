"""Writes /config/www/thread.json: the Thread network as each Matter node sees it (role, parent/neighbour RSSI and LQI, today's losses).

Run by shell_command.thread_snapshot (see config/automations/thread_snapshot.yaml); the card www/thread.html reads the file.
Talks to the Matter Server add-on's websocket, which the browser cannot reach. Thread diagnostics cluster = 0x35 (53):
1 routing role, 7 neighbour table, 8 route table. Role: 2 sleepy end device, 3 end device, 4 REED, 5 router, 6 leader.
The Matter Server holds no subscription to cluster 53, so get_nodes only returns what each device said when it last joined (the
same RSSI and counters for days). Every run therefore reads 0/53/* live from each available device with read_attribute.
Counters (Tx 22, TxAckRequested 25, TxRetry 33, TxDirect/IndirectMaxRetryExpiry 34/35, DetachedRoleCount 14) count since the
device last booted; /config/.thread_counters.json keeps the values from the first run of each day (Europe/Stockholm) so the card
can show today's share of failed attempts. A counter that goes down means the device rebooted: its baseline is then zero.
"""
import asyncio, base64, itertools, json, os, time
from datetime import datetime

import aiohttp

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo('Europe/Stockholm')
except Exception:
    TZ = None

ROLES = {1: 'unassigned', 2: 'sleepy end device', 3: 'end device', 4: 'router-eligible', 5: 'router', 6: 'leader'}
STATE = '/config/.thread_counters.json'
READ_TIMEOUT = 15

def counters(a):
    if '0/53/22' not in a:
        return None
    g = lambda i: a.get(f'0/53/{i}') or 0
    return {'tx': g(22), 'ackreq': g(25), 'retry': g(33), 'expired': g(34) + g(35), 'detached': g(14)}

async def main():
    async with aiohttp.ClientSession() as s, s.ws_connect('ws://core-matter-server:5580/ws') as ws:
        await ws.receive_json()
        ids, futures = itertools.count(1), {}

        async def reader():
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    m = json.loads(msg.data)
                    fut = futures.pop(m.get('message_id'), None)
                    if fut and not fut.done():
                        fut.set_result(m)

        task = asyncio.create_task(reader())

        async def call(command, timeout, **args):
            mid = str(next(ids))
            futures[mid] = fut = asyncio.get_running_loop().create_future()
            await ws.send_json({'message_id': mid, 'command': command, **({'args': args} if args else {})})
            try:
                return (await asyncio.wait_for(fut, timeout)).get('result')
            except asyncio.TimeoutError:
                futures.pop(mid, None)
                return None

        nodes = await call('get_nodes', 30)
        live = [None] * len(nodes)
        for _ in range(2):   # a sleepy device on a weak link can miss the first read; stays inside shell_command's 60 s
            tries = await asyncio.gather(*(call('read_attribute', READ_TIMEOUT, node_id=n['node_id'], attribute_path='0/53/*')
                                           if n['available'] and not live[i] else asyncio.sleep(0, None) for i, n in enumerate(nodes)))
            live = [old or new for old, new in zip(live, tries)]
        task.cancel()
    mac, rloc = {}, {}
    for n in nodes:
        for i in n['attributes'].get('0/51/0') or []:
            if i.get('7') == 4:   # interface type 4 = Thread
                mac[int.from_bytes(base64.b64decode(i['4']), 'big')] = n['node_id']
                for addr in i.get('6') or []:   # the RLOC address ends in 0000:00ff:fe00:<rloc16>
                    b = base64.b64decode(addr)
                    if b[8:14] == bytes([0, 0, 0, 0xff, 0xfe, 0]):
                        rloc[int.from_bytes(b[14:16], 'big')] = n['node_id']

    now = time.time()
    day = datetime.now(TZ).strftime('%Y-%m-%d')
    try:
        with open(STATE) as f:
            state = json.load(f)
    except Exception:
        state = {}
    if state.get('day') != day:
        state = {'day': day, 'since': now, 'base': {}}
    base = state['base']

    out = []
    for n, fresh in zip(nodes, live):
        a = {**n['attributes'], **(fresh or {})}
        if '0/53/1' not in a:
            continue
        neighbours = [{'node': mac.get(x['0'], rloc.get(x['2'])), 'rloc': x['2'], 'avg_rssi': x['6'], 'last_rssi': x['7'], 'lqi': x['5'],
                       'child': x['13'], 'frame_error': x['8'], 'error_rate': x['9']} for x in a.get('0/53/7') or []]
        today, cur, key = None, counters(a), str(n['node_id'])
        if cur and fresh:
            old = base.get(key)
            if old is None:
                base[key] = old = cur
            elif any(cur[k] < old[k] for k in cur):
                base[key] = old = {k: 0 for k in cur}
            today = {k: cur[k] - old[k] for k in cur}
        out.append({'node_id': n['node_id'], 'name': a.get('0/40/3') or a.get('0/40/4') or f"Node {n['node_id']}",
                    'rloc': next((r for r, i in rloc.items() if i == n['node_id']), None), 'available': n['available'], 'live': bool(fresh),
                    'role': ROLES.get(a['0/53/1'], str(a['0/53/1'])), 'channel': a.get('0/53/0'),
                    'neighbours': neighbours, 'routes': len(a.get('0/53/8') or []), 'today': today})
    with open(STATE + '.tmp', 'w') as f:
        json.dump(state, f)
    os.replace(STATE + '.tmp', STATE)
    with open('/config/www/thread.json', 'w') as f:
        json.dump({'updated': now, 'since': state['since'], 'network': nodes and nodes[0]['attributes'].get('0/53/2'), 'nodes': out}, f)

asyncio.run(main())

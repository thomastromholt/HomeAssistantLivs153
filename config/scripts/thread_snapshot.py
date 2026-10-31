"""Writes /config/www/thread.json: the Thread network as each Matter node sees it (role, parent/neighbour RSSI and LQI).

Run by shell_command.thread_snapshot (see config/automations/thread_snapshot.yaml); the card www/thread.html reads the file.
Talks to the Matter Server add-on's websocket, which the browser cannot reach. Thread diagnostics cluster = 0x35 (53):
1 routing role, 7 neighbour table, 8 route table. Role: 2 sleepy end device, 3 end device, 4 REED, 5 router, 6 leader.
"""
import asyncio, base64, json, time
import aiohttp

ROLES = {1: 'unassigned', 2: 'sleepy end device', 3: 'end device', 4: 'router-eligible', 5: 'router', 6: 'leader'}

async def main():
    async with aiohttp.ClientSession() as s, s.ws_connect('ws://core-matter-server:5580/ws') as ws:
        await ws.receive_json()
        await ws.send_json({'message_id': '1', 'command': 'get_nodes'})
        nodes = (await ws.receive_json())['result']
    mac, rloc = {}, {}
    for n in nodes:
        for i in n['attributes'].get('0/51/0') or []:
            if i.get('7') == 4:   # interface type 4 = Thread
                mac[int.from_bytes(base64.b64decode(i['4']), 'big')] = n['node_id']
                for addr in i.get('6') or []:   # the RLOC address ends in 0000:00ff:fe00:<rloc16>
                    b = base64.b64decode(addr)
                    if b[8:14] == bytes([0, 0, 0, 0xff, 0xfe, 0]):
                        rloc[int.from_bytes(b[14:16], 'big')] = n['node_id']
    out = []
    for n in nodes:
        a = n['attributes']
        if '0/53/1' not in a:
            continue
        neighbours = [{'node': mac.get(x['0'], rloc.get(x['2'])), 'rloc': x['2'], 'avg_rssi': x['6'], 'last_rssi': x['7'], 'lqi': x['5'],
                       'child': x['13'], 'error_rate': x['9']} for x in a.get('0/53/7') or []]
        out.append({'node_id': n['node_id'], 'name': a.get('0/40/3') or a.get('0/40/4') or f"Node {n['node_id']}",
                    'rloc': next((r for r, i in rloc.items() if i == n['node_id']), None), 'available': n['available'], 'role': ROLES.get(a['0/53/1'], str(a['0/53/1'])), 'channel': a.get('0/53/0'),
                    'neighbours': neighbours, 'routes': len(a.get('0/53/8') or [])})
    with open('/config/www/thread.json', 'w') as f:
        json.dump({'updated': time.time(), 'network': nodes and nodes[0]['attributes'].get('0/53/2'), 'nodes': out}, f)

asyncio.run(main())

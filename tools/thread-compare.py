"""Compare two Thread snapshots (www/thread.json copies):  python3 tools/thread-compare.py before.json after.json
Take one with: curl -s $HOMEASSISTANT_URL_REMOTE/local/thread.json > tools/thread-snapshots/<name>.json  (the box refreshes it every 10 min)."""
import json, sys
def load(p):
    d = json.load(open(p)); by = {n['node_id']: n for n in d['nodes']}
    def best(n): return max(n['neighbours'], key=lambda x: x['avg_rssi'], default=None)
    return d, by, best
(da, a, ba), (db, b, bb) = load(sys.argv[1]), load(sys.argv[2])
print(f"{'node':32} {'role':18} {'before':>14} {'after':>14}  change")
for i in sorted(set(a) | set(b)):
    na, nb = a.get(i), b.get(i); n = nb or na
    x, y = (ba(na) if na else None), (bb(nb) if nb else None)
    fa = f"{x['avg_rssi']} dBm" if x else '-'; fb = f"{y['avg_rssi']} dBm" if y else '-'
    ch = f"{y['avg_rssi'] - x['avg_rssi']:+d} dB" if x and y else ''
    role = n['role'] + ('' if (nb or na)['available'] else ' (unavail.)')
    print(f"{n['name'][:31]:32} {role:18} {fa:>14} {fb:>14}  {ch}")

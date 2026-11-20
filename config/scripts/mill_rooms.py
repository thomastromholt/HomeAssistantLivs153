#!/usr/bin/env python3
"""Reads each Mill room's comfort (day), sleep (night) and away temperature from Mill's cloud API, plus the house mode.

Home Assistant's Mill integration cannot show these (it only reads the device's own set temperature), but the cloud API has them
(rooms/{id}/devices: roomComfortTemperature, roomSleepTemperature, roomAwayTemperature, see https://github.com/Danielhiversen/pymill).

Called from the Stugan dashboard when it is opened, through `shell_command.mill_rooms` (service response = this script's stdout):
    python3 /config/scripts/mill_rooms.py [cached|fresh]

Mill limits the number of requests per hour, so the answer is cached in /config/.cache_mill_rooms.json:
  cached (default): a result younger than 10 min is returned without any request
  fresh:            a result younger than 15 s is still reused (so a burst of calls costs one read; it must be short, since a read right after a
                    write has to see the change)
The answer has each room's power in W (the devices' lastMetrics.currentPower) too.
One read is about 10 requests (sign-in, houses, the house's devices, one per room). Read-only: nothing is written to Mill.
The login comes from Home Assistant's own stored config entry for Mill; it is never printed or copied anywhere.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.millnorwaycloud.com/"
ENTRIES = "/config/.storage/core.config_entries"
CACHE = "/config/.cache_mill_rooms.json"
TTL = {"cached": 600, "fresh": 15}
ROOM_KEYS = ("mode", "activeModeFromWeeklyProgram", "overrideModeType", "isRoomOnline")


def load_cache():
    try:
        with open(CACHE) as f:
            return json.load(f)
    except Exception:
        return None


def call(path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    return json.load(urllib.request.urlopen(req, timeout=15))


def read_mill():
    with open(ENTRIES) as f:
        entry = next(e for e in json.load(f)["data"]["entries"] if e["domain"] == "mill")
    login, password = entry["data"]["username"], entry["data"]["password"]
    token = call("customer/auth/sign-in", {"login": login, "password": password})["idToken"]
    del login, password
    out = {"house": None, "rooms": []}
    for house in call("houses", token=token).get("ownHouses", []):
        out["house"] = {k: house.get(k) for k in ("name", "mode", "overrideModeType", "isVacationModeActive", "vacationModeType", "vacationTemperature")}
        for entry_room in call(f"houses/{house['id']}/devices", token=token):
            room_id = entry_room.get("roomId")
            if not room_id:
                continue
            room = call(f"rooms/{room_id}/devices", token=token)
            # the devices' own latest report (about a minute old, much fresher than Home Assistant's Mill sensors when their polling is off)
            metrics = [(d.get("lastMetrics") or {}) for d in (room.get("devices") or [])]
            row = {
                "name": room.get("name"),
                "power": sum(m.get("currentPower") or 0 for m in metrics),          # W, all devices in the room
                "received": max([m.get("receivedAt") or "" for m in metrics] or [""]),
                "online": all(d.get("isConnected") is not False for d in (room.get("devices") or [])),   # False = the app says the panel is offline
                "away": room.get("roomAwayTemperature"),
                "comfort": room.get("roomComfortTemperature"),
                "sleep": room.get("roomSleepTemperature"),
                "avg": room.get("averageTemperature"),
            }
            row.update({k: room.get(k) for k in ROOM_KEYS})
            out["rooms"].append(row)
        break   # one house
    return out


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in TTL else "cached"
    cache = load_cache()
    now = time.time()
    if cache and now - cache.get("fetched_at", 0) < TTL[mode]:
        cache["from_cache"] = True
        print(json.dumps(cache))
        return
    try:
        data = read_mill()
        data["fetched_at"] = now
        data["from_cache"] = False
        tmp = CACHE + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f)
        os.replace(tmp, CACHE)
        print(json.dumps(data))
    except urllib.error.HTTPError as e:
        # 429 = Mill's request limit: hand back what we have, marked old
        print(json.dumps({**(cache or {"rooms": []}), "from_cache": True, "stale": True, "error": f"Mill svarede {e.code}"}))
    except Exception as e:   # never include credentials in an error message
        print(json.dumps({**(cache or {"rooms": []}), "from_cache": True, "stale": True, "error": type(e).__name__}))


main()

#!/usr/bin/env python3
"""Charge plan for the Kia Ceed: the cheapest hours before 07:00.

Read-only. It reads the Nord Pool SE3 prices and the car's state from Home Assistant and prints the plan.
It does not start or stop the charger and does not change any setting in HA. See docs/ladeplan.md.

When the car's own reading is missing or old (Kia cloud does not always answer), the battery level is
estimated from the last reading plus the energy the charger has delivered since then.

Usage: python3 tools/charge_plan.py [--target 80]
"""
import argparse
import json
import os
import urllib.request
from datetime import datetime, timedelta

BATTERY_KWH = 8.9       # Kia Ceed SW PHEV, usable as stated by the owner
EFFICIENCY = 0.9        # charger to battery
CHARGER_KW = 3.7        # 16 A on one phase (the car charges on phase 1)
KIA_STALE_MIN = 90      # older than this, the car's reading is not trusted
DEADLINE_HOUR = 7       # ready by 07:00 every morning
CONFIG_ENTRY = '01M4G69T394M8BKNHBNQ9E0246'   # Nord Pool integration, same as the price card
AREA = 'SE3'

SOC = 'sensor.ceed_ev_battery_level'
SOC_UPDATED = 'sensor.ceed_last_updated_at'
METER = 'sensor.go2_energy_meter'
MODE = 'sensor.go2_charger_mode'


def read_env(path):
    values = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    return values


ENV = read_env(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))
BASE = ENV.get('HOMEASSISTANT_URL', 'http://192.168.1.77').rstrip('/')
TOKEN = ENV['HOMEASSISTANT_TOKEN']


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f'{BASE}/api/{path}', data=data, method=method, headers={
        'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read() or 'null')


def state(entity):
    return call('GET', f'states/{entity}')


def local(text):
    return datetime.fromisoformat(text.replace('Z', '+00:00')).astimezone()


def history(entity, start, end):
    url = (f'history/period/{start.isoformat()}?filter_entity_id={entity}'
           f'&end_time={end.isoformat()}&significant_changes_only=0&minimal_response&no_attributes')
    rows = (call('GET', url) or [[]])[0]
    out = []
    for row in rows:
        when = row.get('last_changed') or row.get('last_updated')
        try:
            out.append((local(when), float(row['state'])))
        except (TypeError, ValueError, KeyError):
            pass
    return out


def hourly_prices(day):
    body = call('POST', 'services/nordpool/get_prices_for_date?return_response', {
        'config_entry': CONFIG_ENTRY, 'date': day.strftime('%Y-%m-%d'), 'areas': AREA})
    slots = body['service_response'][AREA]
    by_hour = {}
    for slot in slots:
        start = local(slot['start']).replace(minute=0, second=0, microsecond=0)
        by_hour.setdefault(start, []).append(slot['price'] / 10)   # SEK/MWh -> öre/kWh
    return {hour: sum(values) / len(values) for hour, values in by_hour.items()}


def battery_now(now):
    """Returns (percent, description). Uses the car's reading when it is fresh, else estimates from the charger."""
    current = state(SOC)
    updated = local(state(SOC_UPDATED)['state'])
    age_min = (now - updated).total_seconds() / 60
    if current['state'] not in ('unknown', 'unavailable') and age_min <= KIA_STALE_MIN:
        return float(current['state']), f'car reading, {round(age_min)} min old'

    since = now - timedelta(days=7)
    soc_history = [(t, v) for t, v in history(SOC, since, now) if 0 <= v <= 100]
    if not soc_history:
        raise RuntimeError('no battery reading in the last 7 days, cannot estimate')
    last_time, last_soc = soc_history[-1]
    meter = history(METER, last_time - timedelta(hours=1), last_time)
    meter_then = meter[-1][1] if meter else None
    meter_now = float(state(METER)['state'])
    if meter_then is None:
        raise RuntimeError('no charger meter reading at the last car reading, cannot estimate')
    delivered = meter_now - meter_then
    estimate = last_soc + delivered * EFFICIENCY / BATTERY_KWH * 100
    return min(estimate, 100.0), (f'estimated: {last_soc:.0f} % at {last_time:%d %H:%M} '
                                  f'+ {delivered:.1f} kWh from the charger')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', type=float, default=100, help='battery percent to reach (default 100)')
    args = parser.parse_args()

    now = datetime.now().astimezone()
    deadline = now.replace(hour=DEADLINE_HOUR, minute=0, second=0, microsecond=0)
    if now >= deadline:
        deadline += timedelta(days=1)

    soc, source = battery_now(now)
    need_kwh = max(0.0, (args.target - soc) / 100 * BATTERY_KWH / EFFICIENCY)
    need_hours = need_kwh / CHARGER_KW
    mode = state(MODE)['state']

    print(f'Now: {now:%a %d %b %H:%M}   deadline: {deadline:%a %d %b %H:%M}')
    print(f'Battery: {soc:.0f} % ({source})')
    print(f'Target: {args.target:.0f} %  ->  need {need_kwh:.1f} kWh = {need_hours:.1f} h at {CHARGER_KW} kW')
    if not mode.startswith('connected'):
        print(f'Charger: {mode}. The plan applies when the car is connected.')

    if need_hours <= 0:
        print('\nNothing to charge: the battery is already at the target.')
        return

    prices = {}
    for day in (now.date(), (now + timedelta(days=1)).date()):
        prices.update(hourly_prices(datetime.combine(day, datetime.min.time()).astimezone()))

    start_hour = now.replace(minute=0, second=0, microsecond=0)
    slots = []   # (hour start, hours usable in that hour, öre/kWh)
    hour = start_hour
    while hour < deadline:
        if hour in prices:
            usable = (min(hour + timedelta(hours=1), deadline) - max(hour, now)).total_seconds() / 3600
            if usable > 0:
                slots.append((hour, usable, prices[hour]))
        hour += timedelta(hours=1)

    available = sum(usable for _, usable, _ in slots)
    if available < need_hours:
        print(f'\nWarning: only {available:.1f} h of prices before the deadline, need {need_hours:.1f} h.'
              + (' Tomorrow\'s prices are not published yet.' if (deadline.date() > now.date()) else ''))

    planned, remaining = [], need_hours
    for hour, usable, ore in sorted(slots, key=lambda s: s[2]):
        if remaining <= 0:
            break
        take = min(usable, remaining)
        planned.append((max(hour, now), take, ore))   # the current hour starts now, not at :00
        remaining -= take

    print('\nPlanned hours (cheapest first before the deadline, shown in time order):')
    for start, take, ore in sorted(planned):
        print(f'  {start:%a %H:%M}  {take * 60:>3.0f} min  {ore:6.1f} öre/kWh')
    if planned:
        finish = max(start + timedelta(hours=take) for start, take, _ in planned)
        average = sum(ore * take for _, take, ore in planned) / sum(take for _, take, _ in planned)
        print(f'\nDone about {min(finish, deadline):%H:%M}. Average price in the plan: {average:.1f} öre/kWh (spot, before fees).')
        print('This is only a plan. Nothing has been switched in HA.')


if __name__ == '__main__':
    main()

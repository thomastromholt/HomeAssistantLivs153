// Shared helpers for the dark HTML cards (served from /config/www as /local/card-common.js).

// Inside the dashboard, go through Home Assistant's own connection: it refreshes the login token itself.
// Opened standalone (e.g. headless tests), fall back to the token the frontend stores in localStorage.
async function callApi(method, path, body) {
    let hass = null;
    try { hass = window.parent.document.querySelector('home-assistant')?.hass; } catch (e) { /* cross-origin */ }
    if (hass) return hass.callApi(method, path, body);

    const tokens = JSON.parse(localStorage.getItem('hassTokens') || 'null');
    if (!tokens) throw new Error('Not logged in to Home Assistant');
    const res = await fetch('/api/' + path, {
        method,
        headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status_code: res.status });
    return res.json();
}

async function stateOf(entityId) {
    try {
        return (await callApi('GET', `states/${entityId}`)).state;
    } catch (error) {
        if ((error.status_code ?? error.status) === 404) return null;
        throw error;
    }
}

// Fetches several entities at once: { entityId: state }.
async function statesOf(entityIds) {
    return Object.fromEntries(await Promise.all(entityIds.map(async id => [id, await stateOf(id)])));
}

// Opens Home Assistant's own history pop-up (graph + time picker).
function openHistory(entityId) {
    window.parent.document.querySelector('home-assistant').dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
    }));
}

function formatNumber(state, digits = 0) {
    const value = parseFloat(state);
    return Number.isNaN(value) ? null : value.toLocaleString('sv-SE', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function showError(error) {
    const box = document.getElementById('error');
    box.textContent = error ? (error.message || error.error || 'Request failed') : '';
    box.hidden = !error;
}

// A clickable tile (label + value) that opens the history pop-up of its entity.
function createTile(parent, label, entityId) {
    const button = document.createElement('button');
    button.className = 'tile';
    button.innerHTML = '<div class="tile-label"></div><div class="tile-value"></div>';
    button.querySelector('.tile-label').textContent = label;
    button.addEventListener('click', () => openHistory(entityId));
    parent.append(button);
    return button.querySelector('.tile-value');
}

// A state that means "this device or integration is not delivering data".
const isMissing = state => state === null || state === 'unavailable' || state === 'unknown';

// Writes warnings under the card header (the card needs <div id="problems" class="problems" hidden>).
// An empty list hides the box.
function showProblems(messages) {
    const box = document.getElementById('problems');
    if (!box) return;
    box.hidden = messages.length === 0;
    box.replaceChildren(...messages.map(message => {
        const row = document.createElement('div');
        row.textContent = `⚠ ${message}`;
        return row;
    }));
}

// Shows another card page as a pop-up over the whole dashboard (closes on backdrop click, X or Escape).
// The page inside calls closePopup() to close itself.
function openPopup(url) {
    const doc = window.parent.document;
    closePopup();
    const backdrop = doc.createElement('div');
    backdrop.id = 'card-popup';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    const frame = doc.createElement('iframe');
    frame.src = url;
    frame.style.cssText = 'width:min(560px,100%);height:min(720px,100%);border:0;border-radius:18px;background:#131f28;box-shadow:0 12px 40px rgba(0,0,0,.6)';
    backdrop.append(frame);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closePopup(); });
    doc.addEventListener('keydown', escapeClosesPopup);
    frame.addEventListener('load', () => frame.contentWindow.addEventListener('keydown', escapeClosesPopup));
    doc.body.append(backdrop);
}
function escapeClosesPopup(event) { if (event.key === 'Escape') closePopup(); }
function closePopup() {
    const doc = window.parent.document;
    doc.getElementById('card-popup')?.remove();
    doc.removeEventListener('keydown', escapeClosesPopup);
}

// Home Assistant's websocket API through the dashboard's own connection (null when opened standalone).
async function callWS(message) {
    try {
        const hass = window.parent.document.querySelector('home-assistant')?.hass;
        return hass ? await hass.callWS(message) : null;
    } catch (e) { return null; }
}

// What a radiator thermostat is doing right now, from what Home Assistant can see.
// The device itself reports no motor state or error code, so "valve open/closed" comes from hvac_action
// and problems are inferred from availability, last contact, battery and firmware update.
// Returns { level: 'good'|'busy'|'bad', title, detail }.
async function thermostatStatus({ climate, update, battery, deviceId, night }) {
    if (!climate || isMissing(climate.state)) {
        return { level: 'bad', title: 'Offline', detail: 'No signal: Home Assistant cannot reach the thermostat' };
    }
    const node = deviceId ? await callWS({ type: 'matter/node_diagnostics', device_id: deviceId }) : null;
    if (node && node.available === false) {
        return { level: 'bad', title: 'No signal', detail: 'The Thread network reports the thermostat as unreachable' };
    }
    const a = climate.attributes;
    const target = formatNumber(a.temperature, 1);
    const ago = Math.round((Date.now() - new Date(climate.last_updated)) / 60e3);
    const link = node ? `${node.network_type === 'thread' ? 'Thread' : node.network_type}${node.node_type === 'sleepy_end_device' ? ' (sleeps between reports)' : ''}` : 'connected';
    const contact = ago < 1 ? 'just now' : `${ago} min ago`;
    const nightNote = night && night.active ? `Night mode: lowered ${night.setback} °C until 06:30 (day target ${night.dayTarget} °C) · ` : '';
    const note = nightNote.replace(/ · $/, '');
    const detail = nightNote + `${link} · last report ${contact}` + (battery !== null && battery < 15 ? ` · battery low (${battery} %)` : '');

    const u = update && update.attributes;
    if (u && u.in_progress) {
        const pct = u.update_percentage != null ? ` ${Math.round(u.update_percentage)} %` : '';
        return { note, level: 'busy', title: `Updating firmware${pct}`, detail: 'The LED blinks and the valve does not react meanwhile' };
    }
    if (climate.state === 'off') return { note, level: 'good', title: 'Off', detail };
    // At the lowest setting the thermostat counts as off, but it does not always report that to Home Assistant.
    if (a.temperature != null && a.min_temp != null && a.temperature <= a.min_temp) {
        return { note, level: 'good', title: `Lowest setting (${target} °C): heating off`, detail };
    }
    if (a.hvac_action === 'heating') {
        // The thermostat says heating even when its valve reading is far above the target, so flag that.
        const hot = a.current_temperature != null && a.temperature != null && a.current_temperature > a.temperature + 2;
        return hot
            ? { note, level: 'busy', title: 'Reports heating', detail: `Valve reads ${formatNumber(a.current_temperature, 1)} °C, above target ${target} °C (radiator still warm?) · ${detail}` }
            : { note, level: 'good', title: 'Heating: valve open', detail: `Target ${target} °C · ${detail}` };
    }
    return { note, level: 'good', title: 'Idle: valve closed', detail: `Target ${target} °C · ${detail}` };
}

// Calls onChange(newState, event) the moment one of the entities changes in Home Assistant (no waiting for the poll).
// Quietly does nothing when opened standalone; the caller's own polling still covers that.
function watchEntities(entityIds, onChange) {
    try {
        const hass = window.parent.document.querySelector('home-assistant')?.hass;
        if (!hass) return;
        const unsubscribe = hass.connection.subscribeEvents(event => {
            const data = event.data;
            if (entityIds.includes(data.entity_id) && data.new_state) onChange(data.new_state, event);
        }, 'state_changed');
        // The page can be closed or reloaded without the dashboard: drop the subscription with it.
        window.addEventListener('pagehide', () => unsubscribe.then(stop => stop()).catch(() => {}));
    } catch (e) { /* polling covers it */ }
}

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

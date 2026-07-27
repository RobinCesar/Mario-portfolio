const PERSISTED = new Set(['soundOn', 'subspace']);
const STORAGE_KEY = 'mario-portfolio';

const DEFAULTS = {
  coins: 0,
  cherries: [],
  // Sound is on by default. Browsers still block audio until the first user
  // gesture, so audio.unlock() runs on the first pointer or key event.
  soundOn: true,
  subspace: false,
  starman: false,
};

let store = freshDefaults();
let listeners = new Map();

function freshDefaults() {
  return { ...DEFAULTS, cherries: [] };
}

// localStorage is absent in Node and throws in private browsing mode.
// Both cases land in the catch and fall back to in-memory state.
function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStored(key, value) {
  if (!PERSISTED.has(key)) return;
  try {
    const current = readStored();
    current[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Private mode or no storage. State stays in memory for this session.
  }
}

export function get(key) {
  return store[key];
}

export function set(key, value) {
  if (store[key] === value) return;
  store[key] = value;
  writeStored(key, value);
  const subscribers = listeners.get(key);
  if (!subscribers) return;
  for (const fn of subscribers) fn(value);
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => {
    const subscribers = listeners.get(key);
    if (subscribers) subscribers.delete(fn);
  };
}

/** Restores defaults and drops all listeners. Used by tests and by boot. */
export function reset() {
  store = freshDefaults();
  listeners = new Map();
}

/**
 * Reads persisted values into the store. Call once during boot, not in tests.
 * Returns only the keys that were actually found in storage — callers need to
 * tell "stored false" apart from "never stored", which get() cannot express
 * because it always falls back to a default.
 */
export function hydrate() {
  const stored = readStored();
  const restored = {};
  for (const key of PERSISTED) {
    if (typeof stored[key] === 'boolean') {
      store[key] = stored[key];
      restored[key] = stored[key];
    }
  }
  return restored;
}

// App state lives in localStorage (small JSON). Videos live in IndexedDB.
const KEY = 'gym.v1';

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);

// ---------- dates ----------
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const fmtLong = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtFull = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtDate = (s) => fmtLong.format(parseYmd(s));
export const fmtDateFull = (s) => fmtFull.format(parseYmd(s));
export const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

// ---------- numbers ----------
export const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
export const fmtNum = (n) => (n == null || n === '' ? '' : String(Math.round(n * 100) / 100).replace('.', ','));
export const firstNum = (s) => { const m = String(s ?? '').match(/\d+/); return m ? Number(m[0]) : ''; };
export const fmtSec = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };

// ---------- sample plan ----------
function sampleState() {
  const item = (exId, name, type, sets, reps, seconds, rest) => ({ id: uid(), exId, name, type, sets, reps, seconds, rest });
  return {
    version: 1,
    workouts: [
      {
        id: uid(),
        name: 'Beispiel: Ganzkörper A',
        days: [1, 4],
        exercises: [
          item('x_tib_raise', 'Tibialis Raise', 'reps', 2, '20-25', 0, 60),
          item('x_atg_split_squat', 'ATG Split Squat', 'reps', 3, '6-8', 0, 90),
          item('x_nordic', 'Nordic Curl', 'reps', 3, '5', 0, 120),
          item('Pushups', 'Liegestütze', 'reps', 3, '8-12', 0, 90),
          item('x_wall_sit', 'Wall Sit', 'time', 2, '', 60, 60),
        ],
      },
    ],
    customExercises: [],
    demos: {},
    sessions: [],
    chat: [],
    settings: {},
  };
}

// ---------- persistence ----------
let state;
let saveTimer = null;

export function load() {
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
  if (!state || state.version !== 1) { state = sampleState(); saveNow(); }
  state.demos ||= {};
  state.customExercises ||= [];
  state.favorites ||= ['soccer', 'daily-mobility', 'mobility-express'];
  return state;
}
export const S = () => state;
export function saveNow() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { window.dispatchEvent(new CustomEvent('gym:save-failed')); }
}
export function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
export function replaceState(next) { state = next; saveNow(); }
export function resetAll() { localStorage.removeItem(KEY); state = sampleState(); saveNow(); }
window.addEventListener('pagehide', () => saveNow());
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

// ---------- workouts ----------
export const getWorkout = (id) => state.workouts.find((w) => w.id === id);
/** Alternating weeks (A/B): cycle = { start: Monday 'YYYY-MM-DD', len: 2, idx: 0 | 1 }. */
function inCycle(w, dateStr) {
  if (!w.cycle) return true;
  const weeks = Math.round((mondayOf(parseYmd(dateStr)) - parseYmd(w.cycle.start)) / (7 * 864e5));
  return ((weeks % w.cycle.len) + w.cycle.len) % w.cycle.len === w.cycle.idx;
}
export const workoutsOn = (dateStr) => {
  const wd = parseYmd(dateStr).getDay();
  return state.workouts.filter((w) => w.days.includes(wd) && inCycle(w, dateStr));
};
export function nextPlanned(fromStr) {
  for (let i = 1; i <= 14; i++) {
    const d = ymd(addDays(parseYmd(fromStr), i));
    const ws = workoutsOn(d);
    if (ws.length) return { date: d, workouts: ws };
  }
  return null;
}

// ---------- sessions ----------
const sessionOrder = (a, b) => (a.date === b.date ? b.startedAt - a.startedAt : a.date < b.date ? 1 : -1);
export const sessionsSorted = () => [...state.sessions].sort(sessionOrder);
export const getSession = (id) => state.sessions.find((s) => s.id === id);
export const sessionsOn = (dateStr) => state.sessions.filter((s) => s.date === dateStr);
export const doneSets = (entry) => entry.sets.filter((x) => x.done);
export const sessionHasWork = (s) => s.entries.some((e) => e.sets.some((x) => x.done));
export const sessionDone = (s) => !!s.finishedAt || sessionHasWork(s);
const entryHasData = (e) => e.sets.some((x) => x.done) || (e.note && e.note.trim()) || e.video;

/** All logged entries of one exercise, newest first: [{ session, entry }]. */
export function historyFor(exId, excludeSessionId) {
  const out = [];
  for (const s of sessionsSorted()) {
    if (s.id === excludeSessionId) continue;
    for (const e of s.entries) if (e.exId === exId && entryHasData(e)) out.push({ session: s, entry: e });
  }
  return out;
}

export function makeEntry(item) {
  const last = historyFor(item.exId)[0]?.entry;
  const lastSets = last ? (doneSets(last).length ? doneSets(last) : last.sets) : [];
  const n = item.sets || 3;
  const sets = [];
  for (let i = 0; i < n; i++) {
    const p = lastSets[i] || lastSets[lastSets.length - 1];
    sets.push({
      w: p?.w ?? '',
      r: item.type === 'time' ? '' : (p?.r || firstNum(item.reps)),
      t: item.type === 'time' ? (p?.t || item.seconds || 30) : '',
      done: false,
    });
  }
  return {
    id: uid(), itemId: item.id, exId: item.exId, name: item.name, type: item.type,
    reps: item.reps, repsText: item.repsText, seconds: item.seconds, rest: item.rest, targetSets: n,
    timer: item.timer ?? item.type === 'time', restOn: item.restOn !== false, ss: !!item.ss,
    sets, note: '', video: null,
  };
}

export function startSession(workoutId, dateStr) {
  const w = workoutId ? getWorkout(workoutId) : null;
  const s = {
    id: uid(), date: dateStr, workoutId: w?.id ?? null, name: w?.name ?? 'Freies Training',
    startedAt: Date.now(), finishedAt: null, entries: w ? w.exercises.map(makeEntry) : [],
  };
  state.sessions.push(s);
  saveNow();
  return s;
}

/** Session straight from a program day (not necessarily in the plan). */
export function startSessionFromItems(name, items, dateStr, workoutId = null) {
  const s = { id: uid(), date: dateStr, workoutId, name, startedAt: Date.now(), finishedAt: null, entries: items.map(makeEntry) };
  state.sessions.push(s);
  saveNow();
  return s;
}

/** Open session for a workout on a date, if one was already started. */
export const openSessionFor = (workoutId, dateStr) =>
  state.sessions.find((s) => s.workoutId === workoutId && s.date === dateStr);

export async function deleteSession(id) {
  const s = getSession(id);
  if (!s) return;
  for (const e of s.entries) if (e.video) await delFile(e.video).catch(() => {});
  state.sessions = state.sessions.filter((x) => x.id !== id);
  saveNow();
}

// ---------- IndexedDB for videos ----------
let dbp;
function idb() {
  return (dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('gym-media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}
function tx(mode, fn) {
  return idb().then((db) => new Promise((res, rej) => {
    const t = db.transaction('files', mode);
    const out = fn(t.objectStore('files'));
    t.oncomplete = () => res(out?.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  }));
}
const urlCache = new Map();
export const putFile = (key, blob) => { urlCache.delete(key); return tx('readwrite', (st) => st.put(blob, key)); };
export const getFile = (key) => tx('readonly', (st) => st.get(key));
export const delFile = (key) => {
  const u = urlCache.get(key);
  if (u) { URL.revokeObjectURL(u); urlCache.delete(key); }
  return tx('readwrite', (st) => st.delete(key));
};
export async function fileUrl(key) {
  if (!key) return null;
  if (urlCache.has(key)) return urlCache.get(key);
  const blob = await getFile(key).catch(() => null);
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urlCache.set(key, u);
  return u;
}

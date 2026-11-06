// Autoplay: runs a session hands-free. Announces each exercise, counts down timed work,
// switches sides for "pro Seite", handles supersets (A, B, rest, A, B …) and rest, and logs sets.
// Rep-based sets wait for one tap on "Satz fertig", since the app cannot count reps.
import { S, getSession, saveNow, num, fmtSec } from '../store.js';
import { getEx } from '../exercises.js';
import { esc, beep, unlockAudio, keepAwake, toast } from '../ui.js';
import { ICON, media, hydrateMedia } from '../components.js';
import { stopRest, pauseClock } from '../timers.js';

const PREP = 5;     // seconds to get into position
const SWITCH = 5;   // seconds to change sides
const SIDE_RE = /pro Seite|per side|each side/i;

// ---------- speech ----------
let voiceDe = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices() || [];
  voiceDe = vs.find((v) => v.lang === 'de-DE' && v.localService) || vs.find((v) => v.lang?.toLowerCase().startsWith('de')) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
const voiceOn = () => S().settings.voice !== false;
function say(text) {
  if (!voiceOn() || !('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  if (voiceDe) u.voice = voiceDe;
  u.rate = 1.02;
  speechSynthesis.speak(u);
}
const spokenTime = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} ${s === 60 ? 'Minute' : 'Minuten'}` : `${s} Sekunden`);

// ---------- plan of steps ----------
/** Turns a session into steps. Done sets are skipped, so Autoplay can resume a started session. */
export function buildSteps(s) {
  const groups = [];
  let g = [];
  s.entries.forEach((e, i) => { g.push(i); if (!e.ss) { groups.push(g); g = []; } });
  if (g.length) groups.push(g);

  const steps = [];
  for (const grp of groups) {
    const rounds = Math.max(...grp.map((i) => s.entries[i].sets.length));
    for (let r = 0; r < rounds; r++) {
      let any = false;
      for (const ei of grp) {
        const e = s.entries[ei];
        if (r >= e.sets.length || e.sets[r].done) continue;
        any = true;
        const timed = e.type === 'time' || e.timer;
        const secs = Math.max(5, Math.round(e.type === 'time' ? (num(e.sets[r].t) || e.seconds || 30) : (e.seconds || 45)));
        const sided = SIDE_RE.test(e.repsText || e.reps || '');
        const base = { ei, set: r, of: e.sets.length };
        if (timed) {
          steps.push({ ...base, kind: 'prep', secs: PREP, side: sided ? 'rechts' : null, workSecs: secs });
          steps.push({ ...base, kind: 'work', secs, side: sided ? 'rechts' : null, last: !sided });
          if (sided) {
            steps.push({ ...base, kind: 'switch', secs: SWITCH, side: 'links' });
            steps.push({ ...base, kind: 'work', secs, side: 'links', last: true });
          }
        } else {
          steps.push({ ...base, kind: 'reps', sided, last: true });
        }
      }
      const tail = s.entries[grp[grp.length - 1]];
      const rest = tail.restOn !== false ? tail.rest || 0 : 0;
      if (any && rest > 0) steps.push({ kind: 'rest', secs: rest });
    }
  }
  while (steps.length && steps[steps.length - 1].kind === 'rest') steps.pop();
  return steps;
}

// ---------- runner ----------
const ap = { sid: null, steps: [], i: 0, running: false, started: false, endAt: 0, remaining: 0, h: null, spoken10: false, beeped: null };

function stepEntry(st) { return st && st.ei != null ? getSession(ap.sid)?.entries[st.ei] : null; }
function nextWorkStep(from) { for (let k = from; k < ap.steps.length; k++) if (['work', 'reps'].includes(ap.steps[k].kind)) return ap.steps[k]; return null; }
/** Next exercise step that is not the current set (so a prep does not point at itself). */
function nextOther(i) {
  const cur = ap.steps[i];
  for (let k = i + 1; k < ap.steps.length; k++) {
    const x = ap.steps[k];
    if (['work', 'reps'].includes(x.kind) && !(cur && x.ei === cur.ei && x.set === cur.set)) return x;
  }
  return null;
}
/** Rep texts are written short ("8–12 Wdh."); spell them out for the voice. */
const spoken = (t) => String(t || '')
  .replace(/(\d+)\s*[–-]\s*(\d+)/g, '$1 bis $2')
  .replace(/Wdh\./g, 'Wiederholungen').replace(/Sek\./g, 'Sekunden').replace(/Min\./g, 'Minuten');

function announce(st) {
  const e = stepEntry(st);
  const side = st.side ? `, ${st.side === 'rechts' ? 'rechte' : 'linke'} Seite` : '';
  switch (st.kind) {
    case 'prep': say(`${ap.i === 0 ? 'Los geht’s. Erste Übung' : 'Nächste Übung'}: ${e.name}${side}. ${spokenTime(st.workSecs)}.`); break;
    case 'work': beep(1, 990); if (st.side === 'links') say('Los.'); break;
    case 'switch': say('Seite wechseln. Linke Seite.'); break;
    case 'rest': { const nx = nextWorkStep(ap.i + 1); say(`Pause, ${spokenTime(st.secs)}.${nx ? ` Danach ${stepEntry(nx).name}.` : ''}`); break; }
    default: break;
    case 'reps': say(`${e.name}. Satz ${st.set + 1} von ${st.of}. ${spoken(e.repsText) || `${e.sets[st.set].r || ''} Wiederholungen`}${st.sided && !/Seite/.test(e.repsText || '') ? ', beide Seiten' : ''}. Tippe auf fertig, wenn du durch bist.`); break;
  }
}

function beginStep() {
  const st = ap.steps[ap.i];
  ap.spoken10 = false;
  ap.beeped = null;
  if (!st) { finish(); return; }
  if (st.kind === 'reps') { ap.remaining = 0; ap.endAt = 0; }
  else { ap.remaining = st.secs; ap.endAt = Date.now() + st.secs * 1000; }
  announce(st);
  render();
}

function completeStep() {
  const st = ap.steps[ap.i];
  if (st?.last && (st.kind === 'work' || st.kind === 'reps')) {
    const e = stepEntry(st);
    const set = e?.sets[st.set];
    if (set) {
      set.done = true;
      if (e.type === 'time') set.t = st.secs;
      saveNow();
    }
  }
  ap.i++;
  beginStep();
}

function tick() {
  if (!location.hash.startsWith(`#/autoplay/${ap.sid}`)) { pause(); return; }
  const st = ap.steps[ap.i];
  if (!ap.running || !st || st.kind === 'reps') return;
  ap.remaining = Math.max(0, (ap.endAt - Date.now()) / 1000);
  const whole = Math.ceil(ap.remaining);
  if (st.kind === 'work' && !ap.spoken10 && st.secs >= 20 && whole === 10) { ap.spoken10 = true; say('Noch zehn Sekunden.'); }
  if (whole <= 3 && whole > 0 && ap.beeped !== whole) { ap.beeped = whole; beep(1, 660); }
  if (ap.remaining <= 0) { if (st.kind === 'work') beep(2, 880); completeStep(); return; }
  updateClock();
}

function play() {
  if (ap.running) return;
  const st = ap.steps[ap.i];
  if (st && st.kind !== 'reps' && ap.started) ap.endAt = Date.now() + ap.remaining * 1000;
  ap.running = true;
  clearInterval(ap.h);
  ap.h = setInterval(tick, 200);
  keepAwake(true);
  if (!ap.started) { ap.started = true; beginStep(); } else render();
}

function pause() {
  if (!ap.running) return;
  const st = ap.steps[ap.i];
  if (st && st.kind !== 'reps') ap.remaining = Math.max(0, (ap.endAt - Date.now()) / 1000);
  ap.running = false;
  clearInterval(ap.h);
  window.speechSynthesis?.cancel();
  if (location.hash.startsWith('#/autoplay/')) render();
}

function jump(dir) {
  // move to the previous/next exercise step (skipping preps, switches and rests)
  let k = ap.i + dir;
  const isMain = (x) => ['prep', 'reps'].includes(x.kind) || x.kind === 'rest';
  while (k > 0 && k < ap.steps.length && !isMain(ap.steps[k])) k += dir;
  ap.i = Math.max(0, Math.min(ap.steps.length, k));
  if (!ap.running) { ap.running = true; clearInterval(ap.h); ap.h = setInterval(tick, 200); }
  ap.started = true;
  beginStep();
}

function finish() {
  ap.running = false;
  clearInterval(ap.h);
  beep(3, 990);
  say('Training geschafft. Stark!');
  render();
}

// ---------- view ----------
let root = null;

const phaseLabel = { prep: 'Mach dich bereit', work: 'Los', switch: 'Seite wechseln', rest: 'Pause', reps: 'Dein Satz' };

function render() {
  if (!root || !location.hash.startsWith(`#/autoplay/${ap.sid}`)) return;
  const s = getSession(ap.sid);
  const st = ap.steps[ap.i];
  const done = !st;
  const progress = ap.steps.length ? Math.min(1, ap.i / ap.steps.length) : 1;

  if (done) {
    const sets = s.entries.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
    root.innerHTML = `
      ${topBar()}
      <div class="ap-progress"><i style="width:100%"></i></div>
      <section class="ap-done card">
        <span class="ap-big-check">${ICON.check}</span>
        <h1>Geschafft!</h1>
        <p class="muted">${sets} Sätze eingetragen.</p>
        <button class="btn primary full" data-ap="finish">Training beenden</button>
        <a class="btn ghost full" href="#/session/${s.id}">Zur Übersicht</a>
      </section>`;
    return;
  }

  const e = stepEntry(st);
  const ex = e ? getEx(e.exId) : null;
  const nxEntry = stepEntry(st.kind === 'rest' ? nextWorkStep(ap.i) : nextOther(ap.i));
  const sub = st.kind === 'rest'
    ? (nxEntry ? `Danach: ${esc(nxEntry.name)}` : '')
    : `Satz ${st.set + 1} von ${st.of}${st.side ? ` · ${st.side === 'rechts' ? 'rechte' : 'linke'} Seite` : ''}`;

  root.innerHTML = `
    ${topBar()}
    <div class="ap-progress"><i style="width:${(progress * 100).toFixed(1)}%"></i></div>
    <p class="ap-phase ap-${st.kind}">${phaseLabel[st.kind]}</p>
    ${ex && st.kind !== 'rest' && (ex.images.length || ex.demo) ? media(ex, 'ap') : ''}
    <h1 class="ap-name">${st.kind === 'rest' ? 'Pause' : esc(e.name)}</h1>
    <p class="muted ap-sub">${sub}</p>
    ${st.kind === 'reps' ? `
      <section class="ap-reps card">
        <b>${esc(e.repsText || `${e.sets[st.set].r || '?'} Wdh.`)}</b>
        ${st.sided ? '<span class="muted">beide Seiten</span>' : ''}
        <button class="btn primary full big" data-ap="done">Satz fertig</button>
      </section>` : `
      <section class="ap-clock" id="ap-clock">
        <div class="clock-ring">
          <svg viewBox="0 0 120 120"><circle class="clock-ring-bg" cx="60" cy="60" r="54"/><circle class="clock-ring-fg" cx="60" cy="60" r="54"/></svg>
          <div class="clock-center"><span class="clock-time">${fmtSec(Math.ceil(ap.remaining))}</span><small class="clock-total">${fmtSec(st.secs)}</small></div>
        </div>
      </section>`}
    <div class="ap-controls">
      <button class="icon-btn big-round" data-ap="prev" aria-label="Vorherige Übung">${ICON.back}</button>
      <button class="icon-btn big-round main" data-ap="toggle" aria-label="${ap.running ? 'Pause' : 'Start'}">${ap.running ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>' : ICON.play}</button>
      <button class="icon-btn big-round" data-ap="next" aria-label="Überspringen">${ICON.next}</button>
    </div>
    ${!ap.started ? '<p class="muted small center">Tippe auf Start. Leg das Handy so hin, dass du es sehen und hören kannst. Der Bildschirm bleibt an.</p>' : ''}
    ${nxEntry && st.kind !== 'rest' ? `<p class="ap-next">Als Nächstes: <b>${esc(nxEntry.name)}</b></p>` : ''}`;

  hydrateMedia(root);
  updateClock();
}

function topBar() {
  return `<header class="top-bar">
    <a class="icon-btn" href="#/session/${ap.sid}" aria-label="Zurück">${ICON.back}</a>
    <b>Autoplay</b>
    <button class="icon-btn ${voiceOn() ? 'on-accent' : ''}" data-ap="voice" aria-label="Sprachansage ${voiceOn() ? 'aus' : 'an'}" aria-pressed="${voiceOn()}">
      ${voiceOn()
        ? '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/></svg>'}
    </button>
  </header>`;
}

function updateClock() {
  const el = root?.querySelector('#ap-clock');
  const st = ap.steps[ap.i];
  if (!el || !st || st.kind === 'reps') return;
  const rem = ap.running ? Math.max(0, (ap.endAt - Date.now()) / 1000) : ap.remaining;
  el.querySelector('.clock-time').textContent = fmtSec(Math.ceil(rem));
  const ring = el.querySelector('.clock-ring-fg');
  const c = 2 * Math.PI * 54;
  ring.style.strokeDasharray = c;
  ring.style.strokeDashoffset = c * (1 - rem / st.secs);
  el.dataset.kind = st.kind;
}

export function autoplayView(r, sid) {
  const s = getSession(sid);
  if (!s) { location.hash = '#/'; return; }
  root = r;
  // fresh plan for a new session, or when the last run ended or never started (sets may have changed)
  if (ap.sid !== sid || !ap.started || ap.i >= ap.steps.length) {
    pause();
    const steps = buildSteps(s);
    Object.assign(ap, { sid, steps, i: 0, running: false, started: false, remaining: steps[0]?.secs || 0 });
    if (!ap.steps.length) { toast('Alle Sätze sind schon erledigt'); location.hash = `#/session/${sid}`; return; }
  }
  stopRest();
  pauseClock();
  render();

  root.onclick = (ev) => {
    const b = ev.target.closest('[data-ap]');
    if (!b) return;
    unlockAudio();
    switch (b.dataset.ap) {
      case 'toggle': ap.running ? pause() : play(); break;
      case 'done': if (!ap.running) play(); completeStep(); break;
      case 'next': jump(1); break;
      case 'prev': jump(-1); break;
      case 'voice':
        S().settings.voice = !voiceOn();
        saveNow();
        if (!voiceOn()) window.speechSynthesis?.cancel(); else say('Sprachansage an.');
        render();
        break;
      case 'finish':
        s.finishedAt = Date.now();
        saveNow();
        keepAwake(false);
        ap.sid = null;
        location.hash = '#/';
        break;
    }
  };
}

/** Lets the session view reset Autoplay after sets were edited by hand. */
export function resetAutoplay() { pause(); ap.sid = null; }

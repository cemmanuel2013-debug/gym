// Two timers: the rest bar between sets, and the countdown for timed exercises (e.g. wall sit).
// Both run on wall-clock end times, so they stay correct if the phone throttles the page.
import { fmtSec } from './store.js';
import { beep, toast } from './ui.js';

// ---------- rest timer ----------
const rest = { endAt: 0, total: 0, h: null };

export function initRestBar() {
  const bar = document.getElementById('rest-bar');
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rest]');
    if (!b) return;
    if (b.dataset.rest === 'plus') { rest.endAt += 15000; rest.total += 15; tickRest(); }
    else stopRest();
  });
}

export function startRest(sec) {
  if (!sec) return;
  rest.total = sec;
  rest.endAt = Date.now() + sec * 1000;
  clearInterval(rest.h);
  rest.h = setInterval(tickRest, 250);
  tickRest();
}

function tickRest() {
  const bar = document.getElementById('rest-bar');
  const left = (rest.endAt - Date.now()) / 1000;
  if (left <= 0) { stopRest(); beep(2); toast('Pause vorbei, nächster Satz'); return; }
  bar.hidden = false;
  bar.querySelector('.rest-time').textContent = fmtSec(Math.ceil(left));
  bar.querySelector('.rest-fill').style.transform = `scaleX(${left / rest.total})`;
}

export function stopRest() {
  clearInterval(rest.h);
  rest.h = null;
  document.getElementById('rest-bar').hidden = true;
}

// ---------- countdown for timed exercises ----------
export const clock = { key: null, total: 0, remaining: 0, running: false, endAt: 0, h: null, onDone: null };

export function useClock(key, total) {
  if (clock.key === key) return;
  pauseClock();
  Object.assign(clock, { key, total, remaining: total, running: false, onDone: null });
}

export function startClock() {
  if (clock.running) return;
  if (clock.remaining <= 0) clock.remaining = clock.total;
  clock.running = true;
  clock.endAt = Date.now() + clock.remaining * 1000;
  clearInterval(clock.h);
  clock.h = setInterval(tickClock, 200);
  tickClock();
}

export function pauseClock() {
  if (clock.running) clock.remaining = Math.max(0, (clock.endAt - Date.now()) / 1000);
  clock.running = false;
  clearInterval(clock.h);
  clock.h = null;
  renderClock();
}

export function resetClock() { pauseClock(); clock.remaining = clock.total; renderClock(); }

export function adjustClock(delta) {
  clock.total = Math.max(5, clock.total + delta);
  if (clock.running) clock.endAt += delta * 1000;
  else clock.remaining = Math.max(0, Math.min(clock.total, clock.remaining + delta));
  renderClock();
}

export const clockElapsed = () => {
  const rem = clock.running ? Math.max(0, (clock.endAt - Date.now()) / 1000) : clock.remaining;
  return Math.round(clock.total - rem);
};

let lastWhole = null;
function tickClock() {
  clock.remaining = Math.max(0, (clock.endAt - Date.now()) / 1000);
  const whole = Math.ceil(clock.remaining);
  if (whole !== lastWhole && whole > 0 && whole <= 3) beep(1, 660);
  lastWhole = whole;
  if (clock.remaining <= 0) {
    clock.running = false;
    clearInterval(clock.h);
    clock.h = null;
    beep(3, 990);
    const done = clock.onDone;
    renderClock();
    done?.(clock.total);
    return;
  }
  renderClock();
}

export function renderClock() {
  const el = document.getElementById('clock');
  if (!el || el.dataset.key !== clock.key) return;
  const rem = clock.running ? Math.max(0, (clock.endAt - Date.now()) / 1000) : clock.remaining;
  el.querySelector('.clock-time').textContent = fmtSec(Math.ceil(rem));
  el.querySelector('.clock-total').textContent = `Ziel ${fmtSec(clock.total)}`;
  const ring = el.querySelector('.clock-ring-fg');
  const c = 2 * Math.PI * 54;
  ring.style.strokeDasharray = c;
  ring.style.strokeDashoffset = c * (1 - rem / clock.total);
  el.classList.toggle('running', clock.running);
  el.querySelector('[data-act="clock-toggle"]').textContent = clock.running ? 'Pause' : rem < clock.total && rem > 0 ? 'Weiter' : 'Start';
}

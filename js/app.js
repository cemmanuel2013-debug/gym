import { load } from './store.js';
import { loadExercises } from './exercises.js';
import { toast, unlockAudio, keepAwake } from './ui.js';
import { initRestBar } from './timers.js';
import { train } from './views/train.js';
import { programView } from './views/program.js';
import { profile } from './views/profile.js';
import { calendar } from './views/calendar.js';
import { planList, planEdit } from './views/plan.js';
import { sessionView, exerciseView } from './views/session.js';
import { historyView, exerciseHistory } from './views/history.js';
import { chat } from './views/chat.js';
import { settings } from './views/settings.js';
import { stepsView } from './views/steps.js';
import { autoplayView } from './views/autoplay.js';

const routes = [
  [/^\/?$/, train, 'train'],
  [/^\/program\/([\w-]+)$/, programView, 'train'],
  [/^\/calendar$/, calendar, 'calendar', true],
  [/^\/plan$/, planList, 'train'],
  [/^\/plan\/([\w-]+)$/, planEdit, 'train'],
  [/^\/session\/([\w-]+)$/, sessionView, 'train'],
  [/^\/session\/([\w-]+)\/(\d+)$/, exerciseView, 'train'],
  [/^\/autoplay\/([\w-]+)$/, autoplayView, 'train'],
  [/^\/history$/, historyView, 'history'],
  [/^\/history\/ex\/(.+)$/, exerciseHistory, 'history'],
  [/^\/chat$/, chat, 'chat'],
  [/^\/profile$/, profile, 'profile'],
  [/^\/settings$/, settings, 'profile'],
  [/^\/steps$/, stepsView, 'profile'],
];

function render() {
  const raw = (location.hash || '#/').slice(1);
  const [path, qs] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const root = document.getElementById('view');
  for (const [re, fn, tab, wantsQuery] of routes) {
    const m = path.match(re);
    if (!m) continue;
    root.onclick = root.oninput = root.onchange = null;
    if (!path.startsWith('/session') && !path.startsWith('/autoplay')) keepAwake(false);
    const args = m.slice(1).map(decodeURIComponent);
    fn(root, ...(wantsQuery ? [query] : args));
    document.querySelectorAll('#tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
    document.body.dataset.route = path.split('/')[1] || 'home';
    return;
  }
  location.hash = '#/';
}

async function init() {
  load();
  initRestBar();
  window.addEventListener('gym:save-failed', () => toast('Speichern fehlgeschlagen. Speicher voll?'));
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('hashchange', () => {
    document.querySelectorAll('.sheet-wrap').forEach((s) => s.remove());
    document.body.classList.remove('sheet-open');
    render();
    window.scrollTo(0, 0);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && location.hash.startsWith('#/session')) keepAwake(true);
  });
  try {
    await loadExercises();
  } catch {
    toast('Übungsdatenbank konnte nicht geladen werden');
  }
  render();
  const isDev = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && !isDev) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  navigator.storage?.persist?.().catch(() => {});
}

init();

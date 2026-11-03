import { today, ymd, parseYmd, fmtDateFull, workoutsOn, sessionsOn, sessionDone, startSession, openSessionFor, doneSets } from '../store.js';
import { esc } from '../ui.js';
import { ICON } from '../components.js';
import { pickWorkout } from './home.js';
import { stepsOf, fmtSteps } from './steps.js';

let month = null; // first day of the shown month
let selected = null;

const fmtMonth = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function calendar(root, query) {
  const t = today();
  if (query.d) { selected = query.d; month = null; history.replaceState(null, '', '#/calendar'); }
  selected ||= t;
  if (!month) { const s = parseYmd(selected); month = new Date(s.getFullYear(), s.getMonth(), 1); }

  const first = new Date(month);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('<span class="cal-cell empty"></span>');
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = ymd(new Date(month.getFullYear(), month.getMonth(), d));
    const planned = workoutsOn(ds).length > 0;
    const done = sessionsOn(ds).some(sessionDone);
    const missed = planned && !done && ds < t;
    cells.push(`<button class="cal-cell ${ds === t ? 'is-today' : ''} ${ds === selected ? 'is-sel' : ''} ${planned ? 'is-planned' : ''} ${done ? 'is-done' : ''} ${missed ? 'is-missed' : ''}" data-day="${ds}">
      <span>${d}</span><i></i></button>`);
  }

  const planned = workoutsOn(selected);
  const sessions = sessionsOn(selected);
  const plannedRows = planned.map((w) => {
    const s = openSessionFor(w.id, selected);
    const action = s
      ? `<a class="btn small ${s.finishedAt ? 'ghost' : 'primary'}" href="#/session/${s.id}">${s.finishedAt ? 'Ansehen' : 'Fortsetzen'}</a>`
      : selected <= t ? `<button class="btn small primary" data-start="${w.id}">${selected === t ? 'Starten' : 'Nachtragen'}</button>` : '';
    return `<div class="card row"><span><b>${esc(w.name)}</b><small>${w.exercises.length} Übungen · geplant</small></span>${action}</div>`;
  }).join('');
  const extraRows = sessions.filter((s) => !planned.some((w) => w.id === s.workoutId)).map((s) =>
    `<a class="card row-link" href="#/session/${s.id}"><span><b>${esc(s.name)}</b><small>${s.entries.reduce((n, e) => n + doneSets(e).length, 0)} Sätze</small></span>${ICON.next}</a>`).join('');

  root.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Planung und Rückblick</p><h1>Kalender</h1></div></header>
    <section class="card cal">
      <div class="cal-head">
        <button class="icon-btn" data-m="-1" aria-label="Vorheriger Monat">${ICON.back}</button>
        <b>${fmtMonth.format(month)}</b>
        <button class="icon-btn" data-m="1" aria-label="Nächster Monat">${ICON.next}</button>
      </div>
      <div class="cal-grid cal-dow">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal-grid">${cells.join('')}</div>
      <div class="cal-legend"><span><i class="dot planned"></i>geplant</span><span><i class="dot done"></i>erledigt</span><span><i class="dot missed"></i>verpasst</span></div>
    </section>
    <section class="block">
      <h3 class="label">${esc(fmtDateFull(selected))}</h3>
      ${stepsOf(selected) != null ? `<a class="card row-link" href="#/steps"><span><b>${fmtSteps(stepsOf(selected))} Schritte</b><small>aus Apple Health</small></span>${ICON.next}</a>` : ''}
      ${plannedRows}${extraRows}
      ${!plannedRows && !extraRows ? '<p class="muted">An diesem Tag ist kein Training geplant.</p>' : ''}
      ${selected <= t ? '<button class="btn ghost full" data-other>Anderes Training eintragen</button>' : ''}
    </section>`;

  root.onclick = (e) => {
    const m = e.target.closest('[data-m]');
    if (m) { month = new Date(month.getFullYear(), month.getMonth() + Number(m.dataset.m), 1); calendar(root, {}); return; }
    const day = e.target.closest('[data-day]');
    if (day) { selected = day.dataset.day; calendar(root, {}); return; }
    const st = e.target.closest('[data-start]');
    if (st) { const s = startSession(st.dataset.start, selected); location.hash = `#/session/${s.id}`; return; }
    if (e.target.closest('[data-other]')) pickWorkout(selected);
  };
}

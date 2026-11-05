// "Today" blocks shown on the training tab: planned workout, steps, this week, last session.
import { S, today, fmtDate, workoutsOn, nextPlanned, sessionsOn, sessionsSorted, sessionHasWork, startSession, openSessionFor, doneSets } from '../store.js';
import { esc, openSheet } from '../ui.js';
import { ICON, weekStrip, targetText } from '../components.js';
import { stepsCard, importSteps } from './steps.js';

export function todayHtml() {
  const t = today();
  const planned = workoutsOn(t);
  const todays = sessionsOn(t);
  const last = sessionsSorted().find((s) => s.date < t && sessionHasWork(s));

  const plannedCards = planned.map((w) => {
    const s = openSessionFor(w.id, t);
    const doneCount = s ? s.entries.filter((e) => doneSets(e).length).length : 0;
    const btn = !s
      ? `<button class="btn primary full" data-start="${w.id}">Training starten</button>`
      : s.finishedAt
        ? `<a class="btn ghost full" href="#/session/${s.id}">Erledigt · ansehen</a>`
        : `<a class="btn primary full" href="#/session/${s.id}">Fortsetzen (${doneCount}/${s.entries.length})</a>`;
    return `<section class="card hero">
      <p class="label">Heute geplant</p>
      <h2>${esc(w.name)}</h2>
      <ul class="mini-list">${w.exercises.map((it) => `<li><span>${esc(it.name)}</span><span class="muted">${esc(targetText(it))}</span></li>`).join('')}</ul>
      ${btn}
    </section>`;
  }).join('');

  const extra = todays.filter((s) => !planned.some((w) => w.id === s.workoutId));
  const extraCards = extra.map((s) => `<a class="card row-link" href="#/session/${s.id}"><span><b>${esc(s.name)}</b><small>${s.finishedAt ? 'Erledigt' : 'Läuft'}</small></span>${ICON.next}</a>`).join('');

  let rest = '';
  if (!planned.length) {
    const nx = nextPlanned(t);
    rest = `<section class="card hero">
      <p class="label">Heute</p>
      <h2>Kein Training geplant</h2>
      <p class="muted">${nx ? `Nächstes Training: ${fmtDate(nx.date)}, ${esc(nx.workouts.map((w) => w.name).join(', '))}` : 'Öffne ein Programm und tippe auf „Zum Kalender hinzufügen“.'}</p>
      <button class="btn ghost full" data-pick-workout>Trotzdem trainieren</button>
    </section>`;
  }

  return `${plannedCards}${rest}${extraCards}
    ${stepsCard()}
    <section class="block">
      <div class="block-head"><h3 class="label">Diese Woche</h3><a class="link" href="#/calendar">Kalender</a></div>
      ${weekStrip()}
    </section>
    ${last ? `<section class="block">
      <h3 class="label">Letztes Training</h3>
      <a class="card row-link" href="#/session/${last.id}">
        <span><b>${esc(last.name)}</b><small>${fmtDate(last.date)} · ${last.entries.reduce((n, e) => n + doneSets(e).length, 0)} Sätze</small></span>${ICON.next}
      </a></section>` : ''}`;
}

/** Click handling for the blocks above. Returns true if it handled the click. */
export function todayClick(e, rerender) {
  const t = today();
  const start = e.target.closest('[data-start]');
  if (start) { const s = startSession(start.dataset.start, t); location.hash = `#/session/${s.id}`; return true; }
  if (e.target.closest('[data-pick-workout]')) { pickWorkout(t); return true; }
  if (e.target.closest('[data-steps-import]')) { importSteps(rerender); return true; }
  return false;
}

/** Choose any workout (or a free session) for a given date. */
export function pickWorkout(dateStr) {
  const ws = S().workouts;
  openSheet(
    `<div class="sheet-head"><h2>Welches Training?</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     ${ws.map((w) => `<button class="pick-row" data-w="${w.id}"><span><b>${esc(w.name)}</b><small>${w.exercises.length} Übungen</small></span></button>`).join('')}
     <button class="pick-row" data-w=""><span><b>Freies Training</b><small>Übungen selbst zusammenstellen</small></span></button>`,
    (sheet, close) => {
      sheet.addEventListener('click', (e) => {
        const b = e.target.closest('[data-w]');
        if (!b) return;
        close();
        const s = startSession(b.dataset.w || null, dateStr);
        location.hash = `#/session/${s.id}`;
      });
    }
  );
}

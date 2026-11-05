// Profile tab, laid out like the reference app: one row per area.
import { S, today } from '../store.js';
import { ICON } from '../components.js';
import { stepsOf, fmtSteps } from './steps.js';

export async function profile(root) {
  const st = S();
  const sessions = st.sessions.filter((s) => s.finishedAt).length;
  root.innerHTML = `
    <header class="page-head"><div><p class="brand">Fitbyclin <span>Fitness App</span></p><h1>Profil</h1></div></header>
    <div class="prof-list">
      <a class="prof-row" href="#/history"><span class="prof-ic">${ICON.check}</span><b>Trainings</b><span class="muted">${sessions}</span>${ICON.next}</a>
      <a class="prof-row" href="#/steps"><span class="prof-ic">${ICON.steps}</span><b>Schritte</b><span class="muted">${fmtSteps(stepsOf(today()))}</span>${ICON.next}</a>
      <a class="prof-row" href="#/plan"><span class="prof-ic">${ICON.list}</span><b>Meine Workouts</b><span class="muted">${st.workouts.length}</span>${ICON.next}</a>
      <a class="prof-row" href="#/settings"><span class="prof-ic">${ICON.gear}</span><b>Einstellungen</b><span></span>${ICON.next}</a>
      <a class="prof-row" href="#/settings"><span class="prof-ic">${ICON.box}</span><b>Speicher</b><span class="muted" data-usage>…</span>${ICON.next}</a>
    </div>`;
  const est = await navigator.storage?.estimate?.().catch(() => null);
  const el = root.querySelector('[data-usage]');
  if (el) el.textContent = est ? `${Math.max(1, Math.round(est.usage / 1024 / 1024))} MB` : '–';
}

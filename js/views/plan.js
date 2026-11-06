import { S, uid, saveNow, getWorkout, DAY_SHORT, WEEK_ORDER } from '../store.js';
import { getEx } from '../exercises.js';
import { esc, openSheet, toast } from '../ui.js';
import { ICON, weekStrip, targetText, thumb, openPicker } from '../components.js';
import { openSharePlan, openImportPlan } from './share.js';

export function planList(root) {
  const ws = S().workouts;
  root.innerHTML = `
    <header class="top-bar">
      <a class="icon-btn" href="#/" aria-label="Zurück">${ICON.back}</a>
      <b>Meine Workouts</b>
      <span class="icon-btn" aria-hidden="true"></span>
    </header>
    <section class="block"><h3 class="label">Deine Woche</h3>${weekStrip()}</section>
    <section class="block">
      <h3 class="label">Workouts</h3>
      ${ws.map((w) => `<a class="card row-link" href="#/plan/${w.id}">
        <span><b>${esc(w.name)}</b><small>${w.days.length ? WEEK_ORDER.filter((d) => w.days.includes(d)).map((d) => DAY_SHORT[d]).join(' · ') : 'kein fester Tag'}${w.cycle ? ` · alle ${w.cycle.len} Wochen` : ''} · ${w.exercises.length} Übungen</small></span>${ICON.next}
      </a>`).join('') || '<p class="muted">Noch keine Workouts.</p>'}
      <button class="btn primary full" data-new>${ICON.plus} Neues Workout</button>
    </section>
    <section class="block">
      <h3 class="label">Mit Freunden</h3>
      <div class="grid2">
        <button class="btn ghost" data-share>${ICON.send} Plan teilen</button>
        <button class="btn ghost" data-import>Plan importieren</button>
      </div>
    </section>`;
  root.onclick = (e) => {
    if (e.target.closest('[data-share]')) { openSharePlan(); return; }
    if (e.target.closest('[data-import]')) { openImportPlan(() => planList(root)); return; }
    if (!e.target.closest('[data-new]')) return;
    const w = { id: uid(), name: 'Neues Workout', days: [], exercises: [] };
    S().workouts.push(w);
    saveNow();
    location.hash = `#/plan/${w.id}`;
  };
}

export function planEdit(root, id) {
  const w = getWorkout(id);
  if (!w) { location.hash = '#/plan'; return; }
  const render = () => {
    root.innerHTML = `
      <header class="top-bar">
        <a class="icon-btn" href="#/plan" aria-label="Zurück">${ICON.back}</a>
        <b>Workout bearbeiten</b>
        <span class="icon-btn" aria-hidden="true"></span>
      </header>
      <label class="field"><span>Name</span><input class="input" data-name value="${esc(w.name)}" autocomplete="off"></label>
      <div class="field"><span>Trainingstage (wiederholt sich jede Woche)</span>
        <div class="days">${WEEK_ORDER.map((d) => `<button class="day ${w.days.includes(d) ? 'on' : ''}" data-day="${d}" aria-pressed="${w.days.includes(d)}">${DAY_SHORT[d]}</button>`).join('')}</div>
      </div>
      <h3 class="label">Übungen</h3>
      <div class="plan-list">
        ${w.exercises.map((it, i) => `<div class="card plan-item">
          ${thumb(getEx(it.exId))}
          <button class="plan-main" data-edit="${i}"><b>${esc(it.name)}</b><small>${targetText(it)}${it.restOn !== false && it.rest ? ` · Pause ${it.rest} s` : ' · ohne Pausentimer'}${it.timer ?? it.type === 'time' ? ' · Timer' : ''}</small></button>
          <span class="plan-move">
            <button class="icon-btn sm" data-up="${i}" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
            <button class="icon-btn sm" data-down="${i}" aria-label="Nach unten" ${i === w.exercises.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          </span>
        </div>`).join('') || '<p class="muted">Noch keine Übungen.</p>'}
      </div>
      <button class="btn primary full" data-add>${ICON.plus} Übung hinzufügen</button>
      <button class="btn danger-ghost full" data-del>Workout löschen</button>`;
  };
  render();

  root.oninput = (e) => {
    if (e.target.matches('[data-name]')) { w.name = e.target.value; saveNow(); }
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.day) {
      const d = Number(b.dataset.day);
      w.days = w.days.includes(d) ? w.days.filter((x) => x !== d) : [...w.days, d];
      saveNow(); render(); return;
    }
    if (b.dataset.up || b.dataset.down) {
      const i = Number(b.dataset.up ?? b.dataset.down);
      const j = b.dataset.up ? i - 1 : i + 1;
      [w.exercises[i], w.exercises[j]] = [w.exercises[j], w.exercises[i]];
      saveNow(); render(); return;
    }
    if (b.dataset.edit) { editItem(w, Number(b.dataset.edit), render); return; }
    if (b.hasAttribute('data-add')) {
      openPicker((exId) => {
        const ex = getEx(exId);
        const it = { id: uid(), exId, name: ex.name, type: ex.type, sets: 3, reps: ex.type === 'time' ? '' : '8-12', seconds: ex.type === 'time' ? 45 : 0, rest: 90 };
        w.exercises.push(it);
        saveNow(); render();
        editItem(w, w.exercises.length - 1, render);
      });
      return;
    }
    if (b.hasAttribute('data-del')) {
      if (!confirm(`„${w.name}“ löschen? Bereits geloggte Trainings bleiben erhalten.`)) return;
      S().workouts = S().workouts.filter((x) => x !== w);
      saveNow();
      location.hash = '#/plan';
    }
  };
}

function editItem(w, i, rerender) {
  const it = w.exercises[i];
  openSheet(
    `<div class="sheet-head"><h2>${esc(getEx(it.exId).name)}</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <label class="field"><span>Anzeigename</span><input class="input" name="name" value="${esc(it.name)}"></label>
     <div class="field"><span>Art</span>
       <div class="seg">
         <label><input type="radio" name="type" value="reps" ${it.type !== 'time' ? 'checked' : ''}><span>Wiederholungen</span></label>
         <label><input type="radio" name="type" value="time" ${it.type === 'time' ? 'checked' : ''}><span>Auf Zeit</span></label>
       </div>
     </div>
     <div class="grid2">
       <label class="field"><span>Sätze</span><input class="input" name="sets" inputmode="numeric" value="${it.sets}"></label>
       <label class="field" data-show="reps"><span>Wiederholungen</span><input class="input" name="reps" value="${esc(it.repsText ?? it.reps)}" placeholder="z. B. 8-12"></label>
       <label class="field" data-show="time"><span>Sekunden (Timer)</span><input class="input" name="seconds" inputmode="numeric" value="${it.seconds || ''}" placeholder="45"></label>
       <label class="field" data-show="rest"><span>Pause (Sek.)</span><input class="input" name="rest" inputmode="numeric" value="${it.rest || 90}"></label>
     </div>
     <div class="toggles card">
       <label class="switch"><input type="checkbox" name="timer" ${it.timer ?? it.type === 'time' ? 'checked' : ''}><span></span>Timer bei dieser Übung</label>
       <label class="switch"><input type="checkbox" name="restOn" ${it.restOn !== false && it.rest !== 0 ? 'checked' : ''}><span></span>Pausentimer nach jedem Satz</label>
     </div>
     <button class="btn primary full" data-save>Übernehmen</button>
     <button class="btn danger-ghost full" data-remove>Aus Workout entfernen</button>`,
    (sheet, close) => {
      const timerBox = sheet.querySelector('[name="timer"]');
      const restBox = sheet.querySelector('[name="restOn"]');
      const sync = () => {
        const type = sheet.querySelector('[name="type"]:checked').value;
        sheet.querySelector('[data-show="reps"]').hidden = type !== 'reps';
        sheet.querySelector('[data-show="time"]').hidden = type !== 'time' && !timerBox.checked;
        sheet.querySelector('[data-show="rest"]').hidden = !restBox.checked;
      };
      sheet.querySelectorAll('[name="type"]').forEach((r) => r.addEventListener('change', () => {
        if (r.checked && r.value === 'time') timerBox.checked = true;
        sync();
      }));
      timerBox.addEventListener('change', sync);
      restBox.addEventListener('change', sync);
      sync();
      sheet.querySelector('[data-save]').addEventListener('click', () => {
        const v = (n) => sheet.querySelector(`[name="${n}"]`).value.trim();
        it.name = v('name') || getEx(it.exId).name;
        it.type = sheet.querySelector('[name="type"]:checked').value;
        it.sets = Math.max(1, Math.min(20, parseInt(v('sets'), 10) || 3));
        if (v('reps') !== (it.repsText ?? it.reps)) { it.reps = v('reps'); it.repsText = undefined; }
        if (it.type === 'time') it.repsText = undefined;
        it.timer = timerBox.checked;
        it.restOn = restBox.checked;
        it.seconds = Math.max(0, parseInt(v('seconds'), 10) || 0) || (it.type === 'time' || it.timer ? 45 : 0);
        it.rest = Math.max(0, parseInt(v('rest'), 10) || 0) || 90;
        saveNow(); close(); rerender();
      });
      sheet.querySelector('[data-remove]').addEventListener('click', () => {
        w.exercises.splice(i, 1);
        saveNow(); close(); rerender();
        toast('Übung entfernt');
      });
    }
  );
}

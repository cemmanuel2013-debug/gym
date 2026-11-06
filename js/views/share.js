// Share selected workouts with friends, and import workouts from them.
// Only the plan travels: no sessions, notes, chat, steps or videos.
// On iPhone a link would open in Safari (separate storage from the home-screen app),
// so plans travel as a file or as a text code pasted inside the app.
import { S, uid, saveNow, today } from '../store.js';
import { esc, openSheet, toast, download } from '../ui.js';
import { ICON } from '../components.js';

const PREFIX = 'FITBYCLIN1:';
const MAX_WORKOUTS = 60;
const MAX_ITEMS = 60;

const toB64 = (str) => { const bytes = new TextEncoder().encode(str); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
const fromB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

function packPlan(workouts) {
  const customIds = new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exId)).filter((id) => id.startsWith('c_')));
  return {
    app: 'fitbyclin', kind: 'plan', v: 1, date: today(),
    workouts: workouts.map(({ name, days, cycle, programId, programRef, exercises }) => ({
      name, days, cycle: cycle || null, programId: programId || null, programRef: programRef || null,
      exercises: exercises.map(({ id, ...rest }) => rest),
    })),
    customExercises: S().customExercises.filter((c) => customIds.has(c.id)),
  };
}

/** Accepts the JSON file content or a text containing the code. Returns a clean plan or null. */
export function readPlan(text) {
  let data = null;
  const t = String(text || '').trim();
  try {
    const m = t.match(/FITBYCLIN1:([A-Za-z0-9+/=]+)/);
    data = JSON.parse(m ? fromB64(m[1]) : t);
  } catch { return null; }
  if (!data || data.kind !== 'plan' || !Array.isArray(data.workouts)) return null;
  const str = (v, max = 120) => String(v ?? '').slice(0, max);
  const num = (v, max) => Math.max(0, Math.min(max, Number(v) || 0));
  const workouts = data.workouts.slice(0, MAX_WORKOUTS).map((w) => ({
    name: str(w.name) || 'Workout',
    days: (Array.isArray(w.days) ? w.days : []).map(Number).filter((d) => d >= 0 && d <= 6),
    cycle: w.cycle && /^\d{4}-\d{2}-\d{2}$/.test(w.cycle.start) ? { start: w.cycle.start, len: num(w.cycle.len, 8) || 2, idx: num(w.cycle.idx, 7) } : null,
    programId: w.programId ? str(w.programId, 40) : null,
    programRef: w.programRef ? { wi: num(w.programRef.wi, 9), di: num(w.programRef.di, 9) } : null,
    exercises: (Array.isArray(w.exercises) ? w.exercises : []).slice(0, MAX_ITEMS).map((e) => ({
      exId: str(e.exId, 80), name: str(e.name) || 'Übung', type: e.type === 'time' ? 'time' : 'reps',
      sets: num(e.sets, 20) || 1, reps: str(e.reps, 40), repsText: e.repsText ? str(e.repsText, 80) : undefined,
      seconds: num(e.seconds, 3600), rest: num(e.rest, 900), restOn: e.restOn !== false, timer: !!e.timer, ss: !!e.ss,
    })).filter((e) => e.exId),
  }));
  const customExercises = (Array.isArray(data.customExercises) ? data.customExercises : []).slice(0, 100)
    .filter((c) => /^c_[\w-]+$/.test(c.id))
    .map((c) => ({ id: c.id, name: str(c.name) || 'Eigene Übung', type: c.type === 'time' ? 'time' : 'reps', instructions: (Array.isArray(c.instructions) ? c.instructions : []).slice(0, 20).map((s) => str(s, 300)) }));
  return { workouts, customExercises, date: str(data.date, 10) };
}

export function openSharePlan() {
  const ws = S().workouts;
  if (!ws.length) { toast('Du hast noch keine Workouts im Plan'); return; }
  const sel = new Set(ws.map((w) => w.id));
  openSheet(
    `<div class="sheet-head"><h2>Plan teilen</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <p class="muted small">Geteilt werden nur die ausgewählten Workouts mit Übungen, Sätzen und Tagen. Deine Trainings, Gewichte, Notizen, Videos und der Chat bleiben bei dir.</p>
     <div class="share-list">${ws.map((w) => `<label class="check-row"><input type="checkbox" value="${w.id}" checked><span><b>${esc(w.name)}</b><small>${w.exercises.length} Übungen</small></span></label>`).join('')}</div>
     <button class="btn primary full" data-file>Als Datei teilen</button>
     <button class="btn ghost full" data-code>Als Text-Code kopieren</button>`,
    (sheet, close) => {
      sheet.querySelector('.share-list').addEventListener('change', (e) => {
        if (e.target.checked) sel.add(e.target.value); else sel.delete(e.target.value);
      });
      const chosen = () => ws.filter((w) => sel.has(w.id));
      sheet.querySelector('[data-file]').addEventListener('click', async () => {
        if (!sel.size) { toast('Bitte mindestens ein Workout wählen'); return; }
        const json = JSON.stringify(packPlan(chosen()));
        const file = new File([json], `fitbyclin-plan-${today()}.json`, { type: 'application/json' });
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Fitbyclin-Plan', text: 'Mein Trainingsplan für die Fitbyclin Fitness App. In der App: Training → Meine Workouts → Plan importieren.' });
          } else {
            download(file.name, file);
          }
          close();
        } catch (err) {
          if (err?.name !== 'AbortError') toast('Teilen nicht möglich');
        }
      });
      sheet.querySelector('[data-code]').addEventListener('click', async () => {
        if (!sel.size) { toast('Bitte mindestens ein Workout wählen'); return; }
        const text = `Mein Plan für die Fitbyclin Fitness App: Diese ganze Nachricht kopieren, dann in der App unter Training → Meine Workouts → Plan importieren tippen.\n${PREFIX}${toB64(JSON.stringify(packPlan(chosen())))}`;
        try {
          await navigator.clipboard.writeText(text);
          toast('Code kopiert. Jetzt in WhatsApp oder Nachrichten einfügen.');
          close();
        } catch {
          toast('Kopieren nicht möglich');
        }
      });
    }
  );
}

export function openImportPlan(onDone) {
  openSheet(
    `<div class="sheet-head"><h2>Plan importieren</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <p class="muted small">Die Workouts kommen zusätzlich zu deinem Plan dazu. Nichts von dir wird überschrieben.</p>
     <button class="btn primary full" data-paste>Code aus Zwischenablage einfügen</button>
     <label class="btn ghost full">Datei auswählen<input type="file" accept="application/json,.json" data-pick hidden></label>
     <div data-preview></div>`,
    (sheet, close) => {
      const preview = sheet.querySelector('[data-preview]');
      const show = (plan) => {
        if (!plan || !plan.workouts.length) { toast('Darin wurde kein Plan gefunden'); return; }
        preview.innerHTML = `<h3 class="label">Gefunden</h3>
          ${plan.workouts.map((w) => `<div class="hist-row"><span>${esc(w.name)}</span><span>${w.exercises.length} Übungen</span></div>`).join('')}
          <button class="btn primary full" data-add>${plan.workouts.length} ${plan.workouts.length === 1 ? 'Workout' : 'Workouts'} hinzufügen</button>`;
        preview.querySelector('[data-add]').addEventListener('click', () => {
          const st = S();
          for (const c of plan.customExercises) if (!st.customExercises.some((x) => x.id === c.id)) st.customExercises.push(c);
          for (const w of plan.workouts) st.workouts.push({ ...w, id: uid(), exercises: w.exercises.map((e) => ({ ...e, id: uid() })) });
          saveNow();
          close();
          toast('Plan importiert');
          onDone?.();
        });
      };
      sheet.querySelector('[data-paste]').addEventListener('click', async () => {
        let text = '';
        try { text = await navigator.clipboard.readText(); } catch { text = ''; }
        if (!text) { toast('Zwischenablage ist leer oder nicht lesbar'); return; }
        show(readPlan(text));
      });
      sheet.querySelector('[data-pick]').addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { toast('Datei ist zu groß'); return; }
        show(readPlan(await f.text()));
      });
    }
  );
}

export { toB64, packPlan };

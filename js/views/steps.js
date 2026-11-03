// Steps come from Apple Health via an iOS shortcut that copies "YYYY-MM-DD 8421" to the clipboard.
// A web app cannot read Health directly, so the app reads the clipboard (or a manual entry).
import { S, saveNow, today, ymd, addDays, parseYmd, pad, fmtDate, fmtDateFull, DAY_SHORT } from '../store.js';
import { esc, toast, openSheet } from '../ui.js';
import { ICON } from '../components.js';

const fmtInt = new Intl.NumberFormat('de-DE');
export const fmtSteps = (n) => (n == null ? '–' : fmtInt.format(n));
export const stepsOf = (d) => S().steps?.[d] ?? null;
export const stepGoal = () => S().settings.stepGoal || 10000;

/** Finds "date + number" pairs, one per line. Accepts 2026-11-03 or 03.11.2026, and 8421 / 8.421 / 8421,0. */
export function parseSteps(text) {
  const out = [];
  for (const line of String(text).split(/[\n;]+/)) {
    let date = null;
    let rest = line;
    let m = line.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) date = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    else if ((m = line.match(/(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?!\d)/))) date = `${m[3].length === 2 ? '20' + m[3] : m[3]}-${pad(m[2])}-${pad(m[1])}`;
    if (!date) continue;
    rest = line.replace(m[0], ' ');
    const n = rest.match(/\d[\d.,'  ]*/);
    if (!n) continue;
    const s = n[0].replace(/['  ]/g, '').replace(/[.,]\d{1,2}$/, '').replace(/[.,]/g, '');
    const steps = parseInt(s, 10);
    if (Number.isFinite(steps) && steps >= 0 && steps < 200000 && !Number.isNaN(parseYmd(date).getTime())) out.push({ date, steps });
  }
  return out;
}

function store(list) {
  S().steps ||= {};
  for (const { date, steps } of list) S().steps[date] = steps;
  saveNow();
}

/** Button handler: read the clipboard; if there is nothing usable, open manual entry. */
export async function importSteps(onDone) {
  let text = '';
  try { text = await navigator.clipboard.readText(); } catch { text = ''; }
  const list = parseSteps(text);
  if (!list.length) {
    toast('In der Zwischenablage sind keine Schritte. Kurzbefehl ausführen oder manuell eintragen.');
    editSteps(today(), onDone);
    return;
  }
  store(list);
  const last = list[list.length - 1];
  toast(list.length === 1 ? `${fmtSteps(last.steps)} Schritte für ${fmtDate(last.date)} übernommen` : `Schritte für ${list.length} Tage übernommen`);
  onDone?.();
}

export function editSteps(dateStr, onDone) {
  const cur = stepsOf(dateStr);
  openSheet(
    `<div class="sheet-head"><h2>Schritte eintragen</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <label class="field"><span>Tag</span><input class="input" type="date" name="date" value="${dateStr}" max="${today()}"></label>
     <label class="field"><span>Schritte</span><input class="input" name="steps" inputmode="numeric" value="${cur ?? ''}" placeholder="z. B. 8421"></label>
     <button class="btn primary full" data-save>Speichern</button>
     ${cur != null ? '<button class="btn danger-ghost full" data-del>Eintrag löschen</button>' : ''}`,
    (sheet, close) => {
      sheet.querySelector('[data-save]').addEventListener('click', () => {
        const date = sheet.querySelector('[name="date"]').value;
        const steps = parseInt(sheet.querySelector('[name="steps"]').value.replace(/\D/g, ''), 10);
        if (!date || !Number.isFinite(steps)) { toast('Bitte Tag und Schritte angeben'); return; }
        store([{ date, steps }]);
        close();
        onDone?.();
      });
      sheet.querySelector('[data-del]')?.addEventListener('click', () => {
        delete S().steps[dateStr];
        saveNow();
        close();
        onDone?.();
      });
    }
  );
}

/** Bar chart of the last `days` days with a goal line. */
export function stepsBars(days = 7) {
  const t = parseYmd(today());
  const goal = stepGoal();
  const items = [];
  for (let i = days - 1; i >= 0; i--) { const d = ymd(addDays(t, -i)); items.push({ d, v: stepsOf(d) }); }
  const max = Math.max(goal, ...items.map((x) => x.v || 0)) * 1.05;
  const label = (d) => (days <= 7 ? DAY_SHORT[parseYmd(d).getDay()] : parseYmd(d).getDay() === 1 ? parseYmd(d).getDate() : '');
  return `<div class="bars ${days > 7 ? 'dense' : ''}" style="--g:${(goal / max).toFixed(3)}" role="img" aria-label="Schritte der letzten ${days} Tage">
    ${items.map((x) => `<div class="bar ${x.v >= goal ? 'hit' : ''} ${x.d === today() ? 'today' : ''}" title="${fmtDate(x.d)}: ${fmtSteps(x.v)}">
      <div class="bar-track"><i style="height:${x.v ? Math.max(3, (x.v / max) * 100) : 0}%"></i></div><span>${label(x.d)}</span></div>`).join('')}
    <div class="bar-goal"></div>
  </div>`;
}

export function stepsCard() {
  const v = stepsOf(today());
  const goal = stepGoal();
  const pct = v ? Math.min(100, (v / goal) * 100) : 0;
  return `<section class="card">
    <div class="block-head"><h3 class="label">Schritte heute</h3><a class="link" href="#/steps">Verlauf</a></div>
    <div class="steps-big"><b>${fmtSteps(v)}</b><span class="muted">von ${fmtSteps(goal)}</span></div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    ${stepsBars(7)}
    <button class="btn ghost full" data-steps-import>Schritte übernehmen</button>
  </section>`;
}

export function stepsView(root) {
  const entries = Object.entries(S().steps || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 60);
  const last7 = [...Array(7)].map((_, i) => stepsOf(ymd(addDays(parseYmd(today()), -i)))).filter((v) => v != null);
  const avg = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : null;

  root.innerHTML = `
    <header class="top-bar">
      <a class="icon-btn" href="#/" aria-label="Zurück">${ICON.back}</a>
      <b>Schritte</b>
      <span class="icon-btn" aria-hidden="true"></span>
    </header>
    <section class="card">
      <div class="steps-big"><b>${fmtSteps(stepsOf(today()))}</b><span class="muted">heute</span></div>
      <p class="muted small">Schnitt der letzten 7 Tage: ${fmtSteps(avg)}</p>
      ${stepsBars(30)}
    </section>
    <div class="grid2">
      <button class="btn primary" data-import>Übernehmen</button>
      <button class="btn ghost" data-manual>Manuell</button>
    </div>
    <label class="field"><span>Tagesziel</span><input class="input" data-goal inputmode="numeric" value="${stepGoal()}"></label>

    <section class="block">
      <h3 class="label">Einträge</h3>
      ${entries.map(([d, v]) => `<button class="card row hist-btn" data-edit="${d}"><span><b>${fmtSteps(v)}</b><small>${esc(fmtDateFull(d))}</small></span>${ICON.next}</button>`).join('') || '<p class="muted">Noch keine Schritte gespeichert.</p>'}
    </section>

    <section class="block">
      <h3 class="label">Einrichtung</h3>
      <details class="howto">
        <summary>1. Garmin mit Apple Health verbinden</summary>
        <ol>
          <li>Garmin-Connect-App öffnen.</li>
          <li>In den Einstellungen die verbundenen Apps öffnen und „Apple Health“ wählen.</li>
          <li>Das Schreiben von Schritten nach Health erlauben.</li>
          <li>In der Health-App prüfen, ob unter „Schritte“ die Garmin-Werte ankommen.</li>
        </ol>
      </details>
      <details class="howto">
        <summary>2. Kurzbefehl „Fitbyclin Schritte“ anlegen</summary>
        <ol>
          <li>App „Kurzbefehle“ öffnen, oben rechts auf „+“ tippen und den Kurzbefehl „Fitbyclin Schritte“ nennen.</li>
          <li>Aktion „Health-Stichproben suchen“ hinzufügen. Typ: <b>Schritte</b>. Filter: <b>Startdatum ist heute</b>. Gruppieren nach: <b>Tag</b>.</li>
          <li>Aktion „Details von Health-Stichproben abrufen“ hinzufügen und <b>Wert</b> wählen.</li>
          <li>Aktion „Datum formatieren“ hinzufügen. Datum: <b>Aktuelles Datum</b>. Format: <b>Eigenes</b>, und als Format <b>yyyy-MM-dd</b> eintragen.</li>
          <li>Aktion „Text“ hinzufügen und hineinsetzen: das formatierte Datum, ein Leerzeichen, dann den Wert.</li>
          <li>Aktion „In Zwischenablage kopieren“ hinzufügen.</li>
          <li>Optional: Aktion „Mitteilung anzeigen“ mit dem Text „Schritte kopiert“.</li>
          <li>Einmal antippen zum Testen, Health-Zugriff erlauben, dann hier auf „Übernehmen“ tippen.</li>
        </ol>
        <p class="muted small">Die Namen der Aktionen können je nach iOS-Version leicht anders heißen. Vergleich beim ersten Mal die Zahl mit der Health-App.</p>
      </details>
      <details class="howto">
        <summary>3. Jeden Abend automatisch ausführen</summary>
        <ol>
          <li>In „Kurzbefehle“ unten auf „Automation“ und dann „Neue Automation“ tippen.</li>
          <li>„Tageszeit“ wählen, z. B. 21:30, Wiederholen: täglich.</li>
          <li>„Sofort ausführen“ wählen und den Kurzbefehl „Fitbyclin Schritte“ auswählen.</li>
          <li>Wenn du danach die Fitness-App öffnest, tippst du nur noch auf „Schritte übernehmen“. Das geht auch am nächsten Morgen, das Datum steckt mit drin.</li>
        </ol>
      </details>
    </section>`;

  const rerender = () => stepsView(root);
  root.onclick = (e) => {
    if (e.target.closest('[data-import]')) importSteps(rerender);
    else if (e.target.closest('[data-manual]')) editSteps(today(), rerender);
    else { const b = e.target.closest('[data-edit]'); if (b) editSteps(b.dataset.edit, rerender); }
  };
  root.onchange = (e) => {
    if (!e.target.hasAttribute('data-goal')) return;
    const g = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (g > 0) { S().settings.stepGoal = g; saveNow(); rerender(); }
  };
}

import { S, uid, saveNow, putFile, fileUrl, fmtNum, fmtSec, doneSets, num, DAY_SHORT, WEEK_ORDER, mondayOf, addDays, ymd, today, workoutsOn, sessionsOn, sessionDone } from './store.js';
import { getEx, searchEx, MUSCLES_DE, EQUIP_DE } from './exercises.js';
import { esc, openSheet, toast } from './ui.js';

export const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="11" rx="2"/><path d="M16 11l5-3v9l-5-3z"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 7v7M8 10h8M12 14l-3 6M12 14l3 6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-6z"/></svg>',
};

/** Works for plan items (sets is a number) and session entries (sets is an array). */
export const targetText = (it) => {
  const n = Array.isArray(it.sets) ? it.targetSets : it.sets;
  return it.type === 'time' ? `${n} × ${fmtSec(it.seconds || 0)}` : `${n} × ${it.reps || '?'} Wdh.`;
};

/** Two database pictures cross-faded into a short loop, or the user's own demo video. */
export function media(ex, cls = '') {
  if (ex.demo) return `<div class="media ${cls}" data-demo="${esc(ex.demo)}"></div>`;
  if (ex.images.length >= 2)
    return `<div class="media anim ${cls}"><img src="${ex.images[0]}" alt="${esc(ex.name)}, Startposition"><img src="${ex.images[1]}" alt="${esc(ex.name)}, Endposition"></div>`;
  if (ex.images.length === 1) return `<div class="media ${cls}"><img src="${ex.images[0]}" alt="${esc(ex.name)}"></div>`;
  return `<div class="media ph ${cls}">${ICON.person}<span>Noch keine Animation. Unten kannst du ein eigenes Demo-Video hinterlegen.</span></div>`;
}

export async function hydrateMedia(root) {
  for (const el of root.querySelectorAll('[data-demo]')) {
    const url = await fileUrl(el.dataset.demo);
    el.innerHTML = url
      ? `<video src="${url}" autoplay muted loop playsinline></video>`
      : `<div class="media-ph">${ICON.person}<span>Demo-Video nicht gefunden</span></div>`;
  }
}

export function thumb(ex) {
  if (ex.images.length) return `<img class="thumb" loading="lazy" src="${ex.images[0]}" alt="">`;
  const letters = ex.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<span class="thumb thumb-ph">${esc(letters)}</span>`;
}

export function setsSummary(entry) {
  const d = doneSets(entry);
  if (!d.length) return 'keine Sätze';
  const one = (x) => {
    const w = num(x.w) ? `${fmtNum(num(x.w))} kg` : '';
    const v = entry.type === 'time' ? `${fmtSec(num(x.t) || 0)}` : `${num(x.r) ?? '?'}`;
    return entry.type === 'time' ? [w, v].filter(Boolean).join(' · ') : w ? `${w} × ${v}` : `${v} Wdh.`;
  };
  const parts = d.map(one);
  return parts.every((p) => p === parts[0]) ? `${d.length} × ${parts[0]}` : parts.join(', ');
}

/** Best value per session for the progress chart: heaviest weight, else longest time or most reps. */
export function metricOf(entry) {
  const d = doneSets(entry);
  if (!d.length) return null;
  const w = Math.max(...d.map((x) => num(x.w) || 0));
  if (w > 0) return { v: w, unit: 'kg', label: 'Höchstes Gewicht' };
  if (entry.type === 'time') return { v: Math.max(...d.map((x) => num(x.t) || 0)), unit: 's', label: 'Längste Zeit' };
  return { v: Math.max(...d.map((x) => num(x.r) || 0)), unit: 'Wdh.', label: 'Meiste Wiederholungen' };
}

export function chart(points) {
  if (points.length < 2) return '<p class="muted small">Ab zwei Einheiten siehst du hier eine Kurve.</p>';
  const W = 320, H = 110, P = 14;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const span = max - min || 1;
  const x = (i) => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = (v) => H - P - ((v - min) / span) * (H - 2 * P);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5"><title>${esc(p.label)}: ${fmtNum(p.v)} ${p.unit}</title></circle>`).join('');
  const unit = points[0].unit;
  return `<figure class="chart">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Verlauf">
      <polyline points="${line}"/>${dots}
    </svg>
    <figcaption><span>${fmtNum(min)} ${unit}</span><span>${points[0].metricLabel}</span><span>${fmtNum(max)} ${unit}</span></figcaption>
  </figure>`;
}

/** Mo–So of the current week, with planned workout and done marker. */
export function weekStrip(ref = new Date()) {
  const mon = mondayOf(ref);
  const t = today();
  const cells = WEEK_ORDER.map((_, i) => {
    const d = ymd(addDays(mon, i));
    const planned = workoutsOn(d);
    const done = sessionsOn(d).some(sessionDone);
    return `<a class="wk-day ${d === t ? 'is-today' : ''} ${done ? 'is-done' : ''} ${planned.length ? 'is-planned' : ''}" href="#/calendar?d=${d}">
      <span class="wk-name">${DAY_SHORT[addDays(mon, i).getDay()]}</span>
      <span class="wk-num">${addDays(mon, i).getDate()}</span>
      <span class="wk-dot"></span>
      <span class="wk-w">${esc(planned.map((w) => w.name.replace(/^Beispiel:\s*/, '')).join(', ') || '–')}</span>
    </a>`;
  });
  return `<div class="week">${cells.join('')}</div>`;
}

// ---------- exercise picker ----------
export function openPicker(onPick) {
  const muscleOpts = Object.entries(MUSCLES_DE).sort((a, b) => a[1].localeCompare(b[1], 'de')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  const equipOpts = Object.entries(EQUIP_DE).map(([k, v]) => `<option value="${esc(k)}">${v}</option>`).join('');
  openSheet(
    `<div class="sheet-head"><h2>Übung wählen</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <input class="input search" type="search" placeholder="Suchen, z. B. Kniebeuge oder split squat" autocomplete="off">
     <div class="filters">
       <select class="input" data-f="m"><option value="">Alle Muskeln</option>${muscleOpts}</select>
       <select class="input" data-f="eq"><option value="">Alle Geräte</option>${equipOpts}</select>
     </div>
     <button class="btn ghost full" data-new>${ICON.plus} Eigene Übung anlegen</button>
     <div class="pick-list"></div>`,
    (sheet, close) => {
      const q = sheet.querySelector('.search');
      const fm = sheet.querySelector('[data-f="m"]');
      const fe = sheet.querySelector('[data-f="eq"]');
      const list = sheet.querySelector('.pick-list');
      const row = (id) => {
        const ex = getEx(id);
        const sub = [ex.muscles.map((m) => MUSCLES_DE[m] || m).join(', '), EQUIP_DE[ex.equipment]].filter(Boolean).join(' · ');
        return `<button class="pick-row" data-pick="${esc(id)}">${thumb(ex)}<span><b>${esc(ex.name)}</b><small>${esc(sub)}</small></span></button>`;
      };
      const render = () => {
        const r = searchEx(q.value, fm.value, fe.value);
        const dbShown = r.db.slice(0, 80);
        list.innerHTML =
          (r.own.length ? `<h3 class="label">Eigene und ATG-Übungen</h3>${r.own.map(row).join('')}` : '') +
          `<h3 class="label">Datenbank (${r.db.length})</h3>` +
          (dbShown.length ? dbShown.map(row).join('') : '<p class="muted small">Nichts gefunden. Die Datenbank ist auf Englisch, versuch es z. B. mit „squat“ oder „curl“.</p>') +
          (r.db.length > 80 ? '<p class="muted small">Suche genauer, um weitere Treffer zu sehen.</p>' : '');
      };
      let h;
      q.addEventListener('input', () => { clearTimeout(h); h = setTimeout(render, 120); });
      fm.addEventListener('change', render);
      fe.addEventListener('change', render);
      list.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pick]');
        if (b) { close(); onPick(b.dataset.pick); }
      });
      sheet.querySelector('[data-new]').addEventListener('click', () => {
        close();
        openCustomForm((id) => onPick(id));
      });
      render();
    }
  );
}

export function openCustomForm(onSaved) {
  openSheet(
    `<div class="sheet-head"><h2>Eigene Übung</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <label class="field"><span>Name</span><input class="input" name="name" placeholder="z. B. Sissy Squat" autocomplete="off"></label>
     <div class="field"><span>Art</span>
       <div class="seg"><label><input type="radio" name="type" value="reps" checked><span>Wiederholungen</span></label><label><input type="radio" name="type" value="time"><span>Auf Zeit</span></label></div>
     </div>
     <label class="field"><span>Ausführung (optional)</span><textarea class="input" name="instr" rows="3" placeholder="Eine Zeile pro Schritt"></textarea></label>
     <label class="field"><span>Demo-Video (optional)</span><input class="input" type="file" name="video" accept="video/*"></label>
     <button class="btn primary full" data-save>Speichern</button>`,
    (sheet, close) => {
      sheet.querySelector('[data-save]').addEventListener('click', async () => {
        const name = sheet.querySelector('[name="name"]').value.trim();
        if (!name) { toast('Bitte einen Namen eingeben'); return; }
        const id = 'c_' + uid();
        const type = sheet.querySelector('[name="type"]:checked').value;
        const instructions = sheet.querySelector('[name="instr"]').value.split('\n').map((s) => s.trim()).filter(Boolean);
        S().customExercises.push({ id, name, type, instructions });
        const file = sheet.querySelector('[name="video"]').files[0];
        if (file) { const key = 'demo_' + id; await putFile(key, file); S().demos[id] = key; }
        saveNow();
        close();
        onSaved(id);
      });
    }
  );
}

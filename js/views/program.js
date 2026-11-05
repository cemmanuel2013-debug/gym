// Program page: hero, variants, description, week switch, days with set circles and superset lines.
import { S, uid, saveNow, today, ymd, mondayOf, DAY_SHORT, WEEK_ORDER, startSessionFromItems, historyFor, fmtDate } from '../store.js';
import { getEx, imgUrl } from '../exercises.js';
import { getProgram, itemsOf } from '../programs.js';
import { esc, openSheet, toast } from '../ui.js';
import { ICON, media, hydrateMedia, setsSummary } from '../components.js';

const weekOf = {}; // remembered week tab per program

const dayLabel = (d) => `${d.title}${d.wd != null ? `: ${DAY_SHORT[d.wd]}` : ''}`;
const planned = (pid) => S().workouts.filter((w) => w.programId === pid);

export function programView(root, id) {
  const p = getProgram(id);
  if (!p) { location.hash = '#/'; return; }
  const wi = Math.min(weekOf[id] ?? 0, p.weeks.length - 1);
  const week = p.weeks[wi];
  const fav = S().favorites.includes(id);
  const inCal = planned(id).length > 0;
  const art = imgUrl(p.art);

  root.innerHTML = `
    <section class="phero tone-${p.tone}">
      ${art ? `<img src="${art}" alt="">` : ''}
      <a class="round-btn" href="#/" aria-label="Zurück">${ICON.back}</a>
      <button class="pill ${inCal ? 'on' : ''}" data-addcal>${inCal ? `${ICON.check} Im Kalender` : 'Zum Kalender hinzufügen'}</button>
      <h1>${esc(p.name)}</h1>
      <button class="fav-btn ${fav ? 'on' : ''}" data-fav aria-label="${fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}" aria-pressed="${fav}">${ICON.heart}</button>
    </section>

    ${p.family.length > 1 ? `<p class="label">Programm-Varianten</p>
    <div class="ptabs">${p.family.map((fid) => `<a href="#/program/${fid}" class="${fid === id ? 'active' : ''}">${esc(getProgram(fid).name)}</a>`).join('')}</div>` : ''}

    <p class="label">Beschreibung</p>
    <p class="pdesc">${esc(p.desc)}</p>
    <p class="pdesc muted small">Übungen mit einer Linie zwischen den Kreisen sind ein Supersatz: je einen Satz von beiden, dann erst Pause. Die Zahl im Kreis sind die Sätze.</p>

    <div class="psticky">
      <span>Sätze</span><span>Übungen</span>
      ${p.weeks.length > 1 ? `<button data-week aria-label="Woche wechseln">${esc(week.label)} ${ICON.chevDown}</button>` : '<span></span>'}
    </div>

    ${week.days.map((d, di) => `<section class="pday">
      <div class="pday-head">
        <h2>${esc(dayLabel(d))}</h2>
        <button class="sq-btn" data-start="${di}" aria-label="${esc(d.title)} jetzt starten">${ICON.play}</button>
        <button class="sq-btn" data-daycal="${di}" aria-label="${esc(d.title)} einplanen">${ICON.calPlus}</button>
      </div>
      <div class="plist">${d.items.map((it, i) => `<button class="prow ${it.ss ? 'ss' : ''}" data-ex="${di}:${i}">
        <span class="sets-circle">${it.sets}</span>
        <span class="prow-main"><b>${esc(it.name)}</b><small>${esc(it.reps)}</small></span>
        ${ICON.next}
      </button>`).join('')}</div>
    </section>`).join('')}`;

  const rerender = () => { const y = window.scrollY; programView(root, id); window.scrollTo(0, y); };

  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-fav')) {
      const f = S().favorites;
      S().favorites = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      saveNow(); rerender();
    } else if (b.hasAttribute('data-week')) {
      weekOf[id] = (wi + 1) % p.weeks.length; rerender();
    } else if (b.hasAttribute('data-addcal')) {
      inCal ? removeFromCalendar(p, rerender) : addToCalendar(p, rerender);
    } else if (b.dataset.start != null) {
      const d = week.days[Number(b.dataset.start)];
      const s = startSessionFromItems(`${p.name} · ${d.title}`, itemsOf(p, d, uid), today(), matchPlan(p, wi, Number(b.dataset.start))?.id ?? null);
      location.hash = `#/session/${s.id}`;
    } else if (b.dataset.daycal != null) {
      planDay(p, wi, Number(b.dataset.daycal), rerender);
    } else if (b.dataset.ex) {
      const [di, i] = b.dataset.ex.split(':').map(Number);
      exerciseSheet(week.days[di].items[i]);
    }
  };
}

const matchPlan = (p, wi, di) => planned(p.id).find((w) => w.programRef?.wi === wi && w.programRef?.di === di);

const dayChips = (sel) => `<div class="days">${WEEK_ORDER.map((d) => `<button class="day ${sel.includes(d) ? 'on' : ''}" data-d="${d}" aria-pressed="${sel.includes(d)}">${DAY_SHORT[d]}</button>`).join('')}</div>`;

function wireChips(sheet, sel) {
  sheet.querySelector('.days').addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const d = Number(b.dataset.d);
    const i = sel.indexOf(d);
    i === -1 ? sel.push(d) : sel.splice(i, 1);
    b.classList.toggle('on', i === -1);
    b.setAttribute('aria-pressed', i === -1);
  });
}

function makeWorkout(p, wi, di, days, anchor) {
  const week = p.weeks[wi];
  const d = week.days[di];
  return {
    id: uid(),
    name: [p.name, p.weeks.length > 1 ? week.label : '', d.title].filter(Boolean).join(' · '),
    days,
    exercises: itemsOf(p, d, uid),
    programId: p.id,
    programRef: { wi, di },
    cycle: p.weeks.length > 1 ? { start: anchor.start, len: p.weeks.length, idx: (wi + anchor.offset) % p.weeks.length } : null,
  };
}

/** Whole program into the calendar. Fixed weekdays come from the program; mobility workouts ask. */
function addToCalendar(p, done) {
  const fixed = p.weeks[0].days.every((d) => d.wd != null);
  const sel = fixed ? [] : [1, 3, 5];
  openSheet(
    `<div class="sheet-head"><h2>${esc(p.name)} einplanen</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     ${fixed
       ? `<p class="muted">Die Einheiten kommen fest auf ${[...new Set(p.weeks[0].days.map((d) => DAY_SHORT[d.wd]))].join(', ')}.</p>`
       : `<div class="field"><span>An welchen Tagen?</span>${dayChips(sel)}</div>`}
     ${p.weeks.length > 1 ? `<div class="field"><span>Diese Woche ist</span>
       <div class="seg"><label><input type="radio" name="wk" value="0" checked><span>${esc(p.weeks[0].label)}</span></label><label><input type="radio" name="wk" value="1"><span>${esc(p.weeks[1].label)}</span></label></div>
       <small class="muted">Danach wechseln die Wochen automatisch.</small></div>` : ''}
     <button class="btn primary full" data-save>Zum Kalender hinzufügen</button>`,
    (sheet, close) => {
      if (!fixed) wireChips(sheet, sel);
      sheet.querySelector('[data-save]').addEventListener('click', () => {
        if (!fixed && !sel.length) { toast('Bitte mindestens einen Tag wählen'); return; }
        const thisWeek = Number(sheet.querySelector('[name="wk"]:checked')?.value || 0);
        // offset so that the current week maps to the chosen week label
        const anchor = { start: ymd(mondayOf(new Date())), offset: (p.weeks.length - thisWeek) % p.weeks.length };
        S().programAnchors = { ...(S().programAnchors || {}), [p.id]: anchor };
        p.weeks.forEach((w, wi) => w.days.forEach((d, di) => {
          S().workouts.push(makeWorkout(p, wi, di, fixed ? [d.wd] : [...sel], anchor));
        }));
        saveNow();
        close();
        toast(`${p.name} ist im Kalender`);
        done();
      });
    }
  );
}

function removeFromCalendar(p, done) {
  if (!confirm(`${p.name} aus dem Kalender entfernen? Bereits gemachte Trainings bleiben im Verlauf.`)) return;
  S().workouts = S().workouts.filter((w) => w.programId !== p.id);
  saveNow();
  toast('Aus dem Kalender entfernt');
  done();
}

/** One day: start now or plan it on chosen weekdays. */
function planDay(p, wi, di, done) {
  const d = p.weeks[wi].days[di];
  const existing = matchPlan(p, wi, di);
  const sel = existing ? [...existing.days] : d.wd != null ? [d.wd] : [];
  openSheet(
    `<div class="sheet-head"><h2>${esc(dayLabel(d))}</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     <div class="field"><span>Wöchentlich einplanen${p.weeks.length > 1 ? ` (nur in ${esc(p.weeks[wi].label)})` : ''}</span>${dayChips(sel)}</div>
     <button class="btn primary full" data-save>${existing ? 'Tage übernehmen' : 'Einplanen'}</button>
     ${existing ? '<button class="btn danger-ghost full" data-del>Aus dem Kalender nehmen</button>' : ''}`,
    (sheet, close) => {
      wireChips(sheet, sel);
      sheet.querySelector('[data-save]').addEventListener('click', () => {
        if (!sel.length) { toast('Bitte mindestens einen Tag wählen'); return; }
        if (existing) existing.days = [...sel];
        else {
          const anchor = S().programAnchors?.[p.id] || { start: ymd(mondayOf(new Date())), offset: 0 };
          S().workouts.push(makeWorkout(p, wi, di, [...sel], anchor));
        }
        saveNow(); close(); toast('Eingeplant'); done();
      });
      sheet.querySelector('[data-del]')?.addEventListener('click', () => {
        S().workouts = S().workouts.filter((w) => w !== existing);
        saveNow(); close(); done();
      });
    }
  );
}

function exerciseSheet(it) {
  const ex = getEx(it.id);
  const hist = historyFor(it.id).slice(0, 3);
  openSheet(
    `<div class="sheet-head"><h2>${esc(it.name)}</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
     ${media(ex, 'md')}
     <p><b>${it.sets} ${it.sets === 1 ? 'Satz' : 'Sätze'}</b> · ${esc(it.reps)}${it.ss ? ' · Supersatz mit der nächsten Übung' : ''}</p>
     ${ex.instructions.length ? `<ol class="steps-list">${ex.instructions.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : '<p class="muted small">Für diese Übung gibt es noch keine Beschreibung. Du kannst im Training ein eigenes Demo-Video hinterlegen.</p>'}
     ${hist.length ? `<h3 class="label">Zuletzt</h3>${hist.map((h) => `<div class="hist-row"><span>${fmtDate(h.session.date)}</span><span>${esc(setsSummary(h.entry))}</span></div>`).join('')}` : ''}
     <a class="btn ghost full" href="#/history/ex/${encodeURIComponent(it.id)}">Ganzer Verlauf</a>`,
    (sheet) => hydrateMedia(sheet)
  );
}

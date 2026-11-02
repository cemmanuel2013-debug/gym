import { sessionsSorted, sessionHasWork, historyFor, doneSets, num, fmtDate, fmtNum, fileUrl, parseYmd } from '../store.js';
import { getEx } from '../exercises.js';
import { esc } from '../ui.js';
import { ICON, thumb, setsSummary, metricOf, chart, media, hydrateMedia } from '../components.js';

let tab = 'sessions';
const fmtMonth = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function historyView(root) {
  const sessions = sessionsSorted().filter((s) => sessionHasWork(s) || s.finishedAt);
  let body = '';

  if (tab === 'sessions') {
    let month = '';
    body = sessions.map((s) => {
      const m = fmtMonth.format(parseYmd(s.date));
      const head = m !== month ? `<h3 class="label">${m}</h3>` : '';
      month = m;
      const sets = s.entries.reduce((n, e) => n + doneSets(e).length, 0);
      const vol = s.entries.reduce((n, e) => n + doneSets(e).reduce((a, x) => a + (num(x.w) || 0) * (num(x.r) || 0), 0), 0);
      return `${head}<a class="card row-link" href="#/session/${s.id}">
        <span><b>${esc(s.name)}</b><small>${fmtDate(s.date)} · ${sets} Sätze${vol ? ` · ${fmtNum(Math.round(vol))} kg bewegt` : ''}</small></span>${ICON.next}</a>`;
    }).join('') || '<p class="muted">Noch keine Trainings gespeichert. Starte eins unter „Heute“.</p>';
  } else {
    const seen = new Map();
    for (const s of sessions) for (const e of s.entries) if (doneSets(e).length && !seen.has(e.exId)) seen.set(e.exId, { s, e });
    body = [...seen.entries()].map(([exId, { s, e }]) => {
      const ex = getEx(exId);
      return `<a class="card ex-row" href="#/history/ex/${encodeURIComponent(exId)}">${thumb(ex)}
        <span class="ex-main"><b>${esc(e.name)}</b><small>Zuletzt ${fmtDate(s.date)}: ${esc(setsSummary(e))}</small></span>${ICON.next}</a>`;
    }).join('') || '<p class="muted">Sobald du Sätze abhakst, erscheinen die Übungen hier.</p>';
  }

  root.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Rückblick</p><h1>Verlauf</h1></div></header>
    <div class="seg tabs">
      <label><input type="radio" name="tab" value="sessions" ${tab === 'sessions' ? 'checked' : ''}><span>Einheiten</span></label>
      <label><input type="radio" name="tab" value="exercises" ${tab === 'exercises' ? 'checked' : ''}><span>Übungen</span></label>
    </div>
    <section class="block">${body}</section>`;

  root.onchange = (e) => {
    if (e.target.name === 'tab') { tab = e.target.value; historyView(root); }
  };
}

export function exerciseHistory(root, exId) {
  const ex = getEx(exId);
  const hist = historyFor(exId);
  const name = hist[0]?.entry.name || ex.name;
  const points = [...hist].reverse().map((h) => ({ h, m: metricOf(h.entry) })).filter((p) => p.m)
    .map(({ h, m }) => ({ v: m.v, unit: m.unit, metricLabel: m.label, label: fmtDate(h.session.date) }));

  root.innerHTML = `
    <header class="top-bar">
      <a class="icon-btn" href="#/history" aria-label="Zurück">${ICON.back}</a>
      <b>Übungsverlauf</b>
      <span class="icon-btn" aria-hidden="true"></span>
    </header>
    ${media(ex, 'md')}
    <h1 class="ex-title">${esc(name)}</h1>
    <section class="block">${chart(points)}</section>
    <section class="block">
      <h3 class="label">Alle Einheiten</h3>
      ${hist.map((h) => `<div class="card hist-card">
        <div class="hist-top"><b>${fmtDate(h.session.date)}</b><a class="link" href="#/session/${h.session.id}">${esc(h.session.name)}</a></div>
        <p>${esc(setsSummary(h.entry))}</p>
        ${h.entry.note ? `<p class="muted small">${esc(h.entry.note)}</p>` : ''}
        ${h.entry.video ? `<div class="video-slot" data-video="${esc(h.entry.video)}"></div>` : ''}
      </div>`).join('') || '<p class="muted">Noch nichts geloggt.</p>'}
    </section>`;

  hydrateMedia(root);
  root.querySelectorAll('.video-slot').forEach(async (slot) => {
    const url = await fileUrl(slot.dataset.video);
    if (url) slot.innerHTML = `<video src="${url}" controls playsinline preload="metadata"></video>`;
  });
}

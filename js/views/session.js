import { S, saveNow, save, getSession, getWorkout, deleteSession, makeEntry, historyFor, doneSets, fmtDate, fmtDateFull, fmtSec, num, uid, putFile, delFile, fileUrl } from '../store.js';
import { getEx } from '../exercises.js';
import { esc, toast, keepAwake, unlockAudio } from '../ui.js';
import { ICON, media, hydrateMedia, thumb, setsSummary, targetText, metricOf, chart, openPicker } from '../components.js';
import { startRest, stopRest, clock, useClock, startClock, pauseClock, resetClock, adjustClock, clockElapsed, renderClock } from '../timers.js';

// ---------- one training session: list of exercises ----------
export function sessionView(root, id) {
  const s = getSession(id);
  if (!s) { location.hash = '#/'; return; }
  keepAwake(!s.finishedAt);
  const total = s.entries.reduce((n, e) => n + doneSets(e).length, 0);

  root.innerHTML = `
    <header class="top-bar">
      <a class="icon-btn" href="#/" aria-label="Zurück">${ICON.back}</a>
      <b>${s.finishedAt ? 'Training' : 'Training läuft'}</b>
      <span class="icon-btn" aria-hidden="true"></span>
    </header>
    <section class="session-head">
      <p class="eyebrow">${esc(fmtDateFull(s.date))}</p>
      <h1>${esc(s.name)}</h1>
      <p class="muted">${total} Sätze erledigt${s.finishedAt ? ' · abgeschlossen' : ''}</p>
    </section>
    <div class="ex-list">
      ${s.entries.map((e, i) => {
        const ex = getEx(e.exId);
        const d = doneSets(e).length;
        const complete = d >= e.sets.length && d > 0;
        return `<a class="card ex-row ${complete ? 'complete' : ''}" href="#/session/${s.id}/${i}">
          ${thumb(ex)}
          <span class="ex-main"><b>${esc(e.name)}</b><small>${targetText(e)}${e.video ? ' · Video' : ''}${e.note ? ' · Notiz' : ''}</small></span>
          <span class="ex-count ${complete ? 'ok' : ''}">${complete ? ICON.check : `${d}/${e.sets.length}`}</span>
        </a>`;
      }).join('') || '<p class="muted">Noch keine Übungen in diesem Training.</p>'}
    </div>
    <button class="btn ghost full" data-add>${ICON.plus} Übung hinzufügen</button>
    ${s.finishedAt
      ? '<button class="btn ghost full" data-reopen>Wieder öffnen</button>'
      : '<button class="btn primary full" data-finish>Training beenden</button>'}
    <button class="btn danger-ghost full" data-del>Training löschen</button>`;

  root.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-add')) {
      openPicker((exId) => {
        const ex = getEx(exId);
        s.entries.push(makeEntry({ id: uid(), exId, name: ex.name, type: ex.type, sets: 3, reps: ex.type === 'time' ? '' : '8-12', seconds: ex.type === 'time' ? 45 : 0, rest: 90 }));
        saveNow();
        location.hash = `#/session/${s.id}/${s.entries.length - 1}`;
      });
    } else if (b.hasAttribute('data-finish')) {
      s.finishedAt = Date.now();
      saveNow();
      keepAwake(false);
      stopRest();
      pauseClock();
      toast(`Stark! ${total} Sätze gespeichert.`);
      location.hash = '#/';
    } else if (b.hasAttribute('data-reopen')) {
      s.finishedAt = null;
      saveNow();
      sessionView(root, id);
    } else if (b.hasAttribute('data-del')) {
      if (!confirm('Dieses Training mit allen Sätzen, Notizen und Videos löschen?')) return;
      await deleteSession(s.id);
      location.hash = '#/';
    }
  };
}

// ---------- one exercise inside a session ----------
export function exerciseView(root, id, idxStr) {
  const s = getSession(id);
  const idx = Number(idxStr);
  const e = s?.entries[idx];
  if (!e) { location.hash = s ? `#/session/${id}` : '#/'; return; }
  const ex = getEx(e.exId);
  const hist = historyFor(e.exId, s.id);
  const last = hist[0];
  const lastVideo = hist.find((h) => h.entry.video);
  const isTime = e.type === 'time';
  const timerOn = e.timer ?? isTime;
  const restOn = () => e.restOn !== false && e.rest > 0;
  if (timerOn) {
    useClock(`${s.id}:${e.id}`, e.seconds || 45);
    clock.onDone = (secs) => logNextSet(isTime ? { t: secs } : {});
  }
  // Toggles changed during training are written back to the plan, so they stick next time.
  const syncPlan = (patch) => {
    const item = getWorkout(s.workoutId)?.exercises.find((x) => x.id === e.itemId);
    if (item) Object.assign(item, patch);
  };

  const setRows = () => e.sets.map((x, i) => `
    <div class="set-row ${x.done ? 'done' : ''}" data-i="${i}">
      <span class="set-n">${i + 1}</span>
      <input class="input" data-k="w" inputmode="decimal" placeholder="–" value="${esc(String(x.w ?? '').replace('.', ','))}" aria-label="Gewicht Satz ${i + 1}">
      ${isTime
        ? `<input class="input" data-k="t" inputmode="numeric" placeholder="s" value="${esc(x.t)}" aria-label="Sekunden Satz ${i + 1}">`
        : `<input class="input" data-k="r" inputmode="numeric" placeholder="–" value="${esc(x.r)}" aria-label="Wiederholungen Satz ${i + 1}">`}
      <button class="check" data-toggle="${i}" aria-label="Satz ${i + 1} erledigt" aria-pressed="${x.done}">${ICON.check}</button>
    </div>`).join('');

  const points = [...hist].reverse().map((h) => ({ h, m: metricOf(h.entry) })).filter((p) => p.m)
    .slice(-12).map(({ h, m }) => ({ v: m.v, unit: m.unit, metricLabel: m.label, label: fmtDate(h.session.date) }));

  root.innerHTML = `
    <header class="top-bar">
      <a class="icon-btn" href="#/session/${s.id}" aria-label="Zurück zum Training">${ICON.back}</a>
      <b>${idx + 1} / ${s.entries.length}</b>
      ${idx < s.entries.length - 1
        ? `<a class="icon-btn" href="#/session/${s.id}/${idx + 1}" aria-label="Nächste Übung">${ICON.next}</a>`
        : '<span class="icon-btn" aria-hidden="true"></span>'}
    </header>

    ${media(ex, 'lg')}
    <h1 class="ex-title">${esc(e.name)}</h1>
    <p class="muted">Ziel: ${targetText(e)}${restOn() ? ` · Pause ${e.rest} s` : ''}</p>
    <div class="toggles card">
      <label class="switch"><input type="checkbox" data-opt="timer" ${timerOn ? 'checked' : ''}><span></span>Timer</label>
      <label class="switch"><input type="checkbox" data-opt="restOn" ${restOn() ? 'checked' : ''}><span></span>Pausentimer</label>
    </div>
    ${ex.instructions.length ? `<details class="howto"><summary>Ausführung</summary><ol>${ex.instructions.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></details>` : ''}

    ${timerOn ? `
    <section class="card clock" id="clock" data-key="${esc(clock.key)}">
      <div class="clock-ring">
        <svg viewBox="0 0 120 120"><circle class="clock-ring-bg" cx="60" cy="60" r="54"/><circle class="clock-ring-fg" cx="60" cy="60" r="54"/></svg>
        <div class="clock-center"><span class="clock-time">0:00</span><small class="clock-total"></small></div>
      </div>
      <div class="clock-btns">
        <button class="btn ghost" data-act="clock-minus">−5</button>
        <button class="btn primary big" data-act="clock-toggle">Start</button>
        <button class="btn ghost" data-act="clock-plus">+5</button>
      </div>
      <div class="clock-btns">
        <button class="btn ghost small" data-act="clock-reset">Zurücksetzen</button>
        <button class="btn ghost small" data-act="clock-log">Stopp und eintragen</button>
      </div>
    </section>` : ''}

    <section class="block">
      <div class="block-head"><h3 class="label">Sätze</h3>
        <div class="stepper"><button class="icon-btn sm" data-act="set-minus" aria-label="Satz entfernen">−</button><span>${e.sets.length}</span><button class="icon-btn sm" data-act="set-plus" aria-label="Satz hinzufügen">+</button></div>
      </div>
      <div class="set-head"><span>Satz</span><span>kg</span><span>${isTime ? 'Sek.' : 'Wdh.'}</span><span></span></div>
      <div class="sets">${setRows()}</div>
      ${last ? `<p class="last-time"><b>Letztes Mal</b> (${fmtDate(last.session.date)}): ${esc(setsSummary(last.entry))}</p>` : ''}
    </section>

    <section class="block">
      <h3 class="label">Notiz</h3>
      <textarea class="input" data-note rows="3" placeholder="Wie lief es? Gefühl, Schmerz, Technik…">${esc(e.note)}</textarea>
      ${last?.entry.note ? `<p class="last-time"><b>Notiz vom ${fmtDate(last.session.date)}:</b> ${esc(last.entry.note)}</p>` : ''}
    </section>

    <section class="block">
      <h3 class="label">Ausführung filmen</h3>
      <p class="muted small">Film den letzten Satz. Beim nächsten Training siehst du das Video hier zum Vergleich.</p>
      <div class="video-slot" data-video="${esc(e.video || '')}"></div>
      <div class="grid2">
        <label class="btn primary">${ICON.cam} Filmen<input type="file" accept="video/*" capture="environment" data-upload hidden></label>
        <label class="btn ghost">Aus Mediathek<input type="file" accept="video/*" data-upload hidden></label>
      </div>
      ${e.video ? '<button class="btn danger-ghost full" data-act="video-del">Dieses Video löschen</button>' : ''}
      ${lastVideo ? `<h4 class="sub">Letzte Aufnahme · ${fmtDate(lastVideo.session.date)}</h4><div class="video-slot" data-video="${esc(lastVideo.entry.video)}"></div>` : ''}
    </section>

    <section class="block">
      <div class="block-head"><h3 class="label">Verlauf</h3><a class="link" href="#/history/ex/${encodeURIComponent(e.exId)}">Alles ansehen</a></div>
      ${chart(points)}
      ${hist.slice(0, 5).map((h) => `<div class="hist-row"><span>${fmtDate(h.session.date)}</span><span>${esc(setsSummary(h.entry))}</span></div>`).join('') || '<p class="muted small">Noch keine früheren Einheiten.</p>'}
    </section>

    <section class="block">
      <h3 class="label">Demo-Video</h3>
      <p class="muted small">${ex.demo ? 'Oben läuft dein eigenes Demo-Video.' : 'Eigenes Video statt der Animation oben verwenden (gilt für diese Übung überall).'}</p>
      <div class="grid2">
        <label class="btn ghost">${ex.demo ? 'Ersetzen' : 'Hinterlegen'}<input type="file" accept="video/*" data-demo-upload hidden></label>
        ${ex.demo ? '<button class="btn danger-ghost" data-act="demo-del">Entfernen</button>' : ''}
      </div>
    </section>

    ${idx < s.entries.length - 1
      ? `<a class="btn primary full" href="#/session/${s.id}/${idx + 1}">Nächste Übung: ${esc(s.entries[idx + 1].name)}</a>`
      : `<a class="btn primary full" href="#/session/${s.id}">Zur Übersicht</a>`}
  `;

  hydrateMedia(root);
  root.querySelectorAll('.video-slot').forEach(async (slot) => {
    const url = await fileUrl(slot.dataset.video);
    if (url) slot.innerHTML = `<video src="${url}" controls playsinline preload="metadata"></video>`;
  });
  if (timerOn) renderClock();

  const rerender = () => { const y = window.scrollY; exerciseView(root, id, idxStr); window.scrollTo(0, y); };

  function logNextSet(values) {
    const i = e.sets.findIndex((x) => !x.done);
    if (i === -1) e.sets.push({ w: e.sets.at(-1)?.w ?? '', r: '', t: '', done: false });
    const target = e.sets[i === -1 ? e.sets.length - 1 : i];
    Object.assign(target, values, { done: true });
    saveNow();
    if (location.hash === `#/session/${id}/${idx}`) rerender();
    if (restOn() && e.sets.some((x) => !x.done)) startRest(e.rest);
  }

  root.oninput = (ev) => {
    const t = ev.target;
    if (t.dataset.k) {
      const i = Number(t.closest('.set-row').dataset.i);
      e.sets[i][t.dataset.k] = t.dataset.k === 'w' ? t.value.replace(',', '.') : t.value;
      save();
    } else if (t.hasAttribute('data-note')) {
      e.note = t.value;
      save();
    }
  };

  root.onchange = async (ev) => {
    const t = ev.target;
    if (t.dataset.opt) {
      const key = t.dataset.opt;
      e[key] = t.checked;
      if (key === 'restOn' && t.checked && !e.rest) e.rest = 90;
      if (key === 'restOn' && !t.checked) stopRest();
      if (key === 'timer' && !t.checked && clock.key === `${s.id}:${e.id}`) pauseClock();
      if (key === 'timer' && t.checked && !e.seconds) e.seconds = 45;
      syncPlan({ [key]: e[key], rest: e.rest, seconds: e.seconds });
      saveNow();
      rerender();
      return;
    }
    if (t.hasAttribute('data-upload') && t.files[0]) {
      const f = t.files[0];
      if (f.size > 300 * 1024 * 1024) { toast('Video ist sehr groß (über 300 MB). Bitte kürzer filmen.'); return; }
      toast('Video wird gespeichert…');
      const key = `v_${e.id}`;
      try {
        await putFile(key, f);
        e.video = key;
        saveNow();
        toast('Video gespeichert');
        rerender();
      } catch {
        toast('Speichern fehlgeschlagen. Ist der Speicher voll?');
      }
    }
    if (t.hasAttribute('data-demo-upload') && t.files[0]) {
      const key = `demo_${e.exId}`;
      try {
        await putFile(key, t.files[0]);
        S().demos[e.exId] = key;
        saveNow();
        rerender();
      } catch {
        toast('Speichern fehlgeschlagen');
      }
    }
  };

  root.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    unlockAudio();
    if (b.dataset.toggle != null) {
      const i = Number(b.dataset.toggle);
      const x = e.sets[i];
      x.done = !x.done;
      if (x.done && isTime && !x.t) x.t = e.seconds;
      saveNow();
      const row = b.closest('.set-row');
      row.classList.toggle('done', x.done);
      b.setAttribute('aria-pressed', x.done);
      if (x.done && restOn() && e.sets.some((y) => !y.done)) startRest(e.rest);
      return;
    }
    switch (b.dataset.act) {
      case 'set-plus': {
        const p = e.sets.at(-1) || {};
        e.sets.push({ w: p.w ?? '', r: p.r ?? '', t: p.t ?? (e.seconds || ''), done: false });
        saveNow(); rerender(); break;
      }
      case 'set-minus':
        if (e.sets.length > 1) { e.sets.pop(); saveNow(); rerender(); }
        break;
      case 'clock-toggle': clock.running ? pauseClock() : startClock(); break;
      case 'clock-minus':
      case 'clock-plus':
        adjustClock(b.dataset.act === 'clock-plus' ? 5 : -5);
        e.seconds = clock.total;
        syncPlan({ seconds: e.seconds });
        save();
        break;
      case 'clock-reset': resetClock(); break;
      case 'clock-log': {
        const secs = clockElapsed();
        resetClock();
        if (secs > 0) logNextSet(isTime ? { t: secs } : {});
        break;
      }
      case 'video-del':
        if (!confirm('Video löschen?')) return;
        await delFile(e.video).catch(() => {});
        e.video = null;
        saveNow(); rerender(); break;
      case 'demo-del':
        await delFile(S().demos[e.exId]).catch(() => {});
        delete S().demos[e.exId];
        saveNow(); rerender(); break;
    }
  };
}

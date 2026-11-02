import { S, replaceState, resetAll, today } from '../store.js';
import { esc, toast, download } from '../ui.js';
import { ICON } from '../components.js';

export async function settings(root) {
  const est = await navigator.storage?.estimate?.().catch(() => null);
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  const mb = (b) => `${Math.round((b || 0) / 1024 / 1024)} MB`;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  root.innerHTML = `
    <header class="top-bar">
      <a class="icon-btn" href="#/" aria-label="Zurück">${ICON.back}</a>
      <b>Einstellungen</b>
      <span class="icon-btn" aria-hidden="true"></span>
    </header>

    ${standalone ? '' : `<section class="card">
      <h3>Auf den Homescreen legen</h3>
      <p class="muted">In Safari unten auf das Teilen-Symbol tippen, dann „Zum Home-Bildschirm“. Danach startet die App wie eine normale App, im Vollbild und ohne Browserleiste.</p>
    </section>`}

    <section class="card">
      <h3>Speicher</h3>
      <p class="muted">Alle Daten liegen nur auf diesem Gerät. Belegt: ${est ? `${mb(est.usage)} von etwa ${mb(est.quota)}` : 'unbekannt'}.
      ${persisted ? 'Der Speicher ist vor automatischem Löschen geschützt.' : 'Lege die App auf den Homescreen, damit iOS die Daten nicht nach längerer Pause aufräumt.'}</p>
    </section>

    <section class="card">
      <h3>Sicherung</h3>
      <p class="muted">Exportiert Plan, Trainings, Notizen und Chat als Datei. Videos sind nicht enthalten.</p>
      <button class="btn primary full" data-export>Sicherung exportieren</button>
      <label class="btn ghost full">Sicherung importieren<input type="file" accept="application/json,.json" data-import hidden></label>
    </section>

    <section class="card">
      <h3>Quellen</h3>
      <p class="muted small">Übungsbilder und -texte der Datenbank: free-exercise-db von yuhonas (The Unlicense). Kein offizielles ATG-Produkt.</p>
    </section>

    <button class="btn danger-ghost full" data-reset>Alles zurücksetzen</button>`;

  root.onclick = (e) => {
    if (e.target.closest('[data-export]')) {
      download(`gym-sicherung-${today()}.json`, new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' }));
    }
    if (e.target.closest('[data-reset]')) {
      if (!confirm('Wirklich alles löschen? Plan, Trainings, Notizen und Chat sind danach weg.')) return;
      resetAll();
      toast('Zurückgesetzt');
      location.hash = '#/';
    }
  };
  root.onchange = async (e) => {
    if (!e.target.hasAttribute('data-import') || !e.target.files[0]) return;
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (data.version !== 1 || !Array.isArray(data.workouts) || !Array.isArray(data.sessions)) throw new Error();
      if (!confirm('Aktuelle Daten durch die Sicherung ersetzen?')) return;
      data.demos ||= {}; data.chat ||= []; data.customExercises ||= [];
      replaceState(data);
      toast('Sicherung geladen');
      location.hash = '#/';
    } catch {
      toast('Die Datei ist keine gültige Sicherung');
    }
  };
}

import { S, uid, saveNow, ymd, today, fmtDateFull } from '../store.js';
import { esc, openSheet, toast } from '../ui.js';
import { ICON } from '../components.js';

const fmtTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

export function chat(root) {
  const msgs = S().chat;
  let day = '';
  const t = today();
  const items = msgs.map((m) => {
    const d = ymd(new Date(m.ts));
    const sep = d !== day ? `<div class="chat-day">${d === t ? 'Heute' : esc(fmtDateFull(d))}</div>` : '';
    day = d;
    return `${sep}<button class="bubble" data-id="${m.id}"><span>${esc(m.text)}</span><time>${fmtTime.format(new Date(m.ts))}</time></button>`;
  }).join('');

  root.innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Trainingstagebuch</p><h1>Chat</h1></div></header>
    <div class="chat">
      ${items || '<p class="muted center">Schreib dir hier Gedanken, Ziele oder wie du dich fühlst. Nur du siehst das.</p>'}
    </div>
    <form class="composer">
      <textarea class="input" rows="1" placeholder="Nachricht an dich…" enterkeyhint="send"></textarea>
      <button class="icon-btn primary" type="submit" aria-label="Senden">${ICON.send}</button>
    </form>`;

  const ta = root.querySelector('textarea');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; };
  ta.addEventListener('input', grow);
  const send = () => {
    const text = ta.value.trim();
    if (!text) return;
    msgs.push({ id: uid(), ts: Date.now(), text });
    saveNow();
    chat(root);
    root.querySelector('.composer textarea').focus();
  };
  root.querySelector('.composer').addEventListener('submit', (e) => { e.preventDefault(); send(); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  root.onclick = (e) => {
    const b = e.target.closest('.bubble');
    if (!b) return;
    const m = msgs.find((x) => x.id === b.dataset.id);
    openSheet(
      `<div class="sheet-head"><h2>Nachricht</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
       <button class="btn ghost full" data-copy>Kopieren</button>
       <button class="btn danger-ghost full" data-del>Löschen</button>`,
      (sheet, close) => {
        sheet.querySelector('[data-copy]').addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(m.text); toast('Kopiert'); } catch { toast('Kopieren nicht möglich'); }
          close();
        });
        sheet.querySelector('[data-del]').addEventListener('click', () => {
          S().chat = S().chat.filter((x) => x.id !== m.id);
          saveNow(); close(); chat(root);
        });
      }
    );
  };

  requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
}

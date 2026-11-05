// Training tab: category picker, program carousel, calendar and own workouts, then today's blocks.
import { S, saveNow } from '../store.js';
import { imgUrl } from '../exercises.js';
import { PROGRAMS, CATEGORIES } from '../programs.js';
import { esc } from '../ui.js';
import { ICON } from '../components.js';
import { todayHtml, todayClick } from './home.js';

let searchOpen = false;
let query = '';

export function programCard(p) {
  const fav = S().favorites.includes(p.id);
  const art = imgUrl(p.art);
  return `<a class="pcard tone-${p.tone}" href="#/program/${p.id}">
    ${art ? `<img src="${art}" alt="" loading="lazy">` : ''}
    ${fav ? `<span class="pcard-fav" aria-label="Favorit">${ICON.heart}</span>` : ''}
    <span class="pcard-title">${esc(p.name)}</span>
  </a>`;
}

function matches(p, q) {
  if (!q) return true;
  const hay = [p.name, ...p.weeks.flatMap((w) => w.days.flatMap((d) => d.items.map((i) => i.name)))].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
}

export function train(root) {
  const st = S();
  const cat = st.settings.trainCat || 'fav';
  let cards;
  if (cat === 'own') {
    const own = st.workouts.filter((w) => !w.programId && (!query || w.name.toLowerCase().includes(query.toLowerCase())));
    cards = own.map((w) => `<a class="pcard tone-${w.name.length % 5}" href="#/plan/${w.id}"><span class="pcard-title small">${esc(w.name)}</span></a>`).join('')
      + '<a class="pcard pcard-new" href="#/plan"><span class="pcard-title small">+ Workout anlegen</span></a>';
  } else {
    const list = PROGRAMS.filter((p) => (cat === 'all' || (cat === 'fav' ? st.favorites.includes(p.id) : p.cat.includes(cat))) && matches(p, query));
    cards = list.map(programCard).join('') || '<p class="muted pad">Keine Programme in dieser Kategorie. Tippe in einem Programm auf das Herz, um es zu den Favoriten zu legen.</p>';
  }

  root.innerHTML = `
    <p class="brand">Fitbyclin <span>Fitness App</span></p>
    <div class="train-top">
      <label class="cat-select"><span>Kategorie:</span>
        <select data-cat aria-label="Kategorie">${CATEGORIES.map(([k, v]) => `<option value="${k}" ${k === cat ? 'selected' : ''}>${v}</option>`).join('')}</select>
        ${ICON.chevDown}
      </label>
      <button class="icon-btn boxed ${searchOpen ? 'on' : ''}" data-search aria-label="Suchen">${ICON.search}</button>
    </div>
    ${searchOpen ? `<input class="input" type="search" data-q placeholder="Programm oder Übung suchen" value="${esc(query)}" autocomplete="off">` : ''}
    <div class="carousel">${cards}</div>
    <a class="card row-link link-row" href="#/calendar">${ICON.cal}<b>Mein Kalender</b>${ICON.next}</a>
    <a class="card row-link link-row" href="#/plan">${ICON.list}<b>Meine Workouts</b>${ICON.next}</a>
    ${todayHtml()}`;

  const rerender = () => { const y = window.scrollY; train(root); window.scrollTo(0, y); };
  root.onchange = (e) => {
    if (e.target.matches('[data-cat]')) { st.settings.trainCat = e.target.value; saveNow(); rerender(); }
  };
  root.oninput = (e) => {
    if (!e.target.matches('[data-q]')) return;
    query = e.target.value;
    const pos = e.target.selectionStart;
    rerender();
    const q = root.querySelector('[data-q]');
    q.focus();
    q.setSelectionRange(pos, pos);
  };
  root.onclick = (e) => {
    if (e.target.closest('[data-search]')) {
      searchOpen = !searchOpen;
      if (!searchOpen) query = '';
      rerender();
      if (searchOpen) root.querySelector('[data-q]')?.focus();
      return;
    }
    todayClick(e, rerender);
  };
}

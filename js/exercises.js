import { S } from './store.js';
import { PEX } from './programs.js';

// Images come from free-exercise-db (The Unlicense), pinned to one commit so they never change.
const IMG_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/';

export const MUSCLES_DE = {
  abdominals: 'Bauch', abductors: 'Abduktoren', adductors: 'Adduktoren', biceps: 'Bizeps',
  calves: 'Waden', chest: 'Brust', forearms: 'Unterarme', glutes: 'Gesäß', hamstrings: 'Beinbeuger',
  lats: 'Latissimus', 'lower back': 'Unterer Rücken', 'middle back': 'Mittlerer Rücken', neck: 'Nacken',
  quadriceps: 'Quadrizeps', shoulders: 'Schultern', traps: 'Trapez', triceps: 'Trizeps',
};
export const EQUIP_DE = {
  'body only': 'Körpergewicht', dumbbell: 'Kurzhantel', barbell: 'Langhantel', kettlebells: 'Kettlebell',
  cable: 'Kabelzug', machine: 'Maschine', bands: 'Bänder', 'medicine ball': 'Medizinball',
  'exercise ball': 'Gymnastikball', 'e-z curl bar': 'SZ-Stange', 'foam roll': 'Faszienrolle', other: 'Sonstiges',
};

// German search words mapped to the English names in the database.
const DE_SEARCH = {
  kniebeuge: 'squat', squat: 'squat', kreuzheben: 'deadlift', bankdrücken: 'bench press', bankdruecken: 'bench press',
  liegestütz: 'push', liegestuetz: 'push', klimmzug: 'pull', rudern: 'row', ausfallschritt: 'lunge',
  wade: 'calf', waden: 'calf', bizeps: 'curl', trizeps: 'tricep', schulter: 'shoulder', brust: 'chest',
  bauch: 'crunch', dehnen: 'stretch', dehnung: 'stretch', hüfte: 'hip', huefte: 'hip', rücken: 'back',
  ruecken: 'back', schlitten: 'sled', kurzhantel: 'dumbbell', langhantel: 'barbell', kabel: 'cable',
  seitheben: 'lateral raise', beinpresse: 'leg press', beinstrecker: 'leg extension', beinbeuger: 'leg curl',
  plank: 'plank', unterarmstütz: 'plank', dip: 'dip',
};

// Exercises the database lacks, mostly common in ATG-style training. Texts are short own summaries.
const BUILTIN = [
  { id: 'x_wall_sit', n: 'Wall Sit', type: 'time', m: ['quadriceps'], eq: 'body only',
    i: ['Rücken flach an die Wand, Füße etwa schulterbreit und gut eine Fußlänge vor dem Körper.',
      'An der Wand nach unten rutschen, bis die Knie ungefähr 90 Grad gebeugt sind, oder so tief, wie es schmerzfrei geht.',
      'Position halten und ruhig weiteratmen.'] },
  { id: 'x_tib_raise', n: 'Tibialis Raise', type: 'reps', m: ['calves'], eq: 'body only',
    i: ['Mit dem Rücken an die Wand lehnen, Fersen etwa eine Fußlänge vor der Wand.',
      'Zehenspitzen so weit wie möglich nach oben ziehen, oben kurz halten.',
      'Langsam absenken. Je weiter die Füße von der Wand weg stehen, desto schwerer.'] },
  { id: 'x_atg_split_squat', n: 'ATG Split Squat', type: 'reps', m: ['quadriceps', 'glutes'], eq: 'body only',
    i: ['Langer Ausfallschritt. Vorderer Fuß flach auf dem Boden.',
      'Vorderes Knie weit über die Zehen nach vorn schieben, bis der Oberschenkel auf der Wade liegt. Hinteres Bein bleibt möglichst gestreckt.',
      'Wieder hochdrücken. Zum Erleichtern vorn eine Erhöhung nutzen oder sich mit den Händen abstützen.'] },
  { id: 'x_nordic', n: 'Nordic Curl', type: 'reps', m: ['hamstrings'], eq: 'body only',
    i: ['Knien, Fersen fixieren (Partner, Sprossenwand oder Nordic-Bank).',
      'Körper von Knie bis Kopf gerade halten und langsam nach vorn absenken, die Beinbeuger bremsen.',
      'Mit den Händen abfangen und zurück nach oben drücken. Anfangs mit Band oder kleinerem Bewegungsweg.'] },
  { id: 'x_reverse_nordic', n: 'Reverse Nordic', type: 'reps', m: ['quadriceps'], eq: 'body only',
    i: ['Aufrecht knien, Füße flach am Boden.', 'Hüfte gestreckt lassen und mit geradem Oberkörper nach hinten lehnen.',
      'So weit gehen, wie es kontrolliert geht, dann mit den Oberschenkeln wieder nach vorn ziehen.'] },
  { id: 'x_patrick_step', n: 'Patrick Step', type: 'reps', m: ['quadriceps'], eq: 'body only',
    i: ['Seitlich auf einer niedrigen Stufe oder Schrägbrett stehen.',
      'Das freie Bein gestreckt vor der Stufe nach unten führen, bis die Ferse den Boden antippt. Das Knie des Standbeins wandert dabei über die Zehen.',
      'Langsam wieder aufrichten. Höhe der Stufe nach und nach steigern.'] },
  { id: 'x_jefferson_curl', n: 'Jefferson Curl', type: 'reps', m: ['hamstrings', 'lower back'], eq: 'dumbbell',
    i: ['Auf einer Erhöhung stehen, leichtes Gewicht in den Händen, Beine gestreckt.',
      'Kinn zur Brust und Wirbel für Wirbel nach unten einrollen, Gewicht Richtung Füße.',
      'Ebenso langsam wieder aufrollen. Mit sehr wenig Gewicht anfangen.'] },
  { id: 'x_elephant_walk', n: 'Elephant Walk', type: 'reps', m: ['hamstrings'], eq: 'body only',
    i: ['Im Stand mit gestreckten Beinen nach vorn beugen, Hände auf Boden oder Block.',
      'Abwechselnd ein Knie beugen und das andere Bein durchstrecken, Ferse bleibt unten.'] },
  { id: 'x_couch_stretch', n: 'Couch Stretch', type: 'time', m: ['quadriceps'], eq: 'body only',
    i: ['Hinteres Knie an die Wand oder Sofakante, Schienbein liegt an der Wand nach oben.',
      'Anderer Fuß steht vorn. Becken leicht nach hinten kippen und Gesäß anspannen.', 'Halten, dann Seite wechseln.'] },
  { id: 'x_backward_walk', n: 'Rückwärtsgehen / Schlitten rückwärts', type: 'time', m: ['quadriceps'], eq: 'other',
    i: ['Rückwärts gehen (Laufband, Schlitten oder freie Fläche).', 'Kleine Schritte über den Vorfuß, Knie arbeiten über die Zehen.'] },
  { id: 'x_dead_hang', n: 'Dead Hang', type: 'time', m: ['forearms', 'lats'], eq: 'other',
    i: ['An einer Klimmzugstange hängen, Arme gestreckt.', 'Schultern locker lassen oder leicht aktiv nach unten ziehen.'] },
  { id: 'x_l_sit', n: 'L-Sit', type: 'time', m: ['abdominals'], eq: 'other',
    i: ['Hände auf Barren, Parallettes oder Boden, Arme gestreckt.', 'Körper hochdrücken und die Beine gestreckt nach vorn halten.',
      'Leichter: Knie angezogen oder ein Bein gebeugt.'] },
];

let db = [];
const byId = new Map();

export async function loadExercises() {
  const res = await fetch('data/exercises.json');
  db = await res.json();
  for (const e of db) byId.set(e.id, e);
}

const defaultType = (e) => (e.c === 'stretching' || /plank|hold|hang/i.test(e.n) ? 'time' : 'reps');

export const imgUrl = (dbId, i = 0) => { const r = byId.get(dbId); return r?.img[i] ? IMG_BASE + r.img[i] : null; };

/** Unified view of any exercise: database, built-in, program or own. */
export function getEx(id) {
  const st = S();
  const custom = st.customExercises.find((c) => c.id === id);
  const builtin = BUILTIN.find((b) => b.id === id);
  const raw = byId.get(id);
  const prog = PEX[id];
  let ex;
  if (prog) {
    const base = prog.same ? getEx(prog.same) : null;
    const anim = prog.anim ? byId.get(prog.anim) : null;
    ex = {
      id, name: prog.n, type: base?.type || 'reps', muscles: anim?.m || base?.muscles || [], equipment: anim?.eq || base?.equipment || '',
      instructions: prog.i || base?.instructions || [], images: anim ? anim.img.map((p) => IMG_BASE + p) : [], kind: 'program',
    };
  } else if (custom) ex = { id, name: custom.name, type: custom.type, muscles: [], equipment: '', instructions: custom.instructions || [], images: [], kind: 'custom' };
  else if (builtin) ex = { id, name: builtin.n, type: builtin.type, muscles: builtin.m, equipment: builtin.eq, instructions: builtin.i, images: [], kind: 'builtin' };
  else if (raw) ex = { id, name: raw.n, type: defaultType(raw), muscles: raw.m, equipment: raw.eq, instructions: raw.i, images: raw.img.map((p) => IMG_BASE + p), kind: 'db' };
  else ex = { id, name: id, type: 'reps', muscles: [], equipment: '', instructions: [], images: [], kind: 'missing' };
  ex.demo = st.demos[id] || null;
  return ex;
}

/** Own and built-in exercises first, then database matches. */
export function searchEx(query, muscle, equip) {
  let q = query.trim().toLowerCase();
  for (const [de, en] of Object.entries(DE_SEARCH)) if (q.includes(de)) q = q.replace(de, en);
  const tokens = q.split(/\s+/).filter(Boolean);
  const match = (name, m, eq) =>
    tokens.every((t) => name.toLowerCase().includes(t)) &&
    (!muscle || m.includes(muscle)) && (!equip || eq === equip);
  const own = [
    ...S().customExercises.map((c) => ({ id: c.id, n: c.name, m: [], eq: '' })),
    ...BUILTIN,
    ...Object.entries(PEX).filter(([, p]) => !p.same).map(([pid, p]) => ({ id: pid, n: p.n, m: byId.get(p.anim)?.m || [], eq: byId.get(p.anim)?.eq || '' })),
  ].filter((e) => (!muscle && !equip ? tokens.every((t) => e.n.toLowerCase().includes(t)) : match(e.n, e.m, e.eq)));
  const fromDb = db.filter((e) => match(e.n, e.m, e.eq));
  return { own: own.map((e) => e.id), db: fromDb.map((e) => e.id) };
}

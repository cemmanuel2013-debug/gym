// Programs rebuilt from the user's screen recording (exercise order, sets, reps, supersets).
// Exercise names stay in English as in the original; rep texts are German.
// Descriptions and how-to texts are our own short summaries.

/** Exercises that only appear in programs. anim = database id with a similar picture. */
export const PEX = {
  atg_warmup: { n: 'ATG Warm-up', i: ['100 Yards vorwärts und 100 Yards rückwärts gehen, am besten mit Schlitten.', 'Rückwärts mit kleinen Schritten über den Vorfuß, die Knie wandern über die Zehen.'] },
  atg_tib_rot: { n: 'Tibialis Raise + Rotation', i: ['Rücken an die Wand, Fersen etwa eine Fußlänge vor der Wand.', 'Zehen hochziehen, oben die Fußspitzen abwechselnd nach innen und außen drehen, langsam absenken.'] },
  atg_seated_calf: { n: 'Seated Calf Machine', anim: 'Seated_Calf_Raise', i: ['Sitzend, Polster auf den Oberschenkeln, Fußballen auf der Kante.', 'Fersen ganz tief absenken, dann so hoch wie möglich drücken.'] },
  atg_step_down: { n: 'Step Down Progression', i: ['Auf einer Stufe stehen, freies Bein vor der Stufe nach unten führen, bis die Ferse antippt.', 'Knie des Standbeins wandert kontrolliert über die Zehen. Höhe nach und nach steigern.'] },
  atg_bw_quad_ext: { n: 'Bodyweight Quad Extension' },
  atg_full_squat_bands: { n: 'Full Squat With Bands Or Chains', anim: 'Barbell_Full_Squat', i: ['Tiefe Kniebeuge mit Langhantel, zusätzlich Bänder oder Ketten.', 'Ganz nach unten, oben wird es durch Bänder oder Ketten schwerer.'] },
  atg_pullup: { n: 'Full Pull-up', anim: 'Pullups', i: ['Aus dem vollen Hang bis Kinn über die Stange ziehen.', 'Unten ganz durchstrecken, so viele saubere Wiederholungen wie möglich.'] },
  atg_ohp: { n: 'Full Range Overhead Press', anim: 'Standing_Military_Press', i: ['Gewicht über Kopf drücken, bis die Arme ganz gestreckt sind.', 'Unten tief bis auf Schulterhöhe absenken.'] },
  atg_row: { n: 'ATG Row' },
  atg_pushup: { n: 'ATG Pushup', anim: 'Pushups' },
  atg_ser: { n: 'Shoulder External Rotation', anim: 'External_Rotation_with_Band', i: ['Ellbogen am Körper, 90 Grad gebeugt.', 'Unterarm nach außen drehen und langsam zurück. Pro Seite.'] },
  atg_forearms: { n: 'Forearms (Optional)', anim: 'Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench' },
  atg_fslcr: { n: 'Full Single Leg Calf Raise', anim: 'Calf_Raise_On_A_Dumbbell', i: ['Auf einem Bein auf einer Stufe oder Hantelscheibe.', 'Ferse ganz tief absenken, dann so hoch wie möglich drücken.'] },
  atg_back_ext: { n: 'Back Extension Progression', anim: 'Hyperextensions_Back_Extensions', i: ['Im Back-Extension-Gerät oder auf einer Bank.', 'Rücken einrollen und Wirbel für Wirbel wieder aufrollen.'] },
  atg_ss_prog: { n: 'ATG Split Squat Progression', same: 'x_atg_split_squat' },
  atg_ql_ext: { n: 'QL Extension' },
  atg_hip_flexors: { n: 'Hip Flexors' },
  atg_hip_rot: { n: 'Internal & External Hip Rotation', i: ['Im 90/90-Sitz: beide Knie 90 Grad gebeugt, ein Bein vorn, eins seitlich.', 'Aufrecht sitzen und die Hüfte langsam in Innen- und Außenrotation arbeiten lassen. Pro Seite.'] },
  atg_pancake: { n: 'Pancake', i: ['Sitzend, Beine weit gegrätscht und gestreckt.', 'Mit geradem Rücken aus der Hüfte nach vorn kippen und halten.'] },
  atg_sissy: { n: 'Sissy Squat', i: ['Aufrecht, an etwas festhalten.', 'Knie weit nach vorn schieben und den Körper von Knie bis Kopf gerade nach hinten lehnen, wieder hochkommen.'] },
  atg_ham_roller: { n: 'Ham Roller' },
  atg_hang_clean: { n: 'Hang Clean', anim: 'Hang_Clean' },
  atg_banded_rdl: { n: 'Banded RDL', anim: 'Romanian_Deadlift', i: ['Rumänisches Kreuzheben mit Band.', 'Hüfte nach hinten schieben, Rücken gerade, bis die Beinbeuger dehnen.'] },
  atg_sl_back_ext: { n: 'Single Leg Back Extension', anim: 'Hyperextensions_Back_Extensions' },
  atg_cossack: { n: 'Cossack Squat', i: ['Breiter Stand, Gewicht auf ein Bein verlagern und tief in die Hocke gehen.', 'Das andere Bein bleibt gestreckt, Zehen zeigen nach oben. Seite wechseln.'] },
  atg_sl_hip_flexor: { n: 'Single Leg Hip Flexor' },
  atg_bottom_half_squat: { n: 'Bottom Half Squat', anim: 'Barbell_Full_Squat', i: ['Kniebeuge nur in der unteren Hälfte der Bewegung.', 'Tief bleiben, nicht ganz aufrichten.'] },
  atg_big_toe: { n: 'Big Toe Stretch', i: ['Knien, Zehen aufgestellt.', 'Gewicht langsam nach hinten auf die Fersen verlagern und halten.'] },
  atg_slant_calf: { n: 'Slant Calf Stretch', anim: 'Standing_Gastrocnemius_Calf_Stretch', i: ['Auf dem Schrägbrett stehen, Beine gestreckt.', 'Hüfte nach vorn schieben, bis die Waden dehnen. Pro Seite.'] },
  atg_wall_piri: { n: 'Wall Piriformis' },
  atg_pancake_pulse: { n: 'Standing Pancake Pulse', i: ['Im Stand breit grätschen.', 'Mit geradem Rücken aus der Hüfte nach vorn kippen und federnd tiefer gehen.'] },
  atg_active_couch: { n: 'Active Couch Stretch', same: 'x_couch_stretch' },
  atg_floor_ql: { n: 'Floor QL' },
  atg_long_lunge: { n: 'Long Lunge Hold', anim: 'Kneeling_Hip_Flexor', i: ['Langer Ausfallschritt, hinteres Knie am Boden.', 'Hüfte nach vorn unten sinken lassen und halten. Pro Seite.'] },
  atg_calf_stretch: { n: 'Calf Stretch', anim: 'Standing_Gastrocnemius_Calf_Stretch' },
  atg_ham_stretch: { n: 'Hamstring Stretch', anim: 'Hamstring_Stretch' },
  atg_cobra: { n: 'Cobra Stretch', i: ['Bauchlage, Hände neben den Schultern.', 'Oberkörper hochdrücken, Hüfte bleibt am Boden, halten.'] },
  atg_outer_glute: { n: 'Outer Glute Stretch', anim: 'Lying_Glute', i: ['Rückenlage, einen Knöchel über das andere Knie legen.', 'Beide Beine zur Brust ziehen und halten. Pro Seite.'] },
  atg_standing_pancake: { n: 'Standing Pancake', i: ['Im Stand breit grätschen.', 'Mit geradem Rücken aus der Hüfte nach vorn kippen und halten.'] },
  atg_butterfly: { n: 'Butterfly Stretch', i: ['Sitzend, Fußsohlen aneinander, Knie fallen nach außen.', 'Aufrecht bleiben und halten.'] },
  atg_lat_shoulder: { n: 'Lateral Shoulder Mobility' },
  atg_wall_pullover: { n: 'Wall Pullover Holds' },
  atg_slcr: { n: 'Straight Leg Calf Raise', anim: 'Standing_Calf_Raises', i: ['Beine gestreckt, Fußballen auf einer Erhöhung.', 'Fersen tief absenken und so hoch wie möglich drücken.'] },
  atg_blcr: { n: 'Bent Leg Calf Raise', i: ['Wie der normale Wadenheber, aber mit gebeugten Knien.', 'Fersen tief absenken und hoch drücken.'] },
  atg_piri_pushup: { n: 'Piriformis Push-up' },
};

// Item: [exercise id, display name, sets, reps text, superset-with-next]
const day = (title, wd, items) => ({ title, wd, items: items.map(([id, name, sets, reps, ss]) => ({ id, name, sets, reps, ss: !!ss })) });

const WU = ['atg_warmup', 'ATG Warm-up', 1, '100 Yards (vorwärts & rückwärts)'];
const TIB = ['atg_tib_rot', 'Tibialis Raise + Rotation', 1, '20 Wdh.'];
const CALF = ['atg_seated_calf', 'Seated Calf Machine', 2, '8–12 Wdh.'];

const upper = (n, ss) => day('Oberkörper-Tag', 3, [
  ['atg_pullup', 'Full Pull-up', n, 'bis zum Muskelversagen', ss],
  ['atg_ohp', 'Full Range Overhead Press', n, 'bis 10 Wdh.'],
  ['atg_row', 'ATG Row', n, '12 Wdh.', ss],
  ['atg_pushup', 'ATG Pushup', n, 'Burnout (so viele wie möglich)'],
  ['atg_ser', 'Shoulder External Rotation', n, '10 Wdh. pro Seite', ss],
  ['atg_forearms', 'Forearms (Optional)', n, '5–15 Wdh.'],
]);

const kneeDay = (wd, lsit) => day('Knee Ability Routine', wd, [
  ['x_backward_walk', 'Backward Walking', 1, '5 Min. rückwärts gehen'],
  ['x_tib_raise', 'Tibialis Raise', 1, '20 Wdh.'],
  ['atg_slcr', 'Straight Leg Calf Raise', 1, 'bis 25 Wdh.'],
  ['atg_blcr', 'Bent Leg Calf Raise', 1, 'bis 25 Wdh.'],
  ['x_patrick_step', 'Patrick Step Down', 2, '25 Wdh. pro Seite'],
  ['x_atg_split_squat', 'ATG Split Squat', 3, 'bis 10 Wdh. pro Seite'],
  ['x_elephant_walk', 'Elephant Walk', 1, '20 Wdh. pro Seite'],
  lsit,
  ['atg_active_couch', 'Active Couch Stretch', 1, 'bis 45 Sek. pro Seite'],
  ['atg_piri_pushup', 'Piriformis Push-up', 1, '20 Wdh. pro Seite'],
  ['atg_pancake_pulse', 'Standing Pancake Pulse', 1, '20 Wdh.'],
]);

export const CATEGORIES = [
  ['fav', 'Favoriten'],
  ['all', 'Alle Programme'],
  ['zero', 'Ohne Equipment'],
  ['sport', 'Sport'],
  ['short', 'Kurzprotokolle'],
  ['own', 'Meine Workouts'],
];

export const PROGRAMS = [
  {
    id: 'soccer', name: 'Soccer', cat: ['sport'], art: 'Barbell_Full_Squat', tone: 0, rest: 90,
    family: ['soccer', 'soccer-off'],
    desc: 'Ganzkörperprogramm für Fußballer: belastbare Knie, Hüften und Rücken für Sprints, Richtungswechsel und Schüsse. Lange Bewegungswege für Kraft und Beweglichkeit. Drei Einheiten pro Woche, Woche A und B im Wechsel, damit genug Erholung bleibt.',
    weeks: [
      { label: 'Woche A', days: [
        day('Unterkörper-Tag', 1, [WU, TIB, CALF,
          ['atg_step_down', 'Step Down Progression', 2, '20 Wdh.'],
          ['x_nordic', 'Nordic', 2, '5 Wdh.', 1],
          ['atg_bw_quad_ext', 'Bodyweight Quad Extension', 2, '5–10 Wdh.'],
          ['atg_full_squat_bands', 'Full Squat With Bands Or Chains', 4, '3–5 Wdh.']]),
        upper(1, false),
        day('Wirbelsäulen-Tag', 5, [WU,
          ['atg_fslcr', 'Full Single Leg Calf Raise', 2, '10–20 Wdh.'],
          ['atg_back_ext', 'Back Extension Progression', 3, '10–20 Wdh.', 1],
          ['atg_ss_prog', 'ATG Split Squat Progression', 3, '6–8 Wdh. pro Seite'],
          ['atg_ql_ext', 'QL Extension', 2, '10 Wdh. pro Seite', 1],
          ['atg_hip_flexors', 'Hip Flexors', 2, '20 Wdh.'],
          ['atg_hip_rot', 'Internal & External Hip Rotation', 2, '1 Min. pro Seite', 1],
          ['atg_pancake', 'Pancake', 2, '30 Sek.']]),
      ] },
      { label: 'Woche B', days: [
        day('Unterkörper-Tag', 1, [WU, TIB, CALF,
          ['atg_sissy', 'Sissy Squat', 2, '10 Wdh.', 1],
          ['atg_ham_roller', 'Ham Roller', 2, '10–20 Wdh.'],
          ['atg_hang_clean', 'Hang Clean', 3, '3–5 Wdh.'],
          ['atg_banded_rdl', 'Banded RDL', 4, '5–10 Wdh.'],
          ['x_couch_stretch', 'Couch Stretch', 2, '30–60 Sek. pro Seite']]),
        upper(1, false),
        day('Wirbelsäulen-Tag', 5, [WU,
          ['atg_fslcr', 'Full Single Leg Calf Raise', 2, '10–20 Wdh.'],
          ['atg_sl_back_ext', 'Single Leg Back Extension', 3, '10–20 Wdh.', 1],
          ['atg_cossack', 'Cossack Squat', 3, '10 Wdh. pro Seite'],
          ['atg_ql_ext', 'QL Extension', 2, '10 Wdh. pro Seite', 1],
          ['atg_sl_hip_flexor', 'Single Leg Hip Flexor', 2, '5–8 Wdh.'],
          ['atg_hip_rot', 'Internal & External Hip Rotation', 2, '1 Min. pro Seite', 1],
          ['atg_pancake', 'Pancake', 2, '30 Sek.']]),
      ] },
    ],
  },
  {
    id: 'soccer-off', name: 'Soccer (Off-Season)', cat: ['sport'], art: 'Hang_Clean', tone: 1, rest: 90,
    family: ['soccer', 'soccer-off'],
    desc: 'Die Variante für die Saisonpause: gleiche Struktur wie Soccer, aber mehr Sätze und mehr Supersätze, um in der spielfreien Zeit Kraft und Robustheit aufzubauen. Drei Einheiten pro Woche, Woche A und B im Wechsel.',
    weeks: [
      { label: 'Woche A', days: [
        day('Unterkörper-Tag', 1, [WU, TIB, CALF,
          ['atg_sissy', 'Sissy Squat', 3, '10 Wdh.', 1],
          ['atg_ham_roller', 'Ham Roller', 3, '10–20 Wdh.'],
          ['atg_bottom_half_squat', 'Bottom Half Squat', 5, '5–10 Wdh.'],
          ['x_couch_stretch', 'Couch Stretch', 2, '30–60 Sek. pro Seite']]),
        upper(2, true),
        day('Wirbelsäulen-Tag', 5, [WU,
          ['atg_fslcr', 'Full Single Leg Calf Raise', 2, '10–20 Wdh.'],
          ['atg_back_ext', 'Back Extension Progression', 3, '10–20 Wdh.', 1],
          ['atg_ss_prog', 'ATG Split Squat Progression', 3, '8–12 Wdh. pro Seite'],
          ['atg_ql_ext', 'QL Extension', 2, '10 Wdh. pro Seite', 1],
          ['atg_hip_flexors', 'Hip Flexors', 2, '20 Wdh.'],
          ['atg_hip_rot', 'Internal & External Hip Rotation', 2, '1 Min. pro Seite', 1],
          ['atg_pancake', 'Pancake', 2, '30 Sek.']]),
      ] },
      { label: 'Woche B', days: [
        day('Unterkörper-Tag', 1, [WU, TIB, CALF,
          ['atg_step_down', 'Step Down Progression', 3, '20 Wdh.'],
          ['x_nordic', 'Nordic', 3, '5 Wdh.', 1],
          ['atg_bw_quad_ext', 'Bodyweight Quad Extension', 3, '5–10 Wdh.'],
          ['atg_full_squat_bands', 'Full Squat With Bands Or Chains', 5, '5–10 Wdh.']]),
        upper(2, true),
        day('Wirbelsäulen-Tag', 5, [WU,
          ['atg_fslcr', 'Full Single Leg Calf Raise', 2, '10–20 Wdh.'],
          ['atg_hang_clean', 'Hang Clean', 3, '3–5 Wdh.'],
          ['atg_banded_rdl', 'Banded RDL', 3, '10 Wdh.', 1],
          ['atg_cossack', 'Cossack Squat', 3, '10 Wdh. pro Seite'],
          ['atg_ql_ext', 'QL Extension', 2, '10 Wdh. pro Seite', 1],
          ['atg_sl_hip_flexor', 'Single Leg Hip Flexor', 2, '5–8 Wdh.'],
          ['atg_hip_rot', 'Internal & External Hip Rotation', 2, '1 Min. pro Seite', 1],
          ['atg_pancake', 'Pancake', 2, '30 Sek.']]),
      ] },
    ],
  },
  {
    id: 'daily-mobility', name: 'Daily Mobility Protocol', cat: ['short', 'zero'], art: 'Kneeling_Hip_Flexor', tone: 2, rest: 0,
    family: ['daily-mobility'],
    desc: 'Kurze Mobility-Routine, die du jeden Tag machen kannst, um sanft beweglicher zu werden. Ein Durchgang, jede Übung ein Satz.',
    weeks: [{ label: '', days: [
      day('Workout 1', null, [
        ['atg_big_toe', 'Big Toe Stretch', 1, 'bis 1 Min.'],
        ['atg_slant_calf', 'Slant Calf Stretch', 1, 'bis 1 Min. pro Seite auf dem Schrägbrett'],
        ['atg_wall_piri', 'Wall Piriformis', 1, 'bis 45 Sek. pro Seite'],
        ['atg_pancake_pulse', 'Standing Pancake Pulse', 1, '20 Wdh.'],
        ['atg_hip_rot', 'Internal & External Hip Rotation', 1, '1 Min. pro Seite'],
        ['x_elephant_walk', 'Elephant Walk', 1, '20 Wdh. pro Seite'],
        ['atg_active_couch', 'Active Couch Stretch', 1, 'bis 45 Sek. pro Seite'],
        ['atg_floor_ql', 'Floor QL', 1, '10 Wdh. pro Seite'],
        ['atg_long_lunge', 'Long Lunge Hold', 1, '30 Sek. pro Seite']]),
    ] }],
  },
  {
    id: 'mobility-express', name: 'Mobility Express', cat: ['short', 'zero'], art: 'Hamstring_Stretch', tone: 3, rest: 0,
    family: ['mobility-express'],
    desc: 'Schneller Ganzkörper-Mobility-Durchgang: als eigene Einheit, zum Aufwärmen, zum Abwärmen oder an Reha-Tagen. Die Übungen gehen von unten nach oben durch die typischen steifen Stellen, ohne Pause am Stück.',
    weeks: [{ label: '', days: [
      day('Workout 1', null, [
        ['x_backward_walk', 'Backward Walking/Sled', 1, '2 Min.'],
        ['atg_calf_stretch', 'Calf Stretch', 1, '30 Sek. pro Seite auf dem Schrägbrett'],
        ['atg_ham_stretch', 'Hamstring Stretch', 1, '30 Sek. pro Seite'],
        ['atg_cobra', 'Cobra Stretch', 1, '30 Sek.'],
        ['atg_outer_glute', 'Outer Glute Stretch', 1, '30 Sek. pro Seite'],
        ['x_couch_stretch', 'Couch Stretch', 1, '30 Sek. pro Seite'],
        ['atg_standing_pancake', 'Standing Pancake', 1, '30 Sek.'],
        ['atg_big_toe', 'Big Toe Stretch', 1, '30 Sek.'],
        ['atg_butterfly', 'Butterfly Stretch', 1, '30 Sek.'],
        ['atg_lat_shoulder', 'Lateral Shoulder Mobility', 1, '30 Sek. pro Seite'],
        ['atg_wall_pullover', 'Wall Pullover Holds', 1, '30 Sek.']]),
    ] }],
  },
  {
    id: 'knee-ability-zero', name: 'Knee Ability Zero', cat: ['zero'], art: 'Bodyweight_Squat', tone: 4, rest: 60,
    family: ['knee-ability-zero'],
    desc: 'Ohne Gewichte, ohne Geräte und ohne durch Schmerz zu trainieren: Grundlagenprogramm für belastbare Knie. Jede Übung lässt sich so weit vereinfachen, dass sie schmerzfrei geht. Drei Einheiten pro Woche.',
    weeks: [{ label: '', days: [
      kneeDay(1, ['x_l_sit', 'L-Sit', 1, '20 Wdh. oder 20 Sek. halten']),
      kneeDay(3, ['x_l_sit', 'L-Sit Progression', 1, 'bis 20 Wdh.']),
      kneeDay(5, ['x_l_sit', 'L-Sit Progression', 1, 'bis 20 Wdh.']),
    ] }],
  },
];

export const getProgram = (id) => PROGRAMS.find((p) => p.id === id);

/** Reads a timer target from the rep text: "30 Sek." → 30, "bis 1 Min." → 60, "30–60 Sek." → 60. */
export function timingOf(reps) {
  const hasReps = /Wdh/.test(reps);
  const min = reps.match(/(\d+)\s*Min/);
  const secNums = /Sek/.test(reps) ? (reps.match(/\d+/g) || []).map(Number) : [];
  const seconds = min ? Number(min[1]) * 60 : secNums.length ? Math.max(...secNums) : 0;
  return { type: !hasReps && seconds ? 'time' : 'reps', seconds };
}

/** Program day → plan items (same shape as workouts in the plan). */
export function itemsOf(program, dayObj, uid) {
  return dayObj.items.map((it) => {
    const { type, seconds } = timingOf(it.reps);
    const timed = type === 'time';
    return {
      id: uid(), exId: it.id, name: it.name, type, sets: it.sets, reps: timed ? '' : it.reps,
      repsText: it.reps, seconds: seconds || 0, rest: program.rest || 0,
      restOn: !!program.rest && !it.ss, timer: timed, ss: it.ss,
    };
  });
}

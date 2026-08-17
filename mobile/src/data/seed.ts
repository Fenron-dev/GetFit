import { MEAL_SLOTS } from '../types/domain';
import type {
  Exercise,
  PlanDay,
  PlanTemplate,
  PlanWeek,
  Recipe,
  Settings,
} from '../types/domain';
import { ingredient } from '../lib/ingredients';

/**
 * Startbestand — eins zu eins die Beispieldaten aus dem Mockup
 * (FitPhone.dc.html). Wird beim ersten Start einmalig geschrieben und
 * danach nie wieder angefasst; alles ist anschließend normal editierbar.
 *
 * Zwei Ergänzungen gegenüber dem Mockup: „Rudern" und „Intervalllauf"
 * tauchen dort nur im Wochenplan auf, nicht in der Bibliothek. Da der
 * Plan ausschließlich referenziert, brauchen beide einen Bibliothekseintrag.
 */

const T0 = Date.parse('2026-08-01T08:00:00Z');

function exercise(
  id: string,
  name: string,
  muscleGroup: string,
  defaultSets: number,
  defaultReps: string,
  restSeconds: number,
  icon: string,
  description: string,
): Exercise {
  return {
    id,
    name,
    muscleGroup,
    defaultSets,
    defaultReps,
    restSeconds,
    description,
    icon,
    source: 'seed',
    favorite: false,
    createdAt: T0,
    updatedAt: T0,
  };
}

export const SEED_EXERCISES: Exercise[] = [
  exercise(
    'kniebeugen',
    'Kniebeugen',
    'Beine',
    3,
    '12',
    90,
    'PersonSimpleWalk',
    'Stell dich hüftbreit hin, Rücken gerade, Blick nach vorn. Senke das Gesäß kontrolliert nach hinten unten, bis die Oberschenkel waagerecht sind. Drücke dich über die Fersen wieder nach oben.',
  ),
  exercise(
    'bank',
    'Bankdrücken',
    'Brust',
    3,
    '10',
    120,
    'Barbell',
    'Schulterblätter zusammenziehen, Stange langsam zur Brustmitte führen und kontrolliert nach oben drücken. Ellenbogen bleiben leicht nach innen gedreht.',
  ),
  exercise(
    'klimm',
    'Klimmzüge',
    'Rücken',
    4,
    '6',
    120,
    'PersonSimpleTaiChi',
    'Im Obergriff etwas weiter als schulterbreit greifen. Aus der vollen Streckung ziehen, bis das Kinn über der Stange ist, dann langsam ablassen.',
  ),
  exercise(
    'plank',
    'Plank',
    'Rumpf',
    3,
    '45s',
    60,
    'PersonSimple',
    'Unterarme unter den Schultern, Körper bildet eine gerade Linie. Bauch und Gesäß aktiv anspannen, ruhig weiteratmen.',
  ),
  exercise(
    'ausfall',
    'Ausfallschritte',
    'Beine',
    3,
    '10',
    75,
    'PersonSimpleRun',
    'Großer Schritt nach vorn, hinteres Knie sinkt fast bis zum Boden. Oberkörper bleibt aufrecht, Druck über die vordere Ferse zurück in den Stand.',
  ),
  exercise(
    'schulter',
    'Schulterdrücken',
    'Schultern',
    3,
    '12',
    90,
    'PersonSimpleThrow',
    'Kurzhanteln auf Schulterhöhe, Handflächen nach vorn. Gerade nach oben drücken, ohne ins Hohlkreuz zu fallen, und kontrolliert zurückführen.',
  ),
  exercise(
    'rudern',
    'Rudern',
    'Rücken',
    3,
    '12',
    90,
    'PersonSimpleTaiChi',
    'Oberkörper vorgebeugt, Rücken gerade. Die Stange zum Bauchnabel ziehen, Schulterblätter zusammenführen und kontrolliert ablassen.',
  ),
  exercise(
    'intervall',
    'Intervalllauf',
    'Cardio',
    6,
    '400 m',
    120,
    'PersonSimpleRun',
    'Nach dem Warmlaufen 400 m zügig laufen, danach 200 m locker traben. Das Tempo über alle Intervalle gleich halten.',
  ),
];

function recipe(
  data: Omit<Recipe, 'createdAt' | 'updatedAt' | 'favorite'> &
    Partial<Pick<Recipe, 'favorite'>>,
): Recipe {
  return { favorite: false, createdAt: T0, updatedAt: T0, ...data };
}

export const SEED_RECIPES: Recipe[] = [
  recipe({
    id: 'haferbrei',
    name: 'Haferbrei mit Beeren',
    category: 'breakfast',
    icon: 'BowlSteam',
    timeMinutes: 10,
    servings: 1,
    tags: ['Vegetarisch'],
    nutrition: { kcal: 420, protein: 18, carbs: 58, fat: 11 },
    ingredients: [
      ingredient('Haferflocken, zart', '60 g'),
      ingredient('Milch oder Hafermilch', '250 ml'),
      ingredient('Beerenmischung', '100 g'),
      ingredient('Honig', '1 TL'),
      ingredient('Mandeln, gehackt', '10 g'),
      ingredient('Salz', '1 Prise'),
    ],
    steps: [
      'Haferflocken mit Milch und einer Prise Salz in einem kleinen Topf aufkochen.',
      'Hitze reduzieren und unter Rühren 4–5 Minuten cremig köcheln lassen.',
      'Vom Herd nehmen, kurz ziehen lassen und mit Honig abschmecken.',
      'In eine Schale geben, Beeren und Mandeln darüber verteilen.',
    ],
    source: 'mealie',
    mealieSlug: 'haferbrei-mit-beeren',
  }),
  recipe({
    id: 'ruehrei',
    name: 'Rührei & Vollkornbrot',
    category: 'breakfast',
    icon: 'Egg',
    timeMinutes: 8,
    servings: 1,
    tags: [],
    nutrition: { kcal: 380, protein: 26, carbs: 30, fat: 17 },
    ingredients: [
      ingredient('Eier', '3'),
      ingredient('Vollkornbrot', '2 Scheiben'),
      ingredient('Butter', '5 g'),
      ingredient('Schnittlauch', '1 EL'),
    ],
    steps: [
      'Eier verquirlen und salzen.',
      'Butter in der Pfanne schmelzen, Eier bei mittlerer Hitze stocken lassen.',
      'Mit Schnittlauch bestreuen und mit dem Brot servieren.',
    ],
    source: 'own',
  }),
  recipe({
    id: 'haehnchen',
    name: 'Hähnchen & Reis',
    category: 'lunch',
    icon: 'BowlFood',
    timeMinutes: 25,
    servings: 2,
    tags: ['High Protein'],
    nutrition: { kcal: 610, protein: 48, carbs: 62, fat: 16 },
    ingredients: [
      ingredient('Hähnchenbrust', '300 g'),
      ingredient('Basmatireis', '150 g'),
      ingredient('Brokkoli', '200 g'),
      ingredient('Olivenöl', '1 EL'),
      ingredient('Sojasauce', '2 EL'),
      ingredient('Knoblauch', '2 Zehen'),
    ],
    steps: [
      'Reis nach Packung garen.',
      'Hähnchen in Streifen schneiden und scharf anbraten.',
      'Knoblauch und Brokkoli zugeben, 4 Minuten mitbraten.',
      'Mit Sojasauce ablöschen und über dem Reis anrichten.',
    ],
    source: 'mealie',
    mealieSlug: 'haehnchen-und-reis',
  }),
  recipe({
    id: 'linsen',
    name: 'Linsensuppe',
    category: 'lunch',
    icon: 'BowlSteam',
    timeMinutes: 35,
    servings: 4,
    tags: ['Vegan'],
    nutrition: { kcal: 450, protein: 22, carbs: 55, fat: 12 },
    ingredients: [
      ingredient('Berglinsen', '250 g'),
      ingredient('Suppengemüse', '400 g'),
      ingredient('Gemüsebrühe', '1,2 l'),
      ingredient('Tomatenmark', '2 EL'),
      ingredient('Lorbeerblatt', '1'),
    ],
    steps: [
      'Gemüse würfeln und in Öl anschwitzen.',
      'Tomatenmark kurz mitrösten, Linsen zugeben.',
      'Mit Brühe aufgießen und 25 Minuten köcheln.',
      'Mit Essig, Salz und Pfeffer abschmecken.',
    ],
    source: 'mealie',
    mealieSlug: 'linsensuppe',
  }),
  recipe({
    id: 'lachs',
    name: 'Lachs mit Ofengemüse',
    category: 'dinner',
    icon: 'Fish',
    timeMinutes: 30,
    servings: 2,
    tags: [],
    nutrition: { kcal: 520, protein: 38, carbs: 24, fat: 28 },
    ingredients: [
      ingredient('Lachsfilet', '2 × 150 g'),
      ingredient('Zucchini', '1'),
      ingredient('Paprika', '2'),
      ingredient('Kartoffeln', '300 g'),
      ingredient('Olivenöl', '2 EL'),
      ingredient('Zitrone', '1/2'),
    ],
    steps: [
      'Ofen auf 200 °C vorheizen.',
      'Gemüse und Kartoffeln würfeln, ölen, würzen, 20 Minuten backen.',
      'Lachs auflegen und weitere 10 Minuten garen.',
      'Mit Zitrone beträufeln.',
    ],
    source: 'mealie',
    mealieSlug: 'lachs-mit-ofengemuese',
  }),
  recipe({
    id: 'ofengemuese',
    name: 'Ofengemüse mit Feta',
    category: 'dinner',
    icon: 'Carrot',
    timeMinutes: 35,
    servings: 2,
    tags: ['Vegetarisch'],
    // Bewusst ohne Nährwerte — im Mockup zeigt dieses Rezept überall „—".
    nutrition: {},
    ingredients: [
      ingredient('Saisongemüse', '600 g'),
      ingredient('Feta', '150 g'),
      ingredient('Olivenöl', '2 EL'),
      ingredient('Oregano', '1 TL'),
    ],
    steps: [
      'Gemüse grob schneiden, mit Öl und Oregano mischen.',
      'Bei 200 °C 25 Minuten backen.',
      'Feta zerbröseln, darüber geben, 8 Minuten weiterbacken.',
    ],
    source: 'own',
  }),
  recipe({
    id: 'skyr',
    name: 'Skyr mit Nüssen',
    category: 'snack',
    icon: 'BowlFood',
    timeMinutes: 3,
    servings: 1,
    tags: [],
    nutrition: { kcal: 210, protein: 24, carbs: 12, fat: 8 },
    ingredients: [
      ingredient('Skyr', '200 g'),
      ingredient('Walnüsse', '15 g'),
      ingredient('Zimt', '1 Prise'),
    ],
    steps: [
      'Skyr in eine Schale geben.',
      'Nüsse hacken, darüber streuen, mit Zimt abschmecken.',
    ],
    source: 'own',
  }),
  recipe({
    id: 'apfel',
    name: 'Apfel',
    category: 'snack',
    icon: 'AppleLogo',
    timeMinutes: 1,
    servings: 1,
    tags: [],
    nutrition: { kcal: 95, protein: 0, carbs: 25, fat: 0 },
    ingredients: [ingredient('Apfel', '1')],
    steps: ['Waschen und essen.'],
    source: 'own',
  }),
];

export const SEED_PLAN_WEEKS: PlanWeek[] = [
  {
    id: 'w33',
    title: 'Woche 33',
    startDate: '2026-08-11',
    focus: 'Oberkörper-Fokus',
    state: 'active',
    createdAt: T0,
    updatedAt: T0,
  },
  {
    id: 'w34',
    title: 'Woche 34',
    startDate: '2026-08-18',
    focus: 'Ganzkörper',
    state: 'planned',
    createdAt: T0,
    updatedAt: T0,
  },
  {
    id: 'w35',
    title: 'Woche 35',
    startDate: '2026-08-25',
    focus: 'Deload',
    state: 'draft',
    createdAt: T0,
    updatedAt: T0,
  },
];

type SeedDay = {
  day: PlanDay['day'];
  note: string;
  training: [string, number, string][];
  meals: [string | null, string | null, string | null, string | null];
};

/** Die sieben Tage der aktiven Woche, wie im Wochenplan-Screen. */
const W33_DAYS: SeedDay[] = [
  {
    day: 'Mo',
    note: 'Push · 45 Min',
    training: [
      ['bank', 3, '10'],
      ['schulter', 3, '12'],
      ['plank', 3, '45s'],
    ],
    meals: ['haferbrei', 'haehnchen', 'lachs', null],
  },
  {
    day: 'Di',
    note: 'Pull · 50 Min',
    training: [
      ['klimm', 4, '6'],
      ['rudern', 3, '12'],
    ],
    meals: ['ruehrei', 'linsen', null, 'skyr'],
  },
  {
    day: 'Mi',
    note: 'Beine · 40 Min',
    training: [
      ['kniebeugen', 3, '12'],
      ['ausfall', 3, '10'],
    ],
    meals: ['haferbrei', 'haehnchen', 'ofengemuese', 'apfel'],
  },
  {
    day: 'Do',
    note: 'Ruhetag',
    training: [],
    meals: [null, 'linsen', null, null],
  },
  {
    day: 'Fr',
    note: 'Push · 45 Min',
    training: [
      ['bank', 3, '10'],
      ['schulter', 3, '12'],
    ],
    meals: ['haferbrei', null, 'lachs', 'skyr'],
  },
  {
    day: 'Sa',
    note: 'Cardio · 30 Min',
    training: [['intervall', 6, '400 m']],
    meals: ['ruehrei', null, null, 'apfel'],
  },
  {
    day: 'So',
    note: 'Ruhetag',
    training: [],
    meals: [null, null, null, null],
  },
];

function buildDays(weekId: string, days: SeedDay[]): PlanDay[] {
  return days.map((d) => ({
    id: `${weekId}:${d.day}`,
    weekId,
    day: d.day,
    note: d.note,
    training: d.training.map(([exerciseId, sets, reps], index) => ({
      id: `${weekId}:${d.day}:${exerciseId}`,
      exerciseId,
      sets,
      reps,
      order: index,
    })),
    meals: MEAL_SLOTS.map((slot, index) => ({
      id: `${weekId}:${d.day}:${slot}`,
      slot,
      recipeId: d.meals[index],
      order: index,
      servings: 1,
    })),
  }));
}

/** Woche 34 und 35 sind im Mockup nur angerissen (gefüllte Tage im
 *  Streifen). Sie bekommen dieselben Tage, aber leer bis auf die Notiz. */
function sparseWeek(weekId: string, filled: boolean[], note: string): PlanDay[] {
  return buildDays(
    weekId,
    (['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const).map((day, i) => ({
      day,
      note: filled[i] ? note : 'Ruhetag',
      training: filled[i] ? ([['kniebeugen', 3, '12']] as [string, number, string][]) : [],
      meals: [null, null, null, null],
    })),
  );
}

export const SEED_PLAN_DAYS: PlanDay[] = [
  ...buildDays('w33', W33_DAYS),
  ...sparseWeek('w34', [true, false, true, false, true, false, false], 'Ganzkörper · 50 Min'),
  ...sparseWeek('w35', [true, false, false, false, false, false, false], 'Deload · 30 Min'),
];

export const SEED_TEMPLATES: PlanTemplate[] = [
  {
    id: 'ppl',
    title: 'Push / Pull / Legs',
    meta: '3 Trainingstage · 6 Übungen',
    icon: 'Barbell',
    days: {
      Mo: {
        note: 'Push · 45 Min',
        training: [
          { exerciseId: 'bank', sets: 3, reps: '10' },
          { exerciseId: 'schulter', sets: 3, reps: '12' },
        ],
      },
      Mi: {
        note: 'Pull · 50 Min',
        training: [
          { exerciseId: 'klimm', sets: 4, reps: '6' },
          { exerciseId: 'rudern', sets: 3, reps: '12' },
        ],
      },
      Fr: {
        note: 'Legs · 45 Min',
        training: [
          { exerciseId: 'kniebeugen', sets: 3, reps: '12' },
          { exerciseId: 'ausfall', sets: 3, reps: '10' },
        ],
      },
    },
  },
  {
    id: 'meal5',
    title: 'Meal Prep · 5 Tage',
    meta: '4 Rezepte · 1 Einkaufsliste',
    icon: 'Basket',
    days: {
      Mo: { note: '', training: [], meals: { breakfast: 'haferbrei', lunch: 'haehnchen', dinner: 'lachs' } },
      Di: { note: '', training: [], meals: { breakfast: 'haferbrei', lunch: 'linsen', dinner: 'ofengemuese' } },
      Mi: { note: '', training: [], meals: { breakfast: 'ruehrei', lunch: 'haehnchen', dinner: 'lachs' } },
      Do: { note: '', training: [], meals: { breakfast: 'haferbrei', lunch: 'linsen', dinner: 'ofengemuese' } },
      Fr: { note: '', training: [], meals: { breakfast: 'ruehrei', lunch: 'haehnchen', dinner: 'lachs' } },
    },
  },
];

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  profileName: 'Jan',
  kcalGoal: 2200,
  showKcal: true,
  accent: 'blurple',
  dailyGoalEntries: 5,
  trainingsPerWeek: 4,
  units: 'metric',
  reminderTime: '08:00',
  reminderEnabled: false,
  mealie: { baseUrl: '', token: '' },
  updatedAt: T0,
};

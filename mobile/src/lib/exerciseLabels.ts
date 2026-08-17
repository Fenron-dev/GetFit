/**
 * Bezeichnungen für Körperregionen und Geräte.
 *
 * ExerciseDB und der Übungsdatensatz benutzen dasselbe englische
 * Vokabular, deshalb liegt die Übersetzung hier für beide. Namen und
 * Anleitungen bleiben englisch — eine maschinelle Übersetzung wäre
 * schlechter als das Original.
 */

const BODY_PARTS: Record<string, string> = {
  back: 'Rücken',
  cardio: 'Cardio',
  chest: 'Brust',
  'lower arms': 'Unterarme',
  'lower legs': 'Waden',
  neck: 'Nacken',
  shoulders: 'Schultern',
  'upper arms': 'Arme',
  'upper legs': 'Beine',
  waist: 'Rumpf',
};

const EQUIPMENT: Record<string, string> = {
  'body weight': 'Körpergewicht',
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  cable: 'Kabelzug',
  'leverage machine': 'Maschine',
  'smith machine': 'Multipresse',
  kettlebell: 'Kettlebell',
  band: 'Band',
  'ez barbell': 'SZ-Stange',
  'medicine ball': 'Medizinball',
  'stability ball': 'Gymnastikball',
  rope: 'Seil',
  'resistance band': 'Widerstandsband',
  'olympic barbell': 'Olympia-Stange',
  'weighted': 'mit Zusatzgewicht',
  'assisted': 'unterstützt',
  'sled machine': 'Schlitten',
  'skierg machine': 'SkiErg',
  'stationary bike': 'Ergometer',
  'elliptical machine': 'Crosstrainer',
  'upper body ergometer': 'Armergometer',
  'trap bar': 'Trap-Bar',
  'tire': 'Reifen',
  'hammer': 'Hammer',
  'bosu ball': 'Bosu-Ball',
  'roller': 'Rolle',
  'wheel roller': 'Bauchroller',
};

export function bodyPartLabel(value: string | undefined): string {
  if (!value) return 'Sonstige';
  return BODY_PARTS[value.toLowerCase()] ?? capitalize(value);
}

export function equipmentLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return EQUIPMENT[value.toLowerCase()] ?? capitalize(value);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Beide Quellen schreiben Namen klein — in einer Liste sieht das falsch aus. */
export function displayName(name: string | undefined): string {
  const raw = (name ?? '').trim();
  return raw ? capitalize(raw) : 'Ohne Namen';
}



/** Passendes Symbol je Körperregion, solange kein Bild vorliegt. */
const ICONS: Record<string, string> = {
  Beine: 'PersonSimpleWalk',
  Waden: 'PersonSimpleWalk',
  Brust: 'Barbell',
  Rücken: 'PersonSimpleTaiChi',
  Arme: 'Barbell',
  Unterarme: 'Barbell',
  Schultern: 'PersonSimpleThrow',
  Rumpf: 'PersonSimple',
  Nacken: 'PersonSimple',
  Cardio: 'PersonSimpleRun',
};

export function iconForBodyPart(muscleGroup: string): string {
  return ICONS[muscleGroup] ?? 'Barbell';
}

/**
 * Baut die Beschreibung aus Gerät, Zielmuskel und den nummerierten
 * Schritten — für beide Quellen gleich aufgebaut.
 */
export function buildDescription(options: {
  equipment?: string;
  target?: string;
  steps: string[];
}): string {
  const equipment = equipmentLabel(options.equipment);
  return [
    equipment ? `Gerät: ${equipment}` : null,
    options.target ? `Ziel: ${options.target}` : null,
    '',
    ...options.steps.map((step, index) => `${index + 1}. ${step}`),
  ]
    .filter((line) => line !== null)
    .join('\n')
    .trim();
}

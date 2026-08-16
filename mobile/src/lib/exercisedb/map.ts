import type { ExerciseDbEntry } from './types';
import type { Exercise } from '../../types/domain';

/**
 * ExerciseDB liefert englische Bezeichnungen. Die Oberfläche ist deutsch,
 * also wird beim Import übersetzt, was sich sinnvoll übersetzen lässt —
 * Körperregion und Gerät. Namen und Anleitung bleiben, wie sie kommen:
 * eine maschinelle Übersetzung wäre schlechter als das Original.
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

/** ExerciseDB schreibt Namen klein — für eine Liste sieht das falsch aus. */
export function exerciseName(entry: ExerciseDbEntry): string {
  const raw = (entry.name ?? '').trim();
  return raw ? capitalize(raw) : 'Ohne Namen';
}

/** Passendes Symbol je Körperregion, solange das GIF noch nicht da ist. */
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

export type ExerciseDraft = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Bildet einen Eintrag auf eine Übung ab. Sätze, Wiederholungen und Pause
 * kennt ExerciseDB nicht — dafür stehen gängige Vorgaben, die sich in der
 * App ändern lassen.
 */
export function mapExercise(entry: ExerciseDbEntry): ExerciseDraft {
  const muscleGroup = bodyPartLabel(entry.bodyPart);
  const equipment = equipmentLabel(entry.equipment);
  const steps = (entry.instructions ?? []).map((line) => line.trim()).filter(Boolean);

  return {
    name: exerciseName(entry),
    muscleGroup,
    defaultSets: 3,
    defaultReps: entry.bodyPart === 'cardio' ? '60s' : '12',
    restSeconds: 90,
    description: [
      equipment ? `Gerät: ${equipment}` : null,
      entry.target ? `Ziel: ${entry.target}` : null,
      '',
      ...steps.map((step, index) => `${index + 1}. ${step}`),
    ]
      .filter((line) => line !== null)
      .join('\n')
      .trim(),
    icon: ICONS[muscleGroup] ?? 'Barbell',
    source: 'own',
    favorite: false,
    externalId: entry.id,
  };
}

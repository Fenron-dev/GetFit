import type { ExerciseDbEntry } from './types';
import type { Exercise } from '../../types/domain';
import {
  bodyPartLabel,
  buildDescription,
  displayName,
  iconForBodyPart,
} from '../exerciseLabels';

/**
 * Bildet einen ExerciseDB-Eintrag auf eine Übung ab. Sätze,
 * Wiederholungen und Pause kennt die Quelle nicht — dafür stehen gängige
 * Vorgaben, die sich in der App ändern lassen.
 */

export type ExerciseDraft = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;

export function exerciseName(entry: ExerciseDbEntry): string {
  return displayName(entry.name);
}

export function mapExercise(entry: ExerciseDbEntry): ExerciseDraft {
  const muscleGroup = bodyPartLabel(entry.bodyPart);

  return {
    name: exerciseName(entry),
    muscleGroup,
    defaultSets: 3,
    defaultReps: entry.bodyPart === 'cardio' ? '60s' : '12',
    restSeconds: 90,
    description: buildDescription({
      equipment: entry.equipment,
      target: entry.target,
      steps: (entry.instructions ?? []).map((line) => line.trim()).filter(Boolean),
    }),
    icon: iconForBodyPart(muscleGroup),
    source: 'own',
    favorite: false,
    externalId: entry.id,
  };
}

export { bodyPartLabel, equipmentLabel } from '../exerciseLabels';

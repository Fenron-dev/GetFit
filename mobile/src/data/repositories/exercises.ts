import { newId, now } from '../db';
import { byName, stores } from '../stores';
import type { Exercise } from '../../types/domain';

export async function listExercises(): Promise<Exercise[]> {
  return byName(await stores.exercises.all());
}

export function getExercise(id: string): Promise<Exercise | undefined> {
  return stores.exercises.get(id);
}

/** Freitextsuche über Name und Muskelgruppe — die Suchzeile im Screen. */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const all = await listExercises();
  const needle = query.trim().toLowerCase();
  if (!needle) return all;
  return all.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) ||
      item.muscleGroup.toLowerCase().includes(needle),
  );
}

type ExerciseDraft = Omit<
  Exercise,
  'id' | 'createdAt' | 'updatedAt' | 'source' | 'favorite'
> &
  Partial<Pick<Exercise, 'favorite'>>;

export async function createExercise(draft: ExerciseDraft): Promise<string> {
  const timestamp = now();
  const id = newId('ex');
  await stores.exercises.put({
    favorite: false,
    ...draft,
    id,
    source: 'own',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

export async function updateExercise(
  id: string,
  patch: Partial<Exercise>,
): Promise<void> {
  const existing = await stores.exercises.get(id);
  if (!existing) return;
  await stores.exercises.put({ ...existing, ...patch, id, updatedAt: now() });
}

export async function deleteExercise(id: string): Promise<void> {
  await stores.exercises.delete(id);
}

export async function toggleExerciseFavorite(id: string): Promise<void> {
  const exercise = await stores.exercises.get(id);
  if (exercise) await updateExercise(id, { favorite: !exercise.favorite });
}

/** "Beine · 3 × 12" — die Meta-Zeile der Bibliotheksliste. */
export function exerciseMeta(exercise: Exercise): string {
  return `${exercise.muscleGroup} · ${exercise.defaultSets} × ${exercise.defaultReps}`;
}

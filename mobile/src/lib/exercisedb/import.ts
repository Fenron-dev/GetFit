import { stores } from '../../data/stores';
import { createExercise, updateExercise } from '../../data/repositories/exercises';
import { downloadMedia } from '../media';
import { authHeaders } from './client';
import { mapExercise } from './map';
import type { ExerciseDbEntry } from './types';

/**
 * Übernimmt ausgewählte Einträge in die eigene Bibliothek und lädt dabei
 * das GIF herunter, damit die Übung auch ohne Netz vollständig ist.
 *
 * Ein fehlgeschlagener Bild-Download bricht den Import nicht ab: die
 * Übung steht dann eben mit Platzhalter da und das GIF lässt sich später
 * von Hand nachlegen.
 */

export interface DbImportResult {
  imported: number;
  skipped: number;
  withoutMedia: number;
}

/** Gibt es die Übung schon — über die Kennung oder den Namen? */
export async function findExisting(entry: ExerciseDbEntry) {
  if (entry.id) {
    const byId = await stores.exercises.findBy('externalId', entry.id);
    if (byId) return byId;
  }
  const needle = (entry.name ?? '').trim().toLowerCase();
  if (!needle) return undefined;
  const all = await stores.exercises.all();
  return all.find((item) => item.name.trim().toLowerCase() === needle);
}

export async function importExercises(
  apiKey: string,
  entries: ExerciseDbEntry[],
  onProgress?: (done: number, total: number) => void,
): Promise<DbImportResult> {
  let imported = 0;
  let skipped = 0;
  let withoutMedia = 0;

  for (const [index, entry] of entries.entries()) {
    onProgress?.(index, entries.length);

    if (await findExisting(entry)) {
      skipped += 1;
      continue;
    }

    const draft = mapExercise(entry);
    const id = await createExercise(draft);

    if (entry.gifUrl) {
      try {
        const uri = await downloadMedia(id, entry.gifUrl, authHeaders(apiKey));
        await updateExercise(id, { mediaUrl: uri });
      } catch {
        // Das GIF fehlt, die Übung bleibt trotzdem.
        withoutMedia += 1;
      }
    } else {
      withoutMedia += 1;
    }

    imported += 1;
  }

  onProgress?.(entries.length, entries.length);
  return { imported, skipped, withoutMedia };
}

/**
 * Nur das GIF für eine bereits vorhandene Übung holen — der Weg, um die
 * mitgelieferten Übungen nachträglich zu bebildern.
 */
export async function attachMedia(
  apiKey: string,
  exerciseId: string,
  entry: ExerciseDbEntry,
): Promise<void> {
  if (!entry.gifUrl) throw new Error('Zu diesem Eintrag gibt es kein Bild.');
  const uri = await downloadMedia(exerciseId, entry.gifUrl, authHeaders(apiKey));
  await updateExercise(exerciseId, { mediaUrl: uri, externalId: entry.id });
}

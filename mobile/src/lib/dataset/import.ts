import { stores } from '../../data/stores';
import { createExercise, updateExercise } from '../../data/repositories/exercises';
import { downloadMedia } from '../media';
import { MEDIA_ATTRIBUTION, mapDatasetEntry, mediaUrl, type DatasetEntry } from './index';

/**
 * Übernahme aus dem mitgelieferten Datensatz.
 *
 * Der Datenteil braucht kein Netz — er liegt in der App. Deshalb wird
 * zuerst die Übung angelegt und das GIF getrennt davon geholt: so kann
 * man 50 Übungen in einem Zug übernehmen und die Bilder später
 * nachziehen, ohne 50 Abrufe auf einmal auszulösen.
 */

export interface DatasetImportResult {
  imported: number;
  skipped: number;
}

export async function findExistingFromDataset(entry: DatasetEntry) {
  const byId = await stores.exercises.findBy('externalId', `ds:${entry.id}`);
  if (byId) return byId;

  const needle = entry.name.trim().toLowerCase();
  const all = await stores.exercises.all();
  return all.find((item) => item.name.trim().toLowerCase() === needle);
}

/** Legt die ausgewählten Übungen an — ohne Netzzugriff. */
export async function importFromDataset(
  entries: DatasetEntry[],
): Promise<DatasetImportResult> {
  let imported = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (await findExistingFromDataset(entry)) {
      skipped += 1;
      continue;
    }
    await createExercise(mapDatasetEntry(entry));
    imported += 1;
  }

  return { imported, skipped };
}

/**
 * Holt das GIF zu einer Übung nach. Wird beim ersten Öffnen des Details
 * von allein aufgerufen und lässt sich für den Vorrat auch in Serie
 * anstoßen.
 */
export async function fetchDatasetGif(
  exerciseId: string,
  datasetId: string,
): Promise<void> {
  const { findEntry } = await import('./index');
  const entry = findEntry(datasetId);
  if (!entry) throw new Error(`Im Datensatz gibt es keinen Eintrag ${datasetId}.`);

  const uri = await downloadMedia(exerciseId, mediaUrl(entry.gif));
  await updateExercise(exerciseId, {
    mediaUrl: uri,
    mediaAttribution: MEDIA_ATTRIBUTION,
  });
}

/** Die Datensatz-Kennung einer Übung, falls sie von dort stammt. */
export function datasetIdOf(externalId: string | undefined): string | undefined {
  return externalId?.startsWith('ds:') ? externalId.slice(3) : undefined;
}

/**
 * Lädt fehlende GIFs der Reihe nach. Nacheinander und mit kleiner Pause,
 * weil GitHub die Zahl der Abrufe je Adresse begrenzt — ein Schwung von
 * hundert gleichzeitigen Anfragen läuft dort in eine Sperre.
 */
export async function fetchMissingGifs(
  onProgress?: (done: number, total: number) => void,
): Promise<{ loaded: number; failed: number }> {
  const all = await stores.exercises.all();
  const pending = all.filter(
    (exercise) => !exercise.mediaUrl && datasetIdOf(exercise.externalId),
  );

  let loaded = 0;
  let failed = 0;

  for (const [index, exercise] of pending.entries()) {
    onProgress?.(index, pending.length);
    try {
      await fetchDatasetGif(exercise.id, datasetIdOf(exercise.externalId)!);
      loaded += 1;
    } catch {
      failed += 1;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  onProgress?.(pending.length, pending.length);
  return { loaded, failed };
}

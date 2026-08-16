import * as FileSystem from 'expo-file-system';
import { openDatabase, transaction } from './db';
import { stores } from './stores';
import {
  DEFAULT_SETTINGS,
  SEED_EXERCISES,
  SEED_PLAN_DAYS,
  SEED_PLAN_WEEKS,
  SEED_RECIPES,
  SEED_TEMPLATES,
} from './seed';

/**
 * Öffnet die Datenbank und füllt sie beim allerersten Start. Der Marker
 * steckt in den Einstellungen: existiert der Datensatz, war die App schon
 * einmal offen und der Bestand gehört dem Nutzer.
 */
export async function bootstrapDatabase(): Promise<void> {
  await openDatabase();

  const existing = await stores.settings.get('settings');
  if (existing) return;

  await stores.settings.put(DEFAULT_SETTINGS);
  await stores.exercises.bulkPut(SEED_EXERCISES);
  await stores.recipes.bulkPut(SEED_RECIPES);
  await stores.planWeeks.bulkPut(SEED_PLAN_WEEKS);
  await stores.planDays.bulkPut(SEED_PLAN_DAYS);
  await stores.planTemplates.bulkPut(SEED_TEMPLATES);
}

/** Vollständige Sicherung für „Daten exportieren". */
export async function exportAll(): Promise<string> {
  const [
    settings,
    exercises,
    recipes,
    planWeeks,
    planDays,
    planTemplates,
    dayLogs,
    shoppingLists,
  ] = await Promise.all([
    stores.settings.all(),
    stores.exercises.all(),
    stores.recipes.all(),
    stores.planWeeks.all(),
    stores.planDays.all(),
    stores.planTemplates.all(),
    stores.dayLogs.all(),
    stores.shoppingLists.all(),
  ]);

  return JSON.stringify(
    {
      app: 'getfit',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      exercises,
      recipes,
      planWeeks,
      planDays,
      planTemplates,
      dayLogs,
      shoppingLists,
    },
    null,
    2,
  );
}

/** Schreibt die Sicherung in eine Datei und gibt deren Pfad zurück —
 *  von dort kann sie geteilt oder abgelegt werden. */
export async function writeBackupFile(): Promise<string> {
  const content = await exportAll();
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new FileSystem.File(FileSystem.Paths.cache, `getfit-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  return file.uri;
}

/** Gegenstück zum Export: ersetzt den gesamten lokalen Bestand. */
export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (data.app !== 'getfit') throw new Error('Keine GetFit-Sicherung');

  await transaction(async () => {
    await Promise.all([
      stores.settings.clear(),
      stores.exercises.clear(),
      stores.recipes.clear(),
      stores.planWeeks.clear(),
      stores.planDays.clear(),
      stores.planTemplates.clear(),
      stores.dayLogs.clear(),
      stores.shoppingLists.clear(),
    ]);
  });

  await stores.settings.bulkPut(data.settings ?? []);
  await stores.exercises.bulkPut(data.exercises ?? []);
  await stores.recipes.bulkPut(data.recipes ?? []);
  await stores.planWeeks.bulkPut(data.planWeeks ?? []);
  await stores.planDays.bulkPut(data.planDays ?? []);
  await stores.planTemplates.bulkPut(data.planTemplates ?? []);
  await stores.dayLogs.bulkPut(data.dayLogs ?? []);
  await stores.shoppingLists.bulkPut(data.shoppingLists ?? []);
}

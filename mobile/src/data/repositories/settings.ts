import { now } from '../db';
import { stores } from '../stores';
import { DEFAULT_SETTINGS } from '../seed';
import type {
  ExerciseDbConnection,
  MealieConnection,
  Settings,
} from '../../types/domain';

/**
 * Die Einstellungen werden über die Vorgaben gelegt, nicht bloß gelesen.
 * Eine ältere Installation kennt neu hinzugekommene Blöcke sonst nicht
 * und liefe beim Zugriff darauf ins Leere.
 */
export async function getSettings(): Promise<Settings> {
  const stored = await stores.settings.get('settings');
  if (!stored) return DEFAULT_SETTINGS;

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    mealie: { ...DEFAULT_SETTINGS.mealie, ...stored.mealie },
    exerciseDb: { ...DEFAULT_SETTINGS.exerciseDb, ...stored.exerciseDb },
  };
}

export async function updateSettings(
  patch: Partial<Omit<Settings, 'id'>>,
): Promise<void> {
  const current = await getSettings();
  await stores.settings.put({ ...current, ...patch, id: 'settings', updatedAt: now() });
}

export async function updateMealieConnection(
  patch: Partial<MealieConnection>,
): Promise<void> {
  const current = await getSettings();
  await updateSettings({ mealie: { ...current.mealie, ...patch } });
}

export async function updateExerciseDbConnection(
  patch: Partial<ExerciseDbConnection>,
): Promise<void> {
  const current = await getSettings();
  await updateSettings({ exerciseDb: { ...current.exerciseDb, ...patch } });
}

import { now } from '../db';
import { stores } from '../stores';
import { DEFAULT_SETTINGS } from '../seed';
import type { MealieConnection, Settings } from '../../types/domain';

export async function getSettings(): Promise<Settings> {
  return (await stores.settings.get('settings')) ?? DEFAULT_SETTINGS;
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

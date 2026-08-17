import { newId, now } from '../db';
import { stores } from '../stores';
import { addDays, today } from '../../lib/date';
import type { StockItem, StockLocation } from '../../types/domain';

/**
 * Der Vorrat: gekochte Portionen, die im Kühlschrank, im Gefrierer oder
 * im Vorratsschrank liegen.
 *
 * Sie entstehen beim Abhaken einer Mahlzeit, für die beim Einplanen ein
 * Prep-Anteil gesetzt wurde („koche 4, iss 2, friere 2 ein").
 */

export const LOCATION_LABELS: Record<StockLocation, string> = {
  fridge: 'Kühlschrank',
  freezer: 'Gefrierer',
  pantry: 'Vorrat',
};

export const LOCATION_ICONS: Record<StockLocation, string> = {
  fridge: 'BowlFood',
  freezer: 'Snowflake',
  pantry: 'Basket',
};

/**
 * Haltbarkeit als Faustregel. Bewusst knapp gewählt — die App soll eher
 * zu früh erinnern als zu spät.
 */
const SHELF_LIFE_DAYS: Record<StockLocation, number> = {
  fridge: 3,
  freezer: 90,
  pantry: 30,
};

export function defaultBestBefore(location: StockLocation, from = today()): string {
  return addDays(from, SHELF_LIFE_DAYS[location]);
}

export function listStock(): Promise<StockItem[]> {
  return stores.stock.all('bestBefore');
}

export function getStockItem(id: string): Promise<StockItem | undefined> {
  return stores.stock.get(id);
}

/** Was von einem bestimmten Rezept vorrätig ist. */
export async function stockForRecipe(recipeId: string): Promise<StockItem[]> {
  const items = await stores.stock.where('recipeId', recipeId);
  return items.filter((item) => item.portions > 0);
}

export async function addStock(options: {
  recipeId: string;
  recipeName: string;
  portions: number;
  location: StockLocation;
  cookedOn?: string;
}): Promise<string> {
  const cookedOn = options.cookedOn ?? today();
  const timestamp = now();
  const id = newId('stock');

  await stores.stock.put({
    id,
    recipeId: options.recipeId,
    recipeName: options.recipeName,
    portions: options.portions,
    location: options.location,
    cookedOn,
    bestBefore: defaultBestBefore(options.location, cookedOn),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

export async function updateStock(
  id: string,
  patch: Partial<StockItem>,
): Promise<void> {
  const existing = await stores.stock.get(id);
  if (!existing) return;
  await stores.stock.put({ ...existing, ...patch, id, updatedAt: now() });
}

/**
 * Portionen entnehmen. Ist danach nichts mehr übrig, verschwindet der
 * Posten — ein Vorrat mit null Portionen ist kein Vorrat.
 */
export async function consumeStock(id: string, portions = 1): Promise<void> {
  const item = await stores.stock.get(id);
  if (!item) return;

  const left = item.portions - portions;
  if (left <= 0) await stores.stock.delete(id);
  else await updateStock(id, { portions: left });
}

export async function removeStock(id: string): Promise<void> {
  await stores.stock.delete(id);
}

/** Wie viele Tage bleiben? Negativ heißt überfällig. */
export function daysLeft(item: StockItem, from = today()): number {
  const target = new Date(item.bestBefore).getTime();
  const start = new Date(from).getTime();
  return Math.round((target - start) / 86400000);
}

export type Urgency = 'überfällig' | 'bald' | 'ruhig';

/** Ab drei Tagen Restzeit wird es dringend — im Gefrierer ab sieben. */
export function urgencyOf(item: StockItem, from = today()): Urgency {
  const left = daysLeft(item, from);
  const threshold = item.location === 'freezer' ? 7 : 3;
  if (left < 0) return 'überfällig';
  if (left <= threshold) return 'bald';
  return 'ruhig';
}

/** Was bald weg muss — für den Hinweis auf dem Dashboard. */
export async function listUrgentStock(): Promise<StockItem[]> {
  const items = await listStock();
  return items
    .filter((item) => urgencyOf(item) !== 'ruhig')
    .sort((a, b) => a.bestBefore.localeCompare(b.bestBefore));
}

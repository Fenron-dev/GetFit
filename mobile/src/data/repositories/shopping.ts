import { newId, now } from '../db';
import { stores } from '../stores';
import { aggregateIngredients, scaleIngredient } from '../../lib/ingredients';
import type { DayKey, ShoppingList } from '../../types/domain';
import { listPlanDays } from './plans';

/**
 * Die Einkaufsliste einer Woche: alle in den Mahlzeiten-Slots verplanten
 * Rezepte, ihre Zutaten auf eine Portion je Slot skaliert und über
 * Name + Einheit zusammengefasst. Einmal erzeugt, bleibt sie bearbeitbar
 * (Häkchen, eigene Positionen) und wird nicht automatisch überschrieben.
 */

export function listShoppingLists(weekId: string): Promise<ShoppingList[]> {
  return stores.shoppingLists.where('weekId', weekId, 'createdAt');
}

export function getShoppingList(id: string): Promise<ShoppingList | undefined> {
  return stores.shoppingLists.get(id);
}

export async function generateShoppingList(
  weekId: string,
  days: DayKey[] = [],
): Promise<string> {
  const planDays = await listPlanDays(weekId);
  const relevant = days.length
    ? planDays.filter((planDay) => days.includes(planDay.day))
    : planDays;

  /**
   * Was tatsächlich gekocht wird: geplante Portionen plus das, was
   * eingelagert werden soll. Ein Eintrag, der aus dem Vorrat kommt,
   * braucht dagegen gar keinen Einkauf.
   */
  const cooking = relevant.flatMap((planDay) =>
    planDay.meals
      .filter((entry) => entry.recipeId && !entry.fromStockId)
      .map((entry) => ({
        recipeId: entry.recipeId as string,
        portions: entry.servings + (entry.prep?.portions ?? 0),
      })),
  );

  const recipeIds = cooking.map((entry) => entry.recipeId);
  const unique = [...new Set(recipeIds)];
  const recipes = await stores.recipes.getMany(unique);
  const byId = new Map(
    recipes.filter((r) => r !== undefined).map((r) => [r.id, r]),
  );

  // Die Zutaten werden auf die tatsächlich gekochten Portionen skaliert:
  // ein Rezept für vier Portionen, von dem zwei gebraucht werden, geht
  // mit der Hälfte seiner Mengen in die Liste.
  const entries = cooking.flatMap(({ recipeId, portions }) => {
    const recipe = byId.get(recipeId);
    if (!recipe) return [];
    const factor = recipe.servings > 0 ? portions / recipe.servings : portions;
    return recipe.ingredients.map((item) => ({
      ingredient: scaleIngredient(item, factor),
      recipeId,
    }));
  });

  const id = newId('shop');
  const timestamp = now();
  await stores.shoppingLists.put({
    id,
    weekId,
    days,
    items: aggregateIngredients(entries),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

export async function toggleShoppingItem(
  listId: string,
  itemId: string,
): Promise<void> {
  const list = await stores.shoppingLists.get(listId);
  if (!list) return;
  await stores.shoppingLists.put({
    ...list,
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item,
    ),
    updatedAt: now(),
  });
}

export async function addShoppingItem(
  listId: string,
  name: string,
): Promise<void> {
  const list = await stores.shoppingLists.get(listId);
  if (!list) return;
  await stores.shoppingLists.put({
    ...list,
    items: [
      ...list.items,
      { id: newId('sitem'), name, recipeIds: [], rawParts: [], checked: false },
    ],
    updatedAt: now(),
  });
}

export async function removeShoppingItem(
  listId: string,
  itemId: string,
): Promise<void> {
  const list = await stores.shoppingLists.get(listId);
  if (!list) return;
  await stores.shoppingLists.put({
    ...list,
    items: list.items.filter((item) => item.id !== itemId),
    updatedAt: now(),
  });
}

export async function deleteShoppingList(id: string): Promise<void> {
  await stores.shoppingLists.delete(id);
}

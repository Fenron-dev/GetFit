import { newId, now } from '../db';
import { stores } from '../stores';
import { aggregateIngredients, scaleIngredient } from '../../lib/ingredients';
import { MEAL_SLOTS, type DayKey, type ShoppingList } from '../../types/domain';
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

  const recipeIds = relevant.flatMap((planDay) =>
    MEAL_SLOTS.map((slot) => planDay.meals[slot]).filter(
      (id): id is string => id !== null,
    ),
  );

  const unique = [...new Set(recipeIds)];
  const recipes = await stores.recipes.getMany(unique);
  const byId = new Map(
    recipes.filter((r) => r !== undefined).map((r) => [r.id, r]),
  );

  // Ein Slot ist eine Portion. Ein Rezept für vier Portionen, das an zwei
  // Tagen eingeplant ist, geht also mit 2/4 seiner Zutaten in die Liste.
  const entries = recipeIds.flatMap((recipeId) => {
    const recipe = byId.get(recipeId);
    if (!recipe) return [];
    const factor = recipe.servings > 0 ? 1 / recipe.servings : 1;
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

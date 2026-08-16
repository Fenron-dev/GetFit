import { newId, now } from '../db';
import { byName, stores } from '../stores';
import { MEAL_SLOTS, type MealSlot, type Recipe } from '../../types/domain';

/** Die Überschriften der vier Gruppen im Mahlzeiten-Screen. */
export const CATEGORY_LABELS: Record<MealSlot, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittag',
  dinner: 'Abend',
  snack: 'Snack',
};

/** Die Slot-Kürzel im Wochenplan. */
export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Früh',
  lunch: 'Mittag',
  dinner: 'Abend',
  snack: 'Snack',
};

export const CATEGORY_ICONS: Record<MealSlot, string> = {
  breakfast: 'Coffee',
  lunch: 'BowlFood',
  dinner: 'Fish',
  snack: 'AppleLogo',
};

export async function listRecipes(): Promise<Recipe[]> {
  return byName(await stores.recipes.all());
}

export function getRecipe(id: string): Promise<Recipe | undefined> {
  return stores.recipes.get(id);
}

export async function getRecipes(ids: string[]): Promise<Map<string, Recipe>> {
  const found = await stores.recipes.getMany(ids);
  const map = new Map<string, Recipe>();
  found.forEach((recipe) => {
    if (recipe) map.set(recipe.id, recipe);
  });
  return map;
}

/** Rezepte nach Kategorie gruppiert, in der Reihenfolge der Slots. */
export async function listRecipesByCategory(
  query = '',
): Promise<{ category: MealSlot; items: Recipe[] }[]> {
  const all = await listRecipes();
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? all.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(needle) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(needle)),
      )
    : all;
  return MEAL_SLOTS.map((category) => ({
    category,
    items: filtered.filter((recipe) => recipe.category === category),
  }));
}

type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'favorite'> &
  Partial<Pick<Recipe, 'favorite'>>;

export async function createRecipe(draft: RecipeDraft): Promise<string> {
  const timestamp = now();
  const id = newId('rec');
  await stores.recipes.put({
    favorite: false,
    ...draft,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

export async function updateRecipe(id: string, patch: Partial<Recipe>): Promise<void> {
  const existing = await stores.recipes.get(id);
  if (!existing) return;
  await stores.recipes.put({ ...existing, ...patch, id, updatedAt: now() });
}

export async function deleteRecipe(id: string): Promise<void> {
  await stores.recipes.delete(id);
}

export async function toggleRecipeFavorite(id: string): Promise<void> {
  const recipe = await stores.recipes.get(id);
  if (recipe) await updateRecipe(id, { favorite: !recipe.favorite });
}

/** Findet ein bestehendes Rezept für die Duplikat-Prüfung: erst über den
 *  Mealie-Slug, sonst über den normalisierten Namen. */
export async function findExistingRecipe(
  name: string,
  mealieSlug?: string,
): Promise<Recipe | undefined> {
  if (mealieSlug) {
    const bySlug = await stores.recipes.findBy('mealieSlug', mealieSlug);
    if (bySlug) return bySlug;
  }
  const needle = name.trim().toLowerCase();
  return (await listRecipes()).find(
    (recipe) => recipe.name.trim().toLowerCase() === needle,
  );
}

/** "10 Min · Mealie" — die Unterzeile der Rezeptliste. */
export function recipeMeta(recipe: Recipe): string {
  const origin = recipe.source === 'mealie' ? 'Mealie' : 'eigen';
  return `${recipe.timeMinutes} Min · ${origin}`;
}

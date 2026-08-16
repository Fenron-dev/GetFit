import type { MealSlot, Nutrition, Recipe } from '../../types/domain';
import { ingredient } from '../ingredients';
import type {
  MealieCategoryRef,
  MealieIngredient,
  MealieInstruction,
  MealieRecipe,
} from './types';

/**
 * Bildet ein Mealie-Rezept auf das eigene Modell ab. Mealie kennt keine
 * feste Kategorienliste — die Zuordnung auf die vier Slots ist deshalb
 * eine Heuristik über Kategorien, Tags und Rezeptname, die in der
 * Import-Auswahl pro Rezept korrigiert werden kann.
 */

/** Bekannte Mealie-Kategorien und ihre Entsprechung. Links steht immer
 *  klein geschrieben, verglichen wird ohne Groß-/Kleinschreibung. */
const CATEGORY_MAP: Record<string, MealSlot> = {
  breakfast: 'breakfast',
  frühstück: 'breakfast',
  fruehstueck: 'breakfast',
  brunch: 'breakfast',

  lunch: 'lunch',
  mittag: 'lunch',
  mittagessen: 'lunch',
  main: 'lunch',
  'main course': 'lunch',
  hauptgericht: 'lunch',
  salad: 'lunch',
  salat: 'lunch',
  soup: 'lunch',
  suppe: 'lunch',

  dinner: 'dinner',
  abend: 'dinner',
  abendessen: 'dinner',
  supper: 'dinner',

  snack: 'snack',
  snacks: 'snack',
  dessert: 'snack',
  nachtisch: 'snack',
  appetizer: 'snack',
  vorspeise: 'snack',
  beverage: 'snack',
  getränk: 'snack',
};

function refName(ref: MealieCategoryRef | string | undefined | null): string {
  if (!ref) return '';
  return (typeof ref === 'string' ? ref : (ref.name ?? ref.slug ?? '')).trim();
}

/** Ordnet ein Rezept einem Slot zu; Standard ist Mittag. */
export function inferCategory(recipe: MealieRecipe): MealSlot {
  const candidates = [
    ...(recipe.recipeCategory ?? []).map(refName),
    ...(recipe.tags ?? []).map(refName),
  ];

  for (const candidate of candidates) {
    const hit = CATEGORY_MAP[candidate.toLowerCase()];
    if (hit) return hit;
  }

  const name = (recipe.name ?? '').toLowerCase();
  if (/pancake|müsli|muesli|porridge|granola|shakshuka|omelett/.test(name)) {
    return 'breakfast';
  }
  if (/riegel|balls|smoothie|shake|keks|kuchen/.test(name)) return 'snack';

  return 'lunch';
}

/** Die Rohkategorie, die im Auswahl-Screen links vom Pfeil steht. */
export function rawCategoryLabel(recipe: MealieRecipe): string {
  const first = (recipe.recipeCategory ?? []).map(refName).find(Boolean);
  return first || 'ohne Kategorie';
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed =
    typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapNutrition(recipe: MealieRecipe): Nutrition {
  const source = recipe.nutrition ?? {};
  return {
    kcal: toNumber(source.calories),
    protein: toNumber(source.proteinContent),
    carbs: toNumber(source.carbohydrateContent),
    fat: toNumber(source.fatContent),
  };
}

/** ISO-8601-Dauer ("PT25M") oder Freitext ("25 Minuten") in Minuten. */
export function parseDuration(value: string | null | undefined): number {
  if (!value) return 0;
  const iso = value.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (iso && (iso[1] || iso[2])) {
    return Number(iso[1] ?? 0) * 60 + Number(iso[2] ?? 0);
  }
  const hours = value.match(/(\d+)\s*(?:h|std|stunde)/i);
  const minutes = value.match(/(\d+)\s*(?:m|min)/i);
  if (hours || minutes) {
    return Number(hours?.[1] ?? 0) * 60 + Number(minutes?.[1] ?? 0);
  }
  const bare = Number(value.trim());
  return Number.isFinite(bare) ? bare : 0;
}

/** "4 Portionen" / "serves 4" → 4 */
export function parseServings(recipe: MealieRecipe): number {
  if (recipe.recipeServings && recipe.recipeServings > 0) return recipe.recipeServings;
  const match = (recipe.recipeYield ?? '').match(/(\d+)/);
  return match ? Number(match[1]) : 1;
}

function mapIngredient(item: MealieIngredient) {
  const foodName =
    typeof item.food === 'string' ? item.food : (item.food?.name ?? '');
  const unitName =
    typeof item.unit === 'string'
      ? item.unit
      : (item.unit?.abbreviation ?? item.unit?.name ?? '');
  const quantity = toNumber(item.quantity);

  // Der strukturierte Weg ist der genaue; ohne Food-Namen bleibt nur die
  // fertige Anzeigezeile bzw. die Notiz.
  if (foodName) {
    const qty = [quantity !== undefined ? String(quantity) : '', unitName]
      .filter(Boolean)
      .join(' ');
    const name = item.note ? `${foodName} (${item.note})` : foodName;
    return ingredient(name, qty);
  }

  const fallback = (item.display ?? item.note ?? '').trim();
  return ingredient(fallback, '');
}

function mapInstruction(step: MealieInstruction | string): string {
  return (typeof step === 'string' ? step : (step.text ?? '')).trim();
}

/** Passendes Icon je Slot — Mealie liefert keins. */
const ICON_BY_CATEGORY: Record<MealSlot, string> = {
  breakfast: 'BowlSteam',
  lunch: 'BowlFood',
  dinner: 'Fish',
  snack: 'AppleLogo',
};

export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export function mapMealieRecipe(
  recipe: MealieRecipe,
  category = inferCategory(recipe),
): RecipeDraft {
  const timeMinutes =
    parseDuration(recipe.totalTime) ||
    parseDuration(recipe.prepTime) + parseDuration(recipe.performTime);

  return {
    name: (recipe.name ?? 'Ohne Namen').trim(),
    category,
    icon: ICON_BY_CATEGORY[category],
    timeMinutes,
    servings: parseServings(recipe),
    tags: (recipe.tags ?? []).map(refName).filter(Boolean),
    nutrition: mapNutrition(recipe),
    ingredients: (recipe.recipeIngredient ?? [])
      .map(mapIngredient)
      .filter((item) => item.name.length > 0),
    steps: (recipe.recipeInstructions ?? []).map(mapInstruction).filter(Boolean),
    imageUrl: recipe.image ?? undefined,
    source: 'mealie',
    mealieSlug: recipe.slug ?? recipe.id ?? undefined,
    favorite: false,
  };
}

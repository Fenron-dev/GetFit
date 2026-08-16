/**
 * Ausschnitt aus dem Mealie-Datenmodell (API v1). Bewusst locker
 * typisiert: Mealie liefert je nach Version und je nachdem, ob ein Rezept
 * importiert oder von Hand angelegt wurde, unterschiedlich viel — und ein
 * JSON-Export enthält teils noch ältere Formen.
 */

export interface MealieUnit {
  name?: string;
  abbreviation?: string;
}

export interface MealieFood {
  name?: string;
  pluralName?: string;
}

export interface MealieIngredient {
  quantity?: number | string | null;
  unit?: MealieUnit | string | null;
  food?: MealieFood | string | null;
  note?: string | null;
  /** Fertig formatierte Zeile — der verlässlichste Fallback. */
  display?: string | null;
  title?: string | null;
}

export interface MealieInstruction {
  title?: string | null;
  text?: string | null;
}

export interface MealieNutrition {
  calories?: string | number | null;
  proteinContent?: string | number | null;
  carbohydrateContent?: string | number | null;
  fatContent?: string | number | null;
}

export interface MealieCategoryRef {
  name?: string;
  slug?: string;
}

export interface MealieRecipe {
  id?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  recipeCategory?: (MealieCategoryRef | string)[] | null;
  tags?: (MealieCategoryRef | string)[] | null;
  recipeIngredient?: MealieIngredient[] | null;
  recipeInstructions?: (MealieInstruction | string)[] | null;
  nutrition?: MealieNutrition | null;
  recipeServings?: number | null;
  recipeYield?: string | null;
  totalTime?: string | null;
  prepTime?: string | null;
  performTime?: string | null;
}

/** Die Listenantwort von GET /api/recipes. */
export interface MealieRecipePage {
  items?: MealieRecipe[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

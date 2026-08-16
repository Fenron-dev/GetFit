import { newId, now, transaction } from '../../data/db';
import { stores } from '../../data/stores';
import { findExistingRecipe } from '../../data/repositories/recipes';
import { updateMealieConnection } from '../../data/repositories/settings';
import type {
  ImportCandidate,
  ImportResult,
  MealSlot,
  Recipe,
} from '../../types/domain';
import { inferCategory, mapMealieRecipe, rawCategoryLabel } from './map';
import type { MealieRecipe } from './types';

/**
 * Der Import in drei Schritten:
 *   1. Kandidaten bilden — abbilden, Kategorie raten, Duplikate erkennen.
 *   2. Der Nutzer wählt aus, korrigiert Kategorien und entscheidet bei
 *      Konflikten (Screen „Import-Auswahl").
 *   3. Übernehmen — nur das Ausgewählte wird geschrieben.
 */

/** Liest eine hochgeladene Datei. Akzeptiert die Formen, in denen
 *  Mealie-Exporte in freier Wildbahn vorkommen. */
export function parseMealieJson(text: string): MealieRecipe[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }

  if (Array.isArray(data)) return data as MealieRecipe[];

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as MealieRecipe[];
    if (Array.isArray(record.recipes)) return record.recipes as MealieRecipe[];
    // Einzelnes Rezept
    if (typeof record.name === 'string') return [data as MealieRecipe];
  }

  throw new Error('In der Datei stehen keine Rezepte.');
}

/** Schritt 1: Kandidaten aufbereiten und gegen den Bestand prüfen. */
export async function buildCandidates(
  recipes: MealieRecipe[],
): Promise<ImportCandidate[]> {
  const candidates: ImportCandidate[] = [];

  for (const source of recipes) {
    const category = inferCategory(source);
    const draft = mapMealieRecipe(source, category);
    const existing = await findExistingRecipe(draft.name, draft.mealieSlug);

    candidates.push({
      id: newId('cand'),
      name: draft.name,
      mealieCategory: rawCategoryLabel(source),
      category,
      kcal: draft.nutrition.kcal,
      // Bekannte Duplikate sind zunächst abgewählt — das entspricht dem
      // „übersprungen" aus dem Mockup, ist jetzt aber eine Entscheidung.
      selected: !existing,
      conflictRecipeId: existing?.id,
      resolution: 'skip',
      recipe: draft,
    });
  }

  return candidates;
}

/** Kategorie eines Kandidaten ändern — das Icon zieht mit. */
export function setCandidateCategory(
  candidate: ImportCandidate,
  category: MealSlot,
): ImportCandidate {
  return {
    ...candidate,
    category,
    recipe: { ...candidate.recipe, category },
  };
}

/**
 * Schritt 3: Übernehmen.
 *  - kein Konflikt          → anlegen
 *  - Konflikt + skip        → überspringen
 *  - Konflikt + overwrite   → bestehendes Rezept ersetzen, ID bleibt
 *  - Konflikt + keepBoth    → als eigenes Rezept mit Zusatz im Namen
 */
export async function commitImport(
  candidates: ImportCandidate[],
): Promise<ImportResult> {
  const selected = candidates.filter((candidate) => candidate.selected);
  const timestamp = now();
  let imported = 0;
  let overwritten = 0;
  let skipped = candidates.length - selected.length;

  await transaction(async () => {
    for (const candidate of selected) {
      const conflictId = candidate.conflictRecipeId;

      if (conflictId && candidate.resolution === 'skip') {
        skipped += 1;
        continue;
      }

      if (conflictId && candidate.resolution === 'overwrite') {
        const existing = await stores.recipes.get(conflictId);
        await stores.recipes.put({
          ...candidate.recipe,
          id: conflictId,
          favorite: existing?.favorite ?? false,
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        } satisfies Recipe);
        overwritten += 1;
        continue;
      }

      const keepBoth = conflictId !== undefined && candidate.resolution === 'keepBoth';
      await stores.recipes.put({
        ...candidate.recipe,
        // Zwei Rezepte dürfen sich denselben Slug nicht teilen, sonst
        // greift die Duplikat-Erkennung beim nächsten Lauf daneben.
        name: keepBoth ? `${candidate.recipe.name} (Import)` : candidate.recipe.name,
        mealieSlug: keepBoth ? undefined : candidate.recipe.mealieSlug,
        id: newId('rec'),
        createdAt: timestamp,
        updatedAt: timestamp,
      } satisfies Recipe);
      imported += 1;
    }
  });

  await updateMealieConnection({
    lastImportAt: timestamp,
    lastImportCount: imported + overwritten,
    lastImportSkipped: skipped,
  });

  return { imported, overwritten, skipped, at: timestamp };
}

export const RESOLUTION_LABELS: Record<ImportCandidate['resolution'], string> = {
  skip: 'Überspringen',
  overwrite: 'Ersetzen',
  keepBoth: 'Beide behalten',
};

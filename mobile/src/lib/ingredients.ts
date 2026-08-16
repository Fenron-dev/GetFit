import type { Ingredient, ShoppingItem } from '../types/domain';
import { newId } from '../data/db';

/**
 * Mengenangaben kommen als Freitext herein — aus dem Mockup ("60 g",
 * "2 × 150 g", "1,2 l", "1 Prise") und aus Mealie, wo sie je nach Rezept
 * strukturiert oder als Fließtext vorliegen. Diese Datei zerlegt sie so
 * weit, dass die Einkaufsliste gleichartige Positionen addieren kann, und
 * gibt sonst den Originaltext unverändert weiter.
 */

/** Einheiten, die wir kennen. Die Schreibweise links ist die kanonische. */
const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'TL',
  'EL',
  'Prise',
  'Bund',
  'Zehen',
  'Scheiben',
  'Stück',
  'Dose',
  'Packung',
  'Portion',
];

const UNIT_ALIASES: Record<string, string> = {
  gramm: 'g',
  kilogramm: 'kg',
  milliliter: 'ml',
  liter: 'l',
  teelöffel: 'TL',
  tl: 'TL',
  esslöffel: 'EL',
  el: 'EL',
  prisen: 'Prise',
  zehe: 'Zehen',
  scheibe: 'Scheiben',
  stk: 'Stück',
  stueck: 'Stück',
  packungen: 'Packung',
  portionen: 'Portion',
};

function normalizeUnit(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const exact = UNITS.find((u) => u.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  return UNIT_ALIASES[trimmed.toLowerCase()];
}

/** "1,2" → 1.2, "1/2" → 0.5, "3" → 3 */
function parseNumber(raw: string): number | undefined {
  const cleaned = raw.trim().replace(',', '.');
  const fraction = cleaned.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? undefined : Number(fraction[1]) / denominator;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Zerlegt eine Mengenangabe. Erkennt "2 × 150 g" als 300 g, weil die
 * Einkaufsliste die Gesamtmenge braucht, nicht die Portionierung.
 */
export function parseQuantity(qty: string): { amount?: number; unit?: string } {
  const text = qty.trim();
  if (!text) return {};

  const multiplied = text.match(/^([\d.,/]+)\s*[×x*]\s*([\d.,/]+)\s*(\S+)?$/i);
  if (multiplied) {
    const factor = parseNumber(multiplied[1]);
    const each = parseNumber(multiplied[2]);
    if (factor !== undefined && each !== undefined) {
      return { amount: factor * each, unit: normalizeUnit(multiplied[3] ?? '') };
    }
  }

  const simple = text.match(/^([\d.,/]+)\s*(.*)$/);
  if (simple) {
    const amount = parseNumber(simple[1]);
    if (amount !== undefined) {
      const unit = normalizeUnit(simple[2]);
      // Ein Rest, den wir nicht als Einheit kennen ("Zweige frischer
      // Rosmarin"), bleibt Teil des Originaltexts und wird nicht addiert.
      if (simple[2].trim() && !unit) return {};
      return { amount, unit };
    }
  }

  return {};
}

/** Baut eine Zutat aus Name und Mengen-Freitext. */
export function ingredient(name: string, qty: string): Ingredient {
  const { amount, unit } = parseQuantity(qty);
  return { name, amount, unit, raw: qty };
}

/** Anzeigeform: "60 g", "1 Prise", "2" oder der Originaltext. */
export function formatQuantity(item: {
  amount?: number;
  unit?: string;
  raw?: string;
}): string {
  if (item.amount === undefined) return item.raw ?? '';
  const amount = Number.isInteger(item.amount)
    ? String(item.amount)
    : item.amount.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
  return item.unit ? `${amount} ${item.unit}` : amount;
}

/** Zutaten skalieren, wenn ein Rezept für andere Portionszahlen kocht. */
export function scaleIngredient(item: Ingredient, factor: number): Ingredient {
  if (item.amount === undefined || factor === 1) return item;
  const scaled = { ...item, amount: item.amount * factor };
  return { ...scaled, raw: formatQuantity(scaled) };
}

type IngredientWithSource = { ingredient: Ingredient; recipeId: string };

/**
 * Fasst die Zutaten mehrerer Rezepte zu Einkaufslisten-Positionen
 * zusammen: gleicher Name und gleiche Einheit werden addiert, alles
 * andere bleibt als eigene Zeile mit den Originaltexten stehen.
 */
export function aggregateIngredients(
  entries: IngredientWithSource[],
): ShoppingItem[] {
  const buckets = new Map<string, ShoppingItem>();

  for (const { ingredient: item, recipeId } of entries) {
    const nameKey = item.name.trim().toLowerCase();
    const key = `${nameKey}|${item.unit ?? (item.amount === undefined ? 'raw' : '')}`;
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        id: newId('sitem'),
        name: item.name.trim(),
        amount: item.amount,
        unit: item.unit,
        recipeIds: [recipeId],
        rawParts: item.amount === undefined ? [item.raw] : [],
        checked: false,
      });
      continue;
    }

    if (item.amount !== undefined && existing.amount !== undefined) {
      existing.amount += item.amount;
    } else if (item.raw) {
      existing.rawParts.push(item.raw);
    }
    if (!existing.recipeIds.includes(recipeId)) existing.recipeIds.push(recipeId);
  }

  return [...buckets.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

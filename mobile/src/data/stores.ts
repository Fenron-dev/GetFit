import { Store } from './db';
import type {
  DayLog,
  Exercise,
  PlanDay,
  PlanTemplate,
  PlanWeek,
  Recipe,
  Settings,
  ShoppingList,
  StockItem,
} from '../types/domain';

/**
 * Ein Speicher je Aggregat. Die zweite Angabe ist der Schlüssel, die
 * dritte beschreibt, welche Felder zusätzlich als eigene Spalte
 * mitgeschrieben werden — nur die, nach denen gesucht oder sortiert wird.
 */
export const stores = {
  exercises: new Store<Exercise>('exercises', 'id', {
    name: (item) => item.name,
    muscleGroup: (item) => item.muscleGroup,
    source: (item) => item.source,
    favorite: (item) => (item.favorite ? 1 : 0),
    externalId: (item) => item.externalId ?? null,
  }),

  recipes: new Store<Recipe>('recipes', 'id', {
    name: (item) => item.name,
    category: (item) => item.category,
    source: (item) => item.source,
    favorite: (item) => (item.favorite ? 1 : 0),
    mealieSlug: (item) => item.mealieSlug ?? null,
  }),

  planWeeks: new Store<PlanWeek>('plan_weeks', 'id', {
    startDate: (item) => item.startDate,
    state: (item) => item.state,
  }),

  planDays: new Store<PlanDay>('plan_days', 'id', {
    weekId: (item) => item.weekId,
    day: (item) => item.day,
  }),

  planTemplates: new Store<PlanTemplate>('plan_templates', 'id'),

  dayLogs: new Store<DayLog>('day_logs', 'date'),

  shoppingLists: new Store<ShoppingList>('shopping_lists', 'id', {
    weekId: (item) => item.weekId,
    createdAt: (item) => item.createdAt,
  }),

  stock: new Store<StockItem>('stock', 'id', {
    recipeId: (item) => item.recipeId,
    location: (item) => item.location,
    bestBefore: (item) => item.bestBefore,
  }),

  settings: new Store<Settings>('settings', 'id'),
};

/** Sortierung, die Umlaute richtig einordnet, kommt aus SQLite nicht
 *  zuverlässig — deshalb wird im Speicher sortiert, wo es zählt. */
export function byName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

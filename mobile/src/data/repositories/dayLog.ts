import { newId, now } from '../db';
import { stores } from '../stores';
import { dayKeyOf, fromIsoDate, lastDays, today } from '../../lib/date';
import type { DayLog, DayLogEntry, StreakLevel } from '../../types/domain';
import { getPlanDay, getActiveWeek, setPlanMeal } from './plans';
import { addStock, consumeStock } from './stock';
import { SLOT_LABELS } from './recipes';

/**
 * Das Dashboard zeigt „Heute": eine Liste aus Trainings- und
 * Ernährungseinträgen zum Abhaken. Der Tag wird beim ersten Öffnen aus
 * dem Wochenplan materialisiert und danach eigenständig geführt — wer
 * heute etwas abhakt, soll das nicht verlieren, wenn der Plan sich ändert.
 */

export async function getDayLog(date = today()): Promise<DayLog | undefined> {
  return stores.dayLogs.get(date);
}

/** Erzeugt den Tag aus dem Wochenplan, falls er noch nicht existiert. */
export async function ensureDayLog(date = today()): Promise<DayLog> {
  const existing = await stores.dayLogs.get(date);
  if (existing) return existing;

  const entries = await buildEntriesFromPlan(date);
  const log: DayLog = { date, entries, updatedAt: now() };
  await stores.dayLogs.put(log);
  return log;
}

async function buildEntriesFromPlan(date: string): Promise<DayLogEntry[]> {
  const week = await getActiveWeek();
  if (!week) return [];

  const planDay = await getPlanDay(week.id, dayKeyOf(fromIsoDate(date)));
  if (!planDay) return [];

  const entries: DayLogEntry[] = [];
  const exerciseIds = planDay.training.map((item) => item.exerciseId);
  const exercises = await stores.exercises.getMany(exerciseIds);

  planDay.training.forEach((item, index) => {
    const exercise = exercises[index];
    if (!exercise) return;
    entries.push({
      id: newId('log'),
      kind: 'training',
      refId: exercise.id,
      title: exercise.name,
      meta: `${item.sets} Sätze · ${item.reps}${/^\d+$/.test(item.reps) ? ' Wdh.' : ''}`,
      done: false,
      order: entries.length,
    });
  });

  for (const meal of [...planDay.meals].sort((a, b) => a.order - b.order)) {
    if (!meal.recipeId) continue;
    const recipe = await stores.recipes.get(meal.recipeId);
    if (!recipe) continue;
    entries.push({
      id: newId('log'),
      kind: 'meal',
      refId: recipe.id,
      title: meal.time ? `${SLOT_LABELS[meal.slot]} · ${meal.time}` : SLOT_LABELS[meal.slot],
      meta: recipe.name,
      kcal: recipe.nutrition.kcal,
      slot: meal.slot,
      done: false,
      order: entries.length,
      planEntryId: meal.id,
    });
  }

  return entries;
}

/**
 * Abhaken. Wurde für die Mahlzeit beim Einplanen ein Prep-Anteil gesetzt
 * („koche 4, iss 2, friere 2 ein"), entsteht in diesem Moment der
 * Vorratsposten — gekocht wird schließlich jetzt.
 *
 * Wird das Häkchen wieder entfernt, verschwindet der Posten nicht: er
 * steht dann eben im Kühlschrank, und das lässt sich dort korrigieren.
 */
export async function toggleDayEntry(date: string, entryId: string): Promise<void> {
  const log = await ensureDayLog(date);
  const entry = log.entries.find((item) => item.id === entryId);
  const wirdErledigt = entry ? !entry.done : false;

  await stores.dayLogs.put({
    ...log,
    entries: log.entries.map((item) =>
      item.id === entryId ? { ...item, done: !item.done } : item,
    ),
    updatedAt: now(),
  });

  if (wirdErledigt && entry?.kind === 'meal' && entry.planEntryId) {
    await settleMeal(date, entry.planEntryId, entry.refId);
  }
}

/**
 * Was beim Abhaken einer Mahlzeit mit dem Vorrat geschieht:
 *
 *  - kommt sie aus dem Vorrat, werden die Portionen entnommen
 *  - sieht sie einen Prep-Anteil vor, entsteht ein neuer Posten
 *
 * Beides wird danach aus dem Planeintrag entfernt, damit ein zweites
 * Abhaken nicht doppelt bucht.
 */
async function settleMeal(
  date: string,
  planEntryId: string,
  recipeId: string,
): Promise<void> {
  const week = await getActiveWeek();
  if (!week) return;

  const planDay = await getPlanDay(week.id, dayKeyOf(fromIsoDate(date)));
  const meal = planDay?.meals.find((item) => item.id === planEntryId);
  if (!meal || !planDay) return;

  if (meal.fromStockId) {
    await consumeStock(meal.fromStockId, meal.servings);
    await setPlanMeal(week.id, planDay.day, planEntryId, { fromStockId: undefined });
    return;
  }

  if (meal.prep && meal.prep.portions > 0) {
    const recipe = await stores.recipes.get(recipeId);
    await addStock({
      recipeId,
      recipeName: recipe?.name ?? 'Unbekanntes Rezept',
      portions: meal.prep.portions,
      location: meal.prep.location,
      cookedOn: date,
    });
    await setPlanMeal(week.id, planDay.day, planEntryId, { prep: undefined });
  }
}

/** „Zum Heute-Plan hinzufügen" aus dem Übungs- bzw. Rezept-Detail. */
export async function addDayEntry(
  date: string,
  entry: Omit<DayLogEntry, 'id' | 'done' | 'order'>,
): Promise<void> {
  const log = await ensureDayLog(date);
  await stores.dayLogs.put({
    ...log,
    entries: [
      ...log.entries,
      { ...entry, id: newId('log'), done: false, order: log.entries.length },
    ],
    updatedAt: now(),
  });
}

export async function removeDayEntry(date: string, entryId: string): Promise<void> {
  const log = await ensureDayLog(date);
  await stores.dayLogs.put({
    ...log,
    entries: log.entries
      .filter((entry) => entry.id !== entryId)
      .map((entry, index) => ({ ...entry, order: index })),
    updatedAt: now(),
  });
}

/** Regeneriert den Tag aus dem Plan — verwirft dabei die Häkchen. */
export async function resyncDayLog(date: string): Promise<DayLog> {
  const log: DayLog = {
    date,
    entries: await buildEntriesFromPlan(date),
    updatedAt: now(),
  };
  await stores.dayLogs.put(log);
  return log;
}

export function dayProgress(log: DayLog | undefined): {
  done: number;
  total: number;
  ratio: number;
} {
  const total = log?.entries.length ?? 0;
  const done = log?.entries.filter((entry) => entry.done).length ?? 0;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

/** Alles erledigt = full, mindestens eines = part, sonst low. */
export function streakLevel(log: DayLog | undefined): StreakLevel {
  const { done, total } = dayProgress(log);
  if (total > 0 && done === total) return 'full';
  if (done > 0) return 'part';
  return 'low';
}

/** Das 14-Tage-Band auf dem Dashboard, ältester Tag zuerst. */
export async function loadStreak(
  days = 14,
): Promise<{ date: string; level: StreakLevel }[]> {
  const dates = lastDays(days);
  const logs = await stores.dayLogs.getMany(dates);
  return dates.map((date, index) => ({ date, level: streakLevel(logs[index]) }));
}

/**
 * Die Länge der laufenden Serie: wie viele Tage in Folge bis heute wurde
 * mindestens ein Eintrag erledigt. Ein Tag ohne jede Erledigung beendet
 * die Serie — halb zählt, gar nicht zählt nicht.
 */
export function currentStreak(days: { level: StreakLevel }[]): number {
  let count = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].level === 'low') break;
    count += 1;
  }
  return count;
}

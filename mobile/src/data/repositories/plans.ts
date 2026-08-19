import { newId, now, transaction } from '../db';
import { stores } from '../stores';
import {
  addDays,
  formatWeekRange,
  fromIsoDate,
  isoWeekNumber,
  startOfWeek,
  today,
} from '../../lib/date';
import {
  DAY_KEYS,
  MEAL_SLOTS,
  type DayKey,
  type MealSlot,
  type PlanDay,
  type PlanMealEntry,
  type PlanTemplate,
  type PlanWeek,
} from '../../types/domain';

export function listPlanWeeks(): Promise<PlanWeek[]> {
  return stores.planWeeks.all('startDate');
}

export function getPlanWeek(id: string): Promise<PlanWeek | undefined> {
  return stores.planWeeks.get(id);
}

export async function listPlanDays(weekId: string): Promise<PlanDay[]> {
  const days = await stores.planDays.where('weekId', weekId);
  return days.sort((a, b) => DAY_KEYS.indexOf(a.day) - DAY_KEYS.indexOf(b.day));
}

export function getPlanDay(weekId: string, day: DayKey): Promise<PlanDay | undefined> {
  return stores.planDays.get(`${weekId}:${day}`);
}

/** Die aktive Woche — der Dashboard-Link „Woche 33 ›" zeigt hierauf. */
export async function getActiveWeek(): Promise<PlanWeek | undefined> {
  const monday = startOfWeek(today());
  const weeks = await listPlanWeeks();
  return (
    weeks.find((week) => week.startDate === monday) ??
    weeks.find((week) => week.state === 'active') ??
    weeks[0]
  );
}

/** Ein frischer Tag beginnt mit den vier gewohnten, noch leeren Slots. */
function emptyMeals(dayId: string): PlanMealEntry[] {
  return MEAL_SLOTS.map((slot, index) => ({
    id: `${dayId}:${slot}`,
    slot,
    recipeId: null,
    order: index,
    servings: 1,
  }));
}

/** Legt eine Woche mit ihren sieben — zunächst leeren — Tagen an. */
export async function createPlanWeek(options: {
  startDate?: string;
  title?: string;
  focus?: string;
}): Promise<string> {
  const startDate = options.startDate ?? startOfWeek(today());
  const id = newId('week');
  const timestamp = now();

  await stores.planWeeks.put({
    id,
    title: options.title ?? `Woche ${isoWeekNumber(startDate)}`,
    startDate,
    focus: options.focus ?? '',
    state: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await stores.planDays.bulkPut(
    DAY_KEYS.map((day) => ({
      id: `${id}:${day}`,
      weekId: id,
      day,
      note: '',
      training: [],
      meals: emptyMeals(`${id}:${day}`),
    })),
  );

  return id;
}

export async function updatePlanWeek(
  id: string,
  patch: Partial<PlanWeek>,
): Promise<void> {
  const existing = await stores.planWeeks.get(id);
  if (!existing) return;
  await stores.planWeeks.put({ ...existing, ...patch, id, updatedAt: now() });
}

export async function deletePlanWeek(id: string): Promise<void> {
  await transaction(async () => {
    await stores.planWeeks.delete(id);
    await stores.planDays.deleteWhere('weekId', id);
    await stores.shoppingLists.deleteWhere('weekId', id);
  });
}

/** Kopiert eine Woche samt Inhalt auf die folgende — „Woche duplizieren". */
export async function duplicatePlanWeek(weekId: string): Promise<string> {
  const source = await getPlanWeek(weekId);
  if (!source) throw new Error(`Woche ${weekId} nicht gefunden`);

  const days = await listPlanDays(weekId);
  const startDate = addDays(source.startDate, 7);
  const id = newId('week');
  const timestamp = now();

  await stores.planWeeks.put({
    id,
    title: `Woche ${isoWeekNumber(startDate)}`,
    startDate,
    focus: source.focus,
    state: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await stores.planDays.bulkPut(
    days.map((day) => ({
      ...day,
      id: `${id}:${day.day}`,
      weekId: id,
      training: day.training.map((item) => ({ ...item, id: newId('pt') })),
      meals: { ...day.meals },
    })),
  );

  return id;
}

/** Belegt einen vorhandenen Mahlzeiten-Eintrag oder leert ihn. */
export async function setPlanMeal(
  weekId: string,
  day: DayKey,
  entryId: string,
  patch: Partial<Omit<PlanMealEntry, 'id'>>,
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return;
  await stores.planDays.put({
    ...planDay,
    meals: planDay.meals.map((entry) =>
      entry.id === entryId ? { ...entry, ...patch } : entry,
    ),
  });
}

/** Hängt einen weiteren Eintrag an — der zweite Snack am Nachmittag. */
export async function addPlanMeal(
  weekId: string,
  day: DayKey,
  slot: MealSlot,
): Promise<string> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) throw new Error('Tag nicht gefunden');

  const id = newId('meal');
  await stores.planDays.put({
    ...planDay,
    meals: [
      ...planDay.meals,
      { id, slot, recipeId: null, order: planDay.meals.length, servings: 1 },
    ],
  });
  return id;
}

export async function removePlanMeal(
  weekId: string,
  day: DayKey,
  entryId: string,
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return;
  await stores.planDays.put({
    ...planDay,
    meals: planDay.meals
      .filter((entry) => entry.id !== entryId)
      .map((entry, index) => ({ ...entry, order: index })),
  });
}

export async function addPlanTraining(
  weekId: string,
  day: DayKey,
  item: { exerciseId: string; sets: number; reps: string },
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return;
  await stores.planDays.put({
    ...planDay,
    training: [
      ...planDay.training,
      { ...item, id: newId('pt'), order: planDay.training.length },
    ],
  });
}

export async function removePlanTraining(
  weekId: string,
  day: DayKey,
  itemId: string,
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return;
  await stores.planDays.put({
    ...planDay,
    training: planDay.training
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index })),
  });
}

/** Reihenfolge nach Verschieben neu schreiben. */
export async function reorderPlanTraining(
  weekId: string,
  day: DayKey,
  orderedIds: string[],
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return;
  const byId = new Map(planDay.training.map((item) => [item.id, item]));
  await stores.planDays.put({
    ...planDay,
    training: orderedIds
      .map((id, index) => {
        const item = byId.get(id);
        return item ? { ...item, order: index } : undefined;
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined),
  });
}

export async function updatePlanDayNote(
  weekId: string,
  day: DayKey,
  note: string,
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (planDay) await stores.planDays.put({ ...planDay, note });
}

/**
 * Legt die nächsten noch fehlenden Wochen an.
 *
 * Ohne das griff der Anlegen-Knopf immer auf die laufende Woche und legte
 * sie ein zweites Mal an, sobald es sie schon gab. Jetzt wird lückenlos
 * hinter der letzten vorhandenen weitergezählt — und wo eine Lücke
 * klafft, wird sie geschlossen.
 */
export async function createUpcomingWeeks(count = 1): Promise<string[]> {
  const weeks = await listPlanWeeks();
  const vorhanden = new Set(weeks.map((week) => week.startDate));

  const thisMonday = startOfWeek(today());
  const letzter = weeks
    .map((week) => week.startDate)
    .filter((start) => start >= thisMonday)
    .sort()
    .at(-1);

  let cursor = letzter ? addDays(letzter, 7) : thisMonday;
  const angelegt: string[] = [];

  while (angelegt.length < count) {
    if (!vorhanden.has(cursor)) {
      angelegt.push(await createPlanWeek({ startDate: cursor }));
      vorhanden.add(cursor);
    }
    cursor = addDays(cursor, 7);
  }

  return angelegt;
}

/**
 * Wie die Woche zeitlich liegt. Wird für die Anzeige abgeleitet statt
 * gespeichert — ein von Hand gesetzter Status veraltet sonst still.
 */
export type WeekRelation = 'laufend' | 'kommend' | 'vergangen';

export function weekRelation(week: PlanWeek, from = today()): WeekRelation {
  const monday = startOfWeek(from);
  if (week.startDate === monday) return 'laufend';
  return week.startDate > monday ? 'kommend' : 'vergangen';
}

/** "Diese Woche", "In 2 Wochen", "Vor 1 Woche" */
export function weekDistanceLabel(week: PlanWeek, from = today()): string {
  const monday = startOfWeek(from);
  const wochen = Math.round(
    (fromIsoDate(week.startDate).getTime() - fromIsoDate(monday).getTime()) / (7 * 86400000),
  );

  if (wochen === 0) return 'Diese Woche';
  if (wochen === 1) return 'Nächste Woche';
  if (wochen === -1) return 'Letzte Woche';
  return wochen > 0 ? `In ${wochen} Wochen` : `Vor ${-wochen} Wochen`;
}

export function listTemplates(): Promise<PlanTemplate[]> {
  return stores.planTemplates.all();
}

/** „Übernehmen": erzeugt aus einer Vorlage eine neue Woche. */
export async function applyTemplate(
  templateId: string,
  startDate = startOfWeek(addDays(today(), 7)),
): Promise<string> {
  const template = await stores.planTemplates.get(templateId);
  if (!template) throw new Error(`Vorlage ${templateId} nicht gefunden`);

  const weekId = await createPlanWeek({ startDate, focus: template.title });
  const days = await listPlanDays(weekId);

  await stores.planDays.bulkPut(
    days.map((planDay) => {
      const source = template.days[planDay.day];
      if (!source) return planDay;
      return {
        ...planDay,
        note: source.note,
        training: source.training.map((item, index) => ({
          ...item,
          id: newId('pt'),
          order: index,
        })),
        meals: planDay.meals.map((entry) => {
          const fromTemplate = source.meals?.[entry.slot];
          return fromTemplate ? { ...entry, recipeId: fromTemplate } : entry;
        }),
      };
    }),
  );

  return weekId;
}

/** Für den Wochenstreifen auf der Pläne-Karte: welcher Tag hat Inhalt? */
export function dayFillFlags(days: PlanDay[]): boolean[] {
  const byDay = new Map(days.map((day) => [day.day, day]));
  return DAY_KEYS.map((key) => {
    const planDay = byDay.get(key);
    if (!planDay) return false;
    return (
      planDay.training.length > 0 ||
      planDay.meals.some((entry) => entry.recipeId !== null)
    );
  });
}

export { formatWeekRange };

import { newId, now, transaction } from '../db';
import { stores } from '../stores';
import { addDays, formatWeekRange, isoWeekNumber, startOfWeek, today } from '../../lib/date';
import {
  DAY_KEYS,
  MEAL_SLOTS,
  type DayKey,
  type MealSlot,
  type PlanDay,
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

function emptyMeals(): Record<MealSlot, string | null> {
  return Object.fromEntries(MEAL_SLOTS.map((slot) => [slot, null])) as Record<
    MealSlot,
    string | null
  >;
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
      meals: emptyMeals(),
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

export async function setPlanDayMeal(
  weekId: string,
  day: DayKey,
  slot: MealSlot,
  recipeId: string | null,
): Promise<void> {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return;
  await stores.planDays.put({
    ...planDay,
    meals: { ...planDay.meals, [slot]: recipeId },
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
        meals: { ...planDay.meals, ...source.meals },
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
      MEAL_SLOTS.some((slot) => planDay.meals[slot] !== null)
    );
  });
}

export const PLAN_STATE_LABELS: Record<PlanWeek['state'], string> = {
  active: 'Aktiv',
  planned: 'Geplant',
  draft: 'Entwurf',
};

export { formatWeekRange };

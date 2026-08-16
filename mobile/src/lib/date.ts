import { DAY_KEYS, type DayKey } from '../types/domain';

/** ISO-Datum ohne Zeitzone-Überraschungen: "2026-08-10". */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function today(): string {
  return toIsoDate(new Date());
}

/** Wochentag als Kürzel, mit Montag als erstem Tag. */
export function dayKeyOf(date: Date): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

export function addDays(iso: string, days: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Der Montag der Woche, in der das Datum liegt. */
export function startOfWeek(iso: string): string {
  const date = fromIsoDate(iso);
  return addDays(iso, -((date.getDay() + 6) % 7));
}

/** ISO-Kalenderwoche — die Wochen heißen im Mockup „Woche 33". */
export function isoWeekNumber(iso: string): number {
  const date = fromIsoDate(iso);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(
    firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3,
  );
  return (
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000))
  );
}

const LONG_DATE = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** "Montag, 10. August" — die Kopfzeile des Dashboards. */
export function formatLongDate(iso: string): string {
  return LONG_DATE.format(fromIsoDate(iso));
}

const SHORT_DATE = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'short',
});

/** "11.–17. Aug" — die Zeitspanne einer Planwoche. */
export function formatWeekRange(startIso: string): string {
  const start = fromIsoDate(startIso);
  const end = fromIsoDate(addDays(startIso, 6));
  const endLabel = SHORT_DATE.format(end).replace('.', '');
  return `${start.getDate()}.–${endLabel}`;
}

/** Die letzten n Tage einschließlich heute, ältester zuerst. */
export function lastDays(count: number, from = today()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(from, i - count + 1));
}

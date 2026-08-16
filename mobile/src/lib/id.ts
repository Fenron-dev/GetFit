/**
 * IDs und Zeitstempel. Bewusst ohne Abhängigkeiten, damit die Module,
 * die sie brauchen, nicht die halbe Datenbankschicht mitziehen — und
 * sich außerhalb der App prüfen lassen.
 */

/** Kurze, sortierbare ID ohne externe Abhängigkeit. */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function now(): number {
  return Date.now();
}

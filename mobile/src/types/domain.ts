/* ─────────────────────────────────────────────────────────────────────────
   Domänenmodell.

   Leitannahme aus dem Mockup: Übungen und Rezepte sind zwei gleich
   aufgebaute Bibliotheken. Der Wochenplan führt keine eigenen Einträge,
   sondern referenziert beide über ihre ID. Das Tages-Log referenziert
   ebenfalls, hält aber einen Snapshot von Titel/Meta, damit eine im
   Nachhinein umbenannte Übung die Historie nicht verfälscht.
   ───────────────────────────────────────────────────────────────────── */

/** Wochentage in der Reihenfolge, in der die Chips im Wochenplan stehen. */
export const DAY_KEYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** Die vier Kategorien aus dem Mahlzeiten-Screen — zugleich die vier
 *  Slots, die ein Tag im Wochenplan füllt. */
export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

/** Herkunft eines Datensatzes: mitgeliefert, selbst angelegt, importiert. */
export type RecordSource = 'seed' | 'own' | 'mealie';

/* ── Übungen ─────────────────────────────────────────────────────────── */

export interface Exercise {
  id: string;
  name: string;
  /** "Beine", "Brust", "Rücken", "Rumpf", "Schultern", "Cardio" */
  muscleGroup: string;
  /** Vorgabewerte, die der Wochenplan pro Eintrag überschreiben kann. */
  defaultSets: number;
  /** Frei, weil Übungen entweder Wiederholungen oder Zeit führen: "12", "45s". */
  defaultReps: string;
  restSeconds: number;
  description: string;
  /** Phosphor-Icon-Name aus dem Mockup, z. B. "PersonSimpleWalk". */
  icon: string;
  /** Platzhalter im Mockup; später eine echte GIF-/Video-Quelle. */
  mediaUrl?: string;
  source: RecordSource;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Rezepte ─────────────────────────────────────────────────────────── */

/** Eine Zutat wird in Menge, Einheit und Name zerlegt, damit die
 *  Einkaufsliste gleichartige Positionen zusammenfassen kann. `raw` hält
 *  den Originaltext, falls das Zerlegen nicht sauber aufgeht. */
export interface Ingredient {
  name: string;
  amount?: number;
  /** "g", "ml", "l", "TL", "EL", "Stück", "Prise", "Scheiben", "Zehen", "Portion" */
  unit?: string;
  raw: string;
}

export interface Nutrition {
  kcal?: number;
  /** Gramm */
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: MealSlot;
  /** Phosphor-Icon-Name, z. B. "BowlSteam". */
  icon: string;
  timeMinutes: number;
  servings: number;
  tags: string[];
  /** Nährwerte pro Portion. Fehlende Werte bleiben undefined und werden
   *  in der Oberfläche als „—" gezeigt (siehe „Ofengemüse mit Feta"). */
  nutrition: Nutrition;
  ingredients: Ingredient[];
  steps: string[];
  imageUrl?: string;
  source: RecordSource;
  /** Mealie-Slug — der Schlüssel für die Duplikat-Erkennung beim Import. */
  mealieSlug?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Wochenpläne ─────────────────────────────────────────────────────── */

export type PlanState = 'active' | 'planned' | 'draft';

export interface PlanWeek {
  id: string;
  /** "Woche 33" */
  title: string;
  /** ISO-Datum des Montags, z. B. "2026-08-11". */
  startDate: string;
  /** "Oberkörper-Fokus", "Ganzkörper", "Deload" */
  focus: string;
  state: PlanState;
  createdAt: number;
  updatedAt: number;
}

/** Ein Trainingseintrag im Plan: Referenz auf die Bibliothek plus die
 *  für diesen Tag geltenden Sätze/Wiederholungen. */
export interface PlanTrainingItem {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  order: number;
}

/** Eine Zeile je Woche und Tag. Zusammengesetzter Schlüssel `${weekId}:${day}`. */
export interface PlanDay {
  id: string;
  weekId: string;
  day: DayKey;
  /** "Push · 45 Min", "Ruhetag" */
  note: string;
  training: PlanTrainingItem[];
  /** Slot → Rezept-ID. `null` heißt „Rezept wählen". */
  meals: Record<MealSlot, string | null>;
}

/** Vorlagen aus dem Pläne-Screen: ein Bauplan, aus dem eine Woche
 *  erzeugt wird („Übernehmen"). */
export interface PlanTemplate {
  id: string;
  title: string;
  /** "3 Trainingstage · 6 Übungen" */
  meta: string;
  icon: string;
  days: Partial<Record<DayKey, TemplateDay>>;
}

export interface TemplateDay {
  note: string;
  /** Referenzen in die Übungsbibliothek. */
  training: { exerciseId: string; sets: number; reps: string }[];
  meals?: Partial<Record<MealSlot, string>>;
}

/* ── Tages-Log (Dashboard und Streak) ────────────────────────────────── */

export interface DayLogEntry {
  id: string;
  kind: 'training' | 'meal';
  /** Exercise- bzw. Recipe-ID. */
  refId: string;
  /** Snapshot zum Zeitpunkt des Eintragens. */
  title: string;
  meta: string;
  kcal?: number;
  slot?: MealSlot;
  done: boolean;
  order: number;
}

/** Ein Datensatz je Kalendertag; `date` ist der Schlüssel ("2026-08-10"). */
export interface DayLog {
  date: string;
  entries: DayLogEntry[];
  updatedAt: number;
}

/** Die drei Zustände des Streak-Bands auf dem Dashboard. */
export type StreakLevel = 'full' | 'part' | 'low';

/* ── Einkaufsliste ───────────────────────────────────────────────────── */

export interface ShoppingItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  /** Aus welchen Rezepten diese Position stammt — für die Herkunftszeile. */
  recipeIds: string[];
  /** Positionen ohne verwertbare Menge behalten ihre Originaltexte. */
  rawParts: string[];
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  weekId: string;
  /** Auf welche Tage die Liste eingegrenzt wurde; leer = ganze Woche. */
  days: DayKey[];
  items: ShoppingItem[];
  createdAt: number;
  updatedAt: number;
}

/* ── Einstellungen ───────────────────────────────────────────────────── */

/** Der Akzent ist ein Design-Token; der Typ kommt von dort, damit
 *  Farbwerte und erlaubte Werte nicht auseinanderlaufen. */
export type { AccentKey } from '../theme/tokens';
import type { AccentKey } from '../theme/tokens';

export interface MealieConnection {
  baseUrl: string;
  token: string;
  lastImportAt?: number;
  lastImportCount?: number;
  lastImportSkipped?: number;
}

export interface Settings {
  /** Einzeiliger Datensatz, Schlüssel ist immer "settings". */
  id: 'settings';
  profileName: string;
  kcalGoal: number;
  /** Globaler Schalter aus dem Mockup: blendet alle kcal-Angaben aus. */
  showKcal: boolean;
  accent: AccentKey;
  /** Wie viele erledigte Einträge einen Tag zum vollen Tag machen. */
  dailyGoalEntries: number;
  trainingsPerWeek: number;
  units: 'metric' | 'imperial';
  /** "08:00" */
  reminderTime: string;
  mealie: MealieConnection;
  updatedAt: number;
}

/* ── Mealie-Import ───────────────────────────────────────────────────── */

/** Wie ein erkannter Namenskonflikt aufgelöst wird. */
export type ConflictResolution = 'skip' | 'overwrite' | 'keepBoth';

/** Ein Kandidat im Auswahl-Screen: bereits auf das eigene Modell
 *  abgebildet, aber noch nicht gespeichert. */
export interface ImportCandidate {
  /** Temporäre ID innerhalb des Import-Laufs. */
  id: string;
  name: string;
  /** Rohkategorie aus Mealie: "breakfast", "main", "salad", … */
  mealieCategory: string;
  /** Zugeordnete eigene Kategorie. In der Auswahl änderbar. */
  category: MealSlot;
  kcal?: number;
  selected: boolean;
  /** Trifft auf ein vorhandenes Rezept (gleicher Slug oder Name). */
  conflictRecipeId?: string;
  resolution: ConflictResolution;
  /** Das fertig abgebildete Rezept ohne die Felder, die erst beim
   *  Speichern entstehen. */
  recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface ImportResult {
  imported: number;
  overwritten: number;
  skipped: number;
  at: number;
}

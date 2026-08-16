import * as SQLite from 'expo-sqlite';

/**
 * Alle Daten liegen in einer SQLite-Datei auf dem Gerät. Es gibt keinen
 * Server und keinen Sync; der Mealie-Import ist der einzige Weg, auf dem
 * Daten von außen hereinkommen.
 *
 * Gespeichert wird dokumentorientiert: jede Zeile hält ihren Datensatz
 * als JSON in `data`, daneben stehen nur die Spalten, nach denen wirklich
 * gesucht oder sortiert wird. Das passt zu Datensätzen wie einem Rezept
 * mit Zutaten und Schritten, die man ohnehin immer ganz liest, und hält
 * Schemaänderungen billig.
 */

const DATABASE_NAME = 'getfit.db';
const SCHEMA_VERSION = 2;

let database: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    muscleGroup TEXT,
    source TEXT,
    favorite INTEGER DEFAULT 0,
    externalId TEXT,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises (name);
  CREATE INDEX IF NOT EXISTS idx_exercises_external ON exercises (externalId);

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    source TEXT,
    favorite INTEGER DEFAULT 0,
    mealieSlug TEXT,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes (name);
  CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes (category);
  CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes (mealieSlug);

  CREATE TABLE IF NOT EXISTS plan_weeks (
    id TEXT PRIMARY KEY NOT NULL,
    startDate TEXT NOT NULL,
    state TEXT,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_weeks_start ON plan_weeks (startDate);

  CREATE TABLE IF NOT EXISTS plan_days (
    id TEXT PRIMARY KEY NOT NULL,
    weekId TEXT NOT NULL,
    day TEXT NOT NULL,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_days_week ON plan_days (weekId);

  CREATE TABLE IF NOT EXISTS plan_templates (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS day_logs (
    date TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shopping_lists (
    id TEXT PRIMARY KEY NOT NULL,
    weekId TEXT NOT NULL,
    createdAt INTEGER,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_shopping_week ON shopping_lists (weekId);

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL
  );
`;

/** Öffnet die Datenbank und legt das Schema an. Mehrfach aufrufbar. */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;

  const handle = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await handle.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await handle.execAsync(SCHEMA);

  const row = await handle.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const current = row?.user_version ?? 0;

  // Je ein Schritt pro Version, damit eine bestehende Installation ihre
  // Daten behält. Das CREATE oben legt neue Datenbanken gleich richtig
  // an; hier wird nur nachgezogen, was schon existiert.
  if (current > 0 && current < 2) {
    // Fassung 2: Kennung der Übung bei ExerciseDB.
    await handle.execAsync(`
      ALTER TABLE exercises ADD COLUMN externalId TEXT;
      CREATE INDEX IF NOT EXISTS idx_exercises_external ON exercises (externalId);
    `);
  }

  if (current < SCHEMA_VERSION) {
    await handle.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  database = handle;
  return handle;
}

function requireDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    throw new Error('Datenbank noch nicht geöffnet — openDatabase() fehlt.');
  }
  return database;
}

/* ── Änderungsmeldung ────────────────────────────────────────────────────
   SQLite kennt keine beobachtbaren Abfragen. Jede schreibende Operation
   meldet sich hier; die Hooks lesen daraufhin neu. Für den Umfang dieser
   App ist das genau genug und bleibt nachvollziehbar. */

type Listener = () => void;
const listeners = new Set<Listener>();

export function onDatabaseChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyChange(): void {
  listeners.forEach((listener) => listener());
}

/* ── Dokumentspeicher ──────────────────────────────────────────────────── */

type Row = { data: string };

/** Die Spalten neben `data`, die aus dem Datensatz abgeleitet werden. */
type ColumnMap<T> = Record<string, (item: T) => string | number | null>;

export class Store<T extends object> {
  private readonly table: string;
  private readonly key: string;
  private readonly columns: ColumnMap<T>;

  constructor(table: string, key: string, columns: ColumnMap<T> = {}) {
    this.table = table;
    this.key = key;
    this.columns = columns;
  }

  private serialize(item: T): { names: string[]; values: (string | number | null)[] } {
    const names = [this.key, ...Object.keys(this.columns), 'data'];
    const values = [
      (item as Record<string, unknown>)[this.key] as string,
      ...Object.values(this.columns).map((read) => read(item)),
      JSON.stringify(item),
    ];
    return { names, values };
  }

  async get(id: string): Promise<T | undefined> {
    const row = await requireDatabase().getFirstAsync<Row>(
      `SELECT data FROM ${this.table} WHERE ${this.key} = ?`,
      [id],
    );
    return row ? (JSON.parse(row.data) as T) : undefined;
  }

  async getMany(ids: string[]): Promise<(T | undefined)[]> {
    if (ids.length === 0) return [];
    const found = new Map<string, T>();
    const placeholders = ids.map(() => '?').join(',');
    const rows = await requireDatabase().getAllAsync<Row>(
      `SELECT data FROM ${this.table} WHERE ${this.key} IN (${placeholders})`,
      ids,
    );
    rows.forEach((row) => {
      const item = JSON.parse(row.data) as T;
      found.set((item as Record<string, unknown>)[this.key] as string, item);
    });
    return ids.map((id) => found.get(id));
  }

  async all(orderBy?: string): Promise<T[]> {
    const order = orderBy ? ` ORDER BY ${orderBy}` : '';
    const rows = await requireDatabase().getAllAsync<Row>(
      `SELECT data FROM ${this.table}${order}`,
    );
    return rows.map((row) => JSON.parse(row.data) as T);
  }

  async where(column: string, value: string | number, orderBy?: string): Promise<T[]> {
    const order = orderBy ? ` ORDER BY ${orderBy}` : '';
    const rows = await requireDatabase().getAllAsync<Row>(
      `SELECT data FROM ${this.table} WHERE ${column} = ?${order}`,
      [value],
    );
    return rows.map((row) => JSON.parse(row.data) as T);
  }

  async findBy(column: string, value: string | number): Promise<T | undefined> {
    const row = await requireDatabase().getFirstAsync<Row>(
      `SELECT data FROM ${this.table} WHERE ${column} = ? LIMIT 1`,
      [value],
    );
    return row ? (JSON.parse(row.data) as T) : undefined;
  }

  async count(): Promise<number> {
    const row = await requireDatabase().getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM ${this.table}`,
    );
    return row?.n ?? 0;
  }

  async put(item: T): Promise<void> {
    const { names, values } = this.serialize(item);
    const placeholders = names.map(() => '?').join(',');
    await requireDatabase().runAsync(
      `INSERT OR REPLACE INTO ${this.table} (${names.join(',')}) VALUES (${placeholders})`,
      values,
    );
    notifyChange();
  }

  async bulkPut(items: T[]): Promise<void> {
    if (items.length === 0) return;
    const handle = requireDatabase();
    await handle.withTransactionAsync(async () => {
      for (const item of items) {
        const { names, values } = this.serialize(item);
        const placeholders = names.map(() => '?').join(',');
        await handle.runAsync(
          `INSERT OR REPLACE INTO ${this.table} (${names.join(',')}) VALUES (${placeholders})`,
          values,
        );
      }
    });
    notifyChange();
  }

  async delete(id: string): Promise<void> {
    await requireDatabase().runAsync(
      `DELETE FROM ${this.table} WHERE ${this.key} = ?`,
      [id],
    );
    notifyChange();
  }

  async deleteWhere(column: string, value: string | number): Promise<void> {
    await requireDatabase().runAsync(
      `DELETE FROM ${this.table} WHERE ${column} = ?`,
      [value],
    );
    notifyChange();
  }

  async clear(): Promise<void> {
    await requireDatabase().runAsync(`DELETE FROM ${this.table}`);
    notifyChange();
  }
}

/** Mehrere Schreibvorgänge als eine Einheit — meldet einmal am Ende. */
export async function transaction(work: () => Promise<void>): Promise<void> {
  await requireDatabase().withTransactionAsync(work);
  notifyChange();
}

export { newId, now } from '../lib/id';

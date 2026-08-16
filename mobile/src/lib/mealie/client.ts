import type { MealieRecipe, MealieRecipePage } from './types';

/**
 * Zugriff auf eine Mealie-Instanz im lokalen Netz.
 *
 * In der nativen App gibt es weder CORS noch die Mixed-Content-Sperre —
 * beides sind Browser-Regeln. Die App spricht also direkt mit
 * http://<adresse>:9925, solange sie im selben WLAN hängt. Android
 * verbietet unverschlüsselte Verbindungen allerdings seit Version 9 per
 * Vorgabe; dafür steht `usesCleartextTraffic` in app.json.
 *
 * Der JSON-Import bleibt trotzdem der Hauptweg: er funktioniert auch
 * unterwegs, wenn der Server gar nicht erreichbar ist.
 */

export type MealieErrorKind = 'network' | 'auth' | 'notFound' | 'server';

export class MealieError extends Error {
  readonly kind: MealieErrorKind;

  constructor(kind: MealieErrorKind, message: string) {
    super(message);
    this.name = 'MealieError';
    this.kind = kind;
  }
}

const MESSAGES: Record<MealieErrorKind, string> = {
  network:
    'Der Server ist nicht erreichbar. Läuft Mealie, stimmen Adresse und Port, und ist das Handy im selben WLAN?',
  auth: 'Der API-Token wurde abgelehnt. Bitte in Mealie einen neuen Token erzeugen.',
  notFound: 'Unter dieser Adresse antwortet keine Mealie-API.',
  server: 'Mealie hat mit einem Fehler geantwortet.',
};

export interface MealieConfig {
  baseUrl: string;
  token: string;
}

function resolveBase(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  // Ohne Schema wäre die Adresse für fetch unbrauchbar; im Heimnetz ist
  // http die Regel, also ergänzen wir das statt zu scheitern.
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

async function request<T>(config: MealieConfig, path: string): Promise<T> {
  const url = `${resolveBase(config.baseUrl)}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
    });
  } catch {
    throw new MealieError('network', MESSAGES.network);
  }

  if (response.status === 401 || response.status === 403) {
    throw new MealieError('auth', MESSAGES.auth);
  }
  if (response.status === 404) {
    throw new MealieError('notFound', MESSAGES.notFound);
  }
  if (!response.ok) {
    throw new MealieError('server', `${MESSAGES.server} (HTTP ${response.status})`);
  }

  return (await response.json()) as T;
}

/** Erreichbarkeitsanzeige im Import-Screen („erreichbar"). */
export async function checkConnection(config: MealieConfig): Promise<boolean> {
  try {
    await request<unknown>(config, '/api/app/about');
    return true;
  } catch {
    return false;
  }
}

/** Holt die Rezeptliste; blättert selbstständig durch alle Seiten. */
export async function fetchRecipeList(
  config: MealieConfig,
  { perPage = 100, maxPages = 20 } = {},
): Promise<MealieRecipe[]> {
  const all: MealieRecipe[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await request<MealieRecipePage>(
      config,
      `/api/recipes?page=${page}&perPage=${perPage}`,
    );
    const items = result.items ?? [];
    all.push(...items);
    const totalPages = result.total_pages ?? 1;
    if (items.length === 0 || page >= totalPages) break;
  }

  return all;
}

/**
 * Die Listenantwort enthält keine Zutaten und Schritte — die stehen erst
 * im Einzelabruf. Deshalb werden nur die tatsächlich ausgewählten Rezepte
 * nachgeladen, in kleinen Wellen statt alle gleichzeitig.
 */
export async function fetchRecipeDetails(
  config: MealieConfig,
  slugs: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<MealieRecipe[]> {
  const results: MealieRecipe[] = [];
  const batchSize = 4;

  for (let index = 0; index < slugs.length; index += batchSize) {
    const batch = slugs.slice(index, index + batchSize);
    const loaded = await Promise.all(
      batch.map((slug) =>
        request<MealieRecipe>(config, `/api/recipes/${encodeURIComponent(slug)}`),
      ),
    );
    results.push(...loaded);
    onProgress?.(Math.min(index + batchSize, slugs.length), slugs.length);
  }

  return results;
}

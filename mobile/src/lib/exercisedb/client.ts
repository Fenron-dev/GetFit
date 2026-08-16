import type { ExerciseDbEntry } from './types';

/**
 * ExerciseDB über RapidAPI.
 *
 * Die API braucht einen persönlichen Schlüssel — kostenlos, aber an ein
 * Konto gebunden. Er liegt in den Einstellungen und bleibt wie alles
 * andere auf dem Gerät.
 *
 * Die GIF-Adressen zeigen auf einen eigenen Bildserver und wollen
 * denselben Schlüssel sehen; deshalb gibt es hier auch die Kopfzeilen
 * für den Download.
 */

const HOST = 'exercisedb.p.rapidapi.com';
const BASE = `https://${HOST}`;

export type ExerciseDbErrorKind = 'network' | 'auth' | 'quota' | 'server';

export class ExerciseDbError extends Error {
  readonly kind: ExerciseDbErrorKind;

  constructor(kind: ExerciseDbErrorKind, message: string) {
    super(message);
    this.name = 'ExerciseDbError';
    this.kind = kind;
  }
}

const MESSAGES: Record<ExerciseDbErrorKind, string> = {
  network: 'Keine Verbindung zu ExerciseDB. Ist das Handy online?',
  auth: 'Der Schlüssel wurde abgelehnt. Prüf ihn in den Einstellungen — und ob ExerciseDB in deinem RapidAPI-Konto abonniert ist.',
  quota: 'Das Kontingent für heute ist aufgebraucht. Der kostenlose Tarif erlaubt eine begrenzte Zahl Abrufe pro Monat.',
  server: 'ExerciseDB hat mit einem Fehler geantwortet.',
};

/** Die Kopfzeilen, die sowohl die API als auch der Bildserver sehen wollen. */
export function authHeaders(apiKey: string): Record<string, string> {
  return {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': HOST,
  };
}

async function request<T>(apiKey: string, path: string): Promise<T> {
  if (!apiKey.trim()) {
    throw new ExerciseDbError('auth', 'Es ist kein Schlüssel hinterlegt.');
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { ...authHeaders(apiKey), Accept: 'application/json' },
    });
  } catch {
    throw new ExerciseDbError('network', MESSAGES.network);
  }

  if (response.status === 401 || response.status === 403) {
    throw new ExerciseDbError('auth', MESSAGES.auth);
  }
  if (response.status === 429) {
    throw new ExerciseDbError('quota', MESSAGES.quota);
  }
  if (!response.ok) {
    throw new ExerciseDbError('server', `${MESSAGES.server} (HTTP ${response.status})`);
  }

  return (await response.json()) as T;
}

/** Die Liste der Körperregionen — die Einstiegsauswahl im Screen. */
export function fetchBodyParts(apiKey: string): Promise<string[]> {
  return request<string[]>(apiKey, '/exercises/bodyPartList');
}

/** Übungen einer Körperregion. */
export function fetchByBodyPart(
  apiKey: string,
  bodyPart: string,
  limit = 40,
): Promise<ExerciseDbEntry[]> {
  return request<ExerciseDbEntry[]>(
    apiKey,
    `/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`,
  );
}

/** Freitextsuche über den Namen. */
export function searchByName(
  apiKey: string,
  term: string,
  limit = 40,
): Promise<ExerciseDbEntry[]> {
  return request<ExerciseDbEntry[]>(
    apiKey,
    `/exercises/name/${encodeURIComponent(term.toLowerCase())}?limit=${limit}&offset=0`,
  );
}

/** Prüft Schlüssel und Erreichbarkeit in einem Zug. */
export async function checkKey(apiKey: string): Promise<boolean> {
  try {
    await fetchBodyParts(apiKey);
    return true;
  } catch {
    return false;
  }
}

import type { Exercise } from '../../types/domain';
import {
  bodyPartLabel,
  buildDescription,
  displayName,
  iconForBodyPart,
} from '../exerciseLabels';

/**
 * Der mitgelieferte Übungsdatensatz — 1.324 Einträge aus
 * github.com/Fenron-dev/exercises-dataset, abgespeckt auf das, was die
 * App braucht (siehe assets/data/HERKUNFT.md).
 *
 * Die Daten stehen unter MIT und liegen deshalb in der App: Suchen und
 * Übernehmen brauchen kein Netz. Die GIFs sind nicht dabei — sie gehören
 * Gym visual und werden bei Bedarf einzeln geholt.
 */

export interface DatasetEntry {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondary: string[];
  /** Anleitungsschritte, englisch. */
  steps: string[];
  /** Pfad im Datensatz-Repository, z. B. "images/0001-2gPfomN.jpg". */
  image: string;
  gif: string;
}

/** Pflichtangabe zu jedem Bild aus diesem Datensatz. */
export const MEDIA_ATTRIBUTION = '© Gym visual — https://gymvisual.com/';

const REPO = 'Fenron-dev/exercises-dataset';
const BRANCH = 'main';

/** Vollständige Adresse zu einer Mediendatei im Datensatz. */
export function mediaUrl(path: string): string {
  return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
}

/**
 * Erst beim ersten Zugriff geladen und geparst. Knapp 1 MB JSON soll den
 * Start der App nicht aufhalten, wenn niemand den Import öffnet.
 */
let cache: DatasetEntry[] | undefined;

export function loadDataset(): DatasetEntry[] {
  if (!cache) {
    cache = require('../../../assets/data/exercises-index.json') as DatasetEntry[];
  }
  return cache;
}

export function datasetSize(): number {
  return loadDataset().length;
}

/** Die Körperregionen mit ihrer Anzahl — die Einstiegsauswahl. */
export function listBodyParts(): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of loadDataset()) {
    counts.set(entry.bodyPart, (counts.get(entry.bodyPart) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: bodyPartLabel(value), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

/** Die Gerätearten innerhalb einer Körperregion. */
export function listEquipment(bodyPart?: string): string[] {
  const entries = bodyPart
    ? loadDataset().filter((entry) => entry.bodyPart === bodyPart)
    : loadDataset();
  return [...new Set(entries.map((entry) => entry.equipment))].sort();
}

/**
 * Suche über Name, Zielmuskel und Gerät. Der Datensatz ist englisch —
 * „squat“ findet die Kniebeuge, „Kniebeuge“ nicht. Die deutschen
 * Bezeichnungen der Körperregion werden mitgeprüft, damit „Beine“
 * trotzdem etwas findet.
 */
export function searchDataset(
  query: string,
  options: { bodyPart?: string; equipment?: string; limit?: number } = {},
): DatasetEntry[] {
  const { bodyPart, equipment, limit = 60 } = options;
  const needle = query.trim().toLowerCase();

  const matches = loadDataset().filter((entry) => {
    if (bodyPart && entry.bodyPart !== bodyPart) return false;
    if (equipment && entry.equipment !== equipment) return false;
    if (!needle) return true;
    return (
      entry.name.toLowerCase().includes(needle) ||
      entry.target.toLowerCase().includes(needle) ||
      entry.equipment.toLowerCase().includes(needle) ||
      bodyPartLabel(entry.bodyPart).toLowerCase().includes(needle)
    );
  });

  // Treffer im Namen zuerst — ein Fund über das Gerät ist schwächer.
  if (needle) {
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
      const bName = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
      return aName - bName || a.name.localeCompare(b.name);
    });
  }

  return matches.slice(0, limit);
}

export function findEntry(id: string): DatasetEntry | undefined {
  return loadDataset().find((entry) => entry.id === id);
}

export type ExerciseDraft = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;

/** Bildet einen Datensatz-Eintrag auf eine Übung ab. */
export function mapDatasetEntry(entry: DatasetEntry): ExerciseDraft {
  const muscleGroup = bodyPartLabel(entry.bodyPart);

  return {
    name: displayName(entry.name),
    muscleGroup,
    defaultSets: 3,
    defaultReps: entry.bodyPart === 'cardio' ? '60s' : '12',
    restSeconds: 90,
    description: buildDescription({
      equipment: entry.equipment,
      target: entry.target,
      steps: entry.steps,
    }),
    icon: iconForBodyPart(muscleGroup),
    source: 'own',
    favorite: false,
    // Die Kennung wird mit einem Vorsatz geführt, damit sie sich nicht
    // mit einer ExerciseDB-Kennung überschneidet.
    externalId: `ds:${entry.id}`,
  };
}

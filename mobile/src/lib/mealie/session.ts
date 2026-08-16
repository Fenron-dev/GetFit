import { useSyncExternalStore } from 'react';
import type { ImportCandidate } from '../../types/domain';

/**
 * Ein Importlauf lebt zwischen zwei Screens: gefunden wird auf dem einen,
 * ausgewählt auf dem anderen. Die Kandidaten liegen deshalb hier — im
 * Arbeitsspeicher, nicht in der Datenbank. Ein abgebrochener Lauf soll
 * keine Spuren hinterlassen; erst das Übernehmen schreibt.
 */

interface Session {
  candidates: ImportCandidate[];
  /** Woher der Lauf kam — für die Überschrift der Auswahl. */
  origin: string;
}

let session: Session = { candidates: [], origin: '' };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startSession(candidates: ImportCandidate[], origin: string): void {
  session = { candidates, origin };
  emit();
}

export function clearSession(): void {
  session = { candidates: [], origin: '' };
  emit();
}

export function updateCandidate(
  id: string,
  patch: (candidate: ImportCandidate) => ImportCandidate,
): void {
  session = {
    ...session,
    candidates: session.candidates.map((candidate) =>
      candidate.id === id ? patch(candidate) : candidate,
    ),
  };
  emit();
}

export function setAllSelected(selected: boolean): void {
  session = {
    ...session,
    candidates: session.candidates.map((candidate) => ({ ...candidate, selected })),
  };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): Session {
  return session;
}

export function useImportSession(): Session {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

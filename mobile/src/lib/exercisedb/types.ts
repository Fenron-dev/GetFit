/**
 * Ausschnitt aus dem ExerciseDB-Modell (RapidAPI).
 * Locker typisiert, weil die API Felder je nach Eintrag weglässt.
 */
export interface ExerciseDbEntry {
  id?: string;
  name?: string;
  /** "back", "chest", "upper legs", … */
  bodyPart?: string;
  /** Der genaue Zielmuskel, z. B. "quads". */
  target?: string;
  equipment?: string;
  /** Die Adresse des GIFs. */
  gifUrl?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
}

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseMealieJson } from './import';
import type { MealieRecipe } from './types';

/**
 * Der zweite Importweg: eine aus Mealie exportierte Datei auswählen.
 * Im Entwurf war das eine Ablagefläche zum Hineinziehen — auf dem Handy
 * ist es die Dateiauswahl des Systems.
 *
 * Gibt `null` zurück, wenn die Auswahl abgebrochen wurde.
 */
export async function pickMealieJson(): Promise<{
  recipes: MealieRecipe[];
  fileName: string;
} | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const file = new FileSystem.File(asset.uri);
  const text = await file.text();

  return { recipes: parseMealieJson(text), fileName: asset.name };
}

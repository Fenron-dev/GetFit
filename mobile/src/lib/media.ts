import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Medien für Übungen und Rezepte — GIF, Bild oder kurzes Video.
 *
 * Alles wird ins App-Verzeichnis kopiert, nicht bloß verlinkt: eine
 * Datei aus dem Download-Ordner kann gelöscht oder umbenannt werden, und
 * die App soll auch dann noch etwas anzeigen. Damit bleibt sie zugleich
 * vollständig offline.
 */

const FOLDER = 'medien';

function mediaDirectory(): Directory {
  const directory = new Directory(Paths.document, FOLDER);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

/** Endung aus Dateiname oder Adresse, mit gif als Vorgabe. */
function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/\.(gif|webp|png|jpe?g|mp4|webm)(?:\?|$)/);
  return match ? match[1] : 'gif';
}

/** Löscht eine zuvor gespeicherte Datei, falls vorhanden. */
export function removeMedia(uri: string | undefined): void {
  if (!uri || !uri.includes(`/${FOLDER}/`)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Eine schon verschwundene Datei ist kein Fehler.
  }
}

/**
 * Datei aus der Systemauswahl übernehmen. Gibt die Adresse der Kopie im
 * App-Verzeichnis zurück, oder null bei Abbruch.
 */
export async function pickMediaFile(ownerId: string): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/gif', 'image/webp', 'image/*', 'video/mp4', 'video/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const target = new File(
    mediaDirectory(),
    `${ownerId}-${Date.now()}.${extensionOf(asset.name ?? asset.uri)}`,
  );

  await new File(asset.uri).copy(target);
  return target.uri;
}

/**
 * Datei von einer Adresse holen und ablegen. Für GIFs, die man im Netz
 * oder auf dem eigenen Server gefunden hat.
 */
export async function downloadMedia(ownerId: string, url: string): Promise<string> {
  const address = url.trim();
  if (!/^https?:\/\//i.test(address)) {
    throw new Error('Die Adresse muss mit http:// oder https:// beginnen.');
  }

  const target = new File(
    mediaDirectory(),
    `${ownerId}-${Date.now()}.${extensionOf(address)}`,
  );

  const downloaded = await File.downloadFileAsync(address, target);
  if (!downloaded.exists || (downloaded.size ?? 0) === 0) {
    throw new Error('Unter dieser Adresse kam keine Datei an.');
  }
  return downloaded.uri;
}

/** Zeigt die Adresse auf eine eigene, lokal abgelegte Datei? */
export function isLocalMedia(uri: string | undefined): boolean {
  return Boolean(uri && uri.includes(`/${FOLDER}/`));
}

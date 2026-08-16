# GetFit

Android-App für Training und Ernährung. Alle Daten liegen in einer
SQLite-Datei auf dem Gerät — kein Server, kein Konto, kein Sync.

## Entwickeln

```bash
npm install
npm start          # Metro-Bundler; QR-Code mit Expo Go scannen
npm run android    # startet direkt auf angeschlossenem Gerät/Emulator
npm run typecheck  # TypeScript ohne Ausgabe prüfen
```

Für den Alltag reicht Expo Go auf dem Handy: `npm start`, QR-Code
scannen, die App lädt über WLAN. Änderungen erscheinen sofort.

**Ausnahme:** Der direkte Mealie-Abruf über `http://` braucht die
Einstellung `usesCleartextTraffic`, die erst in einem eigenen Build wirkt.
In Expo Go funktioniert der JSON-Import, der Server-Abruf unter Umständen
nicht.

## APK bauen

Der Build läuft auf GitHubs Runnern — lokal wird weder ein Android-SDK
noch Gradle gebraucht.

Bei jedem Push nach `main`, der `mobile/` berührt, startet der Workflow
*Android-APK* von allein. Manuell geht es über *Actions → Android-APK →
Run workflow*.

Die fertige Datei hängt am Lauf unter **Artifacts** (`getfit-apk-<Nr>`),
30 Tage lang. Herunterladen, entpacken, auf dem Handy öffnen. Android
fragt einmal nach der Erlaubnis, Apps aus dieser Quelle zu installieren.

Jeder Lauf zählt den `versionCode` hoch, damit sich eine neue Fassung
über die installierte legen lässt.

Zum Signieren siehe `SIGNIERUNG.md` im Wurzelverzeichnis — ohne
Einrichtung nimmt der Build Expos festen Debug-Schlüssel, was für die
eigene Installation genügt.

## Mealie

Zwei Wege:

1. **JSON-Datei** — in Mealie exportieren, in der App unter
   *Mehr → Mealie-Import* auswählen. Funktioniert immer, auch ohne Netz.
2. **Server direkt** — Adresse und API-Token in der App hinterlegen. Die
   native App kennt weder CORS noch Mixed-Content-Sperren, spricht also
   direkt mit `http://<adresse>:9925`, solange das Handy im selben WLAN
   ist.

In beiden Fällen zeigt die Auswahl jedes gefundene Rezept einzeln — es
wird nur übernommen, was angehakt ist.

## Daten zurücksetzen

Der Startbestand wird einmalig beim ersten Start geschrieben. Zum
Zurücksetzen die App-Daten in den Android-Einstellungen löschen oder die
Datei `getfit.db` aus dem App-Verzeichnis entfernen.

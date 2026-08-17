# GetFit

Fitness- und Ernährungs-App als native Android-App (Expo / React Native).
Umsetzung des UI-Mockups aus
`Dokumentationen/Minimalist Fitness App UI-handoff.zip`.

## Verzeichnisse

- `mobile/` — die App (Expo SDK 57, React Native, TypeScript, expo-router)
- `design/` — die Entwurfsvorlage aus dem Handoff. **Referenz, kein Code.**
  `FitPhone.dc.html` enthält alle zehn Screens samt Beispieldaten,
  `nocturne-readme.md` die Regeln des Design-Systems.
- `Dokumentationen/` — das ursprüngliche Handoff-Archiv

## Grundsätze

**Das Mockup ist maßgeblich.** Maße, Farben und Abstände stehen im
Quelltext von `design/FitPhone.dc.html`. Bei Zweifeln dort nachsehen,
nicht schätzen. Die Screens werden pixelgenau nachgebaut, aber nicht die
interne Struktur des Prototyps — der ist ein Entwurfsmedium in HTML.

**Alle Werte kommen aus den Tokens.** `mobile/src/theme/tokens.ts` ist die
einzige Stelle mit Hex-Werten, Schriftgrößen, Abständen und Radien.

**Nocturne-Regeln, die leicht durchrutschen:**
- Primäraktionen sind ein Akzent-Umriss auf transparent, nie eine Füllung.
- Überschriften nicht über Gewicht 500 — Hierarchie ist Größe und Weißraum.
- Kein reines Schwarz oder Weiß; alles aus den Rampen.
- Der Akzent trägt keine großen Flächen, nur Linien, Marken und Glow.
- Was im Entwurf `box-shadow: 0 0 0 1px …` heißt, ist hier ein Rahmen:
  `...edge()` aus dem Theme.

**Alles bleibt lokal.** Kein Server, kein Konto, kein Sync. Daten liegen
in SQLite auf dem Gerät. Der einzige Netzzugriff ist der optionale
Mealie-Abruf im heimischen WLAN.

**Sprache.** Oberfläche, Kommentare und Commit-Nachrichten auf Deutsch.
Bezeichner im Code auf Englisch, außer wo die Domäne deutsch ist.

## Architektur

```
mobile/
  app/                     Routen (expo-router, dateibasiert)
    _layout.tsx            Schriften, Datenbank, ThemeProvider
    (tabs)/_layout.tsx     die fünf Tabs
    (tabs)/<bereich>/      je Tab ein eigener Stack
  src/
    types/domain.ts        Datenmodell für alle Screens
    theme/                 Tokens und ThemeProvider (Akzent, Einstellungen)
    data/
      db.ts                SQLite-Verbindung, Dokumentspeicher, Meldungen
      stores.ts            ein Speicher je Aggregat
      seed.ts              Startbestand aus dem Mockup
      bootstrap.ts         Erstbefüllung, Sicherung exportieren/einlesen
      repositories/        die einzige Stelle, an der geschrieben wird
    lib/
      date.ts              Wochen-, Tages- und Formatierungshelfer
      ingredients.ts       Mengen zerlegen, Einkaufsliste zusammenfassen
      mealie/              Client, Abbildung, Import, Dateiauswahl
    components/            geteilte Bausteine
    hooks/useQuery.ts      liest neu, sobald irgendwo geschrieben wurde
```

Screens lesen über `useQuery` und schreiben ausschließlich über die
Repositories. Kein globaler Zustandsspeicher — SQLite ist die Quelle der
Wahrheit, die Oberfläche folgt ihr.

**Speicherform:** dokumentorientiert. Jede Zeile hält ihren Datensatz als
JSON in `data`; daneben stehen nur die Spalten, nach denen gesucht oder
sortiert wird. Neue Felder brauchen deshalb keine Migration, neue Indizes
schon.

## Befehle

```bash
cd mobile
npm start          # Metro-Bundler für Expo Go
npm run android    # auf angeschlossenem Gerät starten
npm run typecheck  # TypeScript prüfen
```

**Builds laufen nicht lokal.** Die APK entsteht auf GitHubs Runnern
(`.github/workflows/android.yml`), weil hier weder Platz noch Android-SDK
dafür da sind. Ergebnis hängt als Artifact am Workflow-Lauf. Der
`android/`-Ordner steht deshalb nicht im Repository — er entsteht bei
jedem Lauf neu aus `app.json` und den Plugins.

Nach größeren Änderungen `npx expo export --platform android` laufen
lassen — das bündelt vollständig und deckt Importfehler auf, die die
Typprüfung nicht sieht.

## Übungsdaten

1.324 Übungen liegen als abgespeckter Index in
`mobile/assets/data/exercises-index.json` — MIT-lizenzierte Daten aus
`github.com/Fenron-dev/exercises-dataset`. Suche und Import laufen
deshalb offline.

Die GIFs stehen **nicht** unter MIT (© Gym visual) und liegen nicht in
der App. Sie werden einzeln aus dem Datensatz-Repository geholt und
lokal abgelegt; jede so bebilderte Übung führt die vorgeschriebene
Angabe in `mediaAttribution` mit und zeigt sie an. Ein selbst gesetztes
Bild löscht sie mit.

Der Abruf läuft der Reihe nach mit Pause — GitHub begrenzt die Anfragen
je Adresse.

## Mealie

Zwei Wege, bewusst redundant:

1. **JSON** — eine aus Mealie exportierte Datei wird über die
   Dateiauswahl geladen. Funktioniert immer, auch ohne Netz. Der Hauptweg.
2. **Server** — direkter Abruf im WLAN. In der nativen App gibt es weder
   CORS noch Mixed Content; `usesCleartextTraffic` in `app.json` erlaubt
   die unverschlüsselte Verbindung, die Android sonst blockt.

Importiert wird nie alles: der Auswahl-Screen zeigt jedes gefundene
Rezept mit Häkchen, Kategorie-Zuordnung und — bei Namensgleichheit — der
Entscheidung überspringen / ersetzen / beide behalten.

## Datenbank ändern

`SCHEMA_VERSION` in `src/data/db.ts` hochzählen und den Schritt in
`openDatabase()` ergänzen, je einer pro Version. Niemals das bestehende
Schema umschreiben — sonst verliert eine installierte App ihre Daten.

# Umsetzungsplan

Stand: 16. August 2026.

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Technologie | Native Android-App mit Expo / React Native und TypeScript |
| Verteilung | APK über EAS bauen, direkt aufs Handy — kein Store, kein Hosting |
| Daten | Ausschließlich lokal in SQLite, kein Server, kein Sync |
| Mealie | JSON-Import als Hauptweg, direkter Server-Abruf im WLAN als Komfortweg; importiert wird nur die getroffene Auswahl |
| Umfang | Alle zehn Screens mit echter Persistenz |
| Zusätzlich | Anlegen-Flow hinter dem „+“, Einkaufsliste aus dem Wochenplan, Duplikat-Behandlung beim Import |

Zuvor war eine Web-PWA geplant. Der Wechsel erfolgte, bevor Screens
gebaut waren; die Logik wurde übernommen, nur die Darstellungsschicht
und die Persistenz sind neu.

## Was bereits steht

- **Gerüst** — Expo SDK 57, React Native 0.86, expo-router, TypeScript.
  Typprüfung sauber, `expo export` bündelt fehlerfrei.
- **Design-Tokens** — die Nocturne-Rampen, Abstände, Radien und
  Schriftrollen als TypeScript; die vier Akzentfarben des Mockups zur
  Laufzeit umschaltbar über den ThemeProvider.
- **Datenmodell** — Übungen, Rezepte, Planwochen und -tage, Vorlagen,
  Tages-Log, Einkaufsliste, Einstellungen, Import-Kandidaten.
- **Persistenz** — SQLite mit dokumentorientiertem Speicher, ein
  Repository je Aggregat, Änderungsmeldung für Abfragen, Erstbefüllung
  mit dem vollständigen Beispielbestand des Mockups (8 Übungen,
  8 Rezepte, 3 Planwochen mit 21 Tagen, 2 Vorlagen).
- **Zutatenlogik** — Mengen zerlegen („2 × 150 g“ → 300 g), skalieren,
  für die Einkaufsliste nach Name und Einheit zusammenfassen.
- **Mealie** — Client mit benannten Fehlern, Abbildung samt
  Kategorie-Heuristik, JSON-Parser für die gängigen Exportformen,
  Dateiauswahl, Import mit Duplikat-Erkennung und drei Auflösungen.
- **Navigation** — fünf Tabs, je Tab ein eigener Stack, alle dreizehn
  Screens als Route vorhanden.
- **Geteilte Bausteine** — Karte, Bibliothekszeile mit Icon-Kachel,
  Fakten-Kachel, Chip, Abschnittskopf, Suchzeile, Zurück-Kopfzeile,
  Akzent-Umriss-Aktion, Anlegen-Knopf und der Medienbereich mit den drei
  Bewegungen des Entwurfs (Atmen, Lichtstreifen, pulsierender Punkt).
  Verläufe über react-native-svg, weil React Natives eigene noch als
  „experimental“ gekennzeichnet sind.
- **Screens 02–05 gebaut** — Übungsbibliothek mit Suche, Übungs-Detail
  mit GIF-Platzhalter und „Zum Heute-Plan hinzufügen“, Mahlzeiten nach
  Kategorien mit Import-Zeile, Rezept-Detail mit Tags, Makro-Kacheln,
  Zutaten und Zubereitung. Alle vier lesen echt aus SQLite.
- **Verpackung** — App-Icon, adaptives Android-Icon, Splash, `eas.json`
  mit APK-Profil, Cleartext-Freigabe für den Mealie-Abruf.

## Reihenfolge des Weiterbaus

**1 — Geteilte Bausteine.** ✓ erledigt.

**2 — Die beiden Bibliotheken.** ✓ erledigt: Screens 02, 03, 04 und 05.
Es fehlt noch die Checkbox-Zeile, die erst das Dashboard braucht.

**3 — Dashboard.** Screen 01 braucht das Tages-Log, das aus dem Plan
entsteht — also nach den Bibliotheken.

**4 — Pläne.** Screens 06 und 07, inklusive Duplizieren und Vorlagen.

**5 — Einstellungen und Import.** Screens 08, 09 und 10.

**6 — Die drei Ergänzungen.** Anlegen-Formulare, Einkaufsliste,
Konfliktauflösung in der Import-Auswahl.

**7 — Feinschliff.** Übergänge, leere Zustände, Zurück-Geste,
Bildschirmleser-Beschriftungen, erste APK aufs Handy.

## Offene Punkte

**Bündelgröße.** Der JavaScript-Anteil liegt bei rund 9 MB, ein guter
Teil davon ist das vollständige Phosphor-Icon-Set — Metro entfernt
Ungenutztes nicht von allein. Für eine selbst installierte App ist das
verschmerzbar; falls es stört, lässt sich das Set auf die tatsächlich
verwendeten Symbole eindampfen.

**Rezeptbilder aus Mealie.** Die liegen als URL auf dem Server. Solange
das Handy nicht im Heimnetz ist, zeigt die App den Platzhalter aus dem
Mockup. Alternative wäre, die Bilder beim Import mitzunehmen und lokal
abzulegen — kostet Speicher, macht die App aber unabhängig. Offen.

**Erinnerungen.** Der Einstellungs-Screen sieht „Erinnerungen · 08:00“
vor. Dafür braucht es `expo-notifications` und eine Berechtigung. Noch
nicht eingebaut.

**Eigene Vorlagen.** „Push / Pull / Legs“ und „Meal Prep · 5 Tage“ liegen
als Startbestand. Ob eigene Vorlagen anlegbar sein sollen, ist offen.

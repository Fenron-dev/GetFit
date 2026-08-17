# Umsetzungsplan

Stand: 16. August 2026.

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Technologie | Native Android-App mit Expo / React Native und TypeScript |
| Verteilung | APK über EAS bauen, direkt aufs Handy — kein Store, kein Hosting |
| Daten | Ausschließlich lokal in SQLite, kein Server, kein Sync |
| Mealie | JSON-Import als Hauptweg, direkter Server-Abruf im WLAN als Komfortweg; importiert wird nur die getroffene Auswahl |
| Übungen | 1.324 Übungen liegen als MIT-Daten in der App; die GIFs (© Gym visual) werden einzeln aus dem Fork geholt und lokal abgelegt |
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

## Alle zehn Screens sind gebaut

| # | Screen | Zustand |
|---|---|---|
| 01 | Dashboard | Streak-Band, Fortschritt, Abhaken |
| 02 | Übungen | Suche, Bibliothek, Anlegen |
| 03 | Übungs-Detail | GIF-Platzhalter, Fakten, zum Tag hinzufügen |
| 04 | Mahlzeiten | vier Gruppen, Import-Einstieg |
| 05 | Rezept-Detail | Tags, Makros, Zutaten, Zubereitung |
| 06 | Pläne | Wochenkarten, Vorlagen übernehmen |
| 07 | Wochenplan | Tageswahl, Training, vier Slots, duplizieren |
| 08 | Einstellungen | kcal-Schalter, Akzentwahl, Sicherung |
| 09 | Mealie-Import | Server und Datei |
| 10 | Import-Auswahl | Auswahl, Kategorien, Konflikte |

Dazu die drei Ergänzungen, die im Entwurf offen waren: der Anlegen-Flow
hinter dem „+“ für Übungen und Rezepte, die Einkaufsliste aus dem
Wochenplan und die Duplikat-Auflösung beim Import (überspringen,
ersetzen, beide behalten).

## Vorrat und Meal Prep

Beim Einplanen einer Mahlzeit wird gefragt, ob mehr gekocht wird als an
diesem Tag gegessen. Der Vorrat entsteht dann beim **Abhaken** — also
wenn tatsächlich gekocht wurde, nicht schon beim Planen.

Ein Posten kennt Ort (Kühlschrank, Gefrierer, Vorrat), Kochtag und ein
Verbrauchsdatum aus einer Faustregel: 3 Tage im Kühlschrank, 90 im
Gefrierer, 30 im Schrank. Drängt etwas, erscheint es auf dem Dashboard,
steht in der Rezeptauswahl ganz oben und meldet sich als Benachrichtigung.

Wird ein Eintrag aus dem Vorrat geplant, verbraucht das Abhaken die
Portionen — und die Einkaufsliste lässt die Zutaten weg, weil nichts
gekocht wird.

## Was noch aussteht

**Feinschliff am Gerät.** Abstände und Proportionen stammen aus dem
Quelltext des Entwurfs, sind aber nie auf einem echten Bildschirm
gegengelesen worden. React Native rundet manches anders als CSS.

**Erinnerungen.** Im Entwurf als Einstellung vorgesehen; braucht
`expo-notifications`.

## Offene Punkte

**Bündelgröße.** Die fertige APK liegt bei 45 MB, ein guter Teil davon
ist das vollständige Phosphor-Icon-Set — Metro entfernt Ungenutztes nicht
von allein. Für eine selbst installierte App verschmerzbar; falls es
stört, lässt sich das Set auf die knapp 30 tatsächlich verwendeten
Symbole eindampfen.

**Rezeptbilder aus Mealie.** Die liegen als URL auf dem Server; unterwegs
sind sie nicht erreichbar und die App fällt auf den Platzhalter zurück.
Über „Foto → Adresse“ lässt sich ein Bild dauerhaft übernehmen. Ein
automatisches Mitnehmen beim Import wäre möglich, kostet aber Speicher —
offen.

**Erinnerungen.** Der Einstellungs-Screen sieht „Erinnerungen · 08:00“
vor. Dafür braucht es `expo-notifications` und eine Berechtigung. Noch
nicht eingebaut.

**Eigene Vorlagen.** „Push / Pull / Legs“ und „Meal Prep · 5 Tage“ liegen
als Startbestand. Ob eigene Vorlagen anlegbar sein sollen, ist offen.

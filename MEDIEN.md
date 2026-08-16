# GIFs und Fotos einsetzen

Jede Übung kann ein GIF zeigen, das den Ablauf vorführt, jedes Rezept ein
Foto. Beides setzt du selbst — die App bringt keine Bilder mit.

## Drei Wege

1. **ExerciseDB** — Übungen samt GIF holen, das den Ablauf zeigt.
   Braucht einen eigenen Schlüssel, siehe unten.
2. **Datei** — irgendeine GIF-, WebP-, PNG-, JPEG- oder MP4-Datei vom
   Gerät.
3. **Adresse** — eine Datei aus dem Netz einmalig herunterladen.

In allen drei Fällen landet eine **Kopie** im App-Verzeichnis. Räumst du
später Downloads auf, bleibt die Anzeige stehen, und die App braucht kein
Netz mehr.

## ExerciseDB einrichten

Die Bilder kommen nicht mit der App, sondern werden mit deinem eigenen
Zugang geholt — das ist der Grund für den Schlüssel.

1. Bei **RapidAPI** anmelden (kostenlos).
2. Dort das Angebot **ExerciseDB** abonnieren; der Basistarif kostet
   nichts und erlaubt eine begrenzte Zahl Abrufe im Monat.
3. Den persönlichen Schlüssel (`X-RapidAPI-Key`) kopieren.
4. In der App: **Mehr → ExerciseDB-Schlüssel** einsetzen.

Danach stehen zwei Dinge offen:

**Mehr → Übungen aus ExerciseDB** — nach Namen suchen oder eine
Körperregion wählen, ankreuzen, übernehmen. Jede übernommene Übung bringt
ihr GIF mit, das dabei heruntergeladen und lokal abgelegt wird. Was schon
in der Bibliothek steht, wird als solches gekennzeichnet und nicht
doppelt angelegt.

**Bei einer vorhandenen Übung** — im Detail steht neben „Datei" und
„Adresse" der Knopf **ExerciseDB**. Damit bekommen auch die
mitgelieferten Übungen nachträglich ihr GIF.

Ein Hinweis zur Suche: ExerciseDB kennt nur **englische** Namen. „squat"
findet die Kniebeuge, „Kniebeuge" findet nichts. Beim Import werden
Körperregion und Gerät ins Deutsche übersetzt, Name und Anleitung bleiben
englisch — eine maschinelle Übersetzung wäre schlechter als das Original.

## Zur Nutzung

Die Bilder von ExerciseDB sind für den eigenen Gebrauch geholt. Gib die
App mit den heruntergeladenen Dateien nicht weiter.

## Einsetzen

Übung oder Rezept öffnen. Unter dem Bildbereich stehen die Knöpfe:

**Datei** — öffnet die Dateiauswahl von Android. Dort kommst du an
Downloads, Galerie und alles, was Cloud-Apps bereitstellen. Nimmt GIF,
WebP, PNG, JPEG und MP4.

**Adresse** — für eine Datei aus dem Netz. Adresse einfügen, die App lädt
sie einmal herunter.

In beiden Fällen wandert eine **Kopie** ins App-Verzeichnis. Räumst du
später den Download-Ordner auf, bleibt die Anzeige bestehen — und die App
braucht kein Netz mehr.

Ist etwas gesetzt, erscheint ein dritter Knopf **Entfernen**. Danach ist
wieder der Platzhalter aus dem Entwurf da.

## Wo du GIFs findest

Zwei Wege, die sich bewährt haben:

- **Selbst aufnehmen.** Ein kurzes Video vom eigenen Satz, in einer
  beliebigen App zu GIF oder kurzem MP4 gemacht. Zeigt die eigene
  Ausführung — für die Formkontrolle oft nützlicher als ein fremdes.
- **Aus dem Netz.** Suchst du „Kniebeuge gif" oder „squat form gif",
  findest du reichlich. Für den privaten Gebrauch auf dem eigenen Gerät
  ist das unproblematisch; weitergeben solltest du solche Dateien nicht.

## Was die App abspielt

GIF und animiertes WebP laufen von allein. PNG und JPEG stehen still.
MP4 wird als Standbild gezeigt — für bewegte Abläufe ist GIF oder WebP
die bessere Wahl.

Lässt sich eine Datei nicht laden — etwa ein Mealie-Foto, das auf dem
Heimserver liegt, während du unterwegs bist — erscheint wieder der
Platzhalter statt einer leeren Fläche.

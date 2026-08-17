# Übungen, GIFs und Fotos

Die App bringt **1.324 Übungen** mit — Namen, Körperregion, Gerät,
Zielmuskel und die Anleitungsschritte. Die GIFs, die den Ablauf zeigen,
werden bei Bedarf geholt.

## Woher die Daten kommen

Aus <https://github.com/Fenron-dev/exercises-dataset>, abgespeckt auf das,
was die App braucht: 0,92 MB statt 17 MB. Weggelassen sind die neun
weiteren Sprachfassungen, der Fließtext der Anleitung (redundant zu den
Schritten) und zwei überflüssige Felder. Einzelheiten in
`mobile/assets/data/HERKUNFT.md`.

**Die Daten** stehen unter MIT und liegen deshalb in der App: Suchen und
Übernehmen brauchen kein Netz.

**Die GIFs und Thumbnails** stehen **nicht** unter MIT. Sie sind Eigentum
von Gym visual, im Datensatz-Repository mit gesonderter Erlaubnis bei
180×180 hinterlegt, und werden hier einzeln von dort geholt statt
mitgeliefert. Die App zeigt an jedem so geholten Bild die vorgeschriebene
Angabe:

> © Gym visual — https://gymvisual.com/

Bedingungen: <https://gymvisual.com/content/3-terms-and-conditions-of-use>

Das ist auf den eigenen Gebrauch ausgelegt. Gib die App mit den geladenen
Bildern nicht weiter.

## Übungen übernehmen

**Mehr → Übungen übernehmen.** Suchen oder eine Körperregion antippen,
ankreuzen, übernehmen. Das läuft ohne Netz und beliebig oft. Was schon in
der Bibliothek steht, wird gekennzeichnet und nicht doppelt angelegt.

Der Datensatz ist englisch: „squat" findet die Kniebeuge, „Kniebeuge"
nicht. Die deutschen Namen der Körperregionen werden mitgesucht, „Beine"
findet also trotzdem etwas. Beim Übernehmen werden Körperregion und Gerät
übersetzt; Name und Anleitung bleiben englisch, weil eine maschinelle
Übersetzung schlechter wäre als das Original.

## GIFs

**Von allein.** Öffnest du eine übernommene Übung, holt die App ihr GIF
beim ersten Mal selbst und legt es lokal ab. Danach läuft es offline.
Scheitert das — kein Netz, oder GitHub sperrt gerade — bleibt der
Platzhalter, und der nächste Aufruf versucht es erneut.

**Auf einen Schlag.** Unter *Mehr → GIFs nachladen* steht, wie viele noch
fehlen. Der Abruf läuft der Reihe nach mit kleiner Pause, weil GitHub die
Zahl der Anfragen je Adresse begrenzt — hundert gleichzeitige Abrufe
liefen dort in eine Sperre.

## Eigene Medien

Bei jeder Übung und jedem Rezept stehen unter dem Bildbereich:

**Datei** — Dateiauswahl von Android: Downloads, Galerie, Cloud-Apps.
Nimmt GIF, WebP, PNG, JPEG und MP4.

**Adresse** — eine Datei aus dem Netz einmalig herunterladen.

**Entfernen** — zurück zum Platzhalter.

In allen Fällen landet eine **Kopie** im App-Verzeichnis. Räumst du später
Downloads auf, bleibt die Anzeige stehen.

Ein selbst gesetztes Bild löscht die Gym-visual-Angabe mit, weil sie dann
nicht mehr zutrifft.

## Was die App abspielt

GIF und animiertes WebP laufen von allein — den Ablauf siehst du also
wirklich. PNG und JPEG stehen still. MP4 wird als Standbild gezeigt.

# Eigener Signaturschlüssel (optional)

Ohne Einrichtung signiert Expos Vorlage die APK mit ihrem mitgelieferten
Debug-Schlüssel. Der ist über alle Builds hinweg derselbe — die App
lässt sich installieren und später über eine neue Fassung aktualisieren.
Für eine App, die nur auf dem eigenen Gerät landet, reicht das.

Sobald du die App weitergeben willst, gehört ein eigener Schlüssel her.
Der Debug-Schlüssel ist öffentlich bekannt; jeder könnte damit eine APK
bauen, die Android für dieselbe App hält.

## Einmalig einrichten

**1 — Schlüssel erzeugen.** Braucht ein JDK (`java -version` muss
antworten; sonst `brew install --cask temurin`):

```bash
keytool -genkeypair -v \
  -keystore getfit-release.keystore \
  -alias getfit \
  -keyalg RSA -keysize 2048 -validity 10000
```

Zweimal dasselbe Passwort vergeben, die Fragen nach Name und Ort können
leer bleiben.

**2 — Datei sichern.** Geht der Schlüssel verloren, lässt sich keine
aktualisierte Fassung mehr über die installierte legen — dann hilft nur
Deinstallieren und Neuinstallieren, wobei alle Daten in der App verloren
gehen. Also an einen Ort legen, der gesichert wird. **Nicht** ins
Repository.

**3 — In Base64 umwandeln**, damit die Datei als Geheimnis hinterlegt
werden kann:

```bash
base64 -i getfit-release.keystore | pbcopy
```

**4 — Vier Geheimnisse anlegen** unter *Settings → Secrets and variables
→ Actions → New repository secret*:

| Name | Inhalt |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | der eben kopierte Base64-Text |
| `ANDROID_KEYSTORE_PASSWORD` | das vergebene Passwort |
| `ANDROID_KEY_ALIAS` | `getfit` |
| `ANDROID_KEY_PASSWORD` | dasselbe Passwort |

Ab dem nächsten Build greift der eigene Schlüssel. Der Wechsel ist
allerdings eine Einbahnstraße: eine mit dem Debug-Schlüssel installierte
App lässt sich nicht durch eine mit eigenem Schlüssel signierte ersetzen.
Einmal deinstallieren, dann neu installieren.

## Wie es technisch greift

`mobile/plugins/withReleaseSigning.js` ist ein Expo-Config-Plugin. Es
läuft bei `expo prebuild` und trägt einen Signier-Eintrag in die erzeugte
`build.gradle` ein — aber nur, wenn alle vier Variablen gesetzt sind.
Fehlt eine, bleibt die Vorlage unverändert.

Das Plugin prüft nach der Änderung selbst nach, dass der Release-Build
auf den eigenen und der Debug-Build weiter auf seinen Schlüssel zeigt,
und bricht sonst mit einer Meldung ab.

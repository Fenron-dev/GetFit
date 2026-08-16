const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Signiert den Release-Build mit einem eigenen Schlüssel — aber nur,
 * wenn einer hinterlegt ist.
 *
 * Ohne gesetzte Umgebungsvariablen bleibt Expos Vorlage unangetastet:
 * die signiert den Release mit dem mitgelieferten Debug-Keystore. Der
 * ist über alle Builds hinweg derselbe, die APK also installierbar und
 * aktualisierbar. Das genügt für eine App, die nur auf dem eigenen Gerät
 * landet.
 *
 * Sobald die App weitergegeben werden soll, gehört ein eigener Schlüssel
 * her. Dann werden im Build diese vier Variablen gesetzt:
 *
 *   ANDROID_KEYSTORE_PATH       Pfad zur .keystore-Datei
 *   ANDROID_KEYSTORE_PASSWORD   Passwort des Speichers
 *   ANDROID_KEY_ALIAS           Name des Schlüssels darin
 *   ANDROID_KEY_PASSWORD        Passwort des Schlüssels
 */
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    const { ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD } =
      process.env;

    const complete =
      ANDROID_KEYSTORE_PATH &&
      ANDROID_KEYSTORE_PASSWORD &&
      ANDROID_KEY_ALIAS &&
      ANDROID_KEY_PASSWORD;

    if (!complete) return gradleConfig;

    let contents = gradleConfig.modResults.contents;

    // Einen zweiten Signier-Eintrag neben den vorhandenen debug-Eintrag
    // stellen. Die Werte kommen aus der Umgebung, damit weder Passwort
    // noch Pfad je in der Versionsverwaltung landen.
    contents = contents.replace(
      /signingConfigs \{\s*\n(\s*)debug \{/,
      (match, indent) =>
        `signingConfigs {\n${indent}release {\n` +
        `${indent}    storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))\n` +
        `${indent}    storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")\n` +
        `${indent}    keyAlias System.getenv("ANDROID_KEY_ALIAS")\n` +
        `${indent}    keyPassword System.getenv("ANDROID_KEY_PASSWORD")\n` +
        `${indent}}\n${indent}debug {`,
    );

    // …und den Release-Build darauf zeigen lassen. Die Suche beginnt
    // bewusst erst bei `buildTypes`: davor steht der eben eingefügte
    // Eintrag, der ebenfalls `release {` heißt.
    const buildTypesAt = contents.indexOf('buildTypes {');
    if (buildTypesAt === -1) {
      throw new Error('withReleaseSigning: kein buildTypes-Block in build.gradle gefunden.');
    }

    const head = contents.slice(0, buildTypesAt);
    const tail = contents
      .slice(buildTypesAt)
      .replace(
        /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig signingConfigs.release',
      );
    contents = head + tail;

    // Gegenprobe: der Release-Build muss auf den neuen Eintrag zeigen und
    // der Debug-Build unverändert auf seinen eigenen.
    const buildTypes = contents.slice(contents.indexOf('buildTypes {'));
    const releaseBlock = buildTypes.slice(buildTypes.indexOf('release {'));
    const debugBlock = buildTypes.slice(
      buildTypes.indexOf('debug {'),
      buildTypes.indexOf('release {'),
    );

    if (!releaseBlock.includes('signingConfig signingConfigs.release')) {
      throw new Error(
        'withReleaseSigning: der Release-Build zeigt nicht auf den eigenen Schlüssel — build.gradle sah anders aus als erwartet.',
      );
    }
    if (!debugBlock.includes('signingConfig signingConfigs.debug')) {
      throw new Error('withReleaseSigning: der Debug-Build wurde versehentlich mitverändert.');
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
};

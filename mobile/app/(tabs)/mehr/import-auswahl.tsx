import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Placeholder } from '../../../src/components/Placeholder';

export default function ImportPreviewRoute() {
  return (
    <Screen variant="detail">
      <Text variant="screenTitle">Import-Auswahl</Text>
      <Placeholder screen="10 · Import-Auswahl">
        Gefundene Rezepte mit Häkchen, Kategorie-Zuordnung („breakfast → Frühstück“, änderbar) und die Auflösung von Namenskonflikten: überspringen, ersetzen oder beide behalten.
      </Placeholder>
    </Screen>
  );
}

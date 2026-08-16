import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Placeholder } from '../../../src/components/Placeholder';

export default function SettingsRoute() {
  return (
    <Screen>
      <Text variant="screenTitle">Einstellungen</Text>
      <Placeholder screen="08 · Einstellungen">
        Profilkarte und die Gruppen Ziele, Daten und App. Hier hängen der kcal-Schalter, die Akzentwahl, der Mealie-Einstieg und die Sicherung.
      </Placeholder>
    </Screen>
  );
}

import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Placeholder } from '../../../src/components/Placeholder';

export default function MealieImportRoute() {
  return (
    <Screen variant="detail">
      <Text variant="screenTitle">Mealie-Import</Text>
      <Placeholder screen="09 · Mealie-Import">
        Server-Verbindung (Adresse, Token, Erreichbarkeit, „Rezepte abrufen“) und als zweiter Weg eine ausgewählte recipes.json. Darunter der letzte Importlauf.
      </Placeholder>
    </Screen>
  );
}

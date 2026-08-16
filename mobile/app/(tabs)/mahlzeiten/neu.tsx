import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Placeholder } from '../../../src/components/Placeholder';

export default function RecipeFormRoute() {
  return (
    <Screen variant="detail">
      <Text variant="screenTitle">Rezept anlegen</Text>
      <Placeholder screen="Anlegen-Flow">
        Neu gegenüber dem Mockup: Name, Kategorie, Zeit, Portionen, Tags, Nährwerte, Zutaten- und Schrittliste.
      </Placeholder>
    </Screen>
  );
}

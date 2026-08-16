import { Screen } from '../../../../src/components/Screen';
import { Text } from '../../../../src/components/Text';
import { Placeholder } from '../../../../src/components/Placeholder';

export default function ShoppingListRoute() {
  return (
    <Screen variant="detail">
      <Text variant="screenTitle">Einkaufsliste</Text>
      <Placeholder screen="Einkaufsliste">
        Neu gegenüber dem Mockup: die Zutaten aller verplanten Rezepte einer Woche, nach Name und Einheit zusammengefasst, abhakbar.
      </Placeholder>
    </Screen>
  );
}

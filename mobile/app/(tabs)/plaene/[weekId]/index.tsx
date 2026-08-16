import { Screen } from '../../../../src/components/Screen';
import { Text } from '../../../../src/components/Text';
import { Placeholder } from '../../../../src/components/Placeholder';

export default function PlanDetailRoute() {
  return (
    <Screen variant="detail">
      <Text variant="screenTitle">Wochenplan</Text>
      <Placeholder screen="07 · Wochenplan">
        Tages-Chips Mo–So, Trainingsliste mit Griff zum Umsortieren, vier Mahlzeiten-Slots, „Woche duplizieren“ und der Einstieg in die Einkaufsliste.
      </Placeholder>
    </Screen>
  );
}

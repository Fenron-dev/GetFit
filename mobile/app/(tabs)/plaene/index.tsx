import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Placeholder } from '../../../src/components/Placeholder';

export default function PlanListRoute() {
  return (
    <Screen>
      <Text variant="screenTitle">Pläne</Text>
      <Placeholder screen="06 · Pläne">
        Wochenkarten mit Status-Badge, Tagesstreifen und Zählern, darunter die Vorlagen mit „Übernehmen“.
      </Placeholder>
    </Screen>
  );
}

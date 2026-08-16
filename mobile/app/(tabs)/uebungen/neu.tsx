import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Placeholder } from '../../../src/components/Placeholder';

export default function ExerciseFormRoute() {
  return (
    <Screen variant="detail">
      <Text variant="screenTitle">Übung anlegen</Text>
      <Placeholder screen="Anlegen-Flow">
        Neu gegenüber dem Mockup: Name, Muskelgruppe, Sätze, Wiederholungen, Pause, Beschreibung, Icon.
      </Placeholder>
    </Screen>
  );
}

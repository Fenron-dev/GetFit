import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/tokens';

/** Eigene Kopfzeilen: die Screens bringen ihre Zurück-Zeile selbst mit,
 *  so wie im Entwurf. */
export default function PlansLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}

import { StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Placeholder } from '../../src/components/Placeholder';
import { useQuery } from '../../src/hooks/useQuery';
import { stores } from '../../src/data/stores';
import { formatLongDate, today } from '../../src/lib/date';
import { colors, edge, radius } from '../../src/theme/tokens';

/**
 * Noch das Gerüst — die Bestandskarte liest allerdings schon echt aus
 * SQLite und zeigt damit, dass Schema, Startbestand und Abfragen
 * zusammenspielen.
 */
export default function DashboardRoute() {
  const { data: counts } = useQuery(async () => ({
    exercises: await stores.exercises.count(),
    recipes: await stores.recipes.count(),
    weeks: await stores.planWeeks.count(),
    days: await stores.planDays.count(),
  }));

  return (
    <Screen>
      <Text variant="eyebrow" color={colors.neutral[500]}>
        {formatLongDate(today())}
      </Text>
      <Text variant="screenTitle" style={styles.title}>
        Heute
      </Text>

      <View style={styles.card}>
        <Text variant="eyebrow" color={colors.neutral[400]}>
          Lokaler Bestand
        </Text>
        <View style={styles.rows}>
          <CountRow label="Übungen" value={counts?.exercises} />
          <CountRow label="Rezepte" value={counts?.recipes} />
          <CountRow label="Planwochen" value={counts?.weeks} />
          <CountRow label="Plantage" value={counts?.days} />
        </View>
      </View>

      <Placeholder screen="01 · Dashboard">
        Streak-Band über 14 Tage (voll / teilweise / wenig),
        Fortschrittsbalken zum Tagesziel, Trainings- und Ernährungsliste zum
        Abhaken. Daten aus dem Tages-Log, beim ersten Öffnen aus dem
        Wochenplan erzeugt.
      </Placeholder>
    </Screen>
  );
}

function CountRow({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.row}>
      <Text variant="body" color={colors.neutral[400]}>
        {label}
      </Text>
      <Text variant="body">{value ?? '…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 14,
  },
  card: {
    marginTop: 20,
    padding: 15,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(),
  },
  rows: {
    marginTop: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

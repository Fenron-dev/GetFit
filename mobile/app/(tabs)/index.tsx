import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { StreakBand } from '../../src/components/StreakBand';
import { ProgressCard } from '../../src/components/ProgressCard';
import { CheckRow } from '../../src/components/CheckRow';
import { SectionHead } from '../../src/components/SectionHead';
import { ActionButton } from '../../src/components/ActionButton';
import { Touchable } from '../../src/components/Surface';
import { CaretRight, Icon } from '../../src/components/icons';
import { useQuery } from '../../src/hooks/useQuery';
import {
  currentStreak,
  dayProgress,
  ensureDayLog,
  loadStreak,
  resyncDayLog,
  toggleDayEntry,
} from '../../src/data/repositories/dayLog';
import { getActiveWeek } from '../../src/data/repositories/plans';
import {
  LOCATION_LABELS,
  daysLeft,
  listUrgentStock,
} from '../../src/data/repositories/stock';
import { formatLongDate, today } from '../../src/lib/date';
import { colors, radius } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/ThemeProvider';

/**
 * Screen 01 — der Tag. Die Liste entsteht beim ersten Öffnen aus dem
 * Wochenplan und wird danach eigenständig geführt: was hier abgehakt ist,
 * bleibt abgehakt, auch wenn der Plan sich später ändert.
 */
export default function DashboardRoute() {
  const router = useRouter();
  const { settings } = useTheme();
  const date = today();

  const { data: log } = useQuery(() => ensureDayLog(date), [date]);
  const { data: streak } = useQuery(() => loadStreak(14), []);
  const { data: week } = useQuery(() => getActiveWeek(), []);
  const { data: urgent } = useQuery(() => listUrgentStock(), []);

  const progress = dayProgress(log);
  const training = log?.entries.filter((entry) => entry.kind === 'training') ?? [];
  const nutrition = log?.entries.filter((entry) => entry.kind === 'meal') ?? [];

  return (
    <Screen>
      <Text variant="eyebrow" color={colors.neutral[500]}>
        {formatLongDate(date)}
      </Text>

      {streak ? (
        <StreakBand days={streak} streakLength={currentStreak(streak)} />
      ) : null}

      <View style={styles.todayRow}>
        <Text variant="screenTitle">Heute</Text>
        {week ? (
          <Touchable
            onPress={() => router.push(`/plaene/${week.id}`)}
            style={styles.weekLink}
            accessibilityLabel={`${week.title} öffnen`}
          >
            <Text variant="meta" color={colors.accent[300]}>
              {week.title}
            </Text>
            <CaretRight size={12} color={colors.accent[300]} />
          </Touchable>
        ) : null}
      </View>

      <ProgressCard done={progress.done} total={progress.total} />

      {urgent && urgent.length > 0 ? (
        <Touchable
          onPress={() => router.push('/mehr/vorrat')}
          accessibilityLabel="Vorrat ansehen"
          style={styles.stockHint}
        >
          <Icon name="Snowflake" size={16} color={colors.warning} weight="fill" />
          <View style={styles.grow}>
            <Text variant="meta" color={colors.neutral[300]}>
              {urgent[0].portions} {urgent[0].portions === 1 ? 'Portion' : 'Portionen'}{' '}
              {urgent[0].recipeName}
            </Text>
            <Text variant="small" color={colors.warning} style={styles.stockMeta}>
              {LOCATION_LABELS[urgent[0].location]} ·{' '}
              {daysLeft(urgent[0]) < 0
                ? 'überfällig'
                : daysLeft(urgent[0]) === 0
                  ? 'heute verbrauchen'
                  : `noch ${daysLeft(urgent[0])} Tage`}
              {urgent.length > 1 ? ` · und ${urgent.length - 1} weitere` : ''}
            </Text>
          </View>
          <Icon name="CaretRight" size={14} color={colors.neutral[700]} />
        </Touchable>
      ) : null}

      {training.length > 0 ? (
        <>
          <SectionHead icon="Barbell" label="Training" style={styles.firstSection} />
          <View style={styles.list}>
            {training.map((entry) => (
              <CheckRow
                key={entry.id}
                title={entry.title}
                meta={entry.meta}
                done={entry.done}
                onToggle={() => toggleDayEntry(date, entry.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      {nutrition.length > 0 ? (
        <>
          <SectionHead icon="ForkKnife" label="Ernährung" />
          <View style={styles.list}>
            {nutrition.map((entry) => (
              <CheckRow
                key={entry.id}
                title={entry.title}
                meta={entry.meta}
                trailing={
                  settings.showKcal && entry.kcal !== undefined
                    ? `${entry.kcal} kcal`
                    : undefined
                }
                done={entry.done}
                onToggle={() => toggleDayEntry(date, entry.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      {log && log.entries.length > 0 ? (
        <ActionButton
          label="Tag aus dem Plan neu laden"
          quiet
          onPress={() =>
            Alert.alert(
              'Tag neu laden?',
              'Der Tag wird aus dem Wochenplan neu aufgebaut. Gesetzte Häkchen gehen dabei verloren.',
              [
                { text: 'Abbrechen', style: 'cancel' },
                {
                  text: 'Neu laden',
                  style: 'destructive',
                  onPress: () => {
                    resyncDayLog(date);
                  },
                },
              ],
            )
          }
          style={styles.resync}
        />
      ) : null}

      {log && log.entries.length === 0 ? (
        <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
          Für heute ist nichts geplant. Leg im Wochenplan etwas an oder füge
          aus der Bibliothek direkt zum Tag hinzu.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  todayRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  weekLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  firstSection: {
    marginTop: 26,
  },
  stockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  stockMeta: { marginTop: 2 },
  grow: { flex: 1, minWidth: 0 },
  list: {
    marginTop: 10,
    gap: 8,
  },
  resync: {
    marginTop: 20,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { StreakBand } from '../../src/components/StreakBand';
import { ProgressCard } from '../../src/components/ProgressCard';
import { CheckRow } from '../../src/components/CheckRow';
import { SectionHead } from '../../src/components/SectionHead';
import { Touchable } from '../../src/components/Surface';
import { CaretRight } from '../../src/components/icons';
import { useQuery } from '../../src/hooks/useQuery';
import {
  currentStreak,
  dayProgress,
  ensureDayLog,
  loadStreak,
  toggleDayEntry,
} from '../../src/data/repositories/dayLog';
import { getActiveWeek } from '../../src/data/repositories/plans';
import { formatLongDate, today } from '../../src/lib/date';
import { colors } from '../../src/theme/tokens';
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
  list: {
    marginTop: 10,
    gap: 8,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
});

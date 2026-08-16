import { StyleSheet, View } from 'react-native';
import { Flame } from './icons';
import { Text } from './Text';
import { colors, edge, radius } from '../theme/tokens';
import type { StreakLevel } from '../types/domain';

/**
 * Das 14-Tage-Band. Jeder Tag ist ein Balken in einer von drei Farben:
 * alles erledigt, teilweise, wenig. Der heutige Tag — ganz rechts —
 * bekommt eine kräftigere Kante, damit er sich aus der Reihe hebt.
 */

const LEVEL_COLORS: Record<StreakLevel, string> = {
  full: colors.success,
  part: colors.warning,
  low: colors.danger,
};

const LEGEND: { level: StreakLevel; label: string }[] = [
  { level: 'full', label: 'Komplett' },
  { level: 'part', label: 'Teilweise' },
  { level: 'low', label: 'Wenig' },
];

/** Farbe mit Deckkraft als Hex-Suffix, wie im Entwurf notiert. */
function fill(level: StreakLevel): string {
  return LEVEL_COLORS[level] + (level === 'low' ? '30' : '3d');
}

export function StreakBand({
  days,
  streakLength,
}: {
  days: { date: string; level: StreakLevel }[];
  streakLength: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Flame size={16} color={colors.warning} weight="fill" />
        <Text variant="rowTitle">
          {streakLength} {streakLength === 1 ? 'Tag' : 'Tage'} Serie
        </Text>
        <View style={styles.spacer} />
        <Text variant="meta" color={colors.neutral[500]}>
          Letzte {days.length} Tage
        </Text>
      </View>

      <View style={styles.bars}>
        {days.map((day, index) => (
          <View
            key={day.date}
            style={[
              styles.bar,
              {
                backgroundColor: fill(day.level),
                borderColor:
                  LEVEL_COLORS[day.level] + (index === days.length - 1 ? 'ff' : '66'),
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {LEGEND.map((entry) => (
          <View key={entry.level} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: LEVEL_COLORS[entry.level] }]} />
            <Text variant="small" color={colors.neutral[500]} style={styles.legendLabel}>
              {entry.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 13,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  spacer: {
    flex: 1,
  },
  bars: {
    marginTop: 13,
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
  },
  legend: {
    marginTop: 11,
    flexDirection: 'row',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  legendLabel: {
    fontSize: 11,
  },
});

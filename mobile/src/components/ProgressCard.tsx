import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, edge, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/** Der Fortschrittsbalken zum Tagesziel. */
export function ProgressCard({ done, total }: { done: number; total: number }) {
  const accent = useAccent();
  const ratio = total === 0 ? 0 : done / total;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text variant="rowTitle" style={styles.label}>
          {total === 0 ? 'Nichts geplant' : `${done} von ${total} erledigt`}
        </Text>
        <Text variant="meta" color={colors.neutral[500]}>
          Tagesziel
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: accent }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
  },
  track: {
    marginTop: 12,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[800],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

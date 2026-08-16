import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, edge, radius } from '../theme/tokens';

/**
 * Die Fakten-Kacheln: oben eine Versal-Beschriftung, darunter der Wert.
 * `compact` ist die schmalere Fassung für die vier Makro-Kacheln.
 */
export function StatTile({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.tile, compact && styles.tileCompact]}>
      <Text
        variant="eyebrow"
        color={colors.neutral[500]}
        style={compact ? styles.labelCompact : undefined}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        variant={compact ? 'rowTitle' : 'stat'}
        style={compact ? styles.valueCompact : styles.value}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  tileCompact: {
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  labelCompact: {
    fontSize: 10,
  },
  value: {
    marginTop: 4,
  },
  valueCompact: {
    marginTop: 3,
    fontSize: 17,
  },
});

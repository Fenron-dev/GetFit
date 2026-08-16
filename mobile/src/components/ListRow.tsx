import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { CaretRight } from './icons';
import { Text } from './Text';
import { Thumb } from './Thumb';
import { Touchable } from './Surface';
import { colors, edge, radius } from '../theme/tokens';

/**
 * Die Zeile, die Übungs- und Rezeptbibliothek gemeinsam haben:
 * Icon-Kachel, Name, Meta-Zeile, rechts entweder ein Wert oder der
 * Pfeil. Beide Bibliotheken sind im Entwurf bewusst gleich aufgebaut.
 */
export function ListRow({
  icon,
  title,
  meta,
  trailing,
  showCaret = false,
  thumbSize = 52,
  onPress,
}: {
  icon: string;
  title: string;
  meta?: string;
  trailing?: ReactNode;
  showCaret?: boolean;
  thumbSize?: 52 | 44;
  onPress?: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      style={[styles.row, { gap: thumbSize === 52 ? 13 : 12 }]}
      accessibilityLabel={title}
    >
      <Thumb icon={icon} size={thumbSize} />
      <View style={styles.grow}>
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text variant="meta" color={colors.neutral[500]} style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showCaret ? <CaretRight size={15} color={colors.neutral[700]} /> : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: 2,
  },
});

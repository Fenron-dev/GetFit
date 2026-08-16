import { StyleSheet, View } from 'react-native';
import { Check } from './icons';
import { Text } from './Text';
import { Touchable } from './Surface';
import { colors, edge, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Die abhakbare Zeile des Dashboards. Erledigtes wird nicht ausgeblendet,
 * sondern durchgestrichen und in eine dunklere Stufe zurückgenommen — der
 * Tag bleibt so als Ganzes sichtbar.
 */
export function CheckRow({
  title,
  meta,
  trailing,
  done,
  onToggle,
}: {
  title: string;
  meta?: string;
  trailing?: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <Touchable
      onPress={onToggle}
      style={styles.row}
      accessibilityLabel={`${title}${done ? ', erledigt' : ''}`}
    >
      <Checkbox checked={done} size={24} />
      <View style={styles.grow}>
        <Text
          variant="rowTitle"
          color={done ? colors.neutral[600] : colors.text}
          style={done ? styles.struck : undefined}
          numberOfLines={1}
        >
          {title}
        </Text>
        {meta ? (
          <Text
            variant="meta"
            color={done ? colors.neutral[700] : colors.neutral[500]}
            style={[styles.meta, done && styles.struck]}
            numberOfLines={1}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text variant="meta" color={done ? colors.neutral[700] : colors.neutral[500]}>
          {trailing}
        </Text>
      ) : null}
    </Touchable>
  );
}

/** Das Kästchen für sich — die Import-Auswahl braucht es ohne Zeile. */
export function Checkbox({ checked, size = 22 }: { checked: boolean; size?: number }) {
  const accent = useAccent();

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size === 24 ? 8 : 7,
          backgroundColor: checked ? accent : 'transparent',
          borderWidth: checked ? 0 : 1.5,
        },
      ]}
    >
      {checked ? <Check size={size === 24 ? 14 : 13} color={colors.bg} weight="bold" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  box: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.neutral[700],
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: 2,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
});

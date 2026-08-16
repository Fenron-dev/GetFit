import { StyleSheet, Switch, View } from 'react-native';
import { CaretRight, Icon } from './icons';
import { Text } from './Text';
import { Touchable } from './Surface';
import { colors, edge, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Die Gruppen der Einstellungen: eine gefüllte Karte, darin Zeilen mit
 * feiner Trennlinie. Eine Zeile zeigt entweder einen Wert mit Pfeil oder
 * einen Schalter.
 */
export function SettingsGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text variant="eyebrow" color={colors.neutral[400]}>
        {label}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  accented = false,
  last = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  /** Hebt das Symbol im Akzent hervor — für die aktiven Einstiege. */
  accented?: boolean;
  last?: boolean;
}) {
  const accent = useAccent();

  return (
    <Touchable
      onPress={onPress}
      style={[styles.row, last && styles.rowLast]}
      accessibilityLabel={label}
    >
      <Icon name={icon} size={17} color={accented ? accent : colors.neutral[500]} />
      <Text variant="rowTitle" style={styles.label}>
        {label}
      </Text>
      {value ? (
        <Text variant="meta" color={colors.neutral[500]}>
          {value}
        </Text>
      ) : null}
      {onPress ? <CaretRight size={13} color={colors.neutral[700]} /> : null}
    </Touchable>
  );
}

export function SettingsSwitch({
  icon,
  label,
  value,
  onChange,
  last = false,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  const accent = useAccent();

  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Icon name={icon} size={17} color={value ? accent : colors.neutral[500]} />
      <Text variant="rowTitle" style={styles.label}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.neutral[800], true: accent }}
        thumbColor={colors.neutral[100]}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 24,
  },
  card: {
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
  },
});

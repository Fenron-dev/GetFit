import { StyleSheet, View } from 'react-native';
import { Icon } from './icons';
import { Text } from './Text';
import { colors } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Die Abschnittsköpfe „Training“, „Ernährung“, „Frühstück“ …: ein kleines
 * Symbol im Akzent und daneben die Versalzeile. Rechts kann eine Notiz
 * stehen, wie im Wochenplan („Push · 45 Min“).
 */
export function SectionHead({
  icon,
  label,
  note,
  style,
}: {
  icon?: string;
  label: string;
  note?: string;
  style?: object;
}) {
  const accent = useAccent();

  return (
    <View style={[styles.row, style]}>
      {icon ? <Icon name={icon} size={14} color={accent} weight="fill" /> : null}
      <Text variant="eyebrow" color={colors.neutral[400]}>
        {label}
      </Text>
      {note ? (
        <>
          <View style={styles.spacer} />
          <Text variant="meta" color={colors.neutral[600]}>
            {note}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  spacer: {
    flex: 1,
  },
});

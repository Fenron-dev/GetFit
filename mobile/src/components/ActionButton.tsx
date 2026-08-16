import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Touchable } from './Surface';
import { colors, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Primäraktionen sind im Nocturne-System ein Akzent-Umriss auf
 * transparent — nie eine gefüllte Fläche. `quiet` ist die zurückhaltende
 * Variante für „noch etwas hinzufügen“-Zeilen.
 */
export function ActionButton({
  label,
  icon,
  onPress,
  quiet = false,
  disabled = false,
  style,
}: {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  quiet?: boolean;
  disabled?: boolean;
  style?: object;
}) {
  const accent = useAccent();
  const color = disabled
    ? colors.neutral[600]
    : quiet
      ? colors.neutral[400]
      : accent;
  const borderColor = disabled || quiet ? colors.neutral[800] : accent;

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[
        styles.button,
        quiet ? styles.quiet : styles.primary,
        { borderColor },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text variant={quiet ? 'meta' : 'rowTitle'} color={color}>
          {label}
        </Text>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.card,
    borderWidth: 1,
    justifyContent: 'center',
  },
  primary: {
    height: 46,
  },
  quiet: {
    height: 42,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

import { Text as RNText, StyleSheet, type TextProps } from 'react-native';
import { colors, textStyles } from '../theme/tokens';

/**
 * Benannte Textrollen statt gestreuter Größen. Die Werte stehen im Theme
 * und stammen aus dem Mockup — Überschriften nie über Gewicht 500.
 *
 * Die Eigenschaft heißt `variant` und nicht `role`, weil React Native
 * `role` bereits für die Barrierefreiheit belegt.
 */
type Variant = keyof typeof textStyles;

export function Text({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  return (
    <RNText
      style={[styles.base, textStyles[variant], color ? { color } : null, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});

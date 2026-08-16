import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, edge, radius, tint } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Die Karte aus dem Entwurf: gefüllte Fläche, 12–14 px Radius, eine
 * Haarlinie als Kante. `ghost` lässt die Füllung weg und behält nur die
 * Kante — so sind im Entwurf die noch leeren Zeilen gezeichnet.
 */
export function Card({
  children,
  style,
  ghost = false,
  padding = 15,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  ghost?: boolean;
  padding?: number;
}) {
  return (
    <View
      style={[
        styles.card,
        { padding },
        ghost ? styles.ghost : styles.filled,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Antippbare Fläche. Der Druckzustand ist Androids Ripple im Akzent —
 * eine eingefärbte Hintergrundfarbe würde die Füllung der Karte
 * überschreiben statt sie zu tönen, und auf Android ist der Ripple
 * ohnehin das erwartete Verhalten.
 */
export function Touchable({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
}: {
  children?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}) {
  const accent = useAccent();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled || (!onPress && !onLongPress)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      android_ripple={{ color: tint(accent, '24') }}
      style={[style, styles.clipped, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.cardLg,
  },
  filled: {
    backgroundColor: colors.surface,
    ...edge(),
  },
  ghost: {
    ...edge(),
  },
  disabled: {
    opacity: 0.45,
  },
  // Damit der Ripple den runden Ecken folgt.
  clipped: {
    overflow: 'hidden',
  },
});

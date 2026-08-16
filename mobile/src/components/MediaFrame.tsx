import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { GradientBox, RadialFill } from './Gradient';
import { Icon } from './icons';
import { Text } from './Text';
import { colors, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Der Medienbereich der Detailseiten. Bild oder GIF gibt es noch nicht —
 * der Entwurf zeigt stattdessen das Symbol der Übung bzw. des Rezepts in
 * einem Glow, mit drei Bewegungen:
 *
 *   fitBreath  das Symbol atmet (Deckkraft und Größe)
 *   fitSweep   ein Lichtstreifen wandert darüber (nur beim GIF-Platz)
 *   fitDot     der Punkt der GIF-Marke pulsiert
 *
 * Alle drei laufen über den nativen Treiber, kosten also keine
 * Bildrate im JavaScript-Thread.
 */

function useLoop(duration: number, enabled = true) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;
    const animation = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [duration, enabled, value]);

  return value;
}

export function MediaFrame({
  icon,
  height,
  badge,
  topRight,
  progress,
  sweep = false,
  breathDuration = 2400,
  iconSize = 110,
}: {
  icon: string;
  height: number;
  /** Die Marke oben links: „GIF“ mit Punkt oder „FOTO“ mit Bildsymbol. */
  badge?: ReactNode;
  topRight?: ReactNode;
  /** Der Streifen unten: wie viele Abschnitte, welcher ist aktiv. */
  progress?: { count: number; active: number };
  sweep?: boolean;
  breathDuration?: number;
  iconSize?: number;
}) {
  const accent = useAccent();
  const breath = useLoop(breathDuration);
  const sweepValue = useLoop(2800, sweep);

  // Der Entwurf lässt das Symbol zwischen 0,35 und 0,75 Deckkraft und
  // 0,97 und 1,02 Größe schwingen — einmal hin, einmal zurück.
  const opacity = breath.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.75, 0.35],
  });
  const scale = breath.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.97, 1.02, 0.97],
  });
  const sweepShift = sweepValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-98, 168],
  });

  return (
    <GradientBox
      style={[styles.frame, { height }]}
      gradient={<RadialFill from={colors.accent[900]} to={colors.neutral[900]} />}
    >
      <View style={styles.center}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Icon name={icon} size={iconSize} color={accent} weight="fill" />
        </Animated.View>
      </View>

      {sweep ? (
        <Animated.View
          style={[styles.sweep, { transform: [{ translateX: sweepShift }] }]}
          pointerEvents="none"
        />
      ) : null}

      {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
      {topRight ? <View style={styles.topRightSlot}>{topRight}</View> : null}

      {progress ? (
        <View style={styles.progress}>
          {Array.from({ length: progress.count }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                index === progress.active
                  ? { backgroundColor: accent, opacity: 0.9 }
                  : { backgroundColor: colors.neutral[700] },
              ]}
            />
          ))}
        </View>
      ) : null}
    </GradientBox>
  );
}

/** Die Marke oben links im Medienbereich. */
export function MediaBadge({
  label,
  dot = false,
  icon,
}: {
  label: string;
  /** Der pulsierende Punkt der GIF-Marke. */
  dot?: boolean;
  icon?: string;
}) {
  const accent = useAccent();
  const pulse = useLoop(1200, dot);
  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 1, 0.25],
  });

  return (
    <View style={styles.badge}>
      {dot ? (
        <Animated.View style={[styles.dot, { backgroundColor: accent, opacity }]} />
      ) : null}
      {icon ? <Icon name={icon} size={12} color={colors.neutral[400]} /> : null}
      <Text variant="small" color={colors.neutral[300]} style={styles.badgeLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.media,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 70,
    backgroundColor: 'rgba(233,233,237,0.07)',
  },
  badgeSlot: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  topRightSlot: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(22,24,38,0.72)',
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  badgeLabel: {
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  progress: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
  },
});

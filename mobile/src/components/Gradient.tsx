import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Der Entwurf arbeitet an zwei Stellen mit Verläufen: die Icon-Kachel in
 * den Listenzeilen (linear, 145°) und der Medienbereich der Detailseiten
 * (radial, als Glow hinter dem Symbol).
 *
 * React Natives eigene Verlaufsunterstützung ist noch als „experimental"
 * gekennzeichnet; react-native-svg liegt ohnehin im Projekt und liefert
 * beides zuverlässig.
 */

let counter = 0;
const nextId = () => `grad${(counter += 1)}`;

/** Füllt den Elternrahmen mit einem linearen Verlauf. */
export function LinearFill({ from, to }: { from: string; to: string }) {
  const id = nextId();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {/* 145° im Entwurf entspricht dieser Achse von oben links nach
            unten rechts. */}
        <SvgLinearGradient id={id} x1="0" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Füllt den Elternrahmen mit einem radialen Verlauf — der Glow im
 *  Medienbereich: hell oben mittig, zum Rand hin dunkel. */
export function RadialFill({ from, to }: { from: string; to: string }) {
  const id = nextId();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgRadialGradient id={id} cx="50%" cy="15%" rx="120%" ry="90%">
          <Stop offset="0" stopColor={from} />
          <Stop offset="0.7" stopColor={to} />
          <Stop offset="1" stopColor={to} />
        </SvgRadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Rahmen mit Verlauf im Hintergrund und Inhalt darüber. */
export function GradientBox({
  style,
  gradient,
  children,
}: {
  style?: ViewStyle | ViewStyle[];
  gradient: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.box, style]}>
      {gradient}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});

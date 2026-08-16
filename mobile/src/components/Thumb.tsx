import { StyleSheet, View } from 'react-native';
import { GradientBox, LinearFill } from './Gradient';
import { Icon } from './icons';
import { colors, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Die quadratische Icon-Kachel links in den Bibliothekszeilen: ein
 * Verlauf von Akzent-900 nach Neutral-900 mit einer inneren Haarlinie,
 * darauf das Symbol im Akzent.
 */
export function Thumb({ icon, size = 52 }: { icon: string; size?: 52 | 44 }) {
  const accent = useAccent();
  const iconSize = size === 52 ? 23 : 19;

  return (
    <GradientBox
      style={[styles.box, { width: size, height: size }]}
      gradient={<LinearFill from={colors.accent[900]} to={colors.neutral[900]} />}
    >
      <View style={styles.center}>
        {/* Der Entwurf nimmt dem Symbol etwas Deckkraft, damit es sich in
            den Verlauf legt statt darauf zu sitzen. */}
        <View style={styles.softened}>
          <Icon name={icon} size={iconSize} color={accent} weight="fill" />
        </View>
      </View>
    </GradientBox>
  );
}

const styles = StyleSheet.create({
  box: {
    flexShrink: 0,
    borderRadius: radius.md + 2,
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
  softened: {
    opacity: 0.85,
  },
});

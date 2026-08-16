import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, edge, radius } from '../theme/tokens';

/**
 * Markiert einen Screen, dessen Gerüst steht, dessen Inhalt aber noch
 * gebaut wird — und benennt, was hineinkommt.
 */
export function Placeholder({ screen, children }: { screen: string; children: string }) {
  return (
    <View style={styles.box}>
      <Text variant="rowTitle" color={colors.neutral[200]}>
        {screen} — noch nicht gebaut
      </Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.body}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 20,
    padding: 16,
    borderRadius: radius.cardLg,
    ...edge(),
  },
  body: {
    marginTop: 6,
    lineHeight: 20,
  },
});

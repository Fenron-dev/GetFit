import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius } from '../theme/tokens';

/**
 * Die Pillen aus dem Entwurf: ein Akzent-Umriss mit hellem Akzenttext.
 * Auf dunklem Grund darf Fließtext nicht im reinen Akzent stehen —
 * dafür ist Accent-300 die vorgesehene Stufe.
 */
export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="small" color={colors.accent[300]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent[700],
  },
});

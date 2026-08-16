import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from './icons';
import { Text } from './Text';
import { Touchable } from './Surface';
import { colors, edge, radius } from '../theme/tokens';

/**
 * Die Zurück-Zeile der Detailseiten: ein quadratischer Knopf mit
 * Haarlinie und daneben der Name der Ebene, aus der man kommt.
 */
export function BackHeader({
  label,
  onBack,
  right,
}: {
  label: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Touchable
        onPress={onBack ?? (() => router.back())}
        style={styles.button}
        accessibilityLabel="Zurück"
      >
        <ArrowLeft size={17} color={colors.neutral[300]} />
      </Touchable>
      <Text variant="meta" color={colors.neutral[500]}>
        {label}
      </Text>
      {right ? (
        <>
          <View style={styles.spacer} />
          {right}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...edge(),
  },
  spacer: {
    flex: 1,
  },
});

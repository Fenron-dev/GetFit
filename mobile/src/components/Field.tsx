import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { colors, fonts, radius } from '../theme/tokens';

/** Ein beschriftetes Eingabefeld im Stil des Entwurfs. */
export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text variant="small" color={colors.neutral[600]} style={styles.label}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.neutral[700]}
        style={[styles.input, input.multiline && styles.multiline]}
        autoCorrect={false}
        {...input}
      />
      {hint ? (
        <Text variant="small" color={colors.neutral[700]} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    marginTop: 3,
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: 4,
  },
});

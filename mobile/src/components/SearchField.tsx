import { StyleSheet, TextInput, View } from 'react-native';
import { MagnifyingGlass } from './icons';
import { colors, edge, fonts, radius } from '../theme/tokens';

/** Die Suchzeile über der Bibliothek. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <MagnifyingGlass size={15} color={colors.neutral[500]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[600]}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: radius.md + 3,
    backgroundColor: colors.surface,
    ...edge(),
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
});

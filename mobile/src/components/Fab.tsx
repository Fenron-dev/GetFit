import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from './icons';
import { colors, layout, radius, tint } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';

/**
 * Der Anlegen-Knopf über der Tab-Leiste. Im Entwurf ohne Funktion —
 * hier führt er in den Anlegen-Flow der Bibliothek, in der er steht.
 */
export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  const accent = useAccent();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: 30 + insets.bottom,
          backgroundColor: accent,
          borderColor: tint(accent, '12'),
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Plus size={24} color={colors.bg} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: layout.screenPadding,
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
});

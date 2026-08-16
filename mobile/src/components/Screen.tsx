import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '../theme/tokens';

/**
 * Der Rahmen jedes Screens: dunkler Grund, Seitenabstand und ein
 * scrollender Inhalt, der oben unter der Statusleiste beginnt und unten
 * über der Tab-Leiste endet.
 *
 * `variant="detail"` beginnt etwas höher, weil dort die Zurück-Zeile
 * sitzt; `bleed` nimmt den Seitenabstand heraus, wenn ein Medienbereich
 * bis an den Rand laufen soll.
 */
export function Screen({
  children,
  variant = 'main',
  bleed = false,
  overlay,
}: {
  children: ReactNode;
  variant?: 'main' | 'detail';
  bleed?: boolean;
  /** Liegt über dem Inhalt und scrollt nicht mit — der Anlegen-Knopf. */
  overlay?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const paddingTop =
    (variant === 'detail' ? layout.safeTopDetail : layout.safeTop) - insets.top;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          {
            paddingTop: Math.max(paddingTop, 16) + insets.top,
            paddingBottom: 24 + insets.bottom,
          },
          !bleed && styles.padded,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
});

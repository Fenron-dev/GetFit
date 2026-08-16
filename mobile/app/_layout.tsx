import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Gezielt die drei genutzten Schnitte einbinden. Über den Paketnamen
// allein landen alle 36 Inter-Varianten im APK — rund 12 MB, von denen
// wir drei brauchen.
import Inter_400Regular from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf';
import Inter_500Medium from '@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf';
import Inter_600SemiBold from '@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf';

import { bootstrapDatabase } from '../src/data/bootstrap';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { colors, fonts, textStyles } from '../src/theme/tokens';

/**
 * Wurzel der App: Schriften laden, Datenbank öffnen und beim ersten Start
 * füllen, dann erst rendern. Vorher gibt es nichts zu zeigen, was nicht
 * gleich wieder springen würde.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [databaseReady, setDatabaseReady] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    bootstrapDatabase()
      .then(() => setDatabaseReady(true))
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      });
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Die Datenbank ließ sich nicht öffnen</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !databaseReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 32,
    gap: 10,
  },
  errorTitle: {
    ...textStyles.rowTitle,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

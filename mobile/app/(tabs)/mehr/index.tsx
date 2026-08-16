import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import {
  SettingsGroup,
  SettingsRow,
  SettingsSwitch,
} from '../../../src/components/SettingsRow';
import { Icon } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import { updateSettings } from '../../../src/data/repositories/settings';
import { writeBackupFile } from '../../../src/data/bootstrap';
import { stores } from '../../../src/data/stores';
import { accentLabels, accents, colors, edge, radius } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { AccentKey } from '../../../src/types/domain';

/** Screen 08 — Profil, Ziele, Daten, App. */
export default function SettingsRoute() {
  const router = useRouter();
  const { settings, accent } = useTheme();
  const [busy, setBusy] = useState(false);

  const { data: recipeCount } = useQuery(() => stores.recipes.count(), []);

  const lastImport = settings.mealie.lastImportCount;

  async function exportData() {
    setBusy(true);
    try {
      const uri = await writeBackupFile();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: 'GetFit-Sicherung',
        });
      } else {
        Alert.alert('Sicherung abgelegt', uri);
      }
    } catch (error) {
      Alert.alert(
        'Export fehlgeschlagen',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text variant="screenTitle">Einstellungen</Text>

      <View style={styles.profile}>
        <View style={[styles.avatar, { borderColor: accent }]}>
          <Icon name="PersonSimple" size={22} color={accent} weight="fill" />
        </View>
        <View style={styles.grow}>
          <Text variant="rowTitle" style={styles.name}>
            {settings.profileName}
          </Text>
          <Text variant="meta" color={colors.neutral[500]} style={styles.profileMeta}>
            {settings.showKcal ? `${settings.kcalGoal} kcal · ` : ''}
            {settings.trainingsPerWeek} Trainings / Woche
          </Text>
        </View>
      </View>

      <SettingsGroup label="Ziele">
        <SettingsRow icon="Barbell" label="Tagesziel" value={`${settings.dailyGoalEntries} Einträge`} accented />
        <SettingsSwitch
          icon="Flame"
          label="Kalorien anzeigen"
          value={settings.showKcal}
          onChange={(next) => updateSettings({ showKcal: next })}
          last
        />
      </SettingsGroup>

      <SettingsGroup label="Daten">
        <SettingsRow
          icon="CloudArrowDown"
          label="Mealie-Import"
          value={lastImport ? `${lastImport} Rezepte` : `${recipeCount ?? 0} Rezepte`}
          accented
          onPress={() => router.push('/mehr/import')}
        />
        <SettingsRow
          icon="Copy"
          label={busy ? 'Wird erstellt…' : 'Daten sichern'}
          value="JSON"
          onPress={busy ? undefined : exportData}
          last
        />
      </SettingsGroup>

      <SettingsGroup label="Darstellung">
        <View style={styles.accentRow}>
          <Text variant="rowTitle" style={styles.accentLabel}>
            Akzent
          </Text>
          <View style={styles.swatches}>
            {(Object.keys(accents) as AccentKey[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => updateSettings({ accent: key })}
                accessibilityRole="radio"
                accessibilityState={{ selected: settings.accent === key }}
                accessibilityLabel={accentLabels[key]}
                style={[
                  styles.swatch,
                  { backgroundColor: accents[key] },
                  settings.accent === key && styles.swatchActive,
                ]}
              />
            ))}
          </View>
        </View>
      </SettingsGroup>

      <Text variant="small" color={colors.neutral[700]} style={styles.version}>
        Version 0.1 · alle Daten auf diesem Gerät
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
    padding: 14,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(),
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  grow: { flex: 1, minWidth: 0 },
  name: { fontSize: 15.5 },
  profileMeta: { marginTop: 2 },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  accentLabel: { flex: 1, fontSize: 14.5 },
  swatches: { flexDirection: 'row', gap: 10 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.neutral[100],
  },
  version: {
    marginTop: 22,
    textAlign: 'center',
  },
});

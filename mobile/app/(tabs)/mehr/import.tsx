import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { ActionButton } from '../../../src/components/ActionButton';
import { Touchable } from '../../../src/components/Surface';
import { Icon } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  getSettings,
  updateMealieConnection,
} from '../../../src/data/repositories/settings';
import {
  MealieError,
  buildCandidates,
  fetchRecipeDetails,
  fetchRecipeList,
  pickMealieJson,
  startSession,
} from '../../../src/lib/mealie';
import { colors, edge, radius } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';

/** Screen 09 — die beiden Wege, Rezepte hereinzuholen. */
export default function MealieImportRoute() {
  const router = useRouter();
  const { accent, settings } = useTheme();

  const [baseUrl, setBaseUrl] = useState(settings.mealie.baseUrl);
  const [token, setToken] = useState(settings.mealie.token);
  const [busy, setBusy] = useState<'server' | 'file' | null>(null);

  const { data: stored } = useQuery(() => getSettings(), []);
  const last = stored?.mealie;

  async function fetchFromServer() {
    if (!baseUrl.trim()) {
      Alert.alert('Adresse fehlt', 'Trag die Adresse deiner Mealie-Instanz ein.');
      return;
    }
    setBusy('server');
    try {
      await updateMealieConnection({ baseUrl: baseUrl.trim(), token: token.trim() });
      const config = { baseUrl: baseUrl.trim(), token: token.trim() };

      // Die Liste bringt keine Zutaten mit — die stehen erst im
      // Einzelabruf. Deshalb erst listen, dann nachladen.
      const list = await fetchRecipeList(config);
      if (list.length === 0) {
        Alert.alert('Nichts gefunden', 'Der Server meldet keine Rezepte.');
        return;
      }
      const slugs = list
        .map((recipe) => recipe.slug ?? recipe.id)
        .filter((slug): slug is string => Boolean(slug));
      const detailed = await fetchRecipeDetails(config, slugs);

      startSession(await buildCandidates(detailed), 'Server');
      router.push('/mehr/import-auswahl');
    } catch (error) {
      Alert.alert(
        'Abruf fehlgeschlagen',
        error instanceof MealieError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error),
      );
    } finally {
      setBusy(null);
    }
  }

  async function pickFile() {
    setBusy('file');
    try {
      const picked = await pickMealieJson();
      if (!picked) return;
      startSession(await buildCandidates(picked.recipes), picked.fileName);
      router.push('/mehr/import-auswahl');
    } catch (error) {
      Alert.alert(
        'Datei nicht lesbar',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Einstellungen" />

      <Text variant="sectionTitle">Mealie-Import</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.intro}>
        Rezepte aus deiner Mealie-Instanz holen — per Datei oder direkt vom
        Server im heimischen WLAN.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Icon name="CloudArrowDown" size={15} color={accent} weight="fill" />
          <Text variant="rowTitle" style={styles.cardTitle}>
            Server verbinden
          </Text>
        </View>

        <View style={styles.fields}>
          <Field
            label="Server-Adresse"
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="192.168.178.20:9925"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Field
            label="API-Token"
            value={token}
            onChangeText={setToken}
            placeholder="optional"
            autoCapitalize="none"
            secureTextEntry
          />
        </View>

        <ActionButton
          label={busy === 'server' ? 'Wird abgerufen…' : 'Rezepte abrufen'}
          icon={
            busy === 'server' ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Icon name="ArrowRight" size={15} color={accent} />
            )
          }
          onPress={fetchFromServer}
          disabled={busy !== null}
          style={styles.cardAction}
        />
      </View>

      <View style={styles.orRow}>
        <View style={styles.rule} />
        <Text variant="small" color={colors.neutral[600]}>
          oder
        </Text>
        <View style={styles.rule} />
      </View>

      <Touchable
        onPress={pickFile}
        disabled={busy !== null}
        accessibilityLabel="JSON-Datei auswählen"
        style={styles.drop}
      >
        <Icon name="CloudArrowDown" size={30} color={accent} />
        <Text variant="rowTitle" style={styles.dropTitle}>
          {busy === 'file' ? 'Wird gelesen…' : 'recipes.json auswählen'}
        </Text>
        <Text variant="meta" color={colors.neutral[500]} style={styles.dropHint}>
          Mealie-Export · funktioniert auch ohne Netz
        </Text>
      </Touchable>

      {last?.lastImportAt ? (
        <>
          <Text variant="eyebrow" color={colors.neutral[400]} style={styles.lastLabel}>
            Letzter Import
          </Text>
          <View style={styles.lastCard}>
            <Icon name="CloudCheck" size={18} color={colors.success} weight="fill" />
            <View style={styles.grow}>
              <Text variant="body">
                {last.lastImportCount} {last.lastImportCount === 1 ? 'Rezept' : 'Rezepte'}{' '}
                übernommen
              </Text>
              <Text variant="meta" color={colors.neutral[500]} style={styles.lastMeta}>
                {new Date(last.lastImportAt).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'long',
                })}
                {last.lastImportSkipped
                  ? ` · ${last.lastImportSkipped} übersprungen`
                  : ''}
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Field({
  label,
  ...input
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text variant="small" color={colors.neutral[600]} style={styles.fieldLabel}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.neutral[700]}
        style={styles.input}
        autoCorrect={false}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 8, fontSize: 13.5, lineHeight: 21 },
  card: {
    marginTop: 20,
    padding: 16,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(),
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 13.5 },
  fields: { marginTop: 12, gap: 8 },
  field: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  fieldLabel: { fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    marginTop: 2,
    padding: 0,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.text,
  },
  cardAction: { marginTop: 12, height: 44 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  rule: { flex: 1, height: 1, backgroundColor: colors.neutral[800] },
  drop: {
    marginTop: 18,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.accent[800],
  },
  dropTitle: { marginTop: 10, fontSize: 14.5 },
  dropHint: { marginTop: 4 },
  lastLabel: { marginTop: 20 },
  lastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  grow: { flex: 1, minWidth: 0 },
  lastMeta: { marginTop: 2 },
});

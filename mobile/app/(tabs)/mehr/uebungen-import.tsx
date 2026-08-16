import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { SearchField } from '../../../src/components/SearchField';
import { Checkbox } from '../../../src/components/CheckRow';
import { ActionButton } from '../../../src/components/ActionButton';
import { Touchable } from '../../../src/components/Surface';
import { Icon } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import { getSettings, updateExerciseDbConnection } from '../../../src/data/repositories/settings';
import {
  ExerciseDbError,
  authHeaders,
  bodyPartLabel,
  equipmentLabel,
  exerciseName,
  fetchBodyParts,
  fetchByBodyPart,
  findExisting,
  importExercises,
  searchByName,
  type ExerciseDbEntry,
} from '../../../src/lib/exercisedb';
import { colors, edge, radius } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';

/**
 * Übungen aus ExerciseDB holen — mit dem GIF, das den Ablauf zeigt.
 *
 * Der Ablauf hat drei Stufen: eine Körperregion wählen oder suchen, in
 * der Trefferliste ankreuzen, übernehmen. Beim Übernehmen wandert jedes
 * GIF ins App-Verzeichnis, damit die Übung danach ohne Netz vollständig
 * ist.
 */
export default function ExerciseDbImportRoute() {
  const router = useRouter();
  const { accent, settings } = useTheme();
  const apiKey = settings.exerciseDb.apiKey;

  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<string>();
  const [results, setResults] = useState<ExerciseDbEntry[]>();
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>();

  const { data: bodyParts } = useQuery(
    () => (apiKey ? fetchBodyParts(apiKey).catch(() => [] as string[]) : Promise.resolve([])),
    [apiKey],
  );

  async function run(load: () => Promise<ExerciseDbEntry[]>) {
    setBusy(true);
    try {
      const entries = await load();
      setResults(entries);
      setSelected(new Set());

      // Was schon in der Bibliothek steht, wird gleich als solches
      // gekennzeichnet, statt erst beim Übernehmen aufzufallen.
      const vorhanden = new Set<string>();
      for (const entry of entries) {
        if (await findExisting(entry)) vorhanden.add(entry.id ?? entry.name ?? '');
      }
      setKnown(vorhanden);
    } catch (error) {
      Alert.alert(
        'Abruf fehlgeschlagen',
        error instanceof ExerciseDbError || error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setBusy(false);
    }
  }

  function keyOf(entry: ExerciseDbEntry): string {
    return entry.id ?? entry.name ?? '';
  }

  function toggle(entry: ExerciseDbEntry) {
    const key = keyOf(entry);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function commit() {
    const chosen = (results ?? []).filter((entry) => selected.has(keyOf(entry)));
    if (chosen.length === 0) return;

    setBusy(true);
    try {
      const result = await importExercises(apiKey, chosen, (done, total) =>
        setProgress(`${done} von ${total}`),
      );
      await updateExerciseDbConnection({
        lastImportAt: Date.now(),
        lastImportCount: result.imported,
      });
      Alert.alert(
        'Import abgeschlossen',
        [
          `${result.imported} übernommen`,
          result.skipped ? `${result.skipped} schon vorhanden` : null,
          result.withoutMedia ? `${result.withoutMedia} ohne GIF` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      );
      router.dismissTo('/uebungen');
    } catch (error) {
      Alert.alert('Import fehlgeschlagen', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
      setProgress(undefined);
    }
  }

  if (!apiKey) {
    return (
      <Screen variant="detail">
        <BackHeader label="Einstellungen" />
        <Text variant="sectionTitle">Übungen importieren</Text>
        <View style={styles.notice}>
          <Text variant="body" color={colors.neutral[400]} style={styles.noticeText}>
            Dafür braucht es einen Schlüssel für ExerciseDB. Er ist kostenlos
            und wird über RapidAPI vergeben — dort das Angebot „ExerciseDB“
            abonnieren und den Schlüssel in den Einstellungen eintragen.
          </Text>
        </View>
        <ActionButton
          label="Zu den Einstellungen"
          onPress={() => router.back()}
          style={styles.action}
        />
      </Screen>
    );
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Einstellungen" />
      <Text variant="sectionTitle">Übungen importieren</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        aus ExerciseDB, mit GIF für den Ablauf
      </Text>

      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Übung suchen, z. B. squat"
        />
      </View>

      <ActionButton
        label="Suchen"
        onPress={() => {
          setBodyPart(undefined);
          run(() => searchByName(apiKey, query));
        }}
        disabled={busy || query.trim().length < 2}
        quiet
        style={styles.searchAction}
      />

      {bodyParts && bodyParts.length > 0 ? (
        <>
          <Text variant="eyebrow" color={colors.neutral[400]} style={styles.groupLabel}>
            oder nach Körperregion
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {bodyParts.map((part) => (
              <Pressable
                key={part}
                onPress={() => {
                  setBodyPart(part);
                  setQuery('');
                  run(() => fetchByBodyPart(apiKey, part));
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: bodyPart === part }}
                style={[
                  styles.chip,
                  { borderColor: bodyPart === part ? accent : colors.neutral[800] },
                ]}
              >
                <Text
                  variant="small"
                  color={bodyPart === part ? colors.accent[200] : colors.neutral[500]}
                >
                  {bodyPartLabel(part)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color={accent} />
          {progress ? (
            <Text variant="meta" color={colors.neutral[500]}>
              {progress}
            </Text>
          ) : null}
        </View>
      ) : null}

      {results ? (
        <View style={styles.list}>
          {results.length === 0 ? (
            <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
              Keine Treffer. ExerciseDB kennt nur englische Namen — versuch es
              mit „squat“ statt „Kniebeuge“.
            </Text>
          ) : null}

          {results.map((entry) => {
            const key = keyOf(entry);
            const vorhanden = known.has(key);
            const on = selected.has(key);
            return (
              <Touchable
                key={key}
                onPress={vorhanden ? undefined : () => toggle(entry)}
                accessibilityLabel={exerciseName(entry)}
                style={[styles.item, on ? styles.itemOn : styles.itemOff]}
              >
                <Checkbox checked={on} />
                {entry.gifUrl ? (
                  <Image
                    source={{ uri: entry.gifUrl, headers: authHeaders(apiKey) }}
                    style={styles.preview}
                    contentFit="cover"
                    autoplay={false}
                    transition={150}
                  />
                ) : (
                  <View style={[styles.preview, styles.previewEmpty]}>
                    <Icon name="Barbell" size={18} color={colors.neutral[700]} />
                  </View>
                )}
                <View style={styles.grow}>
                  <Text variant="rowTitle" numberOfLines={2} style={styles.itemTitle}>
                    {exerciseName(entry)}
                  </Text>
                  <Text variant="small" color={colors.neutral[600]} style={styles.itemMeta}>
                    {bodyPartLabel(entry.bodyPart)}
                    {entry.equipment ? ` · ${equipmentLabel(entry.equipment)}` : ''}
                  </Text>
                  {vorhanden ? (
                    <Text variant="small" color={colors.neutral[700]} style={styles.itemMeta}>
                      schon in der Bibliothek
                    </Text>
                  ) : null}
                </View>
              </Touchable>
            );
          })}
        </View>
      ) : null}

      {selected.size > 0 ? (
        <ActionButton
          label={
            busy
              ? 'Wird geladen…'
              : `${selected.size} ${selected.size === 1 ? 'Übung' : 'Übungen'} übernehmen`
          }
          icon={<Icon name="CloudArrowDown" size={16} color={accent} />}
          onPress={commit}
          disabled={busy}
          style={styles.action}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  search: { marginTop: 14 },
  searchAction: { marginTop: 8 },
  groupLabel: { marginTop: 20 },
  chips: { gap: 7, paddingVertical: 10, paddingRight: 20 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  busy: { marginTop: 24, alignItems: 'center', gap: 8 },
  list: { marginTop: 14, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.card,
  },
  itemOn: { backgroundColor: colors.surface, ...edge() },
  itemOff: { borderWidth: 1, borderColor: colors.neutral[900] },
  preview: {
    width: 56,
    height: 56,
    borderRadius: radius.md + 2,
    backgroundColor: colors.neutral[900],
  },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14.5 },
  itemMeta: { marginTop: 3 },
  empty: { textAlign: 'center', lineHeight: 20, marginTop: 10 },
  notice: {
    marginTop: 18,
    padding: 16,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  noticeText: { lineHeight: 22 },
  action: { marginTop: 18 },
});

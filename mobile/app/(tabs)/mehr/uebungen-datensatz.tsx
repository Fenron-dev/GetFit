import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { SearchField } from '../../../src/components/SearchField';
import { Checkbox } from '../../../src/components/CheckRow';
import { ActionButton } from '../../../src/components/ActionButton';
import { Touchable } from '../../../src/components/Surface';
import { Icon } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import { stores } from '../../../src/data/stores';
import {
  datasetSize,
  listBodyParts,
  searchDataset,
  type DatasetEntry,
} from '../../../src/lib/dataset';
import { importFromDataset } from '../../../src/lib/dataset/import';
import { bodyPartLabel, displayName, equipmentLabel } from '../../../src/lib/exerciseLabels';
import { colors, edge, radius } from '../../../src/theme/tokens';
import { useAccent } from '../../../src/theme/ThemeProvider';

/**
 * Übungen aus dem mitgelieferten Datensatz übernehmen.
 *
 * Suchen und Übernehmen laufen ohne Netz — die Daten liegen in der App.
 * Die GIFs holt die App danach von allein, sobald eine Übung geöffnet
 * wird, oder auf einen Schlag über die Einstellungen.
 */
export default function DatasetImportRoute() {
  const router = useRouter();
  const accent = useAccent();

  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const bodyParts = useMemo(() => listBodyParts(), []);
  const total = useMemo(() => datasetSize(), []);
  const results = useMemo(
    () => searchDataset(query, { bodyPart }),
    [query, bodyPart],
  );

  // Was schon in der Bibliothek steht, wird gekennzeichnet statt
  // stillschweigend übersprungen.
  const { data: knownIds } = useQuery(async () => {
    const all = await stores.exercises.all();
    const ids = new Set<string>();
    const names = new Set<string>();
    all.forEach((exercise) => {
      if (exercise.externalId?.startsWith('ds:')) ids.add(exercise.externalId.slice(3));
      names.add(exercise.name.trim().toLowerCase());
    });
    return { ids, names };
  }, []);

  function isKnown(entry: DatasetEntry): boolean {
    if (!knownIds) return false;
    return knownIds.ids.has(entry.id) || knownIds.names.has(entry.name.trim().toLowerCase());
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function commit() {
    const chosen = results.filter((entry) => selected.has(entry.id));
    if (chosen.length === 0) return;

    setBusy(true);
    try {
      const result = await importFromDataset(chosen);
      Alert.alert(
        'Übernommen',
        [
          `${result.imported} ${result.imported === 1 ? 'Übung' : 'Übungen'} angelegt`,
          result.skipped ? `${result.skipped} schon vorhanden` : null,
          '',
          'Die GIFs holt die App beim Öffnen der Übung — oder auf einen Schlag über Mehr → GIFs nachladen.',
        ]
          .filter((line) => line !== null)
          .join('\n'),
      );
      setSelected(new Set());
      router.dismissTo('/uebungen');
    } catch (error) {
      Alert.alert('Fehlgeschlagen', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Einstellungen" />
      <Text variant="sectionTitle">Übungen übernehmen</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        {total} Übungen liegen in der App — Suche und Übernahme brauchen kein Netz
      </Text>

      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Suchen, z. B. squat oder biceps"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable
          onPress={() => setBodyPart(undefined)}
          accessibilityRole="radio"
          accessibilityState={{ selected: !bodyPart }}
          style={[styles.chip, { borderColor: !bodyPart ? accent : colors.neutral[800] }]}
        >
          <Text variant="small" color={!bodyPart ? colors.accent[200] : colors.neutral[500]}>
            Alle
          </Text>
        </Pressable>
        {bodyParts.map((part) => (
          <Pressable
            key={part.value}
            onPress={() => setBodyPart(part.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: bodyPart === part.value }}
            style={[
              styles.chip,
              { borderColor: bodyPart === part.value ? accent : colors.neutral[800] },
            ]}
          >
            <Text
              variant="small"
              color={bodyPart === part.value ? colors.accent[200] : colors.neutral[500]}
            >
              {part.label} · {part.count}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {results.length === 0 ? (
          <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
            Keine Treffer. Der Datensatz ist englisch — versuch „squat“ statt
            „Kniebeuge“.
          </Text>
        ) : null}

        {results.map((entry) => {
          const known = isKnown(entry);
          const on = selected.has(entry.id);
          return (
            <Touchable
              key={entry.id}
              onPress={known ? undefined : () => toggle(entry.id)}
              accessibilityLabel={displayName(entry.name)}
              style={[styles.item, on ? styles.itemOn : styles.itemOff]}
            >
              <Checkbox checked={on} />
              <View style={styles.grow}>
                <Text variant="rowTitle" numberOfLines={2} style={styles.itemTitle}>
                  {displayName(entry.name)}
                </Text>
                <Text variant="small" color={colors.neutral[600]} style={styles.itemMeta}>
                  {bodyPartLabel(entry.bodyPart)} · {equipmentLabel(entry.equipment)} ·{' '}
                  {entry.target}
                </Text>
                {known ? (
                  <Text variant="small" color={colors.neutral[700]} style={styles.itemMeta}>
                    schon in der Bibliothek
                  </Text>
                ) : null}
              </View>
            </Touchable>
          );
        })}
      </View>

      {selected.size > 0 ? (
        <ActionButton
          label={
            busy
              ? 'Wird angelegt…'
              : `${selected.size} ${selected.size === 1 ? 'Übung' : 'Übungen'} übernehmen`
          }
          icon={
            busy ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Icon name="Plus" size={16} color={accent} />
            )
          }
          onPress={commit}
          disabled={busy}
          style={styles.action}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13, lineHeight: 19 },
  search: { marginTop: 14 },
  chips: { gap: 7, paddingVertical: 12, paddingRight: 20 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  list: { marginTop: 4, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.card,
  },
  itemOn: { backgroundColor: colors.surface, ...edge() },
  itemOff: { borderWidth: 1, borderColor: colors.neutral[900] },
  grow: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14.5 },
  itemMeta: { marginTop: 3 },
  empty: { textAlign: 'center', lineHeight: 20, marginTop: 10 },
  action: { marginTop: 18 },
});

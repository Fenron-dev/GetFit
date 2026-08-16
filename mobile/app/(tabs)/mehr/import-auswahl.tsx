import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { Checkbox } from '../../../src/components/CheckRow';
import { ActionButton } from '../../../src/components/ActionButton';
import { Touchable } from '../../../src/components/Surface';
import { Icon } from '../../../src/components/icons';
import {
  RESOLUTION_LABELS,
  clearSession,
  commitImport,
  setAllSelected,
  setCandidateCategory,
  updateCandidate,
  useImportSession,
} from '../../../src/lib/mealie';
import { CATEGORY_LABELS } from '../../../src/data/repositories/recipes';
import { MEAL_SLOTS, type ConflictResolution } from '../../../src/types/domain';
import { colors, edge, radius } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';

/** Screen 10 — auswählen, Kategorien richtigstellen, Konflikte klären. */
export default function ImportPreviewRoute() {
  const router = useRouter();
  const { accent, settings } = useTheme();
  const { candidates, origin } = useImportSession();
  const [busy, setBusy] = useState(false);

  const selected = candidates.filter((candidate) => candidate.selected);
  const allOn = candidates.length > 0 && selected.length === candidates.length;
  const conflicts = selected.filter((candidate) => candidate.conflictRecipeId);

  if (candidates.length === 0) {
    return (
      <Screen variant="detail">
        <BackHeader label="Mealie-Import" />
        <Text variant="body" color={colors.neutral[500]} style={styles.emptyNote}>
          Kein laufender Import. Hol dir erst Rezepte vom Server oder aus einer
          Datei.
        </Text>
      </Screen>
    );
  }

  async function runImport() {
    setBusy(true);
    try {
      const result = await commitImport(candidates);
      clearSession();
      Alert.alert(
        'Import abgeschlossen',
        [
          result.imported ? `${result.imported} neu angelegt` : null,
          result.overwritten ? `${result.overwritten} ersetzt` : null,
          result.skipped ? `${result.skipped} übersprungen` : null,
        ]
          .filter(Boolean)
          .join('\n') || 'Nichts übernommen',
      );
      router.dismissTo('/mahlzeiten');
    } catch (error) {
      Alert.alert(
        'Import fehlgeschlagen',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Mealie-Import" onBack={() => { clearSession(); router.back(); }} />

      <Text variant="sectionTitle">
        {candidates.length} {candidates.length === 1 ? 'Rezept' : 'Rezepte'} gefunden
      </Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        aus {origin} · Kategorien sind zugeordnet und änderbar
      </Text>

      <Touchable
        onPress={() => setAllSelected(!allOn)}
        style={styles.allRow}
        accessibilityLabel="Alle auswählen"
      >
        <Checkbox checked={allOn} />
        <Text variant="meta" style={styles.allLabel}>
          Alle auswählen
        </Text>
        <Text variant="meta" color={colors.neutral[500]}>
          {selected.length} von {candidates.length}
        </Text>
      </Touchable>

      <View style={styles.list}>
        {candidates.map((candidate) => (
          <View
            key={candidate.id}
            style={[
              styles.item,
              candidate.selected ? styles.itemOn : styles.itemOff,
            ]}
          >
            <Touchable
              onPress={() =>
                updateCandidate(candidate.id, (current) => ({
                  ...current,
                  selected: !current.selected,
                }))
              }
              accessibilityLabel={candidate.name}
              style={styles.itemHead}
            >
              <Checkbox checked={candidate.selected} />
              <View style={styles.grow}>
                <Text variant="rowTitle" style={styles.itemTitle} numberOfLines={2}>
                  {candidate.name}
                </Text>
                <View style={styles.mapping}>
                  <Text variant="small" color={colors.neutral[600]}>
                    {candidate.mealieCategory}
                  </Text>
                  <Icon name="ArrowRight" size={10} color={colors.neutral[700]} />
                  <Text variant="small" color={colors.accent[300]}>
                    {CATEGORY_LABELS[candidate.category]}
                  </Text>
                </View>
              </View>
              {settings.showKcal && candidate.kcal !== undefined ? (
                <Text variant="meta" color={colors.neutral[500]}>
                  {Math.round(candidate.kcal)} kcal
                </Text>
              ) : null}
            </Touchable>

            {candidate.selected ? (
              <View style={styles.chooserRow}>
                {MEAL_SLOTS.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() =>
                      updateCandidate(candidate.id, (current) =>
                        setCandidateCategory(current, slot),
                      )
                    }
                    accessibilityRole="radio"
                    accessibilityState={{ selected: candidate.category === slot }}
                    style={[
                      styles.chooser,
                      candidate.category === slot
                        ? { borderColor: accent }
                        : { borderColor: colors.neutral[800] },
                    ]}
                  >
                    <Text
                      variant="small"
                      color={
                        candidate.category === slot
                          ? colors.accent[200]
                          : colors.neutral[600]
                      }
                      style={styles.chooserLabel}
                    >
                      {CATEGORY_LABELS[slot]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {candidate.selected && candidate.conflictRecipeId ? (
              <View style={styles.conflict}>
                <Text variant="small" color={colors.warning}>
                  Ein Rezept dieses Namens gibt es schon
                </Text>
                <View style={styles.chooserRow}>
                  {(Object.keys(RESOLUTION_LABELS) as ConflictResolution[]).map(
                    (resolution) => (
                      <Pressable
                        key={resolution}
                        onPress={() =>
                          updateCandidate(candidate.id, (current) => ({
                            ...current,
                            resolution,
                          }))
                        }
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: candidate.resolution === resolution,
                        }}
                        style={[
                          styles.chooser,
                          candidate.resolution === resolution
                            ? { borderColor: colors.warning }
                            : { borderColor: colors.neutral[800] },
                        ]}
                      >
                        <Text
                          variant="small"
                          color={
                            candidate.resolution === resolution
                              ? colors.warning
                              : colors.neutral[600]
                          }
                          style={styles.chooserLabel}
                        >
                          {RESOLUTION_LABELS[resolution]}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {conflicts.length > 0 ? (
        <View style={styles.hint}>
          <Icon name="CloudCheck" size={15} color={colors.neutral[500]} />
          <Text variant="meta" color={colors.neutral[500]} style={styles.hintText}>
            {conflicts.length} {conflicts.length === 1 ? 'Rezept trägt' : 'Rezepte tragen'}{' '}
            einen Namen, den es schon gibt. Entscheide oben, was damit geschehen
            soll.
          </Text>
        </View>
      ) : null}

      <ActionButton
        label={
          busy
            ? 'Wird übernommen…'
            : `${selected.length} ${selected.length === 1 ? 'Rezept' : 'Rezepte'} importieren`
        }
        icon={<Icon name="CloudArrowDown" size={16} color={selected.length ? accent : colors.neutral[600]} />}
        onPress={runImport}
        disabled={selected.length === 0 || busy}
        style={styles.action}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  emptyNote: { marginTop: 20, lineHeight: 22 },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.md + 3,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  allLabel: { flex: 1, fontSize: 13.5 },
  list: { marginTop: 12, gap: 8 },
  item: { borderRadius: radius.card, paddingBottom: 2 },
  itemOn: { backgroundColor: colors.surface, ...edge() },
  itemOff: { borderWidth: 1, borderColor: colors.neutral[900], opacity: 0.6 },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  grow: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14.5 },
  mapping: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  chooserRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  chooser: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chooserLabel: { fontSize: 11 },
  conflict: {
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.md + 3,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  hintText: { flex: 1, lineHeight: 19 },
  action: { marginTop: 18, height: 48 },
});

import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './Text';
import { Touchable } from './Surface';
import { ActionButton } from './ActionButton';
import { Icon } from './icons';
import {
  ExerciseDbError,
  attachMedia,
  authHeaders,
  bodyPartLabel,
  exerciseName,
  searchByName,
  type ExerciseDbEntry,
} from '../lib/exercisedb';
import { colors, edge, fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Sucht bei ExerciseDB nach einem passenden GIF für eine Übung, die schon
 * in der Bibliothek steht — der Weg, den mitgelieferten Startbestand
 * nachträglich zu bebildern.
 *
 * ExerciseDB kennt nur englische Namen; der Suchbegriff wird deshalb
 * vorbelegt, aber bleibt änderbar.
 */
export function ExerciseDbGifPicker({
  exerciseId,
  suggestion,
}: {
  exerciseId: string;
  /** Vorschlag für den Suchbegriff, meist der englische Übungsname. */
  suggestion: string;
}) {
  const { accent, settings } = useTheme();
  const apiKey = settings.exerciseDb.apiKey;

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState(suggestion);
  const [results, setResults] = useState<ExerciseDbEntry[]>();
  const [busy, setBusy] = useState(false);

  async function search() {
    setBusy(true);
    try {
      setResults(await searchByName(apiKey, term));
    } catch (error) {
      Alert.alert(
        'Suche fehlgeschlagen',
        error instanceof ExerciseDbError || error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setBusy(false);
    }
  }

  async function choose(entry: ExerciseDbEntry) {
    setBusy(true);
    try {
      await attachMedia(apiKey, exerciseId, entry);
      // Die Übung wird geschrieben; die Abfrage im Detailscreen lädt
      // daraufhin von allein neu.
      setOpen(false);
      setResults(undefined);
    } catch (error) {
      Alert.alert('Nicht übernommen', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  if (!apiKey) return null;

  return (
    <>
      <Touchable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityLabel="GIF bei ExerciseDB suchen"
      >
        <Icon name="MagnifyingGlass" size={15} color={accent} />
        <Text variant="small" color={accent}>
          ExerciseDB
        </Text>
      </Touchable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text variant="rowTitle">GIF bei ExerciseDB suchen</Text>
            <Text variant="meta" color={colors.neutral[500]} style={styles.body}>
              Dort heißen die Übungen englisch — „squat“ statt „Kniebeuge“.
            </Text>

            <TextInput
              value={term}
              onChangeText={setTerm}
              placeholder="squat"
              placeholderTextColor={colors.neutral[700]}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={search}
              returnKeyType="search"
            />

            <ActionButton
              label={busy ? 'Sucht…' : 'Suchen'}
              onPress={search}
              disabled={busy || term.trim().length < 2}
              quiet
              style={styles.searchButton}
            />

            {busy ? <ActivityIndicator color={accent} style={styles.spinner} /> : null}

            <View style={styles.results}>
              {results?.length === 0 ? (
                <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
                  Keine Treffer.
                </Text>
              ) : null}

              {results?.slice(0, 6).map((entry) => (
                <Touchable
                  key={entry.id ?? entry.name}
                  onPress={() => choose(entry)}
                  style={styles.result}
                  accessibilityLabel={exerciseName(entry)}
                >
                  {entry.gifUrl ? (
                    <Image
                      source={{ uri: entry.gifUrl, headers: authHeaders(apiKey) }}
                      style={styles.preview}
                      contentFit="cover"
                      autoplay={false}
                    />
                  ) : (
                    <View style={[styles.preview, styles.previewEmpty]} />
                  )}
                  <View style={styles.grow}>
                    <Text variant="meta" numberOfLines={2}>
                      {exerciseName(entry)}
                    </Text>
                    <Text variant="small" color={colors.neutral[600]}>
                      {bodyPartLabel(entry.bodyPart)}
                    </Text>
                  </View>
                </Touchable>
              ))}
            </View>

            <ActionButton
              label="Schließen"
              quiet
              onPress={() => setOpen(false)}
              style={styles.close}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(11,12,20,0.72)',
  },
  dialog: {
    width: '100%',
    maxHeight: '82%',
    padding: 18,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(colors.neutral[700]),
  },
  body: { marginTop: 6, lineHeight: 19 },
  input: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.neutral[800],
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  searchButton: { marginTop: 10 },
  spinner: { marginTop: 14 },
  results: { marginTop: 12, gap: 8 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  preview: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[900],
  },
  previewEmpty: {},
  grow: { flex: 1, minWidth: 0 },
  empty: { textAlign: 'center' },
  close: { marginTop: 14 },
});

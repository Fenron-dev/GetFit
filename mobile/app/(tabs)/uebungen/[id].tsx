import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { MediaBadge, MediaFrame } from '../../../src/components/MediaFrame';
import { MediaActions } from '../../../src/components/MediaActions';
import { Chip } from '../../../src/components/Chip';
import { StatTile } from '../../../src/components/StatTile';
import { ActionButton } from '../../../src/components/ActionButton';
import { Touchable } from '../../../src/components/Surface';
import { Icon, Plus } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  deleteExercise,
  exerciseMeta,
  getExercise,
  updateExercise,
} from '../../../src/data/repositories/exercises';
import { addDayEntry } from '../../../src/data/repositories/dayLog';
import { today } from '../../../src/lib/date';
import { datasetIdOf, fetchDatasetGif } from '../../../src/lib/dataset/import';
import { colors, layout, radius } from '../../../src/theme/tokens';
import { useAccent, useTheme } from '../../../src/theme/ThemeProvider';

/** Screen 03 — Übungs-Detail mit GIF-Platzhalter. */
export default function ExerciseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = useAccent();
  const { settings } = useTheme();
  const { data: exercise, loading } = useQuery(() => getExercise(id), [id]);

  /**
   * Stammt die Übung aus dem Datensatz und fehlt ihr noch das GIF, wird
   * es beim ersten Öffnen einmal geholt. Der Versuch wird gemerkt, damit
   * ein Fehlschlag nicht bei jedem Blick erneut ins Netz greift.
   */
  const [loadingGif, setLoadingGif] = useState(false);
  const tried = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!exercise || exercise.mediaUrl) return;
    const datasetId = datasetIdOf(exercise.externalId);
    if (!datasetId || tried.current.has(exercise.id)) return;

    tried.current.add(exercise.id);
    setLoadingGif(true);
    fetchDatasetGif(exercise.id, datasetId)
      .catch(() => {
        // Kein Netz oder Sperre — der Platzhalter bleibt, die Knöpfe
        // darunter erlauben den zweiten Versuch.
      })
      .finally(() => setLoadingGif(false));
  }, [exercise]);

  if (loading) {
    return (
      <Screen variant="detail">
        <BackHeader label="Übungen" />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen variant="detail">
        <BackHeader label="Übungen" />
        <Text variant="body" color={colors.neutral[500]}>
          Diese Übung gibt es nicht mehr.
        </Text>
      </Screen>
    );
  }

  const restLabel =
    exercise.restSeconds >= 60 && exercise.restSeconds % 60 === 0
      ? `${exercise.restSeconds / 60} Min`
      : `${exercise.restSeconds}s`;

  /**
   * Der Verbrauch wird von Hand gesetzt. Als Anhalt schlägt die App einen
   * Wert vor, der sich aus Körpergewicht und geschätzter Dauer ergibt —
   * eine Faustregel, kein Messwert, deshalb änderbar.
   */
  function askKcal(current: NonNullable<typeof exercise>) {
    const minutes = Math.max(
      2,
      Math.round((current.defaultSets * (45 + current.restSeconds)) / 60),
    );
    // 6 MET entspricht mäßig anstrengendem Krafttraining.
    const suggestion = settings.weightKg
      ? Math.round((6 * settings.weightKg * minutes) / 60)
      : undefined;

    Alert.alert(
      'Verbrauch je Durchgang',
      suggestion
        ? `Etwa ${minutes} Minuten bei ${settings.weightKg} kg — geschätzt ${suggestion} kcal.`
        : 'Trag im Profil dein Gewicht ein, dann schlägt die App einen Wert vor.',
      [
        ...(suggestion
          ? [
              {
                text: `${suggestion} kcal übernehmen`,
                onPress: () => {
                  updateExercise(current.id, { kcalBurn: suggestion });
                },
              },
            ]
          : []),
        ...(current.kcalBurn
          ? [
              {
                text: 'Wert entfernen',
                style: 'destructive' as const,
                onPress: () => {
                  updateExercise(current.id, { kcalBurn: undefined });
                },
              },
            ]
          : []),
        { text: 'Abbrechen', style: 'cancel' as const },
      ],
    );
  }

  async function addToToday() {
    if (!exercise) return;
    await addDayEntry(today(), {
      kind: 'training',
      refId: exercise.id,
      title: exercise.name,
      meta: `${exercise.defaultSets} Sätze · ${exercise.defaultReps}`,
      kcal: exercise.kcalBurn,
    });
    router.push('/');
  }

  return (
    <Screen variant="detail" bleed>
      <View style={styles.header}>
        <BackHeader label="Übungen" />
      </View>

      <View style={styles.media}>
        <MediaFrame
          icon={exercise.icon}
          source={exercise.mediaUrl}
          contentFit="contain"
          height={250}
          sweep
          placeholderBadge={<MediaBadge label="GIF" dot />}
          progress={{ count: 4, active: 0 }}
        />
        {loadingGif ? (
          <View style={styles.gifLoading}>
            <ActivityIndicator size="small" color={accent} />
            <Text variant="small" color={colors.neutral[500]}>
              GIF wird geladen…
            </Text>
          </View>
        ) : null}

        <MediaActions
          ownerId={exercise.id}
          current={exercise.mediaUrl}
          label="GIF"
          onChange={(uri) =>
            updateExercise(exercise.id, { mediaUrl: uri, mediaAttribution: undefined })
          }
        />

        {exercise.mediaAttribution ? (
          <Text variant="small" color={colors.neutral[600]} style={styles.attribution}>
            {exercise.mediaAttribution}
          </Text>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text variant="detailTitle">{exercise.name}</Text>
        <View style={styles.chip}>
          <Chip label={exerciseMeta(exercise)} />
        </View>

        <Text variant="body" color={colors.neutral[400]} style={styles.description}>
          {exercise.description}
        </Text>

        <View style={styles.stats}>
          <StatTile label="Sätze" value={String(exercise.defaultSets)} />
          <StatTile label="Wdh." value={exercise.defaultReps} />
          <StatTile label="Pause" value={restLabel} />
        </View>

        <Touchable
          onPress={() => askKcal(exercise)}
          accessibilityLabel="Kalorienverbrauch bearbeiten"
          style={styles.kcalRow}
        >
          <Icon name="Flame" size={15} color={exercise.kcalBurn ? accent : colors.neutral[600]} />
          <Text variant="meta" style={styles.grow}>
            Verbrauch je Durchgang
          </Text>
          <Text
            variant="meta"
            color={exercise.kcalBurn ? colors.text : colors.neutral[600]}
          >
            {exercise.kcalBurn ? `${exercise.kcalBurn} kcal` : 'nicht gesetzt'}
          </Text>
        </Touchable>

        <ActionButton
          label="Zum Heute-Plan hinzufügen"
          icon={<Plus size={16} color={accent} />}
          onPress={addToToday}
          style={styles.action}
        />

        <ActionButton
          label="Übung löschen"
          quiet
          onPress={() =>
            Alert.alert('Übung löschen?', `„${exercise.name}“ wird entfernt.`, [
              { text: 'Abbrechen', style: 'cancel' },
              {
                text: 'Löschen',
                style: 'destructive',
                onPress: async () => {
                  await deleteExercise(exercise.id);
                  router.back();
                },
              },
            ])
          }
          style={styles.actionQuiet}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  media: {
    marginTop: 6,
    marginHorizontal: 16,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 20,
  },
  chip: {
    marginTop: 8,
  },
  description: {
    marginTop: 14,
    lineHeight: 22,
  },
  stats: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    marginTop: 18,
  },
  actionQuiet: {
    marginTop: 8,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  grow: { flex: 1 },
  gifLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  attribution: {
    marginTop: 8,
  },
});

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { SearchField } from '../../../src/components/SearchField';
import { ListRow } from '../../../src/components/ListRow';
import { Fab } from '../../../src/components/Fab';
import { useQuery } from '../../../src/hooks/useQuery';
import { exerciseMeta, searchExercises } from '../../../src/data/repositories/exercises';
import { colors, radius } from '../../../src/theme/tokens';
import { useAccent } from '../../../src/theme/ThemeProvider';

/** Screen 02 — die Übungsbibliothek. */
export default function ExerciseListRoute() {
  const router = useRouter();
  const accent = useAccent();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>();

  const { data: all } = useQuery(() => searchExercises(query), [query]);

  // Die Regionen kommen aus dem Bestand, nicht aus einer festen Liste —
  // eigene Übungen können jede Bezeichnung tragen.
  const groups = [...new Set((all ?? []).map((item) => item.muscleGroup))].sort((a, b) =>
    a.localeCompare(b, 'de'),
  );
  const exercises = group ? all?.filter((item) => item.muscleGroup === group) : all;

  return (
    <Screen
      overlay={
        <Fab onPress={() => router.push('/uebungen/neu')} label="Übung anlegen" />
      }
    >
      <Text variant="screenTitle">Übungen</Text>

      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Übung suchen"
        />
      </View>

      {groups.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Pressable
            onPress={() => setGroup(undefined)}
            accessibilityRole="radio"
            accessibilityState={{ selected: !group }}
            style={[styles.chip, { borderColor: !group ? accent : colors.neutral[800] }]}
          >
            <Text variant="small" color={!group ? colors.accent[200] : colors.neutral[500]}>
              Alle
            </Text>
          </Pressable>
          {groups.map((name) => (
            <Pressable
              key={name}
              onPress={() => setGroup(group === name ? undefined : name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: group === name }}
              style={[
                styles.chip,
                { borderColor: group === name ? accent : colors.neutral[800] },
              ]}
            >
              <Text
                variant="small"
                color={group === name ? colors.accent[200] : colors.neutral[500]}
              >
                {name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.list}>
        {exercises?.map((exercise) => (
          <ListRow
            key={exercise.id}
            icon={exercise.icon}
            title={exercise.name}
            meta={exerciseMeta(exercise)}
            showCaret
            onPress={() => router.push(`/uebungen/${exercise.id}`)}
          />
        ))}

        {exercises?.length === 0 ? (
          <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
            {query || group
              ? 'Keine Übung passt zu dieser Auswahl.'
              : 'Noch keine Übungen — lege die erste über das Plus an.'}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    marginTop: 14,
  },
  chips: {
    gap: 7,
    paddingVertical: 12,
    paddingRight: 20,
  },
  list: {
    marginTop: 6,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  empty: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});

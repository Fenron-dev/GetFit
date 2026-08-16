import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { SearchField } from '../../../src/components/SearchField';
import { ListRow } from '../../../src/components/ListRow';
import { Fab } from '../../../src/components/Fab';
import { useQuery } from '../../../src/hooks/useQuery';
import { exerciseMeta, searchExercises } from '../../../src/data/repositories/exercises';
import { colors } from '../../../src/theme/tokens';

/** Screen 02 — die Übungsbibliothek. */
export default function ExerciseListRoute() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: exercises } = useQuery(() => searchExercises(query), [query]);

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
            {query
              ? `Keine Übung passt zu „${query}“.`
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
  list: {
    marginTop: 18,
    gap: 8,
  },
  empty: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});

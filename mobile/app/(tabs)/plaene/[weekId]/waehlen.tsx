import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../../src/components/Screen';
import { Text } from '../../../../src/components/Text';
import { BackHeader } from '../../../../src/components/BackHeader';
import { SearchField } from '../../../../src/components/SearchField';
import { ListRow } from '../../../../src/components/ListRow';
import { SectionHead } from '../../../../src/components/SectionHead';
import { ActionButton } from '../../../../src/components/ActionButton';
import { useQuery } from '../../../../src/hooks/useQuery';
import { exerciseMeta, searchExercises } from '../../../../src/data/repositories/exercises';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SLOT_LABELS,
  listRecipesByCategory,
  recipeMeta,
} from '../../../../src/data/repositories/recipes';
import { addPlanTraining, setPlanDayMeal } from '../../../../src/data/repositories/plans';
import type { DayKey, MealSlot } from '../../../../src/types/domain';
import { colors } from '../../../../src/theme/tokens';
import { useTheme } from '../../../../src/theme/ThemeProvider';

/**
 * Auswahl aus der Bibliothek für einen Tag im Plan. Liegt bewusst im
 * Pläne-Stack und nicht im jeweiligen Bibliotheks-Tab: der Blick bleibt
 * beim Plan, und nach der Wahl steht man wieder genau dort, wo man war.
 *
 * Beide Bibliotheken teilen sich diesen Screen, weil sie im Entwurf
 * ohnehin gleich aufgebaut sind.
 */
export default function PickerRoute() {
  const { weekId, tag, art, slot } = useLocalSearchParams<{
    weekId: string;
    tag: DayKey;
    art: 'rezept' | 'uebung';
    slot?: MealSlot;
  }>();
  const router = useRouter();
  const { settings } = useTheme();
  const [query, setQuery] = useState('');

  const forRecipes = art === 'rezept';

  const { data: exercises } = useQuery(
    () => (forRecipes ? Promise.resolve([]) : searchExercises(query)),
    [query, forRecipes],
  );
  const { data: groups } = useQuery(
    () => (forRecipes ? listRecipesByCategory(query) : Promise.resolve([])),
    [query, forRecipes],
  );

  async function chooseRecipe(recipeId: string) {
    if (!slot) return;
    await setPlanDayMeal(weekId, tag, slot, recipeId);
    router.back();
  }

  async function clearSlot() {
    if (!slot) return;
    await setPlanDayMeal(weekId, tag, slot, null);
    router.back();
  }

  async function chooseExercise(exerciseId: string, sets: number, reps: string) {
    await addPlanTraining(weekId, tag, { exerciseId, sets, reps });
    router.back();
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Wochenplan" />

      <Text variant="sectionTitle">
        {forRecipes ? 'Rezept wählen' : 'Übung wählen'}
      </Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        für {tag}
        {forRecipes && slot ? ` · ${SLOT_LABELS[slot]}` : ''}
      </Text>

      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={forRecipes ? 'Rezept suchen' : 'Übung suchen'}
        />
      </View>

      {forRecipes
        ? groups
            ?.filter((group) => group.items.length > 0)
            .map((group) => (
              <View key={group.category}>
                <SectionHead
                  icon={CATEGORY_ICONS[group.category]}
                  label={CATEGORY_LABELS[group.category]}
                />
                <View style={styles.list}>
                  {group.items.map((recipe) => (
                    <ListRow
                      key={recipe.id}
                      icon={recipe.icon}
                      title={recipe.name}
                      meta={recipeMeta(recipe)}
                      thumbSize={44}
                      trailing={
                        settings.showKcal && recipe.nutrition.kcal !== undefined ? (
                          <Text variant="meta" color={colors.neutral[500]}>
                            {recipe.nutrition.kcal} kcal
                          </Text>
                        ) : undefined
                      }
                      onPress={() => chooseRecipe(recipe.id)}
                    />
                  ))}
                </View>
              </View>
            ))
        : (
            <View style={styles.listTop}>
              {exercises?.map((exercise) => (
                <ListRow
                  key={exercise.id}
                  icon={exercise.icon}
                  title={exercise.name}
                  meta={exerciseMeta(exercise)}
                  onPress={() =>
                    chooseExercise(exercise.id, exercise.defaultSets, exercise.defaultReps)
                  }
                />
              ))}
            </View>
          )}

      {forRecipes ? (
        <ActionButton label="Slot leeren" onPress={clearSlot} quiet style={styles.action} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  search: { marginTop: 14 },
  list: { marginTop: 10, gap: 8 },
  listTop: { marginTop: 18, gap: 8 },
  action: { marginTop: 18 },
});

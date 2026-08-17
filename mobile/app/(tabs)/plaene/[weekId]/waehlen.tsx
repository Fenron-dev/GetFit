import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
import { addPlanTraining, setPlanMeal } from '../../../../src/data/repositories/plans';
import {
  LOCATION_LABELS,
  daysLeft,
  listStock,
} from '../../../../src/data/repositories/stock';
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
  const { weekId, tag, art, slot, eintrag } = useLocalSearchParams<{
    weekId: string;
    tag: DayKey;
    art: 'rezept' | 'uebung';
    slot?: MealSlot;
    /** Der Planeintrag, der belegt werden soll. */
    eintrag?: string;
  }>();
  const router = useRouter();
  const { settings } = useTheme();
  const [query, setQuery] = useState('');
  const [prepFor, setPrepFor] = useState<string>();

  // Die Frage nach dem Vorkochen kommt erst, wenn das Rezept steht —
  // sonst stünde sie vor der Entscheidung, die sie betrifft.
  useEffect(() => {
    if (prepFor) askPrep(prepFor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepFor]);

  const forRecipes = art === 'rezept';

  const { data: exercises } = useQuery(
    () => (forRecipes ? Promise.resolve([]) : searchExercises(query)),
    [query, forRecipes],
  );
  const { data: groups } = useQuery(
    () => (forRecipes ? listRecipesByCategory(query) : Promise.resolve([])),
    [query, forRecipes],
  );

  /** Was gekocht im Haus ist — steht in der Liste ganz oben. */
  const { data: stock } = useQuery(
    () => (forRecipes ? listStock() : Promise.resolve([])),
    [forRecipes],
  );

  /**
   * Ein Rezept aus dem Vorrat ist fertig — es wird nur entnommen. Wird
   * dagegen frisch gekocht, lohnt die Frage nach dem Vorkochen: das ist
   * der Moment, in dem man weiß, ob sich der größere Topf lohnt.
   */
  async function chooseRecipe(recipeId: string, fromStockId?: string) {
    if (!eintrag) return;

    if (fromStockId) {
      await setPlanMeal(weekId, tag, eintrag, {
        recipeId,
        fromStockId,
        prep: undefined,
      });
      router.back();
      return;
    }

    await setPlanMeal(weekId, tag, eintrag, {
      recipeId,
      fromStockId: undefined,
    });
    setPrepFor(recipeId);
  }

  /** Nach der Wahl: wie viel wird zusätzlich gekocht und wohin? */
  function askPrep(recipeId: string) {
    const recipe = groups
      ?.flatMap((group) => group.items)
      .find((item) => item.id === recipeId);

    Alert.alert(
      'Vorkochen?',
      recipe
        ? `${recipe.name} ist für ${recipe.servings} ${recipe.servings === 1 ? 'Portion' : 'Portionen'} angelegt.`
        : undefined,
      [
        { text: 'Nur für heute', onPress: () => router.back() },
        {
          text: '+2 in den Kühlschrank',
          onPress: async () => {
            await setPlanMeal(weekId, tag, eintrag!, {
              prep: { portions: 2, location: 'fridge' },
            });
            router.back();
          },
        },
        {
          text: '+2 in den Gefrierer',
          onPress: async () => {
            await setPlanMeal(weekId, tag, eintrag!, {
              prep: { portions: 2, location: 'freezer' },
            });
            router.back();
          },
        },
      ],
    );
  }

  async function clearSlot() {
    if (!eintrag) return;
    await setPlanMeal(weekId, tag, eintrag, {
      recipeId: null,
      fromStockId: undefined,
      prep: undefined,
    });
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

      {forRecipes && stock && stock.length > 0 ? (
        <View>
          <SectionHead icon="Snowflake" label="Schon gekocht" />
          <View style={styles.list}>
            {stock.map((item) => {
              const rest = daysLeft(item);
              return (
                <ListRow
                  key={item.id}
                  icon="Snowflake"
                  title={item.recipeName}
                  meta={`${item.portions} ${item.portions === 1 ? 'Portion' : 'Portionen'} · ${LOCATION_LABELS[item.location]} · ${
                    rest < 0
                      ? 'überfällig'
                      : rest === 0
                        ? 'heute verbrauchen'
                        : `noch ${rest} ${rest === 1 ? 'Tag' : 'Tage'}`
                  }`}
                  thumbSize={44}
                  onPress={() => chooseRecipe(item.recipeId, item.id)}
                />
              );
            })}
          </View>
        </View>
      ) : null}

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

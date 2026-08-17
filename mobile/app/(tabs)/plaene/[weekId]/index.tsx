import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../../src/components/Screen';
import { Text } from '../../../../src/components/Text';
import { BackHeader } from '../../../../src/components/BackHeader';
import { SectionHead } from '../../../../src/components/SectionHead';
import { ActionButton } from '../../../../src/components/ActionButton';
import { Touchable } from '../../../../src/components/Surface';
import { DraggableList } from '../../../../src/components/DraggableList';
import { Copy, DotsSixVertical, Icon, Plus } from '../../../../src/components/icons';
import { useQuery } from '../../../../src/hooks/useQuery';
import {
  addPlanMeal,
  duplicatePlanWeek,
  formatWeekRange,
  getPlanDay,
  getPlanWeek,
  listPlanDays,
  removePlanMeal,
  removePlanTraining,
  reorderPlanTraining,
  setPlanMeal,
} from '../../../../src/data/repositories/plans';
import { getExercise } from '../../../../src/data/repositories/exercises';
import { SLOT_LABELS, getRecipe } from '../../../../src/data/repositories/recipes';
import { LOCATION_LABELS } from '../../../../src/data/repositories/stock';
import {
  DAY_KEYS,
  MEAL_SLOTS,
  type DayKey,
  type MealSlot,
} from '../../../../src/types/domain';
import { colors, edge, radius, tint } from '../../../../src/theme/tokens';
import { useAccent, useTheme } from '../../../../src/theme/ThemeProvider';

/** Screen 07 — ein Tag der Woche, mit Training und den vier Slots. */
export default function PlanDetailRoute() {
  const { weekId, tag } = useLocalSearchParams<{ weekId: string; tag?: DayKey }>();
  const router = useRouter();
  const accent = useAccent();
  const { settings } = useTheme();

  const day: DayKey = DAY_KEYS.includes(tag as DayKey) ? (tag as DayKey) : 'Mo';

  const { data: week } = useQuery(() => getPlanWeek(weekId), [weekId]);
  const { data: allDays } = useQuery(() => listPlanDays(weekId), [weekId]);
  const { data: detail } = useQuery(() => loadDay(weekId, day), [weekId, day]);

  if (!week) {
    return (
      <Screen variant="detail">
        <BackHeader label="Pläne" />
      </Screen>
    );
  }

  const kcalSum = detail?.meals.reduce((sum, slot) => sum + (slot.kcal ?? 0), 0) ?? 0;

  function openPicker(entryId: string, slot: MealSlot) {
    router.push(
      `/plaene/${weekId}/waehlen?tag=${day}&art=rezept&eintrag=${entryId}&slot=${slot}`,
    );
  }

  async function addMeal() {
    // Ein zusätzlicher Eintrag beginnt als Snack — das ist der Fall, für
    // den man ihn am häufigsten braucht.
    const entryId = await addPlanMeal(weekId, day, 'snack');
    openPicker(entryId, 'snack');
  }

  /** Portionen, Kategorie, Rezept und Entfernen für einen Eintrag. */
  function openMealActions(entry: {
    id: string;
    slot: MealSlot;
    servings: number;
    recipeId: string | null;
  }) {
    Alert.alert(SLOT_LABELS[entry.slot], undefined, [
      {
        text: entry.recipeId ? 'Rezept wechseln' : 'Rezept wählen',
        onPress: () => openPicker(entry.id, entry.slot),
      },
      {
        text: `Portionen: ${entry.servings} → ${(entry.servings % 4) + 1}`,
        onPress: () => {
          setPlanMeal(weekId, day, entry.id, { servings: (entry.servings % 4) + 1 });
        },
      },
      {
        text: 'Kategorie wechseln',
        onPress: () => {
          const next =
            MEAL_SLOTS[(MEAL_SLOTS.indexOf(entry.slot) + 1) % MEAL_SLOTS.length];
          setPlanMeal(weekId, day, entry.id, { slot: next });
        },
      },
      {
        text: 'Entfernen',
        style: 'destructive' as const,
        onPress: () => {
          removePlanMeal(weekId, day, entry.id);
        },
      },
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  }

  /**
   * Der Griff aus dem Entwurf steht für Umsortieren. Echtes Ziehen
   * bräuchte Reanimated und Gesture Handler — bis dahin öffnet ein Tipp
   * dieselben Möglichkeiten als Auswahl, was auch mit einer Hand geht.
   */
  function openTrainingActions(itemId: string, name: string, index: number) {
    const order = detail?.training.map((entry) => entry.id) ?? [];

    function moveTo(target: number) {
      const next = [...order];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      reorderPlanTraining(weekId, day, next);
    }

    Alert.alert(name, undefined, [
      ...(index > 0
        ? [{ text: 'Nach oben', onPress: () => moveTo(index - 1) }]
        : []),
      ...(index < order.length - 1
        ? [{ text: 'Nach unten', onPress: () => moveTo(index + 1) }]
        : []),
      {
        text: 'Entfernen',
        style: 'destructive' as const,
        onPress: () => removePlanTraining(weekId, day, itemId),
      },
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Pläne" />

      <View style={styles.titleRow}>
        <Text variant="sectionTitle">{week.title}</Text>
        <Text variant="meta" color={colors.neutral[500]}>
          {formatWeekRange(week.startDate)}
        </Text>
      </View>

      <View style={styles.dayChips}>
        {DAY_KEYS.map((key) => {
          const planDay = allDays?.find((entry) => entry.day === key);
          const filled = (planDay?.training.length ?? 0) > 0;
          const active = key === day;
          return (
            <Touchable
              key={key}
              onPress={() => router.setParams({ tag: key })}
              accessibilityLabel={key}
              style={[
                styles.dayChip,
                active
                  ? { backgroundColor: tint(accent, '15'), borderColor: accent }
                  : { borderColor: colors.neutral[800] },
              ]}
            >
              <Text
                variant="meta"
                color={active ? colors.accent[200] : colors.neutral[500]}
                style={styles.dayChipLabel}
              >
                {key}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: filled ? accent : colors.neutral[800] },
                ]}
              />
            </Touchable>
          );
        })}
      </View>

      <SectionHead icon="Barbell" label="Training" note={detail?.note} />
      <DraggableList
        items={detail?.training ?? []}
        keyOf={(item) => item.id}
        onReorder={(orderedIds) => reorderPlanTraining(weekId, day, orderedIds)}
        renderItem={(item, index, handle) => (
          <Touchable
            onPress={() => openTrainingActions(item.id, item.name, index)}
            accessibilityLabel={`${item.name} bearbeiten`}
            accessibilityHint="Am Griff links ziehen, um die Reihenfolge zu ändern"
            style={styles.trainingRow}
          >
            <View>
              <DotsSixVertical size={16} color={colors.neutral[700]} />
              {handle}
            </View>
            <View style={styles.grow}>
              <Text variant="rowTitle" style={styles.rowTitle}>
                {item.name}
              </Text>
              <Text variant="meta" color={colors.neutral[500]} style={styles.rowMeta}>
                {item.meta}
              </Text>
            </View>
          </Touchable>
        )}
      />
      <View style={styles.list}>
        <ActionButton
          label="Übung aus der Bibliothek"
          icon={<Plus size={14} color={colors.neutral[400]} />}
          onPress={() =>
            router.push(`/plaene/${weekId}/waehlen?tag=${day}&art=uebung`)
          }
          quiet
        />
      </View>

      <SectionHead
        icon="ForkKnife"
        label="Ernährung"
        note={settings.showKcal && kcalSum > 0 ? `${Math.round(kcalSum)} kcal` : undefined}
      />
      <View style={styles.list}>
        {detail?.meals.map((entry) => (
          <Touchable
            key={entry.id}
            // Wie im Entwurf: ein belegter Eintrag führt zum Rezept.
            // Ändern, Portionen und Entfernen liegen auf dem langen Druck.
            onPress={() =>
              entry.recipeId
                ? router.push(`/plaene/${weekId}/rezept/${entry.recipeId}`)
                : openPicker(entry.id, entry.slot)
            }
            onLongPress={() => openMealActions(entry)}
            accessibilityLabel={`${SLOT_LABELS[entry.slot]}: ${entry.name}`}
            accessibilityHint="Lang drücken für Portionen, Uhrzeit und Entfernen"
            style={[styles.mealRow, entry.recipeId ? styles.mealFilled : styles.mealEmpty]}
          >
            <View style={styles.slotColumn}>
              <Text variant="small" color={colors.neutral[600]} style={styles.slotLabel}>
                {SLOT_LABELS[entry.slot]}
              </Text>
              {entry.time ? (
                <Text variant="small" color={colors.neutral[700]}>
                  {entry.time}
                </Text>
              ) : null}
            </View>

            <View style={styles.grow}>
              <Text
                variant="rowTitle"
                color={entry.recipeId ? colors.text : colors.neutral[600]}
                style={styles.rowTitle}
                numberOfLines={1}
              >
                {entry.name}
              </Text>
              {entry.recipeId ? (
                <Text variant="small" color={colors.neutral[600]} style={styles.rowMeta}>
                  {[
                    entry.servings > 1 ? `${entry.servings} Portionen` : null,
                    entry.fromStockId ? 'aus dem Vorrat' : null,
                    entry.prep
                      ? `+${entry.prep.portions} ${LOCATION_LABELS[entry.prep.location]}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || null}
                </Text>
              ) : null}
            </View>

            {settings.showKcal && entry.kcal !== undefined ? (
              <Text variant="meta" color={colors.neutral[500]}>
                {Math.round(entry.kcal)} kcal
              </Text>
            ) : null}
          </Touchable>
        ))}

        <ActionButton
          label="Mahlzeit hinzufügen"
          icon={<Plus size={14} color={colors.neutral[400]} />}
          onPress={addMeal}
          quiet
        />
      </View>

      <ActionButton
        label="Woche duplizieren"
        icon={<Copy size={16} color={accent} />}
        onPress={async () => {
          const id = await duplicatePlanWeek(weekId);
          router.replace(`/plaene/${id}`);
        }}
        style={styles.action}
      />

      <ActionButton
        label="Einkaufsliste erzeugen"
        icon={<Icon name="Basket" size={16} color={colors.neutral[400]} />}
        onPress={() => router.push(`/plaene/${weekId}/einkaufsliste`)}
        quiet
        style={styles.actionQuiet}
      />
    </Screen>
  );
}

/** Lädt den Tag und löst die Verweise auf Übungen und Rezepte auf. */
async function loadDay(weekId: string, day: DayKey) {
  const planDay = await getPlanDay(weekId, day);
  if (!planDay) return undefined;

  const training = await Promise.all(
    [...planDay.training]
      .sort((a, b) => a.order - b.order)
      .map(async (item) => {
        const exercise = await getExercise(item.exerciseId);
        const repsSuffix = /^\d+$/.test(item.reps) ? ' Wdh.' : '';
        return {
          id: item.id,
          name: exercise?.name ?? 'Unbekannte Übung',
          meta: `${item.sets} Sätze · ${item.reps}${repsSuffix}`,
          kcalBurn: exercise?.kcalBurn,
        };
      }),
  );

  const meals = await Promise.all(
    [...planDay.meals]
      .sort((a, b) => a.order - b.order)
      .map(async (entry) => {
        const recipe = entry.recipeId ? await getRecipe(entry.recipeId) : undefined;
        const perPortion = recipe?.nutrition.kcal;
        return {
          ...entry,
          name: recipe?.name ?? 'Rezept wählen',
          kcal: perPortion !== undefined ? perPortion * entry.servings : undefined,
        };
      }),
  );

  return { note: planDay.note || undefined, training, meals };
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  dayChips: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingTop: 9,
    paddingBottom: 8,
    borderRadius: radius.md + 2,
    borderWidth: 1,
  },
  dayChipLabel: { fontSize: 12 },
  dayDot: { width: 4, height: 4, borderRadius: radius.pill },
  list: { marginTop: 10, gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14.5 },
  rowMeta: { marginTop: 2, fontSize: 12 },
  trainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.card,
  },
  mealFilled: { backgroundColor: colors.surface, ...edge() },
  mealEmpty: { borderWidth: 1, borderColor: colors.neutral[800] },
  slotColumn: { width: 56, flexShrink: 0, gap: 2 },
  slotLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  slotEmpty: { fontWeight: '400' },
  action: { marginTop: 18 },
  actionQuiet: { marginTop: 8 },
});

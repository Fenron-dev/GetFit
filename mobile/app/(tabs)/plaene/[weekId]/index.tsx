import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../../src/components/Screen';
import { Text } from '../../../../src/components/Text';
import { BackHeader } from '../../../../src/components/BackHeader';
import { SectionHead } from '../../../../src/components/SectionHead';
import { ActionButton } from '../../../../src/components/ActionButton';
import { Touchable } from '../../../../src/components/Surface';
import { Copy, DotsSixVertical, Icon, Plus } from '../../../../src/components/icons';
import { useQuery } from '../../../../src/hooks/useQuery';
import {
  duplicatePlanWeek,
  formatWeekRange,
  getPlanDay,
  getPlanWeek,
  listPlanDays,
} from '../../../../src/data/repositories/plans';
import { getExercise } from '../../../../src/data/repositories/exercises';
import { SLOT_LABELS, getRecipe } from '../../../../src/data/repositories/recipes';
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
      <View style={styles.list}>
        {detail?.training.map((item) => (
          <View key={item.id} style={styles.trainingRow}>
            <DotsSixVertical size={16} color={colors.neutral[700]} />
            <View style={styles.grow}>
              <Text variant="rowTitle" style={styles.rowTitle}>
                {item.name}
              </Text>
              <Text variant="meta" color={colors.neutral[500]} style={styles.rowMeta}>
                {item.meta}
              </Text>
            </View>
          </View>
        ))}
        <ActionButton
          label="Übung aus der Bibliothek"
          icon={<Plus size={14} color={colors.neutral[400]} />}
          onPress={() => router.push('/uebungen')}
          quiet
        />
      </View>

      <SectionHead
        icon="ForkKnife"
        label="Ernährung"
        note={settings.showKcal && kcalSum > 0 ? `${kcalSum} kcal` : undefined}
      />
      <View style={styles.list}>
        {detail?.meals.map((slot) => (
          <Touchable
            key={slot.slot}
            onPress={() =>
              slot.recipeId
                ? router.push(`/mahlzeiten/${slot.recipeId}`)
                : router.push('/mahlzeiten')
            }
            accessibilityLabel={`${SLOT_LABELS[slot.slot]}: ${slot.name}`}
            style={[styles.mealRow, slot.recipeId ? styles.mealFilled : styles.mealEmpty]}
          >
            <Text variant="small" color={colors.neutral[600]} style={styles.slotLabel}>
              {SLOT_LABELS[slot.slot]}
            </Text>
            <Text
              variant="rowTitle"
              color={slot.recipeId ? colors.text : colors.neutral[600]}
              style={[styles.grow, styles.rowTitle, !slot.recipeId && styles.slotEmpty]}
              numberOfLines={1}
            >
              {slot.name}
            </Text>
            {settings.showKcal && slot.kcal !== undefined ? (
              <Text variant="meta" color={colors.neutral[500]}>
                {slot.kcal} kcal
              </Text>
            ) : null}
          </Touchable>
        ))}
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
        };
      }),
  );

  const meals = await Promise.all(
    MEAL_SLOTS.map(async (slot: MealSlot) => {
      const recipeId = planDay.meals[slot];
      const recipe = recipeId ? await getRecipe(recipeId) : undefined;
      return {
        slot,
        recipeId: recipe?.id ?? null,
        name: recipe?.name ?? 'Rezept wählen',
        kcal: recipe?.nutrition.kcal,
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
  slotLabel: { width: 52, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  slotEmpty: { fontWeight: '400' },
  action: { marginTop: 18 },
  actionQuiet: { marginTop: 8 },
});

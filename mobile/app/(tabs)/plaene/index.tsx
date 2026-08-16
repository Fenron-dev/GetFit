import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Touchable } from '../../../src/components/Surface';
import { Fab } from '../../../src/components/Fab';
import { Icon, CaretRight } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  PLAN_STATE_LABELS,
  applyTemplate,
  createPlanWeek,
  dayFillFlags,
  formatWeekRange,
  listPlanDays,
  listPlanWeeks,
  listTemplates,
} from '../../../src/data/repositories/plans';
import { DAY_KEYS, type PlanWeek } from '../../../src/types/domain';
import { colors, edge, radius, tint } from '../../../src/theme/tokens';
import { useAccent } from '../../../src/theme/ThemeProvider';

/** Screen 06 — Wochen und Vorlagen. */
export default function PlanListRoute() {
  const router = useRouter();
  const accent = useAccent();

  const { data: weeks } = useQuery(async () => {
    const list = await listPlanWeeks();
    return Promise.all(
      list.map(async (week) => ({
        week,
        fill: dayFillFlags(await listPlanDays(week.id)),
        counts: await countWeek(week.id),
      })),
    );
  }, []);
  const { data: templates } = useQuery(() => listTemplates(), []);

  async function createWeek() {
    const id = await createPlanWeek({});
    router.push(`/plaene/${id}`);
  }

  return (
    <Screen overlay={<Fab onPress={createWeek} label="Woche anlegen" />}>
      <Text variant="screenTitle">Pläne</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        Wochen vorab planen und wiederverwenden
      </Text>

      <Text variant="eyebrow" color={colors.neutral[400]} style={styles.sectionLabel}>
        Wochen
      </Text>
      <View style={styles.list}>
        {weeks?.map(({ week, fill, counts }) => (
          <Touchable
            key={week.id}
            onPress={() => router.push(`/plaene/${week.id}`)}
            style={[
              styles.weekCard,
              week.state === 'active' && { borderColor: tint(accent, '40') },
            ]}
            accessibilityLabel={week.title}
          >
            <View style={styles.weekHead}>
              <View style={styles.grow}>
                <View style={styles.titleRow}>
                  <Text variant="rowTitle" style={styles.weekTitle}>
                    {week.title}
                  </Text>
                  <StateBadge week={week} />
                </View>
                <Text variant="meta" color={colors.neutral[500]} style={styles.weekMeta}>
                  {formatWeekRange(week.startDate)}
                  {week.focus ? ` · ${week.focus}` : ''}
                </Text>
              </View>
              <CaretRight size={15} color={colors.neutral[700]} />
            </View>

            <View style={styles.dayStrip}>
              {DAY_KEYS.map((day, index) => (
                <View
                  key={day}
                  style={[
                    styles.dayChip,
                    fill[index]
                      ? { backgroundColor: tint(accent, '17') }
                      : { borderWidth: 1, borderColor: colors.neutral[800] },
                  ]}
                >
                  <Text
                    variant="small"
                    color={fill[index] ? colors.accent[200] : colors.neutral[600]}
                    style={styles.dayLabel}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.counts}>
              <View style={styles.count}>
                <Icon name="Barbell" size={13} color={colors.neutral[500]} />
                <Text variant="meta" color={colors.neutral[500]}>
                  {counts.trainings} {counts.trainings === 1 ? 'Training' : 'Trainings'}
                </Text>
              </View>
              <View style={styles.count}>
                <Icon name="ForkKnife" size={13} color={colors.neutral[500]} />
                <Text variant="meta" color={colors.neutral[500]}>
                  {counts.meals} {counts.meals === 1 ? 'Mahlzeit' : 'Mahlzeiten'}
                </Text>
              </View>
            </View>
          </Touchable>
        ))}
      </View>

      <Text variant="eyebrow" color={colors.neutral[400]} style={styles.sectionLabel}>
        Vorlagen
      </Text>
      <View style={styles.list}>
        {templates?.map((template) => (
          <Touchable
            key={template.id}
            onPress={async () => {
              const id = await applyTemplate(template.id);
              router.push(`/plaene/${id}`);
            }}
            style={styles.templateRow}
            accessibilityLabel={`${template.title} übernehmen`}
          >
            <Icon name={template.icon} size={18} color={accent} weight="fill" />
            <View style={styles.grow}>
              <Text variant="rowTitle" style={styles.templateTitle}>
                {template.title}
              </Text>
              <Text variant="meta" color={colors.neutral[600]} style={styles.weekMeta}>
                {template.meta}
              </Text>
            </View>
            <Text variant="meta" color={colors.accent[300]}>
              Übernehmen
            </Text>
          </Touchable>
        ))}
      </View>
    </Screen>
  );
}

function StateBadge({ week }: { week: PlanWeek }) {
  const active = week.state === 'active';
  return (
    <View
      style={[
        styles.badge,
        { borderColor: active ? colors.accent[700] : colors.neutral[800] },
      ]}
    >
      <Text
        variant="small"
        color={active ? colors.accent[200] : colors.neutral[500]}
        style={styles.badgeLabel}
      >
        {PLAN_STATE_LABELS[week.state]}
      </Text>
    </View>
  );
}

/** Zählt, was in einer Woche tatsächlich verplant ist. */
async function countWeek(weekId: string) {
  const days = await listPlanDays(weekId);
  return {
    trainings: days.filter((day) => day.training.length > 0).length,
    meals: days.reduce(
      (sum, day) => sum + Object.values(day.meals).filter(Boolean).length,
      0,
    ),
  };
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  sectionLabel: { marginTop: 24 },
  list: { marginTop: 10, gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  weekCard: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(),
  },
  weekHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekTitle: { fontSize: 16 },
  weekMeta: { marginTop: 3 },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeLabel: { fontSize: 10.5 },
  dayStrip: { flexDirection: 'row', gap: 5, marginTop: 14 },
  dayChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: 'center',
  },
  dayLabel: { fontSize: 10.5 },
  counts: { flexDirection: 'row', gap: 16, marginTop: 12 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  templateTitle: { fontSize: 14.5 },
});

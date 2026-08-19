import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { Touchable } from '../../../src/components/Surface';
import { Fab } from '../../../src/components/Fab';
import { Icon, CaretRight } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  applyTemplate,
  createUpcomingWeeks,
  dayFillFlags,
  formatWeekRange,
  listPlanDays,
  listPlanWeeks,
  listTemplates,
  weekDistanceLabel,
  weekRelation,
  type WeekRelation,
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
        relation: weekRelation(week),
        fill: dayFillFlags(await listPlanDays(week.id)),
        counts: await countWeek(week.id),
      })),
    );
  }, []);

  /**
   * Vergangene Wochen stehen unten und zusammengeklappt: sie sollen
   * nachschlagbar bleiben, ohne die Vorausplanung zuzustellen.
   */
  const [zeigeVergangene, setZeigeVergangene] = useState(false);

  const gruppen: { relation: WeekRelation; label: string }[] = [
    { relation: 'laufend', label: 'Diese Woche' },
    { relation: 'kommend', label: 'Vorausgeplant' },
  ];
  const { data: templates } = useQuery(() => listTemplates(), []);

  async function createWeek() {
    const [id] = await createUpcomingWeeks(1);
    router.push(`/plaene/${id}`);
  }

  /** Vier Wochen auf einen Schlag — für die Planung über den Monat. */
  function createMonth() {
    Alert.alert(
      'Vier Wochen anlegen?',
      'Die nächsten vier noch fehlenden Wochen werden leer angelegt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Anlegen',
          onPress: () => {
            createUpcomingWeeks(4);
          },
        },
      ],
    );
  }

  return (
    <Screen overlay={<Fab onPress={createWeek} label="Woche anlegen" />}>
      <Text variant="screenTitle">Pläne</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        Wochen vorab planen und wiederverwenden
      </Text>

      {gruppen.map((gruppe) => {
        const eintraege = weeks?.filter((item) => item.relation === gruppe.relation) ?? [];
        if (eintraege.length === 0) return null;
        return (
          <View key={gruppe.relation}>
            <Text variant="eyebrow" color={colors.neutral[400]} style={styles.sectionLabel}>
              {gruppe.label}
            </Text>
            <View style={styles.list}>
              {eintraege.map((item) => (
                <WeekCard key={item.week.id} {...item} accent={accent} router={router} />
              ))}
            </View>
          </View>
        );
      })}

      <Touchable
        onPress={createMonth}
        accessibilityLabel="Vier Wochen anlegen"
        style={styles.aheadRow}
      >
        <Icon name="CalendarCheck" size={16} color={accent} />
        <Text variant="meta" color={colors.accent[300]} style={styles.grow}>
          Vier Wochen im Voraus anlegen
        </Text>
        <Icon name="CaretRight" size={13} color={colors.accent[700]} />
      </Touchable>

      {(weeks?.filter((item) => item.relation === 'vergangen').length ?? 0) > 0 ? (
        <>
          <Touchable
            onPress={() => setZeigeVergangene((current) => !current)}
            accessibilityLabel="Vergangene Wochen"
            style={styles.pastToggle}
          >
            <Text variant="eyebrow" color={colors.neutral[400]} style={styles.grow}>
              Vergangene ·{' '}
              {weeks?.filter((item) => item.relation === 'vergangen').length}
            </Text>
            <Icon
              name={zeigeVergangene ? 'CaretRight' : 'CaretRight'}
              size={13}
              color={colors.neutral[600]}
            />
          </Touchable>

          {zeigeVergangene ? (
            <View style={styles.list}>
              {weeks
                ?.filter((item) => item.relation === 'vergangen')
                .reverse()
                .map((item) => (
                  <WeekCard key={item.week.id} {...item} accent={accent} router={router} />
                ))}
            </View>
          ) : null}
        </>
      ) : null}

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
                {describeTemplate(template)}
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

/**
 * Eine Woche als Karte: Titel, zeitliche Einordnung, der Tagesstreifen
 * und die Zähler. Die Tage sind einzeln antippbar — von der Übersicht
 * direkt in den Mittwoch, ohne Umweg über den Wochenkopf.
 */
function WeekCard({
  week,
  relation,
  fill,
  counts,
  accent,
  router,
}: {
  week: PlanWeek;
  relation: WeekRelation;
  fill: boolean[];
  counts: { trainings: number; meals: number };
  accent: string;
  router: ReturnType<typeof useRouter>;
}) {
  const laufend = relation === 'laufend';

  return (
    <View
      style={[styles.weekCard, laufend && { borderColor: tint(accent, '40') }]}
    >
      <Touchable
        onPress={() => router.push(`/plaene/${week.id}`)}
        accessibilityLabel={week.title}
        style={styles.weekHead}
      >
        <View style={styles.grow}>
          <View style={styles.titleRow}>
            <Text variant="rowTitle" style={styles.weekTitle}>
              {week.title}
            </Text>
            <View
              style={[
                styles.badge,
                { borderColor: laufend ? colors.accent[700] : colors.neutral[800] },
              ]}
            >
              <Text
                variant="small"
                color={laufend ? colors.accent[200] : colors.neutral[500]}
                style={styles.badgeLabel}
              >
                {weekDistanceLabel(week)}
              </Text>
            </View>
          </View>
          <Text variant="meta" color={colors.neutral[500]} style={styles.weekMeta}>
            {formatWeekRange(week.startDate)}
            {week.focus ? ` · ${week.focus}` : ''}
          </Text>
        </View>
        <CaretRight size={15} color={colors.neutral[700]} />
      </Touchable>

      <View style={styles.dayStrip}>
        {DAY_KEYS.map((day, index) => (
          <Touchable
            key={day}
            onPress={() => router.push(`/plaene/${week.id}?tag=${day}`)}
            accessibilityLabel={`${day} in ${week.title}`}
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
          </Touchable>
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
        <View style={styles.spacer} />
        <Touchable
          onPress={() => router.push(`/plaene/${week.id}/einkaufsliste`)}
          accessibilityLabel={`Einkaufsliste für ${week.title}`}
          style={styles.basket}
        >
          <Icon name="Basket" size={14} color={accent} />
          <Text variant="small" color={colors.accent[300]}>
            Einkauf
          </Text>
        </Touchable>
      </View>
    </View>
  );
}

/**
 * Was eine Vorlage mitbringt — im Entwurf stand dort ein fester Text,
 * der nicht verriet, ob auch Mahlzeiten dabei sind.
 */
function describeTemplate(template: {
  days: Record<string, { training: unknown[]; meals?: Record<string, string> } | undefined>;
}): string {
  const days = Object.values(template.days).filter(Boolean) as {
    training: unknown[];
    meals?: Record<string, string>;
  }[];

  const trainingDays = days.filter((day) => day.training.length > 0).length;
  const meals = days.reduce(
    (sum, day) => sum + Object.values(day.meals ?? {}).filter(Boolean).length,
    0,
  );

  return [
    trainingDays ? `${trainingDays} Trainingstage` : null,
    meals ? `${meals} Mahlzeiten` : null,
  ]
    .filter(Boolean)
    .join(' · ') || 'leer';
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
  counts: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  spacer: { flex: 1 },
  basket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent[700],
  },
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
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.accent[700],
  },
  pastToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 6,
  },
});

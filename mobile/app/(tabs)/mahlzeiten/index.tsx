import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { ListRow } from '../../../src/components/ListRow';
import { SectionHead } from '../../../src/components/SectionHead';
import { Touchable } from '../../../src/components/Surface';
import { Fab } from '../../../src/components/Fab';
import { CaretRight, CloudArrowDown } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  listRecipesByCategory,
  recipeMeta,
} from '../../../src/data/repositories/recipes';
import { colors, radius } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';

/** Screen 04 — Rezepte nach den vier Kategorien gruppiert. */
export default function MealListRoute() {
  const router = useRouter();
  const { accent, settings } = useTheme();
  const { data: groups } = useQuery(() => listRecipesByCategory(), []);

  const total = groups?.reduce((sum, group) => sum + group.items.length, 0) ?? 0;
  const filled = groups?.filter((group) => group.items.length > 0).length ?? 0;

  return (
    <Screen
      overlay={
        <Fab onPress={() => router.push('/mahlzeiten/neu')} label="Rezept anlegen" />
      }
    >
      <Text variant="screenTitle">Mahlzeiten</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        {total} {total === 1 ? 'Rezept' : 'Rezepte'} · {filled}{' '}
        {filled === 1 ? 'Kategorie' : 'Kategorien'}
      </Text>

      <Touchable
        onPress={() => router.push('/mehr/import')}
        style={styles.importRow}
        accessibilityLabel="Rezepte aus Mealie importieren"
      >
        <CloudArrowDown size={16} color={accent} />
        <Text variant="meta" color={colors.accent[300]} style={styles.importLabel}>
          Rezepte aus Mealie importieren
        </Text>
        <CaretRight size={13} color={colors.accent[700]} />
      </Touchable>

      {groups
        ?.filter((group) => group.items.length > 0)
        .map((group) => (
          <View key={group.category}>
            <SectionHead
              icon={CATEGORY_ICONS[group.category]}
              label={CATEGORY_LABELS[group.category]}
              style={styles.groupHead}
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
                      <Text
                        variant="meta"
                        color={colors.neutral[500]}
                        style={styles.kcal}
                      >
                        {recipe.nutrition.kcal} kcal
                      </Text>
                    ) : undefined
                  }
                  onPress={() => router.push(`/mahlzeiten/${recipe.id}`)}
                />
              ))}
            </View>
          </View>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 5,
    fontSize: 13,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: radius.md + 3,
    borderWidth: 1,
    borderColor: colors.accent[700],
  },
  importLabel: {
    flex: 1,
    fontSize: 13.5,
  },
  groupHead: {
    marginTop: 22,
  },
  list: {
    marginTop: 10,
    gap: 8,
  },
  kcal: {
    fontVariant: ['tabular-nums'],
  },
});

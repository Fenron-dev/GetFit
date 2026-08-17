import { Alert, StyleSheet, View } from 'react-native';
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
import { CloudCheck, Heart, Plus } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  deleteRecipe,
  getRecipe,
  toggleRecipeFavorite,
  updateRecipe,
} from '../../../src/data/repositories/recipes';
import { getActiveWeek } from '../../../src/data/repositories/plans';
import { formatQuantity } from '../../../src/lib/ingredients';
import { colors, edge, layout, radius } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { Nutrition } from '../../../src/types/domain';

/** Screen 05 — Rezept-Detail mit Zutaten und Zubereitung. */
export default function RecipeDetailRoute({
  idOverride,
  backLabel = 'Mahlzeiten',
}: {
  /** Gesetzt, wenn der Screen aus einem anderen Stack heraus benutzt wird. */
  idOverride?: string;
  backLabel?: string;
} = {}) {
  const params = useLocalSearchParams<{ id: string }>();
  const id = idOverride ?? params.id;
  const router = useRouter();
  const { accent, settings } = useTheme();
  const { data: recipe, loading } = useQuery(() => getRecipe(id), [id]);

  if (loading || !recipe) {
    return (
      <Screen variant="detail">
        <BackHeader label={backLabel} />
        {!loading ? (
          <Text variant="body" color={colors.neutral[500]}>
            Dieses Rezept gibt es nicht mehr.
          </Text>
        ) : null}
      </Screen>
    );
  }

  // Zeit und Portionen stehen im Entwurf als Chips neben den echten Tags.
  const chips = [
    `${recipe.timeMinutes} Min`,
    `${recipe.servings} ${recipe.servings === 1 ? 'Portion' : 'Portionen'}`,
    ...recipe.tags,
  ];

  const macros = buildMacros(recipe.nutrition, settings.showKcal);

  return (
    <Screen variant="detail" bleed>
      <View style={styles.header}>
        <BackHeader
          label={backLabel}
          right={
            <Touchable
              onPress={() => toggleRecipeFavorite(recipe.id)}
              accessibilityLabel={
                recipe.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'
              }
            >
              <Heart
                size={18}
                color={recipe.favorite ? accent : colors.neutral[500]}
                weight={recipe.favorite ? 'fill' : 'regular'}
              />
            </Touchable>
          }
        />
      </View>

      <View style={styles.media}>
        <MediaFrame
          icon={recipe.icon}
          source={recipe.imageUrl}
          height={210}
          iconSize={92}
          breathDuration={3200}
          placeholderBadge={<MediaBadge label="FOTO" icon="Image" />}
          topRight={
            recipe.source === 'mealie' ? (
              <View style={styles.sourceBadge}>
                <CloudCheck size={12} color={colors.accent[300]} />
                <Text variant="small" color={colors.accent[300]} style={styles.sourceLabel}>
                  Mealie
                </Text>
              </View>
            ) : undefined
          }
        />
        <MediaActions
          ownerId={recipe.id}
          current={recipe.imageUrl}
          label="Foto"
          onChange={(uri) => updateRecipe(recipe.id, { imageUrl: uri })}
        />
      </View>

      <View style={styles.content}>
        <Text variant="detailTitle">{recipe.name}</Text>

        <View style={styles.chips}>
          {chips.map((label) => (
            <Chip key={label} label={label} />
          ))}
        </View>

        <View style={styles.macros}>
          {macros.map((macro) => (
            <StatTile key={macro.label} label={macro.label} value={macro.value} compact />
          ))}
        </View>

        <View style={styles.ingredientsHead}>
          <Text variant="eyebrow" color={colors.neutral[400]}>
            Zutaten
          </Text>
          <Text variant="meta" color={colors.neutral[600]}>
            für {recipe.servings} {recipe.servings === 1 ? 'Portion' : 'Portionen'}
          </Text>
        </View>

        <View style={styles.ingredients}>
          {recipe.ingredients.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              style={[
                styles.ingredient,
                index === recipe.ingredients.length - 1 && styles.ingredientLast,
              ]}
            >
              <View style={[styles.bullet, { backgroundColor: accent }]} />
              <Text variant="body" style={styles.ingredientName}>
                {item.name}
              </Text>
              <Text variant="meta" color={colors.neutral[500]} style={styles.quantity}>
                {formatQuantity(item)}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="eyebrow" color={colors.neutral[400]} style={styles.stepsHead}>
          Zubereitung
        </Text>
        <View style={styles.steps}>
          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text variant="small" color={accent}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="body" color={colors.neutral[300]} style={styles.stepText}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <ActionButton
          label="In Wochenplan legen"
          icon={<Plus size={16} color={accent} />}
          onPress={async () => {
            // In die laufende Woche springen; dort wird der Slot durch
            // langes Drücken belegt.
            const week = await getActiveWeek();
            router.push(week ? `/plaene/${week.id}` : '/plaene');
          }}
          style={styles.action}
        />

        <ActionButton
          label="Rezept löschen"
          quiet
          onPress={() =>
            Alert.alert('Rezept löschen?', `„${recipe.name}“ wird entfernt.`, [
              { text: 'Abbrechen', style: 'cancel' },
              {
                text: 'Löschen',
                style: 'destructive',
                onPress: async () => {
                  await deleteRecipe(recipe.id);
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

/** Die vier Kacheln. Fehlende Werte zeigt der Entwurf als „—“; ist die
 *  kcal-Anzeige aus, fällt die erste Kachel weg. */
function buildMacros(nutrition: Nutrition, showKcal: boolean) {
  const dash = (value?: number, unit = ' g') =>
    value === undefined ? '—' : `${value}${unit}`;

  const macros = [
    { label: 'kcal', value: dash(nutrition.kcal, '') },
    { label: 'Eiweiß', value: dash(nutrition.protein) },
    { label: 'KH', value: dash(nutrition.carbs) },
    { label: 'Fett', value: dash(nutrition.fat) },
  ];

  return showKcal ? macros : macros.slice(1);
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  media: {
    marginTop: 6,
    marginHorizontal: 16,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(22,24,38,0.72)',
    borderWidth: 1,
    borderColor: colors.accent[700],
  },
  sourceLabel: {
    fontSize: 10.5,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 20,
  },
  chips: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  macros: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 7,
  },
  ingredientsHead: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredients: {
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  ingredient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  ingredientLast: {
    borderBottomWidth: 0,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    opacity: 0.8,
  },
  ingredientName: {
    flex: 1,
  },
  quantity: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  stepsHead: {
    marginTop: 24,
  },
  steps: {
    marginTop: 12,
    gap: 14,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent[700],
  },
  stepText: {
    flex: 1,
    lineHeight: 22,
  },
  action: {
    marginTop: 22,
  },
  actionQuiet: {
    marginTop: 8,
  },
});

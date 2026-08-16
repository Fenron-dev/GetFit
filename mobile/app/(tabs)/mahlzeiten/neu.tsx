import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { Field } from '../../../src/components/Field';
import { ActionButton } from '../../../src/components/ActionButton';
import { Plus } from '../../../src/components/icons';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  createRecipe,
} from '../../../src/data/repositories/recipes';
import { ingredient } from '../../../src/lib/ingredients';
import { MEAL_SLOTS, type MealSlot } from '../../../src/types/domain';
import { colors, radius } from '../../../src/theme/tokens';
import { useAccent } from '../../../src/theme/ThemeProvider';

/**
 * Eigenes Rezept anlegen. Zutaten und Schritte werden zeilenweise
 * eingegeben — eine Zeile je Eintrag. Das ist beim Abtippen schneller als
 * ein Formular mit Plus-Knopf je Zutat, und die Mengen zerlegt die
 * Zutatenlogik ohnehin selbst.
 */
export default function RecipeFormRoute() {
  const router = useRouter();
  const accent = useAccent();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MealSlot>('lunch');
  const [time, setTime] = useState('20');
  const [servings, setServings] = useState('2');
  const [kcal, setKcal] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name fehlt', 'Gib dem Rezept einen Namen.');
      return;
    }

    const id = await createRecipe({
      name: name.trim(),
      category,
      icon: CATEGORY_ICONS[category],
      timeMinutes: Number(time) || 0,
      servings: Number(servings) || 1,
      tags: [],
      nutrition: kcal.trim() ? { kcal: Number(kcal) } : {},
      ingredients: parseIngredients(ingredients),
      steps: steps
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      source: 'own',
    });
    router.replace(`/mahlzeiten/${id}`);
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Mahlzeiten" />
      <Text variant="sectionTitle">Neues Rezept</Text>

      <View style={styles.form}>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="z. B. Ofengemüse mit Halloumi"
          autoFocus
        />

        <View>
          <Text variant="small" color={colors.neutral[600]} style={styles.groupLabel}>
            Kategorie
          </Text>
          <View style={styles.chips}>
            {MEAL_SLOTS.map((slot) => (
              <Pressable
                key={slot}
                onPress={() => setCategory(slot)}
                accessibilityRole="radio"
                accessibilityState={{ selected: category === slot }}
                style={[
                  styles.chip,
                  { borderColor: category === slot ? accent : colors.neutral[800] },
                ]}
              >
                <Text
                  variant="small"
                  color={category === slot ? colors.accent[200] : colors.neutral[500]}
                >
                  {CATEGORY_LABELS[slot]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.triple}>
          <View style={styles.grow}>
            <Field label="Zeit" value={time} onChangeText={setTime} keyboardType="number-pad" hint="Minuten" />
          </View>
          <View style={styles.grow}>
            <Field label="Portionen" value={servings} onChangeText={setServings} keyboardType="number-pad" />
          </View>
          <View style={styles.grow}>
            <Field label="kcal" value={kcal} onChangeText={setKcal} keyboardType="number-pad" hint="optional" />
          </View>
        </View>

        <Field
          label="Zutaten"
          value={ingredients}
          onChangeText={setIngredients}
          placeholder={'60 g Haferflocken\n250 ml Milch\n1 Prise Salz'}
          hint="Eine Zutat je Zeile, Menge vorn"
          multiline
        />

        <Field
          label="Zubereitung"
          value={steps}
          onChangeText={setSteps}
          placeholder={'Ofen auf 200 °C vorheizen.\nGemüse würfeln und ölen.'}
          hint="Ein Schritt je Zeile"
          multiline
        />
      </View>

      <ActionButton
        label="Rezept anlegen"
        icon={<Plus size={16} color={accent} />}
        onPress={save}
        style={styles.action}
      />
    </Screen>
  );
}

/**
 * "60 g Haferflocken" → Menge "60 g", Name "Haferflocken".
 * Erkannt wird die führende Zahl samt folgender Einheit; steht keine
 * Zahl vorn, gilt die ganze Zeile als Name.
 */
function parseIngredients(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([\d.,/]+(?:\s*[×x*]\s*[\d.,/]+)?)\s*([A-Za-zÄÖÜäöüß]+)?\s+(.*)$/);
      if (!match) return ingredient(line, '');

      const [, amount, maybeUnit, rest] = match;
      const knownUnit = maybeUnit && /^(g|kg|ml|l|TL|EL|Prise|Bund|Zehen|Scheiben|Stück|Dose|Packung)$/i.test(maybeUnit);
      return knownUnit
        ? ingredient(rest.trim(), `${amount} ${maybeUnit}`)
        : ingredient(`${maybeUnit ?? ''} ${rest}`.trim(), amount);
    });
}

const styles = StyleSheet.create({
  form: { marginTop: 18, gap: 12 },
  groupLabel: { marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 10.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  triple: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
  action: { marginTop: 20 },
});

import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { Field } from '../../../src/components/Field';
import { ActionButton } from '../../../src/components/ActionButton';
import { updateSettings } from '../../../src/data/repositories/settings';
import { colors } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/ThemeProvider';

/**
 * Das Profil war bisher fest verdrahtet („Jan · 2 200 kcal"). Hier liegen
 * jetzt die Werte, an denen sich Ziele und Schätzungen ausrichten.
 *
 * Das Gewicht steht hier, weil der geschätzte Kalorienverbrauch einer
 * Übung ohne es nicht auskommt.
 */
export default function ProfileRoute() {
  const router = useRouter();
  const { settings } = useTheme();

  const [name, setName] = useState(settings.profileName);
  const [weight, setWeight] = useState(settings.weightKg ? String(settings.weightKg) : '');
  const [height, setHeight] = useState(settings.heightCm ? String(settings.heightCm) : '');
  const [kcalGoal, setKcalGoal] = useState(String(settings.kcalGoal));
  const [trainings, setTrainings] = useState(String(settings.trainingsPerWeek));
  const [dailyGoal, setDailyGoal] = useState(String(settings.dailyGoalEntries));

  async function save() {
    const entries = Number(dailyGoal);
    if (!Number.isFinite(entries) || entries < 1) {
      Alert.alert('Tagesziel prüfen', 'Mindestens ein Eintrag muss es sein.');
      return;
    }

    await updateSettings({
      profileName: name.trim() || 'Ich',
      weightKg: weight.trim() ? Number(weight.replace(',', '.')) : undefined,
      heightCm: height.trim() ? Number(height) : undefined,
      kcalGoal: Number(kcalGoal) || 2000,
      trainingsPerWeek: Number(trainings) || 3,
      dailyGoalEntries: entries,
    });
    router.back();
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Einstellungen" />
      <Text variant="sectionTitle">Profil</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        Alles bleibt auf diesem Gerät
      </Text>

      <View style={styles.form}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Ich" />

        <View style={styles.pair}>
          <View style={styles.grow}>
            <Field
              label="Gewicht"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="78"
              hint="kg · Grundlage für den Verbrauch"
            />
          </View>
          <View style={styles.grow}>
            <Field
              label="Größe"
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
              placeholder="182"
              hint="cm · optional"
            />
          </View>
        </View>

        <View style={styles.pair}>
          <View style={styles.grow}>
            <Field
              label="Kalorienziel"
              value={kcalGoal}
              onChangeText={setKcalGoal}
              keyboardType="number-pad"
              hint="kcal am Tag"
            />
          </View>
          <View style={styles.grow}>
            <Field
              label="Trainings"
              value={trainings}
              onChangeText={setTrainings}
              keyboardType="number-pad"
              hint="pro Woche"
            />
          </View>
        </View>

        <Field
          label="Tagesziel"
          value={dailyGoal}
          onChangeText={setDailyGoal}
          keyboardType="number-pad"
          hint="Wie viele erledigte Einträge machen den Tag voll"
        />
      </View>

      <ActionButton label="Speichern" onPress={save} style={styles.action} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  form: { marginTop: 18, gap: 12 },
  pair: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
  action: { marginTop: 20 },
});

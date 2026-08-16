import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { Field } from '../../../src/components/Field';
import { ActionButton } from '../../../src/components/ActionButton';
import { Icon, Plus } from '../../../src/components/icons';
import { createExercise } from '../../../src/data/repositories/exercises';
import { colors, radius } from '../../../src/theme/tokens';
import { useAccent } from '../../../src/theme/ThemeProvider';

/**
 * Der Anlegen-Flow hinter dem „+“ — im Entwurf offen gelassen.
 * Bewusst knapp: Name und Muskelgruppe genügen, alles Weitere hat
 * brauchbare Vorgaben.
 */

const MUSCLE_GROUPS = ['Beine', 'Brust', 'Rücken', 'Schultern', 'Arme', 'Rumpf', 'Cardio'];

const ICONS = [
  'PersonSimpleWalk',
  'Barbell',
  'PersonSimpleTaiChi',
  'PersonSimple',
  'PersonSimpleRun',
  'PersonSimpleThrow',
];

export default function ExerciseFormRoute() {
  const router = useRouter();
  const accent = useAccent();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [rest, setRest] = useState('90');
  const [icon, setIcon] = useState(ICONS[0]);
  const [description, setDescription] = useState('');

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name fehlt', 'Gib der Übung einen Namen.');
      return;
    }
    const id = await createExercise({
      name: name.trim(),
      muscleGroup,
      defaultSets: Number(sets) || 3,
      defaultReps: reps.trim() || '12',
      restSeconds: Number(rest) || 90,
      description: description.trim(),
      icon,
    });
    router.replace(`/uebungen/${id}`);
  }

  return (
    <Screen variant="detail">
      <BackHeader label="Übungen" />
      <Text variant="sectionTitle">Neue Übung</Text>

      <View style={styles.form}>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="z. B. Rumänisches Kreuzheben"
          autoFocus
        />

        <View>
          <Text variant="small" color={colors.neutral[600]} style={styles.groupLabel}>
            Muskelgruppe
          </Text>
          <View style={styles.chips}>
            {MUSCLE_GROUPS.map((group) => (
              <Pressable
                key={group}
                onPress={() => setMuscleGroup(group)}
                accessibilityRole="radio"
                accessibilityState={{ selected: muscleGroup === group }}
                style={[
                  styles.chip,
                  { borderColor: muscleGroup === group ? accent : colors.neutral[800] },
                ]}
              >
                <Text
                  variant="small"
                  color={muscleGroup === group ? colors.accent[200] : colors.neutral[500]}
                >
                  {group}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.triple}>
          <View style={styles.grow}>
            <Field label="Sätze" value={sets} onChangeText={setSets} keyboardType="number-pad" />
          </View>
          <View style={styles.grow}>
            <Field
              label="Wdh."
              value={reps}
              onChangeText={setReps}
              hint="auch „45s“"
            />
          </View>
          <View style={styles.grow}>
            <Field
              label="Pause"
              value={rest}
              onChangeText={setRest}
              keyboardType="number-pad"
              hint="Sekunden"
            />
          </View>
        </View>

        <View>
          <Text variant="small" color={colors.neutral[600]} style={styles.groupLabel}>
            Symbol
          </Text>
          <View style={styles.chips}>
            {ICONS.map((name_) => (
              <Pressable
                key={name_}
                onPress={() => setIcon(name_)}
                accessibilityRole="radio"
                accessibilityState={{ selected: icon === name_ }}
                style={[
                  styles.iconChoice,
                  { borderColor: icon === name_ ? accent : colors.neutral[800] },
                ]}
              >
                <Icon
                  name={name_}
                  size={22}
                  color={icon === name_ ? accent : colors.neutral[500]}
                  weight="fill"
                />
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          label="Beschreibung"
          value={description}
          onChangeText={setDescription}
          placeholder="Wie wird die Übung ausgeführt?"
          multiline
        />
      </View>

      <ActionButton
        label="Übung anlegen"
        icon={<Plus size={16} color={accent} />}
        onPress={save}
        style={styles.action}
      />
    </Screen>
  );
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
  iconChoice: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
  },
  triple: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
  action: { marginTop: 20 },
});

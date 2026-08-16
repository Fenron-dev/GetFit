import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../../src/components/Screen';
import { Text } from '../../../../src/components/Text';
import { BackHeader } from '../../../../src/components/BackHeader';
import { Checkbox } from '../../../../src/components/CheckRow';
import { ActionButton } from '../../../../src/components/ActionButton';
import { Touchable } from '../../../../src/components/Surface';
import { Icon } from '../../../../src/components/icons';
import { useQuery } from '../../../../src/hooks/useQuery';
import {
  deleteShoppingList,
  generateShoppingList,
  listShoppingLists,
  toggleShoppingItem,
} from '../../../../src/data/repositories/shopping';
import { getPlanWeek } from '../../../../src/data/repositories/plans';
import { formatQuantity } from '../../../../src/lib/ingredients';
import { colors, edge, radius } from '../../../../src/theme/tokens';
import { useAccent } from '../../../../src/theme/ThemeProvider';

/**
 * Die Einkaufsliste einer Woche — im Entwurf nicht vorgesehen, aber als
 * offener Punkt benannt. Zutaten aller verplanten Rezepte, auf eine
 * Portion je Slot skaliert und nach Name und Einheit zusammengefasst.
 */
export default function ShoppingListRoute() {
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const accent = useAccent();

  const { data: week } = useQuery(() => getPlanWeek(weekId), [weekId]);
  const { data: lists } = useQuery(() => listShoppingLists(weekId), [weekId]);

  // Die zuletzt erzeugte Liste ist die gültige.
  const list = lists?.[lists.length - 1];
  const open = list?.items.filter((item) => !item.checked) ?? [];
  const done = list?.items.filter((item) => item.checked) ?? [];

  async function regenerate() {
    if (list) await deleteShoppingList(list.id);
    await generateShoppingList(weekId);
  }

  return (
    <Screen variant="detail">
      <BackHeader label={week?.title ?? 'Woche'} />

      <Text variant="sectionTitle">Einkaufsliste</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        {list
          ? `${list.items.length} Positionen · ${done.length} erledigt`
          : 'Aus den verplanten Rezepten dieser Woche'}
      </Text>

      {!list ? (
        <ActionButton
          label="Liste erzeugen"
          icon={<Icon name="Basket" size={16} color={accent} />}
          onPress={async () => {
            await generateShoppingList(weekId);
          }}
          style={styles.action}
        />
      ) : list.items.length === 0 ? (
        <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
          In dieser Woche ist noch kein Rezept eingeplant — deshalb gibt es
          nichts einzukaufen.
        </Text>
      ) : (
        <>
          <View style={styles.list}>
            {[...open, ...done].map((item) => (
              <Touchable
                key={item.id}
                onPress={() => toggleShoppingItem(list.id, item.id)}
                accessibilityLabel={item.name}
                style={[styles.row, item.checked && styles.rowDone]}
              >
                <Checkbox checked={item.checked} />
                <View style={styles.grow}>
                  <Text
                    variant="body"
                    color={item.checked ? colors.neutral[600] : colors.text}
                    style={item.checked ? styles.struck : undefined}
                  >
                    {item.name}
                  </Text>
                  {item.recipeIds.length > 1 ? (
                    <Text variant="small" color={colors.neutral[600]} style={styles.origin}>
                      aus {item.recipeIds.length} Rezepten
                    </Text>
                  ) : null}
                </View>
                <Text
                  variant="meta"
                  color={item.checked ? colors.neutral[700] : colors.neutral[500]}
                  style={styles.quantity}
                >
                  {item.amount !== undefined
                    ? formatQuantity(item)
                    : item.rawParts.filter(Boolean).join(' + ') || '—'}
                </Text>
              </Touchable>
            ))}
          </View>

          <ActionButton
            label="Neu erzeugen"
            icon={<Icon name="Copy" size={14} color={colors.neutral[400]} />}
            quiet
            onPress={() =>
              Alert.alert(
                'Liste neu erzeugen?',
                'Die aktuelle Liste wird verworfen, auch die Häkchen.',
                [
                  { text: 'Abbrechen', style: 'cancel' },
                  { text: 'Neu erzeugen', style: 'destructive', onPress: regenerate },
                ],
              )
            }
            style={styles.action}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  list: { marginTop: 18, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...edge(),
  },
  rowDone: { backgroundColor: 'transparent' },
  grow: { flex: 1, minWidth: 0 },
  origin: { marginTop: 2 },
  struck: { textDecorationLine: 'line-through' },
  quantity: { fontVariant: ['tabular-nums'] },
  action: { marginTop: 18 },
  empty: { marginTop: 24, textAlign: 'center', lineHeight: 20 },
});

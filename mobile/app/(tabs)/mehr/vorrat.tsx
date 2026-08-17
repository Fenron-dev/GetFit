import { Alert, StyleSheet, View } from 'react-native';
import { Screen } from '../../../src/components/Screen';
import { Text } from '../../../src/components/Text';
import { BackHeader } from '../../../src/components/BackHeader';
import { SectionHead } from '../../../src/components/SectionHead';
import { Touchable } from '../../../src/components/Surface';
import { Icon } from '../../../src/components/icons';
import { useQuery } from '../../../src/hooks/useQuery';
import {
  LOCATION_ICONS,
  LOCATION_LABELS,
  consumeStock,
  daysLeft,
  listStock,
  removeStock,
  updateStock,
  urgencyOf,
} from '../../../src/data/repositories/stock';
import { LOCATIONS, type StockItem, type StockLocation } from '../../../src/types/domain';
import { colors, edge, radius } from '../../../src/theme/tokens';
import { useAccent } from '../../../src/theme/ThemeProvider';

/**
 * Was gekocht im Haus ist, nach Ort gruppiert und nach Ablauf sortiert.
 * Überfälliges steht oben und ist rot gerändert — das ist der Zweck der
 * Liste.
 */
export default function StockRoute() {
  const accent = useAccent();
  const { data: stock } = useQuery(() => listStock(), []);

  const byLocation = LOCATIONS.map((location) => ({
    location,
    items: (stock ?? [])
      .filter((item) => item.location === location)
      .sort((a, b) => a.bestBefore.localeCompare(b.bestBefore)),
  })).filter((group) => group.items.length > 0);

  return (
    <Screen variant="detail">
      <BackHeader label="Einstellungen" />
      <Text variant="sectionTitle">Vorrat</Text>
      <Text variant="meta" color={colors.neutral[500]} style={styles.subtitle}>
        {stock?.length
          ? `${stock.reduce((sum, item) => sum + item.portions, 0)} Portionen gekocht`
          : 'Noch nichts eingelagert'}
      </Text>

      {byLocation.length === 0 ? (
        <Text variant="meta" color={colors.neutral[500]} style={styles.empty}>
          Setz beim Einplanen einer Mahlzeit fest, wie viele Portionen du
          zusätzlich kochst — beim Abhaken landen sie dann hier.
        </Text>
      ) : null}

      {byLocation.map((group) => (
        <View key={group.location}>
          <SectionHead
            icon={LOCATION_ICONS[group.location]}
            label={LOCATION_LABELS[group.location]}
          />
          <View style={styles.list}>
            {group.items.map((item) => (
              <StockRow key={item.id} item={item} accent={accent} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function StockRow({ item, accent }: { item: StockItem; accent: string }) {
  const rest = daysLeft(item);
  const urgency = urgencyOf(item);

  const border =
    urgency === 'überfällig'
      ? colors.danger
      : urgency === 'bald'
        ? colors.warning
        : colors.neutral[800];

  const restLabel =
    rest < 0
      ? `${-rest} ${rest === -1 ? 'Tag' : 'Tage'} überfällig`
      : rest === 0
        ? 'heute verbrauchen'
        : `noch ${rest} ${rest === 1 ? 'Tag' : 'Tage'}`;

  function openActions() {
    Alert.alert(item.recipeName, `${item.portions} Portionen · ${restLabel}`, [
      {
        text: 'Eine Portion verbraucht',
        onPress: () => {
          consumeStock(item.id, 1);
        },
      },
      {
        text: 'Ort wechseln',
        onPress: () => {
          const next = LOCATIONS[(LOCATIONS.indexOf(item.location) + 1) % LOCATIONS.length];
          updateStock(item.id, { location: next });
        },
      },
      {
        text: 'Ganz entfernen',
        style: 'destructive' as const,
        onPress: () => {
          removeStock(item.id);
        },
      },
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  }

  return (
    <Touchable
      onPress={openActions}
      accessibilityLabel={`${item.recipeName}, ${restLabel}`}
      style={[styles.row, { borderColor: border }]}
    >
      <View style={[styles.portions, { borderColor: accent }]}>
        <Text variant="rowTitle" color={accent}>
          {item.portions}
        </Text>
      </View>
      <View style={styles.grow}>
        <Text variant="rowTitle" numberOfLines={1}>
          {item.recipeName}
        </Text>
        <Text
          variant="small"
          color={urgency === 'ruhig' ? colors.neutral[600] : border}
          style={styles.rowMeta}
        >
          {restLabel}
        </Text>
      </View>
      <Icon name="CaretRight" size={14} color={colors.neutral[700]} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 5, fontSize: 13 },
  empty: { marginTop: 24, textAlign: 'center', lineHeight: 20 },
  list: { marginTop: 10, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
  },
  portions: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  grow: { flex: 1, minWidth: 0 },
  rowMeta: { marginTop: 2 },
});

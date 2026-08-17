import { useCallback, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * Eine kurze Liste, deren Einträge sich durch Ziehen umsortieren lassen.
 *
 * Bewusst keine Bibliothek: die Listen hier sind kurz (die Übungen eines
 * Tages) und gleich hoch, damit reicht ein Griff, eine Verschiebung und
 * ein Zielindex aus der zurückgelegten Strecke. Das spart eine
 * Abhängigkeit, die seit Jahren hinter den React-Native-Fassungen
 * herhinkt.
 *
 * Losgezogen wird am Griff, nicht an der ganzen Zeile — sonst ließe sich
 * die Zeile nicht mehr antippen.
 */
export function DraggableList<T>({
  items,
  keyOf,
  gap = 8,
  onReorder,
  renderItem,
}: {
  items: T[];
  keyOf: (item: T) => string;
  gap?: number;
  /** Bekommt die neue Reihenfolge als Schlüsselliste. */
  onReorder: (orderedKeys: string[]) => void;
  /** `handle` gehört an das Element, das den Zug auslöst. */
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
}) {
  const [rowHeight, setRowHeight] = useState(0);
  const [dragging, setDragging] = useState<string>();

  // Die Reihenfolge während des Ziehens; erst beim Loslassen geschrieben.
  const orderRef = useRef<string[]>(items.map(keyOf));
  orderRef.current = items.map(keyOf);

  const step = rowHeight + gap;

  const finish = useCallback(
    (key: string, offset: number) => {
      setDragging(undefined);
      if (step <= 0) return;

      const from = orderRef.current.indexOf(key);
      const shift = Math.round(offset / step);
      const to = Math.max(0, Math.min(orderRef.current.length - 1, from + shift));
      if (to === from) return;

      const next = [...orderRef.current];
      next.splice(to, 0, ...next.splice(from, 1));
      onReorder(next);
    },
    [onReorder, step],
  );

  return (
    <View style={[styles.list, { gap }]}>
      {items.map((item, index) => (
        <Row
          key={keyOf(item)}
          itemKey={keyOf(item)}
          index={index}
          step={step}
          count={items.length}
          isDragging={dragging === keyOf(item)}
          otherDragging={dragging !== undefined && dragging !== keyOf(item)}
          onStart={setDragging}
          onFinish={finish}
          onMeasure={index === 0 ? setRowHeight : undefined}
          render={(handle) => renderItem(item, index, handle)}
        />
      ))}
    </View>
  );
}

function Row({
  itemKey,
  step,
  isDragging,
  onStart,
  onFinish,
  onMeasure,
  render,
}: {
  itemKey: string;
  index: number;
  step: number;
  count: number;
  isDragging: boolean;
  otherDragging: boolean;
  onStart: (key: string) => void;
  onFinish: (key: string, offset: number) => void;
  onMeasure?: (height: number) => void;
  render: (handle: ReactNode) => ReactNode;
}) {
  const offset = useSharedValue(0);
  const lifted = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      lifted.value = withTiming(1, { duration: 120 });
      runOnJS(onStart)(itemKey);
    })
    .onUpdate((event) => {
      offset.value = event.translationY;
    })
    .onEnd(() => {
      runOnJS(onFinish)(itemKey, offset.value);
      offset.value = withSpring(0, { damping: 20, stiffness: 200 });
      lifted.value = withTiming(0, { duration: 160 });
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: offset.value },
      { scale: 1 + lifted.value * 0.02 },
    ],
    zIndex: lifted.value > 0 ? 10 : 0,
    opacity: 1 - lifted.value * 0.08,
  }));

  const handle = (
    <GestureDetector gesture={pan}>
      <View style={styles.handle} accessibilityLabel="Zum Umsortieren ziehen" />
    </GestureDetector>
  );

  return (
    <Animated.View
      style={style}
      onLayout={onMeasure ? (event) => onMeasure(event.nativeEvent.layout.height) : undefined}
      pointerEvents={step === 0 && isDragging ? 'none' : 'auto'}
    >
      {render(handle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 10,
  },
  /** Die Fläche, an der gezogen wird — deckt das Griff-Symbol ab. */
  handle: {
    position: 'absolute',
    left: -14,
    top: -12,
    width: 44,
    height: 48,
  },
});

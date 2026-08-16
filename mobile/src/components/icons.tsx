import {
  AppleLogo,
  ArrowLeft,
  ArrowRight,
  Barbell,
  Basket,
  BowlFood,
  BowlSteam,
  CaretRight,
  Carrot,
  Check,
  CloudArrowDown,
  CloudCheck,
  Coffee,
  Copy,
  DotsSixVertical,
  Egg,
  Fish,
  Flame,
  ForkKnife,
  Heart,
  Image as ImageIcon,
  MagnifyingGlass,
  PersonSimple,
  PersonSimpleRun,
  PersonSimpleTaiChi,
  PersonSimpleThrow,
  PersonSimpleWalk,
  Plus,
  type IconProps,
  type IconWeight,
} from 'phosphor-react-native';
import { colors } from '../theme/tokens';

/**
 * Übungen und Rezepte speichern ihr Symbol als Name. Hier steht, welcher
 * Name welches Phosphor-Symbol bedeutet — die Datenschicht muss keine
 * Komponenten kennen.
 */
const REGISTRY = {
  AppleLogo,
  ArrowLeft,
  ArrowRight,
  Barbell,
  Basket,
  BowlFood,
  BowlSteam,
  CaretRight,
  Carrot,
  Check,
  CloudArrowDown,
  CloudCheck,
  Coffee,
  Copy,
  DotsSixVertical,
  Egg,
  Fish,
  Flame,
  ForkKnife,
  Heart,
  Image: ImageIcon,
  MagnifyingGlass,
  PersonSimple,
  PersonSimpleRun,
  PersonSimpleTaiChi,
  PersonSimpleThrow,
  PersonSimpleWalk,
  Plus,
} satisfies Record<string, React.ComponentType<IconProps>>;

export type IconName = keyof typeof REGISTRY;

/** Namen aus den Daten sind Zeichenketten; unbekannte fallen auf ein
 *  neutrales Symbol zurück, statt die Liste zu sprengen. */
export function iconFor(name: string): React.ComponentType<IconProps> {
  return REGISTRY[name as IconName] ?? Barbell;
}

export function Icon({
  name,
  size = 16,
  color = colors.text,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color?: string;
  weight?: IconWeight;
}) {
  const Component = iconFor(name);
  return <Component size={size} color={color} weight={weight} />;
}

export {
  ArrowLeft,
  Flame,
  CaretRight,
  Check,
  CloudArrowDown,
  CloudCheck,
  Copy,
  DotsSixVertical,
  Heart,
  ImageIcon,
  MagnifyingGlass,
  Plus,
};

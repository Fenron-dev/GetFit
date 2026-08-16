import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Barbell,
  CalendarCheck,
  ForkKnife,
  Gear,
  House,
  type IconProps,
} from 'phosphor-react-native';
import { colors, fonts, layout } from '../../src/theme/tokens';
import { useAccent } from '../../src/theme/ThemeProvider';

type PhosphorIcon = React.ComponentType<IconProps>;

/** React Navigation reicht die Farbe als ColorValue herein, Phosphor
 *  erwartet eine Zeichenkette — hier wird das einmal überbrückt. */
function tabIcon(Icon: PhosphorIcon) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Icon size={21} color={color as string} weight={focused ? 'fill' : 'regular'} />
  );
}

/**
 * Fünf Tabs — im Mockup heißt „Einstellungen" in der Leiste „Mehr", damit
 * fünf Labels nebeneinander passen. Aktive Symbole sind gefüllt, inaktive
 * im Regelschnitt; die Farbe kommt vom gewählten Akzent.
 */
export default function TabsLayout() {
  const accent = useAccent();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.neutral[600],
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          height: layout.tabBarHeight,
          paddingTop: 9,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[800],
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.regular,
          fontSize: 9.5,
        },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon(House),
        }}
      />
      <Tabs.Screen
        name="uebungen"
        options={{
          title: 'Übungen',
          tabBarIcon: tabIcon(Barbell),
        }}
      />
      <Tabs.Screen
        name="mahlzeiten"
        options={{
          title: 'Mahlzeiten',
          tabBarIcon: tabIcon(ForkKnife),
        }}
      />
      <Tabs.Screen
        name="plaene"
        options={{
          title: 'Pläne',
          tabBarIcon: tabIcon(CalendarCheck),
        }}
      />
      <Tabs.Screen
        name="mehr"
        options={{
          title: 'Mehr',
          tabBarIcon: tabIcon(Gear),
        }}
      />
    </Tabs>
  );
}

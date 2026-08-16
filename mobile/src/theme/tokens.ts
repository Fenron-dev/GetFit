/* ─────────────────────────────────────────────────────────────────────────
   Nocturne — Design-Tokens.

   Dieselben Werte wie im Handoff-Bundle (design/nocturne-styles.css), nur
   als TypeScript statt CSS-Variablen: React Native kennt keine
   Custom Properties. Diese Datei ist die einzige Stelle mit Hex-Werten,
   Schriftgrößen, Abständen und Radien.
   ───────────────────────────────────────────────────────────────────── */

/** Die vier Akzente aus dem Mockup. Der aktive kommt aus den
 *  Einstellungen und wird über den ThemeProvider verteilt. */
export const accents = {
  blurple: '#9184d9',
  mint: '#7fd4c1',
  amber: '#e0a26a',
  rose: '#d98495',
} as const;

export type AccentKey = keyof typeof accents;

export const accentLabels: Record<AccentKey, string> = {
  blurple: 'Blurple',
  mint: 'Mint',
  amber: 'Amber',
  rose: 'Rose',
};

export const colors = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',

  /** Tonale Rampen, in OKLCH auf einer gemeinsamen Helligkeitsskala
   *  erzeugt — derselbe Schritt jeder Rolle wiegt visuell gleich. */
  neutral: {
    100: '#f3f5fe',
    200: '#e4e7f5',
    300: '#cfd3e5',
    400: '#b2b6ca',
    500: '#9397ab',
    600: '#75798c',
    700: '#595d6c',
    800: '#3f424d',
    900: '#292b31',
  },

  accent: {
    100: '#f5f4ff',
    200: '#e7e5fe',
    300: '#d2cefd',
    400: '#b5abfc',
    500: '#968ae0',
    600: '#796cbf',
    700: '#5d5294',
    800: '#423a6a',
    900: '#2b2741',
  },

  /** Status — im Mockup fest verdrahtet für Streak, Erfolg, Warnung. */
  success: '#7fd4c1',
  warning: '#e0a26a',
  danger: '#d98495',
} as const;

/** Abstandsskala mit Dichte 0,7× — dieses System ist bewusst dicht. */
export const space = {
  1: 3,
  2: 6,
  3: 8,
  4: 11,
  6: 17,
  8: 22,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
  card: 12,
  cardLg: 14,
  media: 16,
  pill: 99,
} as const;

/** Schriftfamilien, wie sie expo-font unter diesen Namen lädt. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/** Die Größen aus dem Mockup, benannt statt gestreut. Überschriften
 *  gehen nie über Gewicht 500 — Hierarchie ist Größe und Weißraum. */
export const textStyles = {
  screenTitle: { fontFamily: fonts.medium, fontSize: 30, letterSpacing: -0.6 },
  detailTitle: { fontFamily: fonts.medium, fontSize: 26, letterSpacing: -0.5 },
  sectionTitle: { fontFamily: fonts.medium, fontSize: 28, letterSpacing: -0.56 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 15 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
  meta: { fontFamily: fonts.regular, fontSize: 12.5 },
  small: { fontFamily: fonts.regular, fontSize: 11.5 },
  /** Die Versalzeilen über den Abschnitten. */
  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    letterSpacing: 1.15,
    textTransform: 'uppercase' as const,
  },
  stat: { fontFamily: fonts.medium, fontSize: 22 },
} as const;

/**
 * Elevation auf dunklem Grund: eine Haarlinie plus Umgebungsdunkel.
 * Im Mockup steht dafür überall `box-shadow: 0 0 0 1px …` — in React
 * Native ist das schlicht ein Rahmen.
 */
export const edge = (color: string = colors.neutral[800]) => ({
  borderWidth: 1,
  borderColor: color,
});

export const shadow = {
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.65,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
} as const;

/** Deckkraft-Suffixe für Hex-Farben — das Mockup mischt so seine Tints. */
export const alpha = {
  '06': '0f',
  '10': '1a',
  '12': '1f',
  '15': '26',
  '17': '2b',
  '24': '3d',
  '40': '66',
} as const;

/** Akzent mit Deckkraft, z. B. tint(accent, '10') für einen Hover-Grund. */
export function tint(color: string, key: keyof typeof alpha): string {
  return `${color}${alpha[key]}`;
}

export const layout = {
  screenPadding: 20,
  /** Der Inhalt beginnt unter der Statusleiste. */
  safeTop: 70,
  safeTopDetail: 64,
  tabBarHeight: 78,
} as const;

export const motion = {
  fast: 180,
  base: 350,
} as const;

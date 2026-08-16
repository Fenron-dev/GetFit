import { createContext, useContext, type ReactNode } from 'react';
import { accents, type AccentKey } from './tokens';
import { useQuery } from '../hooks/useQuery';
import { getSettings } from '../data/repositories/settings';
import type { Settings } from '../types/domain';
import { DEFAULT_SETTINGS } from '../data/seed';

/**
 * Der Akzent ist in React Native keine CSS-Variable, sondern ein Wert,
 * der durch den Baum gereicht wird. Hier hängen auch die Einstellungen
 * dran, damit der kcal-Schalter überall ohne eigene Abfrage verfügbar ist.
 */
interface ThemeValue {
  accent: string;
  accentKey: AccentKey;
  settings: Settings;
}

const ThemeContext = createContext<ThemeValue>({
  accent: accents.blurple,
  accentKey: 'blurple',
  settings: DEFAULT_SETTINGS,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(() => getSettings(), []);
  const settings = data ?? DEFAULT_SETTINGS;

  return (
    <ThemeContext.Provider
      value={{
        accent: accents[settings.accent],
        accentKey: settings.accent,
        settings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/** Kurzform für den häufigsten Zugriff. */
export function useAccent(): string {
  return useContext(ThemeContext).accent;
}

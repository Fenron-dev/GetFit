import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Die tägliche Erinnerung aus dem Entwurf („Erinnerungen · 08:00").
 *
 * Es gibt genau eine, sie wiederholt sich täglich zur eingestellten Zeit
 * und liegt vollständig auf dem Gerät — kein Push-Dienst, kein Konto.
 *
 * Android bündelt Benachrichtigungen in Kanälen; ohne angelegten Kanal
 * erscheinen sie ab Version 8 stumm oder gar nicht.
 */

const CHANNEL = 'taeglich';
const IDENTIFIER = 'getfit-taegliche-erinnerung';

export type ReminderState = 'aktiv' | 'aus' | 'verweigert';

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Tägliche Erinnerung',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** Fragt die Erlaubnis, falls noch nicht geschehen. */
export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** "08:00" → { hour: 8, minute: 0 }; ungültige Eingaben werden zu 08:00. */
export function parseTime(value: string): { hour: number; minute: number } {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour: 8, minute: 0 };

  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return { hour, minute };
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Setzt die Erinnerung auf die angegebene Zeit. Vorher wird die alte
 * gelöscht — sonst sammeln sich mit jeder Änderung weitere an.
 */
export async function scheduleReminder(time: string): Promise<ReminderState> {
  await cancelReminder();

  if (!(await requestPermission())) return 'verweigert';
  await ensureChannel();

  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIER,
    content: {
      title: 'Heute',
      body: 'Dein Tag wartet — Training und Mahlzeiten stehen bereit.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL,
    },
  });

  return 'aktiv';
}

export async function cancelReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // Nichts geplant — kein Fehler.
  }
}

/** Steht eine Erinnerung? Für die Anzeige in den Einstellungen. */
export async function isScheduled(): Promise<boolean> {
  const planned = await Notifications.getAllScheduledNotificationsAsync();
  return planned.some((entry) => entry.identifier === IDENTIFIER);
}

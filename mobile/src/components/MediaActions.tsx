import { useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, View } from 'react-native';
import { Text } from './Text';
import { Touchable } from './Surface';
import { ActionButton } from './ActionButton';
import { Icon } from './icons';
import { colors, edge, fonts, radius } from '../theme/tokens';
import { useAccent } from '../theme/ThemeProvider';
import { downloadMedia, isLocalMedia, pickMediaFile, removeMedia } from '../lib/media';

/**
 * Setzt, ersetzt oder entfernt das Medium eines Eintrags. Zwei Wege:
 * eine Datei vom Gerät oder eine Adresse aus dem Netz. In beiden Fällen
 * landet eine Kopie im App-Verzeichnis, damit die Anzeige auch offline
 * und nach dem Aufräumen des Download-Ordners noch steht.
 */
export function MediaActions({
  ownerId,
  current,
  label,
  onChange,
}: {
  ownerId: string;
  current?: string;
  /** „GIF“ bei Übungen, „Foto“ bei Rezepten. */
  label: string;
  onChange: (uri: string | undefined) => Promise<void> | void;
}) {
  const accent = useAccent();
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function replaceWith(next: string) {
    // Erst das Neue eintragen, dann das Alte löschen — bricht etwas ab,
    // steht lieber eine Datei zu viel herum als ein leerer Eintrag.
    const previous = current;
    await onChange(next);
    if (isLocalMedia(previous)) removeMedia(previous);
  }

  async function fromFile() {
    setBusy(true);
    try {
      const uri = await pickMediaFile(ownerId);
      if (uri) await replaceWith(uri);
    } catch (error) {
      Alert.alert('Datei nicht übernommen', messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  async function fromUrl() {
    setBusy(true);
    try {
      const uri = await downloadMedia(ownerId, url);
      await replaceWith(uri);
      setUrlOpen(false);
      setUrl('');
    } catch (error) {
      Alert.alert('Laden fehlgeschlagen', messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    Alert.alert(`${label} entfernen?`, 'Danach erscheint wieder der Platzhalter.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen',
        style: 'destructive',
        onPress: async () => {
          const previous = current;
          await onChange(undefined);
          if (isLocalMedia(previous)) removeMedia(previous);
        },
      },
    ]);
  }

  return (
    <>
      <View style={styles.row}>
        <Touchable onPress={busy ? undefined : fromFile} style={styles.button} accessibilityLabel={`${label} aus Datei wählen`}>
          <Icon name="Image" size={15} color={accent} />
          <Text variant="small" color={accent}>
            Datei
          </Text>
        </Touchable>

        <Touchable
          onPress={busy ? undefined : () => setUrlOpen(true)}
          style={styles.button}
          accessibilityLabel={`${label} von einer Adresse laden`}
        >
          <Icon name="CloudArrowDown" size={15} color={accent} />
          <Text variant="small" color={accent}>
            Adresse
          </Text>
        </Touchable>

        {current ? (
          <Touchable onPress={clear} style={styles.button} accessibilityLabel={`${label} entfernen`}>
            <Text variant="small" color={colors.neutral[500]}>
              Entfernen
            </Text>
          </Touchable>
        ) : null}
      </View>

      <Modal
        visible={urlOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUrlOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text variant="rowTitle">{label} von einer Adresse</Text>
            <Text variant="meta" color={colors.neutral[500]} style={styles.dialogBody}>
              Die Datei wird einmal geladen und bleibt danach auf dem Gerät.
            </Text>

            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://…/kniebeuge.gif"
              placeholderTextColor={colors.neutral[700]}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoFocus
            />

            <View style={styles.dialogActions}>
              <ActionButton
                label="Abbrechen"
                quiet
                onPress={() => setUrlOpen(false)}
                style={styles.dialogButton}
              />
              <ActionButton
                label={busy ? 'Lädt…' : 'Laden'}
                onPress={fromUrl}
                disabled={busy || url.trim().length === 0}
                style={styles.dialogButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(11,12,20,0.72)',
  },
  dialog: {
    width: '100%',
    padding: 18,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    ...edge(colors.neutral[700]),
  },
  dialogBody: {
    marginTop: 6,
    lineHeight: 19,
  },
  input: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.neutral[800],
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dialogButton: {
    flex: 1,
  },
});

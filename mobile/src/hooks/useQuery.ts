import { useCallback, useEffect, useState } from 'react';
import { onDatabaseChange } from '../data/db';

/**
 * Ersatz für beobachtbare Abfragen: liest einmal und danach jedes Mal
 * neu, wenn irgendwo geschrieben wurde. Für den Umfang dieser App ist
 * das genau genug — die Datenmengen sind klein und die Schreibvorgänge
 * selten.
 *
 * `deps` verhält sich wie bei useEffect: ändert sich etwas darin, wird
 * neu gelesen.
 */
export function useQuery<T>(
  read: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | undefined; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableRead = useCallback(read, deps);

  const run = useCallback(() => {
    let cancelled = false;
    stableRead()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Abfrage fehlgeschlagen', error);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stableRead]);

  useEffect(() => {
    const cancel = run();
    const unsubscribe = onDatabaseChange(() => run());
    return () => {
      cancel();
      unsubscribe();
    };
  }, [run]);

  return { data, loading, reload: run };
}

import { useLocalStorage } from 'usehooks-ts';

import { type LocalPrefs } from 'loot-core/types/prefs';

import { useMetadataPref } from './useMetadataPref';

type SetLocalPrefAction<K extends keyof LocalPrefs> = (
  value: LocalPrefs[K],
) => void;

/**
 * Local preferences are scoped to a specific budget file.
 */
export function useLocalPref<K extends keyof LocalPrefs>(
  prefName: K,
  defaultVal?: LocalPrefs[K],
): [LocalPrefs[K], SetLocalPrefAction<K>] {
  const [budgetId] = useMetadataPref('id');

  return useLocalStorage<LocalPrefs[K]>(`${budgetId}-${prefName}`, defaultVal, {
    deserializer: JSON.parse,
    serializer: JSON.stringify,
  });
}

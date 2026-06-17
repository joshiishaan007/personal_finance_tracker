import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { idbStorage } from './idbStorage';

// Persists the TanStack Query cache to IndexedDB so the app can rehydrate the
// last-seen data on an offline cold start. Throttled so rapid cache updates
// don't thrash IndexedDB.
export const asyncPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: 'pft-query-cache',
  throttleTime: 1000,
});

// Wipe the offline snapshot (logout / token expiry) so one account's financial
// data never rehydrates under another on a shared device.
export async function clearPersistedCache(): Promise<void> {
  await asyncPersister.removeClient();
}

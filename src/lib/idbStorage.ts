// Tiny IndexedDB key/value store implementing the AsyncStorage shape TanStack's
// async persister expects ({ getItem, setItem, removeItem }). IndexedDB is only
// touched inside these calls, which the persister runs client-side only.
const DB_NAME = 'pft-query-cache';
const STORE = 'kv';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const idbStorage = {
  getItem: (key: string): Promise<string | null> =>
    withStore<string | undefined>('readonly', (s) => s.get(key)).then((v) => v ?? null),
  setItem: (key: string, value: string): Promise<void> =>
    withStore('readwrite', (s) => s.put(value, key)).then(() => undefined),
  removeItem: (key: string): Promise<void> =>
    withStore('readwrite', (s) => s.delete(key)).then(() => undefined),
};

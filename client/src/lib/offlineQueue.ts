// IndexedDB-backed offline queue for transactions created while offline
const DB_NAME = 'finbuddy-offline';
const STORE = 'queue';
const DB_VERSION = 1;

interface QueueItem {
  id: string;
  endpoint: string;
  method: string;
  body: unknown;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(endpoint: string, method: string, body: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const item: QueueItem = { id: `${Date.now()}-${Math.random()}`, endpoint, method, body, timestamp: Date.now() };
    const req = tx.objectStore(STORE).add(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function flushQueue(fetch: (endpoint: string, method: string, body: unknown) => Promise<void>): Promise<void> {
  const db = await openDB();
  const items: QueueItem[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      await fetch(item.endpoint, item.method, item.body);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).delete(item.id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Leave in queue to retry next time
    }
  }
}

// Register online handler to flush queue on reconnect
export function initOfflineSync(fetch: (endpoint: string, method: string, body: unknown) => Promise<void>): void {
  window.addEventListener('online', () => {
    void flushQueue(fetch);
  });
  if (navigator.onLine) void flushQueue(fetch);
}

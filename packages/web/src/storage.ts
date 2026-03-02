import type { StorageAdapter, SavedGame, GameSummary, LLMConfig } from "@storyteller/core";

const DB_NAME = "storyteller";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("games")) {
        db.createObjectStore("games", { keyPath: "summary.id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const tx = (db: IDBDatabase, store: string, mode: IDBTransactionMode): IDBObjectStore => {
  return db.transaction(store, mode).objectStore(store);
};

const req = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idbStorage: StorageAdapter = {
  async saveGame(game: SavedGame): Promise<void> {
    const db = await openDB();
    await req(tx(db, "games", "readwrite").put(game));
  },

  async loadGame(id: string): Promise<SavedGame | null> {
    const db = await openDB();
    const result = await req(tx(db, "games", "readonly").get(id));
    return (result as SavedGame) ?? null;
  },

  async listGames(): Promise<GameSummary[]> {
    const db = await openDB();
    const all: SavedGame[] = await req(tx(db, "games", "readonly").getAll());
    return all.map((g) => g.summary).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async deleteGame(id: string): Promise<void> {
    const db = await openDB();
    await req(tx(db, "games", "readwrite").delete(id));
  },

  async saveSettings(settings: LLMConfig): Promise<void> {
    const db = await openDB();
    await req(tx(db, "settings", "readwrite").put(settings, "llm"));
  },

  async loadSettings(): Promise<LLMConfig | null> {
    const db = await openDB();
    const result = await req(tx(db, "settings", "readonly").get("llm"));
    return (result as LLMConfig) ?? null;
  },
};

export { idbStorage };

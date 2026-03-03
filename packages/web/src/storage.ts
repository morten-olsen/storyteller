import type { StorageAdapter, SavedGame, GameSummary, LLMSettings, Locale } from "@storyteller/core";

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

// Migrate old saved games that lack `mode` and score `kind` fields
const migrateGame = (game: SavedGame): SavedGame => {
  const state = game.state;
  const summary = game.summary;

  // Add mode if missing (old games are objective)
  if (!state.mode) {
    (state as Record<string, unknown>).mode = "objective";
  }
  if (!summary.mode) {
    (summary as Record<string, unknown>).mode = "objective";
  }

  // Add kind to scores if missing
  for (const turn of state.turns) {
    if (turn.score && !("kind" in turn.score)) {
      (turn.score as Record<string, unknown>).kind = "objective";
    }
  }

  // Add locale if missing (old games default to English)
  if (!state.locale) {
    (state as Record<string, unknown>).locale = "en";
  }

  return game;
};

// Migrate old settings formats to new multi-provider LLMSettings
const migrateSettings = (raw: unknown): LLMSettings | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;

  // New format — has remoteProviders array
  if ("remoteProviders" in obj) {
    return raw as LLMSettings;
  }

  // Old RemoteLLMSettings: { provider: "remote", apiKey, baseUrl, model }
  if (obj.provider === "remote" && "apiKey" in obj && "baseUrl" in obj && "model" in obj) {
    const providerId = crypto.randomUUID();
    return {
      remoteProviders: [
        {
          id: providerId,
          name: "Remote API",
          baseUrl: obj.baseUrl as string,
          apiKey: obj.apiKey as string,
          models: [obj.model as string],
        },
      ],
      activeModel: { kind: "remote", providerId, model: obj.model as string },
    };
  }

  // Old LocalLLMSettings: { provider: "local", modelId }
  if (obj.provider === "local" && "modelId" in obj) {
    return {
      remoteProviders: [],
      activeModel: { kind: "local", modelId: obj.modelId as string },
    };
  }

  // Ancient format: { apiKey, baseUrl, model } (no provider field)
  if ("apiKey" in obj && "baseUrl" in obj && "model" in obj) {
    const providerId = crypto.randomUUID();
    return {
      remoteProviders: [
        {
          id: providerId,
          name: "Remote API",
          baseUrl: obj.baseUrl as string,
          apiKey: obj.apiKey as string,
          models: [obj.model as string],
        },
      ],
      activeModel: { kind: "remote", providerId, model: obj.model as string },
    };
  }

  return null;
};

const idbStorage: StorageAdapter = {
  async saveGame(game: SavedGame): Promise<void> {
    const db = await openDB();
    await req(tx(db, "games", "readwrite").put(game));
  },

  async loadGame(id: string): Promise<SavedGame | null> {
    const db = await openDB();
    const result = await req(tx(db, "games", "readonly").get(id));
    return result ? migrateGame(result as SavedGame) : null;
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

  async saveSettings(settings: LLMSettings): Promise<void> {
    const db = await openDB();
    await req(tx(db, "settings", "readwrite").put(settings, "llm"));
  },

  async loadSettings(): Promise<LLMSettings | null> {
    const db = await openDB();
    const result = await req(tx(db, "settings", "readonly").get("llm"));
    return result ? migrateSettings(result) : null;
  },
};

const saveLocale = async (locale: Locale): Promise<void> => {
  const db = await openDB();
  await req(tx(db, "settings", "readwrite").put(locale, "locale"));
};

const loadLocale = async (): Promise<Locale | null> => {
  const db = await openDB();
  const result = await req(tx(db, "settings", "readonly").get("locale"));
  return (result as Locale) ?? null;
};

export { idbStorage, saveLocale, loadLocale };

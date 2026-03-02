// Re-export the StorageAdapter interface from types.
// This file exists so consumers can import { StorageAdapter } from '@storyteller/core/storage'
// without pulling in all types. The actual implementations live in each client (web, tui).
export type { StorageAdapter, SavedGame, GameSummary, LLMConfig } from "./types.js";

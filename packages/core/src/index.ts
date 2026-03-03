// Types
export type {
  Locale,
  NarrationStyle,
  GameMode,
  Difficulty,
  DifficultyConfig,
  AiPersona,
  Checkpoint,
  ObjectiveTurnScore,
  SurvivalTurnScore,
  TurnScore,
  Turn,
  GamePhase,
  GameState,
  GameSummary,
  SavedGame,
  LLMConfig,
  StorageAdapter,
} from "./types.js";

// Difficulty
export { DIFFICULTY_CONFIGS, getDifficultyConfig } from "./difficulty.js";

// Personas
export { PERSONAS, getPersona, getRandomPersona } from "./personas.js";

// Narration Styles
export { NARRATION_STYLES, getNarrationStyle } from "./narration-styles.js";
export type { NarrationStyleDef } from "./narration-styles.js";

// Scoring
export { computeObjectiveScore, computeSurvivalScore, aggregateScore, playerCheckpointsFulfilled } from "./scoring.js";

// Game state machine
export {
  createGame,
  applySetupResult,
  submitPlayerTurn,
  applyScore,
  applyAiTurn,
  isGameOver,
  buildSummary,
} from "./game.js";

// LLM
export { chatCompletion, chatCompletionStream } from "./llm/client.js";
export type {
  ChatMessage,
  ChatCompletionOptions,
  StreamCallbacks,
  ChatCompletionResult,
  StreamCompletionResult,
} from "./llm/client.js";
export { generateSetup } from "./llm/setup.js";
export type { SetupResult } from "./llm/setup.js";
export { generateAiTurn, streamAiTurn } from "./llm/narrator.js";
export { judgePlayerTurn } from "./llm/judge.js";
export type { JudgeResult } from "./llm/judge.js";
export { generateDraftTurn } from "./llm/draft.js";
export type { DraftTurnResult } from "./llm/draft.js";

// --- Difficulty ---

export type Difficulty = "easy" | "medium" | "hard";

export type DifficultyConfig = {
  charLimit: number;
  checkpointCount: { player: number; ai: number };
  aiVisibility: "full" | "hints" | "hidden";
  personaVisible: boolean;
};

// --- Personas ---

export type AiPersona = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
};

// --- Checkpoints ---

export type Checkpoint = {
  id: string;
  description: string;
  fulfilled: boolean;
};

// --- Scoring ---

export type TurnScore = {
  coherence: number; // -1 to +1
  proseQuality: number; // -1 to +1
  adaptation: number; // -1 to +1
  total: number; // sum of above
};

// --- Turns ---

export type Turn = {
  index: number;
  author: "player" | "ai";
  text: string;
  score?: TurnScore;
  scoreReason?: string;
  aiPenalty?: number;
};

// --- Game State Machine ---

export type GamePhase = "setup" | "generating" | "player_turn" | "ai_turn" | "scoring" | "closing" | "game_over";

export type GameState = {
  id: string;
  phase: GamePhase;
  difficulty: Difficulty;
  config: DifficultyConfig;
  persona: AiPersona;
  title: string;
  worldPrompt: string;
  worldDescription: string;
  playerCheckpoints: Checkpoint[];
  aiCheckpoints: Checkpoint[];
  turns: Turn[];
  isClosingTurn: boolean;
  totalCost: number;
};

// --- Storage ---

export type GameSummary = {
  id: string;
  date: string;
  phase: GamePhase;
  title: string;
  worldPrompt: string;
  difficulty: Difficulty;
  persona: string;
  totalScore: number;
  totalCost: number;
  turnCount: number;
  playerWon: boolean;
};

export type SavedGame = {
  summary: GameSummary;
  state: GameState;
};

// --- LLM Config ---

export type LLMConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

// --- Storage Adapter ---

export type StorageAdapter = {
  saveGame(game: SavedGame): Promise<void>;
  loadGame(id: string): Promise<SavedGame | null>;
  listGames(): Promise<GameSummary[]>;
  deleteGame(id: string): Promise<void>;
  saveSettings(settings: LLMConfig): Promise<void>;
  loadSettings(): Promise<LLMConfig | null>;
};

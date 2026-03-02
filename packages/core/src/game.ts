import type {
  GameState,
  GamePhase,
  Difficulty,
  DifficultyConfig,
  AiPersona,
  Checkpoint,
  Turn,
  TurnScore,
  GameSummary,
} from "./types.js";
import { aggregateScore, playerCheckpointsFulfilled } from "./scoring.js";

const createGame = (
  id: string,
  difficulty: Difficulty,
  config: DifficultyConfig,
  persona: AiPersona,
  worldPrompt: string,
): GameState => {
  return {
    id,
    phase: "generating",
    difficulty,
    config,
    persona,
    title: "",
    worldPrompt,
    worldDescription: "",
    playerCheckpoints: [],
    aiCheckpoints: [],
    turns: [],
    isClosingTurn: false,
    totalCost: 0,
  };
};

const applySetupResult = (
  state: GameState,
  worldDescription: string,
  playerCheckpoints: Checkpoint[],
  aiCheckpoints: Checkpoint[],
  title = "",
  cost = 0,
): GameState => {
  if (state.phase !== "generating") {
    throw new Error(`Cannot apply setup in phase: ${state.phase}`);
  }
  return {
    ...state,
    phase: "player_turn",
    title,
    worldDescription,
    playerCheckpoints,
    aiCheckpoints,
    totalCost: state.totalCost + cost,
  };
};

const submitPlayerTurn = (state: GameState, text: string): GameState => {
  if (state.phase !== "player_turn" && state.phase !== "closing") {
    throw new Error(`Cannot submit player turn in phase: ${state.phase}`);
  }
  const turn: Turn = {
    index: state.turns.length,
    author: "player",
    text,
  };
  return {
    ...state,
    phase: "scoring",
    turns: [...state.turns, turn],
  };
};

const applyScore = (
  state: GameState,
  score: TurnScore,
  playerCheckpoints: Checkpoint[],
  aiCheckpoints: Checkpoint[],
  reason = "",
  cost = 0,
): GameState => {
  if (state.phase !== "scoring") {
    throw new Error(`Cannot apply score in phase: ${state.phase}`);
  }

  const turns = [...state.turns];
  const last = { ...turns[turns.length - 1], score, scoreReason: reason };
  turns[turns.length - 1] = last;

  const totalCost = state.totalCost + cost;
  const allFulfilled = playerCheckpoints.every((c) => c.fulfilled) && aiCheckpoints.every((c) => c.fulfilled);

  if (state.isClosingTurn) {
    return { ...state, phase: "game_over", turns, playerCheckpoints, aiCheckpoints, totalCost };
  }

  if (allFulfilled) {
    return {
      ...state,
      phase: "ai_turn",
      turns,
      playerCheckpoints,
      aiCheckpoints,
      isClosingTurn: true,
      totalCost,
    };
  }

  return { ...state, phase: "ai_turn", turns, playerCheckpoints, aiCheckpoints, totalCost };
};

const applyAiTurn = (state: GameState, text: string, cost = 0): GameState => {
  if (state.phase !== "ai_turn") {
    throw new Error(`Cannot apply AI turn in phase: ${state.phase}`);
  }

  const turn: Turn = {
    index: state.turns.length,
    author: "ai",
    text,
  };

  const nextPhase: GamePhase = state.isClosingTurn ? "closing" : "player_turn";

  return {
    ...state,
    phase: nextPhase,
    turns: [...state.turns, turn],
    totalCost: state.totalCost + cost,
  };
};

const isGameOver = (state: GameState): boolean => {
  return state.phase === "game_over";
};

const buildSummary = (state: GameState): GameSummary => {
  const playerFulfilled = playerCheckpointsFulfilled(state.playerCheckpoints);
  const aiFulfilled = playerCheckpointsFulfilled(state.aiCheckpoints);
  return {
    id: state.id,
    date: new Date().toISOString(),
    phase: state.phase,
    title: state.title,
    worldPrompt: state.worldPrompt,
    difficulty: state.difficulty,
    persona: state.persona.name,
    totalScore: aggregateScore(state.turns),
    totalCost: state.totalCost,
    turnCount: state.turns.length,
    playerWon: playerFulfilled >= aiFulfilled,
  };
};

export { createGame, applySetupResult, submitPlayerTurn, applyScore, applyAiTurn, isGameOver, buildSummary };

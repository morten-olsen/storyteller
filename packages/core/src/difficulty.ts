import type { Difficulty, DifficultyConfig } from "./types.js";

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    charLimit: 800,
    checkpointCount: { player: 1, ai: 1 },
    aiVisibility: "full",
    personaVisible: true,
  },
  medium: {
    charLimit: 500,
    checkpointCount: { player: 3, ai: 3 },
    aiVisibility: "hints",
    personaVisible: true,
  },
  hard: {
    charLimit: 350,
    checkpointCount: { player: 5, ai: 5 },
    aiVisibility: "hidden",
    personaVisible: false,
  },
};

const getDifficultyConfig = (difficulty: Difficulty): DifficultyConfig => {
  return DIFFICULTY_CONFIGS[difficulty];
};

export { DIFFICULTY_CONFIGS, getDifficultyConfig };

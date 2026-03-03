import type { DifficultyConfig, GameMode, Locale, NarrationStyle, Checkpoint } from "../types.js";

import type { ChatMessage, ChatClient } from "./client.js";
import { localeInstruction } from "./locale-instruction.js";
import { parseJSON } from "./parse-json.js";
import { styleInstruction } from "./style-instruction.js";

type SetupResult = {
  title: string;
  worldDescription: string;
  playerCheckpoints: Checkpoint[];
  aiCheckpoints: Checkpoint[];
  cost: number;
};

const generateObjectiveSetup = async (
  client: ChatClient,
  difficultyConfig: DifficultyConfig,
  worldPrompt: string,
  locale: Locale = "en",
  narrationStyle: NarrationStyle = "casual",
): Promise<SetupResult> => {
  const playerCount = difficultyConfig.checkpointCount.player;
  const aiCount = difficultyConfig.checkpointCount.ai;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a game master for an adversarial storytelling game. Your job is to create:
1. A vivid world description (2-3 paragraphs) based on the user's prompt
2. Secret narrative checkpoints for the player (${playerCount} checkpoint${playerCount > 1 ? "s" : ""})
3. Secret narrative checkpoints for the AI opponent (${aiCount} checkpoint${aiCount > 1 ? "s" : ""})

Checkpoints are specific story conditions that must be fulfilled (e.g. "The knight must betray the kingdom", "A hidden treasure must be discovered"). They should:
- Be achievable through storytelling (not meta-game actions)
- Create interesting tension when opposing checkpoints conflict
- Be specific enough to judge but flexible in how they're achieved
- Scale in complexity: single goals for easy, multi-step non-linear for hard

Respond with ONLY valid JSON in this exact format:
{
  "title": "A short, evocative story title",
  "worldDescription": "...",
  "playerCheckpoints": ["checkpoint 1", "checkpoint 2"],
  "aiCheckpoints": ["checkpoint 1", "checkpoint 2"]
}${localeInstruction(locale)}${styleInstruction(narrationStyle)}`,
    },
    {
      role: "user",
      content: worldPrompt
        ? `Create a world and checkpoints based on this prompt: "${worldPrompt}"`
        : "Create a world and checkpoints from scratch. Choose any interesting setting and scenario.",
    },
  ];

  const { content, cost } = await client.complete({ messages, json: true, temperature: 0.9 });
  const parsed = parseJSON(content);

  return {
    title: (parsed.title as string) ?? "Untitled Story",
    worldDescription: parsed.worldDescription as string,
    playerCheckpoints: (parsed.playerCheckpoints as string[]).map((desc, i) => ({
      id: `player-${i}`,
      description: desc,
      fulfilled: false,
    })),
    aiCheckpoints: (parsed.aiCheckpoints as string[]).map((desc, i) => ({
      id: `ai-${i}`,
      description: desc,
      fulfilled: false,
    })),
    cost,
  };
};

const generateSurvivalSetup = async (
  client: ChatClient,
  worldPrompt: string,
  locale: Locale = "en",
  narrationStyle: NarrationStyle = "casual",
): Promise<SetupResult> => {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a game master for a survival storytelling game. The player must write their way out of escalating dangerous situations.

Your job is to create:
1. A vivid world description (2-3 paragraphs) that establishes a setting and ends with an immediate dangerous situation the player must survive
2. A short, evocative title

The danger should be dramatic but survivable with clever writing. The world description should seamlessly flow into the first threat — do NOT separate them.

Respond with ONLY valid JSON in this exact format:
{
  "title": "A short, evocative story title",
  "worldDescription": "... ending with the immediate danger the player faces"
}${localeInstruction(locale)}${styleInstruction(narrationStyle)}`,
    },
    {
      role: "user",
      content: worldPrompt
        ? `Create a survival scenario based on this prompt: "${worldPrompt}"`
        : "Create a survival scenario from scratch. Choose any interesting and dangerous setting.",
    },
  ];

  const { content, cost } = await client.complete({ messages, json: true, temperature: 0.9 });
  const parsed = parseJSON(content);

  return {
    title: (parsed.title as string) ?? "Untitled Story",
    worldDescription: parsed.worldDescription as string,
    playerCheckpoints: [],
    aiCheckpoints: [],
    cost,
  };
};

const generateSetup = async (
  client: ChatClient,
  mode: GameMode,
  difficultyConfig: DifficultyConfig,
  worldPrompt: string,
  locale: Locale = "en",
  narrationStyle: NarrationStyle = "casual",
): Promise<SetupResult> => {
  if (mode === "survival") {
    return generateSurvivalSetup(client, worldPrompt, locale, narrationStyle);
  }
  return generateObjectiveSetup(client, difficultyConfig, worldPrompt, locale, narrationStyle);
};

export type { SetupResult };
export { generateSetup };

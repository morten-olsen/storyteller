import type { LLMConfig, DifficultyConfig, Checkpoint } from "../types.js";

import { chatCompletion } from "./client.js";
import type { ChatMessage } from "./client.js";

type SetupResult = {
  title: string;
  worldDescription: string;
  playerCheckpoints: Checkpoint[];
  aiCheckpoints: Checkpoint[];
  cost: number;
};

const generateSetup = async (
  config: LLMConfig,
  difficultyConfig: DifficultyConfig,
  worldPrompt: string,
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
}`,
    },
    {
      role: "user",
      content: worldPrompt
        ? `Create a world and checkpoints based on this prompt: "${worldPrompt}"`
        : "Create a world and checkpoints from scratch. Choose any interesting setting and scenario.",
    },
  ];

  const { content, cost } = await chatCompletion(config, { messages, json: true, temperature: 0.9 });
  const parsed = JSON.parse(content);

  return {
    title: parsed.title ?? "Untitled Story",
    worldDescription: parsed.worldDescription,
    playerCheckpoints: parsed.playerCheckpoints.map((desc: string, i: number) => ({
      id: `player-${i}`,
      description: desc,
      fulfilled: false,
    })),
    aiCheckpoints: parsed.aiCheckpoints.map((desc: string, i: number) => ({
      id: `ai-${i}`,
      description: desc,
      fulfilled: false,
    })),
    cost,
  };
};

export type { SetupResult };
export { generateSetup };

import type { GameState } from "../types.js";

import type { ChatMessage, ChatClient } from "./client.js";
import { localeInstruction } from "./locale-instruction.js";
import { styleInstruction } from "./style-instruction.js";

type DraftTurnResult = { text: string; cost: number };

const truncateAtSentence = (text: string, limit: number): string => {
  if (text.length <= limit) {
    return text;
  }
  const truncated = text.slice(0, limit);
  const lastSentence = truncated.search(/[.!?][^.!?]*$/);
  if (lastSentence === -1) {
    return truncated.trim();
  }
  return truncated.slice(0, lastSentence + 1).trim();
};

const generateObjectiveDraft = async (client: ChatClient, state: GameState): Promise<DraftTurnResult> => {
  const checkpointList = state.playerCheckpoints
    .filter((c) => !c.fulfilled)
    .map((c) => `- ${c.description}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a writing coach helping a player craft their opening paragraph for a collaborative storytelling game.

WORLD:
${state.worldDescription}

PLAYER'S SECRET OBJECTIVES (subtly work toward these):
${checkpointList || "(No objectives)"}

Write a single draft paragraph that:
- Responds naturally to the world description
- Subtly begins working toward one or more player objectives
- Uses vivid, engaging prose
- Stays UNDER ${state.config.charLimit} characters

Output ONLY the paragraph text, nothing else.${localeInstruction(state.locale)}${styleInstruction(state.narrationStyle)}`,
    },
    {
      role: "user",
      content: "Write a strong opening paragraph for the player.",
    },
  ];

  const { content, cost } = await client.complete({ messages, json: false, temperature: 0.85, maxTokens: 400 });
  const text = truncateAtSentence(content.trim(), state.config.charLimit);
  return { text, cost };
};

const generateSurvivalDraft = async (client: ChatClient, state: GameState): Promise<DraftTurnResult> => {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a writing coach helping a player craft their opening paragraph for a survival storytelling game.

SITUATION:
${state.worldDescription}

Write a single draft paragraph that:
- Creatively addresses the immediate danger described in the situation
- Shows the character taking decisive, inventive action
- Uses vivid, engaging prose
- Stays UNDER ${state.config.charLimit} characters

Output ONLY the paragraph text, nothing else.${localeInstruction(state.locale)}${styleInstruction(state.narrationStyle)}`,
    },
    {
      role: "user",
      content: "Write a strong opening survival response for the player.",
    },
  ];

  const { content, cost } = await client.complete({ messages, json: false, temperature: 0.85, maxTokens: 400 });
  const text = truncateAtSentence(content.trim(), state.config.charLimit);
  return { text, cost };
};

const generateDraftTurn = async (client: ChatClient, state: GameState): Promise<DraftTurnResult> => {
  if (state.mode === "survival") {
    return generateSurvivalDraft(client, state);
  }
  return generateObjectiveDraft(client, state);
};

export type { DraftTurnResult };
export { generateDraftTurn };

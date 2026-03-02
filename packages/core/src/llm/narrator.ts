import type { LLMConfig, GameState } from "../types.js";

import { chatCompletion, chatCompletionStream } from "./client.js";
import type { ChatMessage, StreamCallbacks, ChatCompletionResult, StreamCompletionResult } from "./client.js";

const buildNarratorMessages = (state: GameState): ChatMessage[] => {
  const storyContext = state.turns.map((t) => t.text).join("\n\n");
  const checkpointList = state.aiCheckpoints
    .filter((c) => !c.fulfilled)
    .map((c) => `- ${c.description}`)
    .join("\n");

  const system = `${state.persona.systemPrompt}

You are writing a collaborative story with another author. You take turns writing paragraphs.

WORLD:
${state.worldDescription}

YOUR SECRET OBJECTIVES (steer the story toward these without being obvious):
${checkpointList || "(All objectives fulfilled — write a satisfying conclusion)"}

RULES:
- Write exactly ONE paragraph, no more than ${state.config.charLimit} characters
- Maintain story coherence — build on what came before
- Subtly steer toward your objectives without breaking the narrative
- Do NOT reference the game mechanics, scoring, or objectives directly
- Write compelling, engaging prose`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  if (storyContext) {
    messages.push({
      role: "user",
      content: `Story so far:\n\n${storyContext}\n\nContinue the story with your next paragraph.`,
    });
  } else {
    messages.push({ role: "user", content: "Begin the story with your opening paragraph." });
  }

  return messages;
};

const generateAiTurn = async (config: LLMConfig, state: GameState): Promise<ChatCompletionResult> => {
  const messages = buildNarratorMessages(state);
  return chatCompletion(config, { messages, maxTokens: 500 });
};

const streamAiTurn = async (
  config: LLMConfig,
  state: GameState,
  callbacks: StreamCallbacks,
): Promise<StreamCompletionResult> => {
  const messages = buildNarratorMessages(state);
  return chatCompletionStream(config, { messages, maxTokens: 500 }, callbacks);
};

export { generateAiTurn, streamAiTurn };

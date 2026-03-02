import type { LLMConfig, GameState } from "../types.js";

import { chatCompletion, chatCompletionStream } from "./client.js";
import type { ChatMessage, StreamCallbacks, ChatCompletionResult, StreamCompletionResult } from "./client.js";

const buildObjectiveMessages = (state: GameState): ChatMessage[] => {
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

const buildSurvivalMessages = (state: GameState): ChatMessage[] => {
  const storyContext = state.turns.map((t) => t.text).join("\n\n");
  const roundNumber = Math.floor(state.turns.length / 2);

  const system = `${state.persona.systemPrompt}

You are the narrator of a survival storytelling game. The player writes their way out of dangerous situations, and you resolve the outcome and introduce the NEXT escalating challenge.

WORLD:
${state.worldDescription}

CURRENT ROUND: ${roundNumber + 1}
ESCALATION LEVEL: ${roundNumber} (increase danger and complexity with each round — early rounds are tense but manageable, later rounds should be increasingly dire and creative)

RULES:
- First, briefly resolve the player's survival attempt (they survived — acknowledge their solution)
- Then introduce the NEXT dangerous situation they must face
- Write exactly ONE paragraph, no more than ${state.config.charLimit} characters
- Each new danger should escalate in severity and creativity
- Do NOT reference game mechanics, scoring, or survival checks directly
- Write compelling, vivid prose that raises the stakes`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  messages.push({
    role: "user",
    content: `Story so far:\n\n${storyContext}\n\nResolve the player's action and introduce the next danger.`,
  });

  return messages;
};

const buildNarratorMessages = (state: GameState): ChatMessage[] => {
  if (state.mode === "survival") {
    return buildSurvivalMessages(state);
  }
  return buildObjectiveMessages(state);
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

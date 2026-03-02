import type { LLMConfig, GameState, TurnScore, Checkpoint, Difficulty } from "../types.js";
import { computeObjectiveScore, computeSurvivalScore } from "../scoring.js";

import { chatCompletion } from "./client.js";
import type { ChatMessage } from "./client.js";

type JudgeResult = {
  score: TurnScore;
  reason: string;
  playerCheckpoints: Checkpoint[];
  aiCheckpoints: Checkpoint[];
  survived?: boolean;
  deathReason?: string;
  cost: number;
};

const clamp = (val: unknown): number => {
  const n = Number(val);
  if (isNaN(n)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, Math.round(n * 10) / 10));
};

const strictnessInstruction = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case "easy":
      return "Be lenient — give the player the benefit of the doubt. If the solution is remotely plausible, they survive.";
    case "medium":
      return "Be fair — the solution should be reasonable and show some creativity to survive.";
    case "hard":
      return "Be ruthless — only clearly viable, clever solutions allow survival. Vague or lazy responses mean death.";
  }
};

const judgeObjectiveTurn = async (config: LLMConfig, state: GameState): Promise<JudgeResult> => {
  const latestTurn = state.turns[state.turns.length - 1];
  const previousTurns = state.turns.slice(0, -1);
  const storyContext = previousTurns.map((t) => t.text).join("\n\n");

  const playerCheckpointList = state.playerCheckpoints
    .map((c, i) => `${i + 1}. [${c.fulfilled ? "FULFILLED" : "PENDING"}] ${c.description}`)
    .join("\n");
  const aiCheckpointList = state.aiCheckpoints
    .map((c, i) => `${i + 1}. [${c.fulfilled ? "FULFILLED" : "PENDING"}] ${c.description}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an objective literary critic judging a collaborative storytelling game. You evaluate the latest paragraph written by the player.

Score each dimension from -1.0 to +1.0 (use one decimal place):
- coherence: Does this follow logically from the story so far?
- proseQuality: Is the writing compelling, vivid, and well-crafted?
- adaptation: How gracefully does it respond to or redirect the story's direction?

Also evaluate whether any checkpoints (player OR AI) have been newly fulfilled by the events in the complete story so far.

PLAYER CHECKPOINTS:
${playerCheckpointList}

AI CHECKPOINTS:
${aiCheckpointList}

Respond with ONLY valid JSON:
{
  "coherence": 0.0,
  "proseQuality": 0.0,
  "adaptation": 0.0,
  "reason": "1-2 sentence explanation of why you scored this way and what the writer could improve",
  "newlyFulfilledPlayer": [],
  "newlyFulfilledAi": []
}

Where newlyFulfilledPlayer and newlyFulfilledAi are arrays of checkpoint numbers (1-indexed) that are NOW fulfilled but were PENDING before.`,
    },
    {
      role: "user",
      content: `STORY SO FAR:\n${storyContext}\n\nLATEST TURN (written by the PLAYER — this is what you are judging):\n${latestTurn.text}`,
    },
  ];

  const { content, cost } = await chatCompletion(config, { messages, json: true, temperature: 0.3 });
  const parsed = JSON.parse(content);

  const score = computeObjectiveScore({
    coherence: clamp(parsed.coherence),
    proseQuality: clamp(parsed.proseQuality),
    adaptation: clamp(parsed.adaptation),
  });

  const playerCheckpoints = state.playerCheckpoints.map((c, i) => ({
    ...c,
    fulfilled: c.fulfilled || (parsed.newlyFulfilledPlayer ?? []).includes(i + 1),
  }));

  const aiCheckpoints = state.aiCheckpoints.map((c, i) => ({
    ...c,
    fulfilled: c.fulfilled || (parsed.newlyFulfilledAi ?? []).includes(i + 1),
  }));

  return { score, reason: parsed.reason ?? "", playerCheckpoints, aiCheckpoints, cost };
};

const judgeSurvivalTurn = async (config: LLMConfig, state: GameState): Promise<JudgeResult> => {
  const latestTurn = state.turns[state.turns.length - 1];
  const previousTurns = state.turns.slice(0, -1);
  const storyContext = previousTurns.map((t) => t.text).join("\n\n");
  const roundNumber = Math.floor(state.turns.length / 2);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a survival judge evaluating whether a player's written response successfully gets them out of a dangerous situation.

ROUND: ${roundNumber + 1}
DIFFICULTY: ${state.difficulty}
${strictnessInstruction(state.difficulty)}

Score each dimension from -1.0 to +1.0 (use one decimal place):
- creativity: How original and inventive is the solution?
- writingQuality: Is the prose compelling, vivid, and well-crafted?
- effectiveness: Does the described action plausibly resolve the danger?

Then determine: does the player SURVIVE this round?

Respond with ONLY valid JSON:
{
  "creativity": 0.0,
  "writingQuality": 0.0,
  "effectiveness": 0.0,
  "survived": true,
  "reason": "1-2 sentence explanation",
  "deathReason": "only if survived is false — a dramatic description of how they died"
}`,
    },
    {
      role: "user",
      content: `WORLD:\n${state.worldDescription}\n\nSTORY SO FAR:\n${storyContext}\n\nLATEST TURN (the player's survival attempt — this is what you are judging):\n${latestTurn.text}`,
    },
  ];

  const { content, cost } = await chatCompletion(config, { messages, json: true, temperature: 0.3 });
  const parsed = JSON.parse(content);

  const survived = parsed.survived !== false;
  const score = computeSurvivalScore({
    creativity: clamp(parsed.creativity),
    writingQuality: clamp(parsed.writingQuality),
    effectiveness: clamp(parsed.effectiveness),
    survived,
  });

  return {
    score,
    reason: parsed.reason ?? "",
    playerCheckpoints: state.playerCheckpoints,
    aiCheckpoints: state.aiCheckpoints,
    survived,
    deathReason: survived ? undefined : (parsed.deathReason ?? parsed.reason ?? ""),
    cost,
  };
};

const judgePlayerTurn = async (config: LLMConfig, state: GameState): Promise<JudgeResult> => {
  if (state.mode === "survival") {
    return judgeSurvivalTurn(config, state);
  }
  return judgeObjectiveTurn(config, state);
};

export type { JudgeResult };
export { judgePlayerTurn };

import type { GameState, TurnScore, Checkpoint, Difficulty } from "../types.js";
import { computeObjectiveScore, computeSurvivalScore } from "../scoring.js";

import type { ChatMessage, ChatClient } from "./client.js";
import { localeInstruction } from "./locale-instruction.js";
import { parseJSON } from "./parse-json.js";

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

const judgeObjectiveTurn = async (client: ChatClient, state: GameState): Promise<JudgeResult> => {
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

Score EACH dimension independently from -1.0 to +1.0 (one decimal place). Use this rubric:
  -1.0 = terrible, completely fails
  -0.5 = poor, major problems
   0.0 = mediocre, neither good nor bad
  +0.5 = good, solid quality
  +1.0 = exceptional, outstanding

Dimensions:
- coherence: Does this follow logically from the story so far? Lazy, nonsensical, or off-topic input = negative.
- proseQuality: Is the writing compelling, vivid, and well-crafted? Minimal-effort or sloppy writing = negative.
- adaptation: How gracefully does it respond to or redirect the story's direction? Ignoring the narrative = negative.

A short, low-effort response (e.g. just a few words) MUST score negative on ALL dimensions.

Also evaluate whether any checkpoints (player OR AI) have been newly fulfilled by the events in the complete story so far.

PLAYER CHECKPOINTS:
${playerCheckpointList}

AI CHECKPOINTS:
${aiCheckpointList}

Respond with ONLY valid JSON matching this schema (replace NUMBER with your computed score):
{
  "coherence": NUMBER,
  "proseQuality": NUMBER,
  "adaptation": NUMBER,
  "reason": "your explanation here",
  "newlyFulfilledPlayer": [],
  "newlyFulfilledAi": []
}

Where newlyFulfilledPlayer and newlyFulfilledAi are arrays of checkpoint numbers (1-indexed) that are NOW fulfilled but were PENDING before.${localeInstruction(state.locale)}`,
    },
    {
      role: "user",
      content: `STORY SO FAR:\n${storyContext}\n\nLATEST TURN (written by the PLAYER — this is what you are judging):\n${latestTurn.text}`,
    },
  ];

  const { content, cost } = await client.complete({ messages, json: true, temperature: 0.3 });
  const parsed = parseJSON(content);

  const score = computeObjectiveScore({
    coherence: clamp(parsed.coherence),
    proseQuality: clamp(parsed.proseQuality),
    adaptation: clamp(parsed.adaptation),
  });

  const fulfilledPlayer = (parsed.newlyFulfilledPlayer ?? []) as number[];
  const fulfilledAi = (parsed.newlyFulfilledAi ?? []) as number[];

  const playerCheckpoints = state.playerCheckpoints.map((c, i) => ({
    ...c,
    fulfilled: c.fulfilled || fulfilledPlayer.includes(i + 1),
  }));

  const aiCheckpoints = state.aiCheckpoints.map((c, i) => ({
    ...c,
    fulfilled: c.fulfilled || fulfilledAi.includes(i + 1),
  }));

  return { score, reason: (parsed.reason as string) ?? "", playerCheckpoints, aiCheckpoints, cost };
};

const judgeSurvivalTurn = async (client: ChatClient, state: GameState): Promise<JudgeResult> => {
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

Score EACH dimension independently from -1.0 to +1.0 (one decimal place). Use this rubric:
  -1.0 = terrible, completely fails
  -0.5 = poor, major problems
   0.0 = mediocre, neither good nor bad
  +0.5 = good, solid quality
  +1.0 = exceptional, outstanding

Dimensions:
- creativity: How original and inventive is the solution? Generic or lazy attempts = negative.
- writingQuality: Is the prose compelling, vivid, and well-crafted? Minimal-effort writing = negative.
- effectiveness: Does the described action plausibly resolve the danger? Giving up or ignoring the danger = negative.

A short, low-effort response (e.g. just a few words) MUST score negative on ALL dimensions.

Then determine: does the player SURVIVE this round?

Respond with ONLY valid JSON matching this schema (replace NUMBER with your computed score):
{
  "creativity": NUMBER,
  "writingQuality": NUMBER,
  "effectiveness": NUMBER,
  "survived": true,
  "reason": "your explanation here",
  "deathReason": "only if survived is false"
}${localeInstruction(state.locale)}`,
    },
    {
      role: "user",
      content: `WORLD:\n${state.worldDescription}\n\nSTORY SO FAR:\n${storyContext}\n\nLATEST TURN (the player's survival attempt — this is what you are judging):\n${latestTurn.text}`,
    },
  ];

  const { content, cost } = await client.complete({ messages, json: true, temperature: 0.3 });
  const parsed = parseJSON(content);

  const survived = parsed.survived !== false;
  const score = computeSurvivalScore({
    creativity: clamp(parsed.creativity),
    writingQuality: clamp(parsed.writingQuality),
    effectiveness: clamp(parsed.effectiveness),
    survived,
  });

  return {
    score,
    reason: (parsed.reason as string) ?? "",
    playerCheckpoints: state.playerCheckpoints,
    aiCheckpoints: state.aiCheckpoints,
    survived,
    deathReason: survived ? undefined : ((parsed.deathReason ?? parsed.reason ?? "") as string),
    cost,
  };
};

const judgePlayerTurn = async (client: ChatClient, state: GameState): Promise<JudgeResult> => {
  if (state.mode === "survival") {
    return judgeSurvivalTurn(client, state);
  }
  return judgeObjectiveTurn(client, state);
};

export type { JudgeResult };
export { judgePlayerTurn };

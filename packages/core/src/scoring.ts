import type { ObjectiveTurnScore, SurvivalTurnScore, Turn } from "./types.js";

const computeObjectiveScore = (score: Omit<ObjectiveTurnScore, "total" | "kind">): ObjectiveTurnScore => {
  return {
    kind: "objective",
    ...score,
    total: score.coherence + score.proseQuality + score.adaptation,
  };
};

const computeSurvivalScore = (score: Omit<SurvivalTurnScore, "total" | "kind">): SurvivalTurnScore => {
  return {
    kind: "survival",
    ...score,
    total: score.creativity + score.writingQuality + score.effectiveness,
  };
};

const aggregateScore = (turns: Turn[]): number => {
  return turns.reduce((sum, t) => {
    if (t.score) {
      sum += t.score.total;
    }
    if (t.aiPenalty) {
      sum -= t.aiPenalty;
    }
    return sum;
  }, 0);
};

const playerCheckpointsFulfilled = (checkpoints: { fulfilled: boolean }[]): number => {
  return checkpoints.filter((c) => c.fulfilled).length;
};

export { computeObjectiveScore, computeSurvivalScore, aggregateScore, playerCheckpointsFulfilled };

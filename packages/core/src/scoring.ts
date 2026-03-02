import type { TurnScore, Turn } from "./types.js";

const computeTotalScore = (score: Omit<TurnScore, "total">): TurnScore => {
  return {
    ...score,
    total: score.coherence + score.proseQuality + score.adaptation,
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

export { computeTotalScore, aggregateScore, playerCheckpointsFulfilled };

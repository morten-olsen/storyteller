import type { TurnScore } from "@storyteller/core";

type Props = {
  score: TurnScore;
  reason?: string;
};

const DIMENSIONS: { key: keyof Omit<TurnScore, "total">; label: string }[] = [
  { key: "coherence", label: "Coherence" },
  { key: "proseQuality", label: "Prose Quality" },
  { key: "adaptation", label: "Adaptation" },
];

const ScoreBar = ({ score, reason }: Props): React.ReactNode => {
  return (
    <div className='score-bar'>
      <h4>Last Turn Score</h4>
      {DIMENSIONS.map(({ key, label }) => {
        const val = score[key];
        return (
          <div key={key} className='score-row'>
            <span className='score-label'>{label}</span>
            <div className='score-track'>
              <div
                className={`score-fill ${val >= 0 ? "positive" : "negative"}`}
                style={{
                  width: `${Math.abs(val) * 50}%`,
                  marginLeft: val < 0 ? undefined : "50%",
                  marginRight: val >= 0 ? undefined : "50%",
                  [val < 0 ? "right" : "left"]: "50%",
                  position: "absolute",
                  [val < 0 ? "right" : "left"]: 0,
                }}
              />
              <div className='score-center' />
            </div>
            <span className={`score-value ${val >= 0 ? "positive" : "negative"}`}>
              {val >= 0 ? "+" : ""}
              {val.toFixed(1)}
            </span>
          </div>
        );
      })}
      <div className='score-total'>
        <span>Total</span>
        <span className={score.total >= 0 ? "positive" : "negative"}>
          {score.total >= 0 ? "+" : ""}
          {score.total.toFixed(1)}
        </span>
      </div>
      {reason && <p className='score-reason'>{reason}</p>}
    </div>
  );
};

export { ScoreBar };

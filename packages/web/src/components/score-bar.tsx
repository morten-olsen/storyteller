import type { TurnScore } from "@storyteller/core";

type Props = {
  score: TurnScore;
  reason?: string;
};

type Dimension = {
  key: string;
  label: string;
  value: number;
};

const getDimensions = (score: TurnScore): Dimension[] => {
  if (score.kind === "survival") {
    return [
      { key: "creativity", label: "Creativity", value: score.creativity },
      { key: "writingQuality", label: "Writing", value: score.writingQuality },
      { key: "effectiveness", label: "Effective", value: score.effectiveness },
    ];
  }
  return [
    { key: "coherence", label: "Coherence", value: score.coherence },
    { key: "proseQuality", label: "Prose Quality", value: score.proseQuality },
    { key: "adaptation", label: "Adaptation", value: score.adaptation },
  ];
};

const ScoreBar = ({ score, reason }: Props): React.ReactNode => {
  const dimensions = getDimensions(score);

  return (
    <div className='score-bar'>
      <h4>Last Turn Score</h4>
      {dimensions.map(({ key, label, value }) => (
        <div key={key} className='score-row'>
          <span className='score-label'>{label}</span>
          <div className='score-track'>
            <div
              className={`score-fill ${value >= 0 ? "positive" : "negative"}`}
              style={{
                width: `${Math.abs(value) * 50}%`,
                marginLeft: value < 0 ? undefined : "50%",
                marginRight: value >= 0 ? undefined : "50%",
                [value < 0 ? "right" : "left"]: "50%",
                position: "absolute",
                [value < 0 ? "right" : "left"]: 0,
              }}
            />
            <div className='score-center' />
          </div>
          <span className={`score-value ${value >= 0 ? "positive" : "negative"}`}>
            {value >= 0 ? "+" : ""}
            {value.toFixed(1)}
          </span>
        </div>
      ))}
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

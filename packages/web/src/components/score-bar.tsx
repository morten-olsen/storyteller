import { useTranslation } from "react-i18next";
import type { TurnScore } from "@storyteller/core";

type Props = {
  score: TurnScore;
  reason?: string;
};

type Dimension = {
  key: string;
  labelKey: string;
  value: number;
};

const getDimensions = (score: TurnScore): Dimension[] => {
  if (score.kind === "survival") {
    return [
      { key: "creativity", labelKey: "scoreBar.creativity", value: score.creativity },
      { key: "writingQuality", labelKey: "scoreBar.writingQuality", value: score.writingQuality },
      { key: "effectiveness", labelKey: "scoreBar.effectiveness", value: score.effectiveness },
    ];
  }
  return [
    { key: "coherence", labelKey: "scoreBar.coherence", value: score.coherence },
    { key: "proseQuality", labelKey: "scoreBar.proseQuality", value: score.proseQuality },
    { key: "adaptation", labelKey: "scoreBar.adaptation", value: score.adaptation },
  ];
};

const ScoreBar = ({ score, reason }: Props): React.ReactNode => {
  const { t } = useTranslation();
  const dimensions = getDimensions(score);

  return (
    <div className='score-bar'>
      <h4>{t("scoreBar.lastTurnScore")}</h4>
      {dimensions.map(({ key, labelKey, value }) => (
        <div key={key} className='score-row'>
          <span className='score-label'>{t(labelKey)}</span>
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
        <span>{t("common.total")}</span>
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

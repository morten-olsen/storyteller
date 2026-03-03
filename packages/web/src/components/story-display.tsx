import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Turn, TurnScore } from "@storyteller/core";

type Props = {
  turns: Turn[];
  streamText: string;
};

const formatScore = (n: number): string => (n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

const TurnScoreInline = ({ score }: { score: TurnScore }): React.ReactNode => {
  const { t } = useTranslation();

  const breakdown =
    score.kind === "survival"
      ? `${t("scoreAbbrev.creativity")} ${formatScore(score.creativity)} · ${t("scoreAbbrev.writingQuality")} ${formatScore(score.writingQuality)} · ${t("scoreAbbrev.effectiveness")} ${formatScore(score.effectiveness)}`
      : `${t("scoreAbbrev.coherence")} ${formatScore(score.coherence)} · ${t("scoreAbbrev.proseQuality")} ${formatScore(score.proseQuality)} · ${t("scoreAbbrev.adaptation")} ${formatScore(score.adaptation)}`;

  return (
    <div className={`turn-score ${score.total >= 0 ? "positive" : "negative"}`}>
      <span className='turn-score-total'>{formatScore(score.total)}</span>
      <span className='turn-score-breakdown'>{breakdown}</span>
      {score.kind === "survival" && !score.survived && (
        <span className='turn-score-death'>{t("storyDisplay.dead")}</span>
      )}
    </div>
  );
};

const StoryDisplay = ({ turns, streamText }: Props): React.ReactNode => {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, streamText]);

  return (
    <div className='story-display'>
      {turns.map((turn) => (
        <div key={turn.index}>
          <div className={`story-turn turn-${turn.author}`}>
            <div className='turn-header'>
              {turn.author === "player" ? t("storyDisplay.you") : t("storyDisplay.narrator")}
            </div>
            <p>{turn.text}</p>
          </div>
          {turn.author === "player" && turn.score && <TurnScoreInline score={turn.score} />}
        </div>
      ))}
      {streamText && (
        <div className='story-turn turn-ai streaming'>
          <div className='turn-header'>{t("storyDisplay.narrator")}</div>
          <p>
            {streamText}
            <span className='cursor' />
          </p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};

export { StoryDisplay };

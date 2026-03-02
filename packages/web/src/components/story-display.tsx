import { useEffect, useRef } from "react";
import type { Turn, TurnScore } from "@storyteller/core";

type Props = {
  turns: Turn[];
  streamText: string;
};

const formatScore = (n: number): string => (n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

const TurnScoreInline = ({ score }: { score: TurnScore }): React.ReactNode => (
  <div className={`turn-score ${score.total >= 0 ? "positive" : "negative"}`}>
    <span className='turn-score-total'>{formatScore(score.total)}</span>
    <span className='turn-score-breakdown'>
      coh {formatScore(score.coherence)} · pro {formatScore(score.proseQuality)} · adp {formatScore(score.adaptation)}
    </span>
  </div>
);

const StoryDisplay = ({ turns, streamText }: Props): React.ReactNode => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, streamText]);

  return (
    <div className='story-display'>
      {turns.map((turn) => (
        <div key={turn.index}>
          <div className={`story-turn turn-${turn.author}`}>
            <div className='turn-header'>{turn.author === "player" ? "You" : "Narrator"}</div>
            <p>{turn.text}</p>
          </div>
          {turn.author === "player" && turn.score && <TurnScoreInline score={turn.score} />}
        </div>
      ))}
      {streamText && (
        <div className='story-turn turn-ai streaming'>
          <div className='turn-header'>Narrator</div>
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

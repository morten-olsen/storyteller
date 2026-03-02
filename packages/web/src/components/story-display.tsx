import { useEffect, useRef } from "react";
import type { Turn } from "@storyteller/core";

type Props = {
  turns: Turn[];
  streamText: string;
};

const StoryDisplay = ({ turns, streamText }: Props): React.ReactNode => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, streamText]);

  return (
    <div className='story-display'>
      {turns.map((turn) => (
        <div key={turn.index} className={`story-turn turn-${turn.author}`}>
          <div className='turn-header'>{turn.author === "player" ? "You" : "Narrator"}</div>
          <p>{turn.text}</p>
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

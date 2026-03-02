import type { GamePhase } from "@storyteller/core";

type Props = {
  phase: GamePhase;
};

const MESSAGES: Partial<Record<GamePhase, string>> = {
  generating: "Crafting the world...",
  scoring: "Judging your prose...",
  ai_turn: "The narrator is writing...",
};

const AiThinking = ({ phase }: Props): React.ReactNode => {
  const message = MESSAGES[phase] ?? "Thinking...";
  return (
    <div className='ai-thinking'>
      <div className='spinner' />
      <span>{message}</span>
    </div>
  );
};

export { AiThinking };

import { useTranslation } from "react-i18next";
import type { GamePhase } from "@storyteller/core";

type Props = {
  phase: GamePhase;
};

const PHASE_KEYS: Partial<Record<GamePhase, string>> = {
  generating: "aiThinking.generating",
  scoring: "aiThinking.scoring",
  ai_turn: "aiThinking.ai_turn",
};

const AiThinking = ({ phase }: Props): React.ReactNode => {
  const { t } = useTranslation();
  const key = PHASE_KEYS[phase] ?? "aiThinking.default";
  return (
    <div className='ai-thinking'>
      <div className='thinking-dots'>
        <span />
        <span />
        <span />
      </div>
      <span>{t(key)}...</span>
    </div>
  );
};

export { AiThinking };

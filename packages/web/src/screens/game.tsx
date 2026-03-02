import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GameState } from "@storyteller/core";

import { StoryDisplay } from "../components/story-display.tsx";
import { TurnInput } from "../components/turn-input.tsx";
import { ScoreBar } from "../components/score-bar.tsx";
import { Checkpoints } from "../components/checkpoints.tsx";
import { AiThinking } from "../components/ai-thinking.tsx";

type Props = {
  game: GameState;
  loading: boolean;
  error: string | null;
  streamText: string;
  onSubmitTurn: (text: string) => void;
  onEndGame: () => void;
  onClearError: () => void;
};

const Game = ({ game, loading, error, streamText, onSubmitTurn, onEndGame, onClearError }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const lastPlayerTurn = [...game.turns].reverse().find((t) => t.author === "player");
  const isWaiting = game.phase === "generating" || game.phase === "scoring" || game.phase === "ai_turn";
  const fulfilled = game.playerCheckpoints.filter((c) => c.fulfilled).length;

  return (
    <div className='screen game-screen'>
      <div className='game-header'>
        <div className='game-header-left'>
          <button className='btn btn-ghost btn-small' onClick={() => navigate("/")}>
            &larr;
          </button>
          <h3>{game.title || game.persona.name}</h3>
          <span className='difficulty-badge'>{game.difficulty}</span>
          {game.isClosingTurn && <span className='closing-badge'>Final</span>}
        </div>
        <div className='game-header-right'>
          <button className={`status-toggle${panelOpen ? " active" : ""}`} onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? "\u25BE" : "\u25B8"} {fulfilled}/{game.playerCheckpoints.length}
          </button>
          <button className='btn btn-ghost btn-small' onClick={onEndGame}>
            End
          </button>
        </div>
      </div>

      {error && (
        <div className='error-bar'>
          <span>{error}</span>
          <button className='btn btn-ghost btn-small' onClick={onClearError}>
            Dismiss
          </button>
        </div>
      )}

      <div className='game-content'>
        <div className={`game-panel${panelOpen ? " open" : ""}`}>
          {lastPlayerTurn?.score && <ScoreBar score={lastPlayerTurn.score} reason={lastPlayerTurn.scoreReason} />}
          <Checkpoints
            playerCheckpoints={game.playerCheckpoints}
            aiCheckpoints={game.aiCheckpoints}
            aiVisibility={game.config.aiVisibility}
          />
        </div>

        <div className='game-main'>
          {game.worldDescription && (
            <div className='world-description'>
              <strong>World:</strong> {game.worldDescription}
            </div>
          )}

          <StoryDisplay turns={game.turns} streamText={streamText} />

          {isWaiting && !streamText && <AiThinking phase={game.phase} />}

          {(game.phase === "player_turn" || game.phase === "closing") && !loading && (
            <TurnInput charLimit={game.config.charLimit} onSubmit={onSubmitTurn} />
          )}
        </div>
      </div>
    </div>
  );
};

export { Game };

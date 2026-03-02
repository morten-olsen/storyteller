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
  const lastPlayerTurn = [...game.turns].reverse().find((t) => t.author === "player");
  const isWaiting = game.phase === "generating" || game.phase === "scoring" || game.phase === "ai_turn";

  return (
    <div className='screen game-screen'>
      <div className='game-header'>
        <div className='game-header-left'>
          <h3>{game.title || game.persona.name}</h3>
          <span className='difficulty-badge'>{game.difficulty}</span>
          {game.isClosingTurn && <span className='closing-badge'>Final Turn</span>}
        </div>
        <button className='btn btn-ghost' onClick={onEndGame}>
          End Game
        </button>
      </div>

      {error && (
        <div className='error-bar'>
          <span>{error}</span>
          <button className='btn btn-ghost' onClick={onClearError}>
            Dismiss
          </button>
        </div>
      )}

      <div className='game-body'>
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

        <div className='game-sidebar'>
          {lastPlayerTurn?.score && <ScoreBar score={lastPlayerTurn.score} reason={lastPlayerTurn.scoreReason} />}
          <Checkpoints
            playerCheckpoints={game.playerCheckpoints}
            aiCheckpoints={game.aiCheckpoints}
            aiVisibility={game.config.aiVisibility}
          />
        </div>
      </div>
    </div>
  );
};

export { Game };

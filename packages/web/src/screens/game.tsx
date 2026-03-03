import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { GameState } from "@storyteller/core";
import { aggregateScore } from "@storyteller/core";

import { StoryDisplay } from "../components/story-display.tsx";
import { TurnInput } from "../components/turn-input.tsx";
import { ScoreBar } from "../components/score-bar.tsx";
import { Checkpoints } from "../components/checkpoints.tsx";
import { AiThinking } from "../components/ai-thinking.tsx";
import { TutorialOverlay } from "../components/tutorial-overlay.tsx";

type Props = {
  game: GameState;
  loading: boolean;
  error: string | null;
  streamText: string;
  tutorialEnabled: boolean;
  draftText: string | null;
  draftLoading: boolean;
  onSubmitTurn: (text: string) => void;
  onEndGame: () => void;
  onClearError: () => void;
  onGenerateDraft: () => void;
};

const SurvivalStatus = ({ game }: { game: GameState }): React.ReactNode => {
  const totalScore = aggregateScore(game.turns);
  const roundNumber = Math.floor(game.turns.length / 2);
  return (
    <div className='survival-status'>
      <h4>Survival</h4>
      <div className='survival-stats'>
        <span>Round {roundNumber + 1}</span>
        <span className={totalScore >= 0 ? "positive" : "negative"}>
          Score: {totalScore >= 0 ? "+" : ""}
          {totalScore.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

const MissionBriefing = ({ game }: { game: GameState }): React.ReactNode => (
  <div className='mission-briefing'>
    {game.worldDescription && (
      <div className='mission-world'>
        <h4>{game.mode === "survival" ? "Situation" : "World"}</h4>
        <p>{game.worldDescription}</p>
      </div>
    )}
    {game.mode === "objective" && (
      <Checkpoints
        playerCheckpoints={game.playerCheckpoints}
        aiCheckpoints={game.aiCheckpoints}
        aiVisibility={game.config.aiVisibility}
      />
    )}
  </div>
);

const Game = ({
  game,
  loading,
  error,
  streamText,
  tutorialEnabled,
  draftText,
  draftLoading,
  onSubmitTurn,
  onEndGame,
  onClearError,
  onGenerateDraft,
}: Props): React.ReactNode => {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(tutorialEnabled);
  const draftTriggeredRef = useRef(false);
  const lastPlayerTurn = [...game.turns].reverse().find((t) => t.author === "player");
  const isWaiting = game.phase === "generating" || game.phase === "scoring" || game.phase === "ai_turn";
  const hasTurns = game.turns.length > 0;
  const isSurvival = game.mode === "survival";

  const handleTutorialComplete = (): void => {
    setTutorialActive(false);
    onGenerateDraft();
  };

  // When tutorial is off, trigger draft immediately at first player_turn
  useEffect(() => {
    if (!tutorialActive && game.phase === "player_turn" && !hasTurns && !draftTriggeredRef.current) {
      draftTriggeredRef.current = true;
      onGenerateDraft();
    }
  }, [tutorialActive, game.phase, hasTurns, onGenerateDraft]);

  return (
    <div className='screen game-screen'>
      <div className='game-header'>
        <div className='game-header-left'>
          <button className='btn btn-ghost btn-small' onClick={() => navigate("/")}>
            &larr;
          </button>
          <h3>{game.title || game.persona.name}</h3>
          <span className='difficulty-badge'>{game.difficulty}</span>
          {isSurvival && <span className='closing-badge'>Survival</span>}
          {!isSurvival && game.isClosingTurn && <span className='closing-badge'>Final</span>}
        </div>
        <div className='game-header-right'>
          <button className={`status-toggle${panelOpen ? " active" : ""}`} onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? "\u25BE" : "\u25B8"} {isSurvival ? "Score" : "Status"}
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
          {isSurvival ? (
            <SurvivalStatus game={game} />
          ) : (
            <Checkpoints
              playerCheckpoints={game.playerCheckpoints}
              aiCheckpoints={game.aiCheckpoints}
              aiVisibility={game.config.aiVisibility}
            />
          )}
          {hasTurns && game.worldDescription && (
            <details className='panel-world'>
              <summary>{isSurvival ? "Situation" : "World"}</summary>
              <p>{game.worldDescription}</p>
            </details>
          )}
        </div>

        <div className='game-main'>
          {!hasTurns ? (
            <>
              <MissionBriefing game={game} />
              {isWaiting && !streamText && <AiThinking phase={game.phase} />}
              {(game.phase === "player_turn" || game.phase === "closing") && !loading && (
                <TurnInput
                  charLimit={game.config.charLimit}
                  onSubmit={onSubmitTurn}
                  draftText={draftText}
                  draftLoading={draftLoading}
                />
              )}
            </>
          ) : (
            <>
              <StoryDisplay turns={game.turns} streamText={streamText} />
              {isWaiting && !streamText && <AiThinking phase={game.phase} />}
              {(game.phase === "player_turn" || game.phase === "closing") && !loading && (
                <TurnInput charLimit={game.config.charLimit} onSubmit={onSubmitTurn} />
              )}
            </>
          )}
          {tutorialActive && game.phase === "player_turn" && !hasTurns && (
            <TutorialOverlay mode={game.mode} onComplete={handleTutorialComplete} />
          )}
        </div>
      </div>
    </div>
  );
};

export { Game };

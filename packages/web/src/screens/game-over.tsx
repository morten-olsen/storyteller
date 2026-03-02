import { useNavigate } from "react-router-dom";
import type { GameState } from "@storyteller/core";
import { aggregateScore, playerCheckpointsFulfilled } from "@storyteller/core";

type Props = {
  game: GameState;
};

const GameOver = ({ game }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const totalScore = aggregateScore(game.turns);
  const playerFulfilled = playerCheckpointsFulfilled(game.playerCheckpoints);
  const aiFulfilled = playerCheckpointsFulfilled(game.aiCheckpoints);
  const playerWon = playerFulfilled >= aiFulfilled;

  return (
    <div className='screen gameover'>
      {game.title && <h3 className='gameover-title'>{game.title}</h3>}
      <h2>{playerWon ? "Victory" : "Defeat"}</h2>
      <p className='gameover-subtitle'>
        {playerWon ? "Your narrative prevailed." : "The AI steered the story to its ends."}
      </p>

      <div className='gameover-stats'>
        <div className='stat'>
          <span className='stat-label'>Total Score</span>
          <span className={`stat-value ${totalScore >= 0 ? "positive" : "negative"}`}>
            {totalScore >= 0 ? "+" : ""}
            {totalScore.toFixed(1)}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>Turns</span>
          <span className='stat-value'>{game.turns.length}</span>
        </div>
        <div className='stat'>
          <span className='stat-label'>Your Checkpoints</span>
          <span className='stat-value'>
            {playerFulfilled}/{game.playerCheckpoints.length}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>AI Checkpoints</span>
          <span className='stat-value'>
            {aiFulfilled}/{game.aiCheckpoints.length}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>Cost</span>
          <span className='stat-value'>${(game.totalCost ?? 0).toFixed(4)}</span>
        </div>
      </div>

      <div className='gameover-checkpoints'>
        <h3>Your Objectives</h3>
        {game.playerCheckpoints.map((c) => (
          <div key={c.id} className={`checkpoint ${c.fulfilled ? "fulfilled" : "unfulfilled"}`}>
            <span className='checkpoint-icon'>{c.fulfilled ? "\u2713" : "\u2717"}</span>
            {c.description}
          </div>
        ))}
        <h3>AI Objectives</h3>
        {game.aiCheckpoints.map((c) => (
          <div key={c.id} className={`checkpoint ${c.fulfilled ? "fulfilled" : "unfulfilled"}`}>
            <span className='checkpoint-icon'>{c.fulfilled ? "\u2713" : "\u2717"}</span>
            {c.description}
          </div>
        ))}
      </div>

      <div className='gameover-actions'>
        <button className='btn btn-primary' onClick={() => navigate("/setup")}>
          Play Again
        </button>
        <button className='btn btn-secondary' onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </div>
  );
};

export { GameOver };

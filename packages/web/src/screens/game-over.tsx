import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GameState } from "@storyteller/core";
import { aggregateScore, playerCheckpointsFulfilled } from "@storyteller/core";

type Props = {
  game: GameState;
};

const ObjectiveGameOver = ({ game }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const totalScore = aggregateScore(game.turns);
  const playerFulfilled = playerCheckpointsFulfilled(game.playerCheckpoints);
  const aiFulfilled = playerCheckpointsFulfilled(game.aiCheckpoints);
  const playerWon = playerFulfilled >= aiFulfilled;

  return (
    <div className='screen gameover'>
      {game.title && <p className='gameover-title'>{game.title}</p>}
      <h2 className={playerWon ? "victory" : "defeat"}>{playerWon ? t("gameOver.victory") : t("gameOver.defeat")}</h2>
      <p className='gameover-subtitle'>{playerWon ? t("gameOver.victorySubtitle") : t("gameOver.defeatSubtitle")}</p>

      <div className='gameover-stats'>
        <div className='stat'>
          <span className='stat-label'>{t("common.score")}</span>
          <span className={`stat-value ${totalScore >= 0 ? "positive" : "negative"}`}>
            {totalScore >= 0 ? "+" : ""}
            {totalScore.toFixed(1)}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("common.turns")}</span>
          <span className='stat-value'>{game.turns.length}</span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("gameOver.you")}</span>
          <span className='stat-value'>
            {playerFulfilled}/{game.playerCheckpoints.length}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("gameOver.ai")}</span>
          <span className='stat-value'>
            {aiFulfilled}/{game.aiCheckpoints.length}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("common.cost")}</span>
          <span className='stat-value'>${(game.totalCost ?? 0).toFixed(4)}</span>
        </div>
      </div>

      <div className='gameover-checkpoints'>
        <h3>{t("gameOver.yourObjectives")}</h3>
        {game.playerCheckpoints.map((c) => (
          <div key={c.id} className={`checkpoint ${c.fulfilled ? "fulfilled" : "unfulfilled"}`}>
            <span className='checkpoint-icon'>{c.fulfilled ? "\u2713" : "\u2717"}</span>
            {c.description}
          </div>
        ))}
        <h3>{t("gameOver.aiObjectives")}</h3>
        {game.aiCheckpoints.map((c) => (
          <div key={c.id} className={`checkpoint ${c.fulfilled ? "fulfilled" : "unfulfilled"}`}>
            <span className='checkpoint-icon'>{c.fulfilled ? "\u2713" : "\u2717"}</span>
            {c.description}
          </div>
        ))}
      </div>

      <div className='gameover-actions'>
        <button className='btn btn-primary' onClick={() => navigate("/setup")}>
          {t("gameOver.playAgain")}
        </button>
        <button className='btn btn-secondary' onClick={() => navigate("/")}>
          {t("gameOver.home")}
        </button>
      </div>
    </div>
  );
};

const SurvivalGameOver = ({ game }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const totalScore = aggregateScore(game.turns);
  const roundsSurvived = Math.floor(game.turns.filter((t) => t.author === "player").length - 1);

  return (
    <div className='screen gameover gameover-survival'>
      {game.title && <p className='gameover-title'>{game.title}</p>}
      <h2 className='death'>{t("gameOver.youDied")}</h2>
      {game.deathReason && <p className='gameover-subtitle death-reason'>{game.deathReason}</p>}

      <div className='gameover-stats'>
        <div className='stat'>
          <span className='stat-label'>{t("common.score")}</span>
          <span className={`stat-value ${totalScore >= 0 ? "positive" : "negative"}`}>
            {totalScore >= 0 ? "+" : ""}
            {totalScore.toFixed(1)}
          </span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("gameOver.rounds")}</span>
          <span className='stat-value'>{Math.max(0, roundsSurvived)}</span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("common.turns")}</span>
          <span className='stat-value'>{game.turns.length}</span>
        </div>
        <div className='stat'>
          <span className='stat-label'>{t("common.cost")}</span>
          <span className='stat-value'>${(game.totalCost ?? 0).toFixed(4)}</span>
        </div>
      </div>

      <div className='gameover-actions'>
        <button className='btn btn-primary' onClick={() => navigate("/setup")}>
          {t("gameOver.tryAgain")}
        </button>
        <button className='btn btn-secondary' onClick={() => navigate("/")}>
          {t("gameOver.home")}
        </button>
      </div>
    </div>
  );
};

const GameOver = ({ game }: Props): React.ReactNode => {
  if (game.mode === "survival") {
    return <SurvivalGameOver game={game} />;
  }
  return <ObjectiveGameOver game={game} />;
};

export { GameOver };

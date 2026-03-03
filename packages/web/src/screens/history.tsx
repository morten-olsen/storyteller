import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GameSummary } from "@storyteller/core";

import { idbStorage } from "../storage.ts";

type Props = {
  onResume: (id: string) => void;
};

const History = ({ onResume }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [games, setGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    idbStorage.listGames().then(setGames);
  }, []);

  const handleDelete = async (id: string) => {
    await idbStorage.deleteGame(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  const resultLabel = (g: GameSummary): string => {
    const inProgress = g.phase !== "game_over";
    if (inProgress) {
      return t("history.inProgress");
    }
    if (g.mode === "survival") {
      return t("history.died");
    }
    return g.playerWon ? t("history.won") : t("history.lost");
  };

  return (
    <div className='screen history'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; {t("common.back")}
      </button>
      <h2>{t("history.heading")}</h2>

      {games.length === 0 ? (
        <p className='empty-state'>{t("history.empty")}</p>
      ) : (
        <div className='history-list'>
          {games.map((g) => {
            const inProgress = g.phase !== "game_over";
            return (
              <div key={g.id} className={`history-card${inProgress ? " in-progress" : ""}`}>
                <div className='history-card-header'>
                  <span className={`result ${inProgress ? "active" : g.playerWon ? "won" : "lost"}`}>
                    {resultLabel(g)}
                  </span>
                  <span className='history-date'>{new Date(g.date).toLocaleDateString()}</span>
                </div>
                <div className='history-card-body'>
                  {g.title && <span className='history-title'>{g.title}</span>}
                  <span className='history-meta'>
                    {g.difficulty} &middot; {g.persona}
                  </span>
                  <span className='history-prompt'>{g.worldPrompt || t("history.randomWorld")}</span>
                </div>
                <div className='history-card-footer'>
                  <span className={`score ${g.totalScore >= 0 ? "positive" : "negative"}`}>
                    {t("common.score")}: {g.totalScore >= 0 ? "+" : ""}
                    {g.totalScore.toFixed(1)}
                  </span>
                  <span>${(g.totalCost ?? 0).toFixed(4)}</span>
                  <span>{t("history.turns", { count: g.turnCount })}</span>
                  {inProgress ? (
                    <button className='btn btn-secondary btn-small' onClick={() => onResume(g.id)}>
                      {t("history.resume")}
                    </button>
                  ) : (
                    <button className='btn btn-ghost btn-small' onClick={() => onResume(g.id)}>
                      {t("history.view")}
                    </button>
                  )}
                  <button className='btn btn-ghost btn-small' onClick={() => handleDelete(g.id)}>
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { History };

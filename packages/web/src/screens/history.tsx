import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { GameSummary } from "@storyteller/core";

import { idbStorage } from "../storage.ts";

type Props = {
  onResume: (id: string) => void;
};

const History = ({ onResume }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    idbStorage.listGames().then(setGames);
  }, []);

  const handleDelete = async (id: string) => {
    await idbStorage.deleteGame(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className='screen history'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; Back
      </button>
      <h2>Past Games</h2>

      {games.length === 0 ? (
        <p className='empty-state'>No games yet. Start one!</p>
      ) : (
        <div className='history-list'>
          {games.map((g) => {
            const inProgress = g.phase !== "game_over";
            return (
              <div key={g.id} className={`history-card${inProgress ? " in-progress" : ""}`}>
                <div className='history-card-header'>
                  <span className={`result ${inProgress ? "active" : g.playerWon ? "won" : "lost"}`}>
                    {inProgress ? "In Progress" : g.playerWon ? "Won" : "Lost"}
                  </span>
                  <span className='history-date'>{new Date(g.date).toLocaleDateString()}</span>
                </div>
                <div className='history-card-body'>
                  {g.title && <span className='history-title'>{g.title}</span>}
                  <span className='history-meta'>
                    {g.difficulty} &middot; {g.persona}
                  </span>
                  <span className='history-prompt'>{g.worldPrompt || "Random world"}</span>
                </div>
                <div className='history-card-footer'>
                  <span className={`score ${g.totalScore >= 0 ? "positive" : "negative"}`}>
                    Score: {g.totalScore >= 0 ? "+" : ""}
                    {g.totalScore.toFixed(1)}
                  </span>
                  <span>${(g.totalCost ?? 0).toFixed(4)}</span>
                  <span>{g.turnCount} turns</span>
                  {inProgress ? (
                    <button className='btn btn-secondary btn-small' onClick={() => onResume(g.id)}>
                      Resume
                    </button>
                  ) : (
                    <button className='btn btn-ghost btn-small' onClick={() => onResume(g.id)}>
                      View
                    </button>
                  )}
                  <button className='btn btn-ghost btn-small' onClick={() => handleDelete(g.id)}>
                    Delete
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

import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { useLLM } from "./hooks/use-llm.ts";
import { useGame } from "./hooks/use-game.ts";
import { Welcome } from "./screens/welcome.tsx";
import { Setup } from "./screens/setup.tsx";
import { Game } from "./screens/game.tsx";
import { GameOver } from "./screens/game-over.tsx";
import { History } from "./screens/history.tsx";
import { Settings } from "./components/settings.tsx";

const AppRoutes = (): React.ReactNode => {
  const navigate = useNavigate();
  const { config, setConfig, isConfigured, loaded } = useLLM();
  const {
    game,
    loading,
    error,
    clearError,
    streamText,
    activeGameId,
    activeGameTitle,
    tutorialEnabled,
    draftText,
    draftLoading,
    startGame,
    submitTurn,
    endGame,
    resumeGame,
    generateDraft,
  } = useGame(config, navigate);

  if (!loaded) {
    return null;
  }

  return (
    <Routes>
      <Route
        path='/'
        element={
          <Welcome
            isConfigured={isConfigured}
            activeGameId={activeGameId}
            activeGameTitle={activeGameTitle}
            onResume={resumeGame}
          />
        }
      />
      <Route path='/setup' element={<Setup onStart={startGame} />} />
      <Route
        path='/game'
        element={
          game ? (
            <Game
              game={game}
              loading={loading}
              error={error}
              streamText={streamText}
              tutorialEnabled={tutorialEnabled}
              draftText={draftText}
              draftLoading={draftLoading}
              onSubmitTurn={submitTurn}
              onEndGame={endGame}
              onClearError={clearError}
              onGenerateDraft={generateDraft}
            />
          ) : (
            <Navigate to='/' replace />
          )
        }
      />
      <Route path='/game-over' element={game ? <GameOver game={game} /> : <Navigate to='/' replace />} />
      <Route path='/history' element={<History onResume={resumeGame} />} />
      <Route path='/settings' element={<Settings config={config} onSave={setConfig} />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
};

const App = (): React.ReactNode => (
  <HashRouter>
    <AppRoutes />
  </HashRouter>
);

export { App };

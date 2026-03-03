import { useState, useCallback, useRef, useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";
import i18next from "i18next";
import type {
  GameState,
  GameMode,
  Difficulty,
  AiPersona,
  NarrationStyle,
  LLMConfig,
  Locale,
  StreamCompletionResult,
} from "@storyteller/core";
import {
  getDifficultyConfig,
  createGame,
  applySetupResult,
  submitPlayerTurn,
  applyScore,
  applyAiTurn,
  buildSummary,
  generateSetup,
  judgePlayerTurn,
  streamAiTurn,
  generateDraftTurn,
} from "@storyteller/core";

import { idbStorage } from "../storage.ts";

const SAVEABLE_PHASES = new Set(["player_turn", "ai_turn", "scoring", "closing", "game_over"]);

const useGame = (llmConfig: LLMConfig, navigate: NavigateFunction) => {
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGameTitle, setActiveGameTitle] = useState<string | null>(null);
  const [tutorialEnabled, setTutorialEnabled] = useState(false);
  const [draftText, setDraftText] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const abortRef = useRef(false);

  // Check for in-progress game on mount
  useEffect(() => {
    idbStorage.listGames().then((summaries) => {
      const inProgress = summaries.find((s) => s.phase !== "game_over");
      setActiveGameId(inProgress?.id ?? null);
      setActiveGameTitle(inProgress?.title ?? null);
    });
  }, []);

  // Auto-save whenever game state changes and phase is worth saving
  useEffect(() => {
    if (!game || !SAVEABLE_PHASES.has(game.phase)) {
      return;
    }
    const summary = buildSummary(game);
    idbStorage.saveGame({ summary, state: game });

    if (game.phase === "game_over") {
      setActiveGameId(null);
      setActiveGameTitle(null);
    } else {
      setActiveGameId(game.id);
      setActiveGameTitle(game.title);
    }
  }, [game]);

  const clearError = useCallback(() => setError(null), []);

  const startGame = useCallback(
    async (
      mode: GameMode,
      difficulty: Difficulty,
      persona: AiPersona,
      worldPrompt: string,
      tutorial: boolean,
      narrationStyle: NarrationStyle = "casual",
    ) => {
      setError(null);
      setTutorialEnabled(tutorial);
      setDraftText(null);
      setDraftLoading(false);
      const id = crypto.randomUUID();
      const config = getDifficultyConfig(difficulty);
      const locale = (i18next.language === "da" ? "da" : "en") as Locale;
      const state = createGame(id, mode, difficulty, config, persona, worldPrompt, locale, narrationStyle);
      setGame(state);
      navigate("/game");
      setLoading(true);

      try {
        const result = await generateSetup(llmConfig, mode, config, worldPrompt, locale, narrationStyle);
        setGame((prev) =>
          prev
            ? applySetupResult(
                prev,
                result.worldDescription,
                result.playerCheckpoints,
                result.aiCheckpoints,
                result.title,
                result.cost,
              )
            : prev,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Setup generation failed");
      } finally {
        setLoading(false);
      }
    },
    [llmConfig, navigate],
  );

  const submitTurn = useCallback(
    async (text: string) => {
      if (!game) {
        return;
      }
      setError(null);

      let state = submitPlayerTurn(game, text);
      setGame(state);
      setLoading(true);

      try {
        const judgeResult = await judgePlayerTurn(llmConfig, state);

        // For survival mode death: use deathReason from judge as the score reason
        const scoreReason =
          state.mode === "survival" && judgeResult.deathReason ? judgeResult.deathReason : judgeResult.reason;

        state = applyScore(
          state,
          judgeResult.score,
          judgeResult.playerCheckpoints,
          judgeResult.aiCheckpoints,
          scoreReason,
          judgeResult.cost,
        );
        setGame(state);

        if (state.phase === "game_over") {
          navigate("/game-over");
          setLoading(false);
          return;
        }

        setStreamText("");
        abortRef.current = false;

        let capturedText = "";
        const streamResult = await new Promise<StreamCompletionResult>((resolve, reject) => {
          streamAiTurn(llmConfig, state, {
            onToken(token: string) {
              if (abortRef.current) {
                return;
              }
              setStreamText((prev) => prev + token);
            },
            onDone(full: string) {
              capturedText = full;
            },
            onError(err: Error) {
              reject(err);
            },
          }).then(resolve, reject);
        });

        const nextState = applyAiTurn(state, capturedText, streamResult.cost);
        setGame(nextState);
        setStreamText("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Turn processing failed");
      } finally {
        setLoading(false);
      }
    },
    [game, llmConfig, navigate],
  );

  const endGame = useCallback(() => {
    if (!game) {
      return;
    }
    navigate("/game-over");
  }, [game, navigate]);

  const generateDraft = useCallback(async () => {
    if (!game || draftLoading) {
      return;
    }
    setDraftLoading(true);
    try {
      const result = await generateDraftTurn(llmConfig, game);
      setDraftText(result.text);
      setGame((prev) => (prev ? { ...prev, totalCost: prev.totalCost + result.cost } : prev));
    } catch {
      // Draft is non-critical — silently fail
    } finally {
      setDraftLoading(false);
    }
  }, [game, draftLoading, llmConfig]);

  const resumeGame = useCallback(
    async (id: string) => {
      const saved = await idbStorage.loadGame(id);
      if (!saved) {
        return;
      }
      setGame(saved.state);
      navigate(saved.state.phase === "game_over" ? "/game-over" : "/game");
    },
    [navigate],
  );

  return {
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
  };
};

export { useGame };

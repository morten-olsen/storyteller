import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Difficulty, GameMode, AiPersona } from "@storyteller/core";
import { PERSONAS, getDifficultyConfig, getRandomPersona } from "@storyteller/core";

type Props = {
  onStart: (
    mode: GameMode,
    difficulty: Difficulty,
    persona: AiPersona,
    worldPrompt: string,
    tutorialEnabled: boolean,
  ) => void;
};

const MODES: GameMode[] = ["objective", "survival"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const Setup = ({ onStart }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameMode>("objective");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [personaId, setPersonaId] = useState("random");
  const [worldPrompt, setWorldPrompt] = useState("");
  const [tutorialEnabled, setTutorialEnabled] = useState(false);

  const config = getDifficultyConfig(difficulty);

  const handleStart = () => {
    const persona = personaId === "random" ? getRandomPersona() : PERSONAS.find((p) => p.id === personaId);
    if (!persona) {
      return;
    }
    onStart(mode, difficulty, persona, worldPrompt, tutorialEnabled);
  };

  const judgeLevel =
    difficulty === "easy"
      ? t("setup.judgeLenient")
      : difficulty === "medium"
        ? t("setup.judgeFair")
        : t("setup.judgeRuthless");

  return (
    <div className='screen setup'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; {t("common.back")}
      </button>
      <h2>{t("setup.heading")}</h2>

      <div className='setup-section'>
        <label>{t("setup.mode")}</label>
        <div className='mode-picker'>
          {MODES.map((m) => (
            <button
              key={m}
              className={`btn ${mode === m ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode(m)}
            >
              {t(`setup.${m}`)}
            </button>
          ))}
        </div>
        <div className='difficulty-info'>
          <span>{mode === "objective" ? t("setup.objectiveDesc") : t("setup.survivalDesc")}</span>
        </div>
      </div>

      <div className='setup-section'>
        <label>{t("setup.difficulty")}</label>
        <div className='difficulty-picker'>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`btn ${difficulty === d ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setDifficulty(d)}
            >
              {t(`setup.${d}`)}
            </button>
          ))}
        </div>
        <div className='difficulty-info'>
          <span>{t("setup.charLimit", { limit: config.charLimit })}</span>
          {mode === "objective" && (
            <>
              <span>{t("setup.checkpoints", { count: config.checkpointCount.player })}</span>
              <span>{t("setup.aiVisibility", { visibility: config.aiVisibility })}</span>
            </>
          )}
          {mode === "survival" && <span>{t("setup.judge", { level: judgeLevel })}</span>}
        </div>
      </div>

      <div className='setup-section'>
        <label>{t("setup.persona")}</label>
        <div className='persona-picker'>
          <button
            className={`btn ${personaId === "random" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPersonaId("random")}
          >
            {t("setup.random")}
          </button>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              className={`btn ${personaId === p.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setPersonaId(p.id)}
            >
              {t(`personas.${p.id}.name`)}
            </button>
          ))}
        </div>
        {personaId !== "random" && <p className='persona-desc'>{t(`personas.${personaId}.description`)}</p>}
      </div>

      <div className='setup-section'>
        <label>
          {t("setup.worldPrompt")} <span className='optional'>{t("setup.optional")}</span>
        </label>
        <textarea
          className='world-input'
          placeholder={mode === "survival" ? t("setup.worldPlaceholderSurvival") : t("setup.worldPlaceholderObjective")}
          value={worldPrompt}
          onChange={(e) => setWorldPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <div className='setup-section'>
        <label>{t("setup.tutorial")}</label>
        <div className='tutorial-picker'>
          <button
            className={`btn ${tutorialEnabled ? "btn-secondary" : "btn-primary"}`}
            onClick={() => setTutorialEnabled(false)}
          >
            {t("setup.off")}
          </button>
          <button
            className={`btn ${tutorialEnabled ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTutorialEnabled(true)}
          >
            {t("setup.on")}
          </button>
        </div>
      </div>

      <button className='btn btn-primary btn-large' onClick={handleStart}>
        {mode === "survival" ? t("setup.enterDanger") : t("setup.beginStory")}
      </button>
    </div>
  );
};

export { Setup };

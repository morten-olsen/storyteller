import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Difficulty, AiPersona } from "@storyteller/core";
import { PERSONAS, getDifficultyConfig, getRandomPersona } from "@storyteller/core";

type Props = {
  onStart: (difficulty: Difficulty, persona: AiPersona, worldPrompt: string) => void;
};

const Setup = ({ onStart }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [personaId, setPersonaId] = useState("random");
  const [worldPrompt, setWorldPrompt] = useState("");

  const config = getDifficultyConfig(difficulty);

  const handleStart = () => {
    const persona = personaId === "random" ? getRandomPersona() : PERSONAS.find((p) => p.id === personaId);
    if (!persona) {
      return;
    }
    onStart(difficulty, persona, worldPrompt);
  };

  return (
    <div className='screen setup'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; Back
      </button>
      <h2>New Game</h2>

      <div className='setup-section'>
        <label>Difficulty</label>
        <div className='difficulty-picker'>
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`btn ${difficulty === d ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className='difficulty-info'>
          <span>Character limit: {config.charLimit}</span>
          <span>Checkpoints: {config.checkpointCount.player}</span>
          <span>AI visibility: {config.aiVisibility}</span>
        </div>
      </div>

      <div className='setup-section'>
        <label>AI Persona</label>
        <div className='persona-picker'>
          <button
            className={`btn ${personaId === "random" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPersonaId("random")}
          >
            Random
          </button>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              className={`btn ${personaId === p.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setPersonaId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        {personaId !== "random" && (
          <p className='persona-desc'>{PERSONAS.find((p) => p.id === personaId)?.description}</p>
        )}
      </div>

      <div className='setup-section'>
        <label>
          World Prompt <span className='optional'>(optional)</span>
        </label>
        <textarea
          className='world-input'
          placeholder='Describe a setting, theme, or leave blank for a surprise...'
          value={worldPrompt}
          onChange={(e) => setWorldPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <button className='btn btn-primary btn-large' onClick={handleStart}>
        Begin Story
      </button>
    </div>
  );
};

export { Setup };

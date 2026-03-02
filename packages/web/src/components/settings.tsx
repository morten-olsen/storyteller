import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { LLMConfig } from "@storyteller/core";

type Props = {
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
};

const Settings = ({ config, onSave }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [model, setModel] = useState(config.model);

  useEffect(() => {
    setApiKey(config.apiKey);
    setBaseUrl(config.baseUrl);
    setModel(config.model);
  }, [config]);

  const handleSave = () => {
    onSave({ apiKey, baseUrl, model });
    navigate("/");
  };

  return (
    <div className='screen settings'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; Back
      </button>
      <h2>Settings</h2>

      <div className='settings-form'>
        <div className='field'>
          <label>API Key</label>
          <input
            type='password'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder='sk-or-v1-...'
          />
        </div>

        <div className='field'>
          <label>Base URL</label>
          <input
            type='url'
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder='https://openrouter.ai/api/v1'
          />
        </div>

        <div className='field'>
          <label>Model</label>
          <input
            type='text'
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder='google/gemini-2.0-flash-001'
          />
        </div>

        <button className='btn btn-primary' onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export { Settings };

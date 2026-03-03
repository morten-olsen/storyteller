import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LLMConfig, Locale } from "@storyteller/core";

import { saveLocale } from "../storage.ts";

type Props = {
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
};

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "da", label: "Dansk" },
];

const Settings = ({ config, onSave }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [model, setModel] = useState(config.model);

  useEffect(() => {
    setApiKey(config.apiKey);
    setBaseUrl(config.baseUrl);
    setModel(config.model);
  }, [config]);

  const handleLanguageChange = async (locale: Locale): Promise<void> => {
    await i18n.changeLanguage(locale);
    await saveLocale(locale);
  };

  const handleSave = () => {
    onSave({ apiKey, baseUrl, model });
    navigate("/");
  };

  return (
    <div className='screen settings'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; {t("common.back")}
      </button>
      <h2>{t("settings.heading")}</h2>

      <div className='settings-form'>
        <div className='field'>
          <label>{t("settings.language")}</label>
          <div className='language-picker'>
            {LOCALES.map((loc) => (
              <button
                key={loc.value}
                className={`btn ${i18n.language === loc.value ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleLanguageChange(loc.value)}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <div className='field'>
          <label>{t("settings.apiKey")}</label>
          <input
            type='password'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder='sk-or-v1-...'
          />
        </div>

        <div className='field'>
          <label>{t("settings.baseUrl")}</label>
          <input
            type='url'
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder='https://openrouter.ai/api/v1'
          />
        </div>

        <div className='field'>
          <label>{t("settings.model")}</label>
          <input
            type='text'
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder='google/gemini-2.0-flash-001'
          />
        </div>

        <button className='btn btn-primary' onClick={handleSave}>
          {t("common.save")}
        </button>
      </div>
    </div>
  );
};

export { Settings };

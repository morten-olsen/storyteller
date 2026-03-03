import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { LLMSettings } from "@storyteller/core";

type Props = {
  onComplete: (settings: LLMSettings) => void;
  onBack: () => void;
};

const OnboardingRemote = ({ onComplete, onBack }: Props): React.ReactNode => {
  const { t } = useTranslation();

  const [name, setName] = useState("OpenRouter");
  const [baseUrl, setBaseUrl] = useState("https://openrouter.ai/api/v1");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [manualModelInput, setManualModelInput] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchModels = async (): Promise<void> => {
    setFetchError(null);
    try {
      const url = baseUrl.replace(/\/+$/, "") + "/models";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data?: { id: string }[] };
      const ids = (json.data ?? []).map((m) => m.id);
      if (ids.length === 0) {
        throw new Error("No models returned");
      }
      setModels(ids);
    } catch {
      setFetchError(t("settings.fetchFailed"));
    }
  };

  const addManualModel = (): void => {
    const id = manualModelInput.trim();
    if (!id || models.includes(id)) {
      return;
    }
    setModels((prev) => [...prev, id]);
    setManualModelInput("");
  };

  const canFinish = apiKey.trim().length > 0 && selectedModel !== null;

  const handleFinish = (): void => {
    if (!canFinish || !selectedModel) {
      return;
    }
    const providerId = crypto.randomUUID();
    onComplete({
      remoteProviders: [
        {
          id: providerId,
          name: name || "Remote API",
          baseUrl,
          apiKey,
          models,
        },
      ],
      activeModel: { kind: "remote", providerId, model: selectedModel },
    });
  };

  return (
    <div className='onboarding-step'>
      <h2 className='onboarding-heading'>{t("onboarding.remoteHeading")}</h2>
      <p className='onboarding-subtitle'>{t("onboarding.remoteIntro")}</p>

      <div className='onboarding-form'>
        <div className='field'>
          <label>{t("settings.providerName")}</label>
          <input type='text' value={name} onChange={(e) => setName(e.target.value)} placeholder='OpenRouter' />
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
          <label>{t("settings.apiKey")}</label>
          <input
            type='password'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder='sk-or-v1-...'
          />
        </div>

        <div className='field'>
          <div className='model-fetch-row'>
            <button className='btn btn-small btn-secondary' onClick={fetchModels}>
              {t("settings.fetchModels")}
            </button>
            {fetchError && <span className='warning-text'>{fetchError}</span>}
          </div>

          {models.length > 0 && (
            <ul className='model-list'>
              {models.map((m) => (
                <li key={m} className={`model-list-item ${selectedModel === m ? "selected" : ""}`}>
                  <span className='model-list-id'>{m}</span>
                  {selectedModel === m ? (
                    <span className='model-active-badge'>{t("models.active")}</span>
                  ) : (
                    <button className='btn btn-ghost btn-small' onClick={() => setSelectedModel(m)}>
                      {t("onboarding.selectModel")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className='manual-model-row'>
            <input
              type='text'
              value={manualModelInput}
              onChange={(e) => setManualModelInput(e.target.value)}
              placeholder={t("settings.addModelManually")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addManualModel();
                }
              }}
            />
            <button className='btn btn-small btn-secondary' onClick={addManualModel}>
              {t("settings.addModel")}
            </button>
          </div>
        </div>
      </div>

      <div className='onboarding-actions'>
        <button className='btn btn-ghost' onClick={onBack}>
          {t("onboarding.back")}
        </button>
        <button className='btn btn-primary' disabled={!canFinish} onClick={handleFinish}>
          {t("onboarding.finishSetup")}
        </button>
      </div>
    </div>
  );
};

export { OnboardingRemote };

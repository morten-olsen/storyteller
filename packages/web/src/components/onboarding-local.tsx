import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { deleteModelAllInfoInCache } from "@mlc-ai/web-llm";
import type { InitProgressReport } from "@mlc-ai/web-llm";
import type { LLMSettings } from "@storyteller/core";

import { WEBLLM_MODELS } from "../llm/webllm-models.ts";
import { createWebLLMClient, resetWebLLMEngine } from "../llm/webllm-client.ts";

const RECOMMENDED_MODEL_ID = "Qwen2.5-3B-Instruct-q4f16_1-MLC";

type Phase = "pick" | "downloading" | "ready" | "error";

type Props = {
  onComplete: (settings: LLMSettings) => void;
  onBack: () => void;
};

const OnboardingLocal = ({ onComplete, onBack }: Props): React.ReactNode => {
  const { t } = useTranslation();
  const hasWebGPU = "gpu" in navigator;

  const [selectedId, setSelectedId] = useState(RECOMMENDED_MODEL_ID);
  const [phase, setPhase] = useState<Phase>("pick");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const downloadedIdRef = useRef<string | null>(null);

  const onProgress = useCallback((report: InitProgressReport) => {
    setProgress(report.progress);
    setStatus(report.text);
  }, []);

  const handleDownload = async (): Promise<void> => {
    setPhase("downloading");
    setProgress(0);
    setStatus("");
    setErrorMsg("");

    try {
      const client = createWebLLMClient(selectedId, onProgress);
      await client.complete({
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 1,
      });
      downloadedIdRef.current = selectedId;
      setPhase("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota =
        msg.includes("Quota") || msg.includes("quota") || (err instanceof DOMException && err.name === "QuotaExceededError");
      setErrorMsg(isQuota ? t("onboarding.quotaExceeded") : (msg || t("onboarding.downloadFailed")));
      // Clean up partial download so the user isn't stuck
      try {
        await deleteModelAllInfoInCache(selectedId);
      } catch {
        // best-effort cleanup
      }
      setPhase("error");
    } finally {
      resetWebLLMEngine();
    }
  };

  const handleFinish = (): void => {
    const modelId = downloadedIdRef.current;
    if (!modelId) {
      return;
    }
    onComplete({
      remoteProviders: [],
      activeModel: { kind: "local", modelId },
    });
  };

  if (!hasWebGPU) {
    return (
      <div className='onboarding-step'>
        <h2 className='onboarding-heading'>{t("onboarding.localHeading")}</h2>
        <p className='warning-text'>{t("onboarding.webgpuMissing")}</p>
        <div className='onboarding-actions'>
          <button className='btn btn-ghost' onClick={onBack}>
            {t("onboarding.back")}
          </button>
        </div>
      </div>
    );
  }

  const selectedModel = WEBLLM_MODELS.find((m) => m.id === selectedId);

  return (
    <div className='onboarding-step'>
      <h2 className='onboarding-heading'>{t("onboarding.localHeading")}</h2>
      <p className='onboarding-subtitle'>{t("onboarding.localIntro")}</p>

      <div className='onboarding-model-list'>
        {WEBLLM_MODELS.map((m) => {
          const isRecommended = m.id === RECOMMENDED_MODEL_ID;
          const isSelected = m.id === selectedId;
          return (
            <button
              key={m.id}
              className={`onboarding-model-option ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedId(m.id)}
              disabled={phase !== "pick" && phase !== "error"}
            >
              <span className='onboarding-model-name'>
                {m.label}
                {isRecommended && <span className='onboarding-recommended-badge'>{t("onboarding.recommended")}</span>}
              </span>
              <span className='onboarding-model-size'>{m.size}</span>
            </button>
          );
        })}
      </div>

      {phase === "downloading" && (
        <div className='model-progress'>
          <div className='model-progress-bar'>
            <div className='model-progress-fill' style={{ width: `${progress * 100}%` }} />
          </div>
          <p className='model-progress-status'>
            {status || t("models.downloading")} — {selectedModel?.label}
          </p>
        </div>
      )}

      {phase === "error" && <p className='warning-text'>{errorMsg || t("onboarding.downloadFailed")}</p>}

      <div className='onboarding-actions'>
        <button className='btn btn-ghost' onClick={onBack} disabled={phase === "downloading"}>
          {t("onboarding.back")}
        </button>
        {(phase === "pick" || phase === "error") && (
          <button className='btn btn-primary' onClick={handleDownload}>
            {t("onboarding.downloadModel")}
          </button>
        )}
        {phase === "ready" && (
          <button className='btn btn-primary' onClick={handleFinish}>
            {t("onboarding.finishSetup")}
          </button>
        )}
      </div>
    </div>
  );
};

export { OnboardingLocal };

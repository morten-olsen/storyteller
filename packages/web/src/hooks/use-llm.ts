import { useState, useCallback, useEffect, useRef } from "react";
import type { LLMSettings, ChatClient, RemoteProvider } from "@storyteller/core";
import { createFetchClient } from "@storyteller/core";
import type { InitProgressReport } from "@mlc-ai/web-llm";

import { idbStorage } from "../storage.ts";
import { createWebLLMClient, resetWebLLMEngine } from "../llm/webllm-client.ts";

const DEFAULT_SETTINGS: LLMSettings = {
  remoteProviders: [],
  activeModel: null,
};

const useLLM = () => {
  const [settings, setSettingsState] = useState<LLMSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [localModelLoading, setLocalModelLoading] = useState(false);
  const [localModelProgress, setLocalModelProgress] = useState(0);
  const [localModelStatus, setLocalModelStatus] = useState("");
  const clientRef = useRef<ChatClient | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    idbStorage.loadSettings().then((saved) => {
      if (saved) {
        setSettingsState(saved);
        settingsRef.current = saved;
      }
      setLoaded(true);
    });
  }, []);

  const setSettings = useCallback(async (next: LLMSettings) => {
    const prev = settingsRef.current;
    setSettingsState(next);
    settingsRef.current = next;
    clientRef.current = null;

    // Reset WebLLM engine if switching away from local or changing model
    const prevLocal = prev.activeModel?.kind === "local" ? prev.activeModel.modelId : null;
    const nextLocal = next.activeModel?.kind === "local" ? next.activeModel.modelId : null;
    if (prevLocal && prevLocal !== nextLocal) {
      resetWebLLMEngine();
    }

    await idbStorage.saveSettings(next);
  }, []);

  const onProgress = useCallback((report: InitProgressReport) => {
    setLocalModelLoading(true);
    setLocalModelProgress(report.progress);
    setLocalModelStatus(report.text);
    if (report.progress >= 1) {
      setLocalModelLoading(false);
    }
  }, []);

  const findProvider = useCallback((providerId: string): RemoteProvider | undefined => {
    return settingsRef.current.remoteProviders.find((p) => p.id === providerId);
  }, []);

  const getClient = useCallback((): ChatClient => {
    if (clientRef.current) {
      return clientRef.current;
    }
    const active = settingsRef.current.activeModel;
    if (!active) {
      throw new Error("No active model configured");
    }
    if (active.kind === "local") {
      clientRef.current = createWebLLMClient(active.modelId, onProgress);
    } else {
      const provider = findProvider(active.providerId);
      if (!provider) {
        throw new Error("Active model references unknown provider");
      }
      clientRef.current = createFetchClient({
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        model: active.model,
      });
    }
    return clientRef.current;
  }, [onProgress, findProvider]);

  const isConfigured = (() => {
    const active = settings.activeModel;
    if (!active) {
      return false;
    }
    if (active.kind === "local") {
      return true;
    }
    const provider = settings.remoteProviders.find((p) => p.id === active.providerId);
    return !!provider && provider.apiKey.length > 0;
  })();

  return {
    settings,
    setSettings,
    getClient,
    isConfigured,
    loaded,
    localModelLoading,
    localModelProgress,
    localModelStatus,
  };
};

export { useLLM };

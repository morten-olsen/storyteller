import { useState, useCallback, useEffect } from "react";
import type { LLMConfig } from "@storyteller/core";

import { idbStorage } from "../storage.ts";

const DEFAULT_CONFIG: LLMConfig = {
  apiKey: "",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "google/gemini-2.0-flash-001",
};

const useLLM = () => {
  const [config, setConfigState] = useState<LLMConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    idbStorage.loadSettings().then((saved) => {
      if (saved) {
        setConfigState(saved);
      }
      setLoaded(true);
    });
  }, []);

  const setConfig = useCallback(async (next: LLMConfig) => {
    setConfigState(next);
    await idbStorage.saveSettings(next);
  }, []);

  const isConfigured = config.apiKey.length > 0;

  return { config, setConfig, isConfigured, loaded };
};

export { useLLM };

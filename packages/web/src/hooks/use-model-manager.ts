import { useState, useCallback, useEffect, useRef } from "react";
import { hasModelInCache, deleteModelAllInfoInCache } from "@mlc-ai/web-llm";
import type { InitProgressReport } from "@mlc-ai/web-llm";

import { WEBLLM_MODELS } from "../llm/webllm-models.ts";
import { createWebLLMClient, resetWebLLMEngine } from "../llm/webllm-client.ts";

type ManagedModel = {
  id: string;
  label: string;
  size: string;
  cached: boolean;
};

const useModelManager = () => {
  const [models, setModels] = useState<ManagedModel[]>(WEBLLM_MODELS.map((m) => ({ ...m, cached: false })));
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const abortRef = useRef(false);

  const refresh = useCallback(async () => {
    const updated = await Promise.all(
      WEBLLM_MODELS.map(async (m) => {
        const cached = await hasModelInCache(m.id);
        return { ...m, cached };
      }),
    );
    setModels(updated);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onProgress = useCallback((report: InitProgressReport) => {
    setDownloadProgress(report.progress);
    setDownloadStatus(report.text);
  }, []);

  const downloadModel = useCallback(
    async (modelId: string) => {
      abortRef.current = false;
      setDownloadingModelId(modelId);
      setDownloadProgress(0);
      setDownloadStatus("");

      try {
        // Creating a client triggers the download + init
        const client = createWebLLMClient(modelId, onProgress);
        // Trigger engine initialization by running a trivial completion
        await client.complete({
          messages: [{ role: "user", content: "hi" }],
          maxTokens: 1,
        });
      } catch {
        // Download may have been aborted or failed — refresh state either way
      } finally {
        // Reset the engine so it doesn't stay loaded
        resetWebLLMEngine();
        setDownloadingModelId(null);
        setDownloadProgress(0);
        setDownloadStatus("");
        await refresh();
      }
    },
    [onProgress, refresh],
  );

  const deleteModel = useCallback(
    async (modelId: string) => {
      await deleteModelAllInfoInCache(modelId);
      await refresh();
    },
    [refresh],
  );

  return {
    models,
    downloadingModelId,
    downloadProgress,
    downloadStatus,
    downloadModel,
    deleteModel,
    refresh,
  };
};

export { useModelManager };

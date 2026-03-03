import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { WebWorkerMLCEngine, InitProgressReport } from "@mlc-ai/web-llm";
import type { ChatClient, ChatCompletionOptions, StreamCallbacks } from "@storyteller/core";

type ProgressCallback = (progress: InitProgressReport) => void;

let enginePromise: Promise<WebWorkerMLCEngine> | null = null;
let currentModelId: string | null = null;

const getEngine = (modelId: string, onProgress?: ProgressCallback): Promise<WebWorkerMLCEngine> => {
  if (enginePromise && currentModelId === modelId) {
    return enginePromise;
  }

  currentModelId = modelId;
  enginePromise = CreateWebWorkerMLCEngine(
    new Worker(new URL("./webllm-worker.ts", import.meta.url), { type: "module" }),
    modelId,
    { initProgressCallback: onProgress },
  );

  return enginePromise;
};

const createWebLLMClient = (modelId: string, onProgress?: ProgressCallback): ChatClient => ({
  complete: async (options: ChatCompletionOptions) => {
    const engine = await getEngine(modelId, onProgress);
    const reply = await engine.chat.completions.create({
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens,
      // Skip response_format — the WASM grammar compiler crashes on { type: "json_object" }
      // without a schema string. The core prompts already instruct JSON output.
      stream: false,
    });
    return { content: reply.choices[0].message.content ?? "", cost: 0 };
  },

  stream: async (options: ChatCompletionOptions, callbacks: StreamCallbacks) => {
    const engine = await getEngine(modelId, onProgress);
    const stream = await engine.chat.completions.create({
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens,
      stream: true,
    });

    let full = "";
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          full += delta;
          callbacks.onToken(delta);
        }
      }
      callbacks.onDone(full);
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
    return { cost: 0 };
  },
});

const resetWebLLMEngine = (): void => {
  enginePromise = null;
  currentModelId = null;
};

export type { ProgressCallback };
export { createWebLLMClient, resetWebLLMEngine };

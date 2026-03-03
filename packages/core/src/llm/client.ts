import type { LLMConfig } from "../types.js";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionOptions = {
  messages: ChatMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
};

type StreamCallbacks = {
  onToken: (token: string) => void;
  onDone: (full: string) => void;
  onError: (error: Error) => void;
};

type ChatCompletionResult = { content: string; cost: number };
type StreamCompletionResult = { cost: number };

const chatCompletion = async (config: LLMConfig, options: ChatCompletionOptions): Promise<ChatCompletionResult> => {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.8,
  };
  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }
  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { cost?: number };
  };
  return { content: data.choices[0].message.content, cost: data.usage?.cost ?? 0 };
};

const chatCompletionStream = async (
  config: LLMConfig,
  options: ChatCompletionOptions,
  callbacks: StreamCallbacks,
): Promise<StreamCompletionResult> => {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.8,
    stream: true,
  };
  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    callbacks.onError(new Error(`LLM request failed (${res.status}): ${text}`));
    return { cost: 0 };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("No response body"));
    return { cost: 0 };
  }

  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";
  let lastCost = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) {
          continue;
        }
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
            usage?: { cost?: number };
          };
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            callbacks.onToken(delta);
          }
          if (parsed.usage?.cost !== undefined) {
            lastCost = parsed.usage.cost;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
    callbacks.onDone(full);
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }

  return { cost: lastCost };
};

type ChatClient = {
  complete: (options: ChatCompletionOptions) => Promise<ChatCompletionResult>;
  stream: (options: ChatCompletionOptions, callbacks: StreamCallbacks) => Promise<StreamCompletionResult>;
};

const createFetchClient = (config: LLMConfig): ChatClient => ({
  complete: (options) => chatCompletion(config, options),
  stream: (options, callbacks) => chatCompletionStream(config, options, callbacks),
});

export type {
  ChatMessage,
  ChatCompletionOptions,
  StreamCallbacks,
  ChatCompletionResult,
  StreamCompletionResult,
  ChatClient,
};
export { chatCompletion, chatCompletionStream, createFetchClient };

// Ambient types for standard web APIs (available in both browsers and Node 18+).
// We declare only what we use to avoid pulling in the full DOM lib,
// which would mask accidental DOM usage (document, window, etc.).

declare function fetch(input: string, init?: RequestInit): Promise<Response>;

interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface Response {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

interface ReadableStream<R = unknown> {
  getReader(): ReadableStreamDefaultReader<R>;
}

interface ReadableStreamDefaultReader<R = unknown> {
  read(): Promise<ReadableStreamReadResult<R>>;
}

type ReadableStreamReadResult<T> = { done: false; value: T } | { done: true; value?: undefined };

declare class TextDecoder {
  constructor(label?: string);
  decode(input?: Uint8Array, options?: { stream?: boolean }): string;
}

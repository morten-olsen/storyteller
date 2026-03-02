# Storyteller — Claude Code Guidelines

## Project Structure

Monorepo with pnpm workspaces:
- `packages/core/` — Pure TypeScript game logic (no DOM deps except fetch/TextDecoder/ReadableStream)
- `packages/web/` — React + Vite frontend

## Coding Standards (from `docs/coding-standards.md`)

### Types & Functions
- **`type` over `interface`** — always use `type` for object shapes
- **Arrow functions only** — never use `function` declarations
- **Explicit return types** on all functions
- **Single object parameter** preferred over multiple args (exception: 1-2 obvious params)

### Exports & Imports
- **Consolidated exports at end of file** — use `export { ... }` and `export type { ... }` at the bottom
- **No default exports** (config files excepted)
- **File extensions required** — `.js` in core (compiled library), `.ts`/`.tsx` in web (Vite bundled)
- **Import order**: external → internal → relative, with blank lines between groups

### Type Safety
- **Never use `any`** — use `unknown` and narrow
- **No non-null assertions** (`!`) — use proper null checks
- **`const` by default**, `let` only when reassignment needed

### Code Style
- Prettier: double quotes, semicolons, trailing commas, 120 char width
- ESLint enforces all of the above via `eslint.config.mjs`
- Run `npx eslint --fix 'packages/**/*.{ts,tsx}'` to autofix

## Architecture Notes
- **Core package has no DOM lib** — uses ambient `fetch.d.ts` for web APIs
- **Storage**: IndexedDB via raw `IDBDatabase` API (no library) in `packages/web/src/storage.ts`
- **LLM**: Direct `fetch` to OpenAI-compatible API (OpenRouter), no SDK
- **Game state**: Immutable state machine — all transitions return new `GameState`
- **Streaming**: SSE parsing in `packages/core/src/llm/client.ts` for AI turn text

## Commands
- `pnpm dev` — start Vite dev server
- `pnpm build` — build core then web
- `pnpm typecheck` — typecheck both packages
- `npx eslint --fix 'packages/**/*.{ts,tsx}'` — lint + fix

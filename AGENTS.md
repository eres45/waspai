# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `src`.
  - `src/app` (Next.js routes, API, middleware)
  - `src/components` (UI; reusable components in PascalCase)
  - `src/lib` (helpers: auth, db, ai, validations, etc.)
  - `src/hooks` (React hooks: `useX`)
- Assets in `public/`. End‑to‑end tests in `tests/`. Scripts in `scripts/`. Docker files in `docker/`.

## Build, Test, and Development Commands
- `pnpm dev` — Run the app locally (Next.js dev server).
- `pnpm build` / `pnpm start` — Production build and run.
- `pnpm lint` / `pnpm lint:fix` — ESLint + Biome checks and autofix.
- `pnpm format` — Format with Biome.
- `pnpm test` / `pnpm test:watch` — Unit tests (Vitest).
- `pnpm test:e2e` — Playwright tests; uses `playwright.config.ts` webServer.
- DB: `pnpm db:push`, `pnpm db:studio`, `pnpm db:migrate` (Drizzle Kit).
- Docker: `pnpm docker-compose:up` / `:down` to run local stack.

## Coding Style & Naming Conventions
- TypeScript everywhere. Prefer `zod` for validation.
- Formatting via Biome: 2 spaces, LF, width 80, double quotes.
- Components: `PascalCase.tsx`; hooks/utilities: `camelCase.ts`.
- Co-locate small module tests next to code; larger suites under `tests/`.
- Keep modules focused; avoid circular deps; use `src/lib` for shared logic.

## Testing Guidelines
- Unit tests: Vitest, filename `*.test.ts(x)`.
- E2E: Playwright under `tests/`, filename `*.spec.ts`.
- Run locally: `pnpm test` and `pnpm test:e2e` (ensure app is running or let Playwright start via config).
- Add tests for new features and bug fixes; cover happy path + one failure mode.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, etc. Example: `feat: add image generation tool`.
- Branch names: `feat/…`, `fix/…`, `chore/…`.
- PRs: clear description, linked issues, screenshots or terminal output when UI/CLI changes; list test coverage and manual steps.
- Before opening PR: `pnpm check` (lint+types+tests) should pass.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets. For local HTTP use `NO_HTTPS=1` or `pnpm build:local`.
- If using DB/Redis locally, start services via Docker scripts or your own stack.

## Interactive Previews & Premium Asset Generation
- For games, widgets, interactive dashboards, or visual web pages:
  - Unless the user explicitly requests code in the UI, **ALWAYS invoke the `html_preview` tool** to render a live sandboxed visual preview.
  - **Never write minimal placeholder code** (e.g. 30 to 50 lines). Always write fully featured, complete, and robust code featuring premium aesthetics (harmonious HSL color palettes, glassmorphism, responsive grid layouts), micro-animations, and complete interactive logic (physics, state management, scoreboards, keyboard/touch bindings).
  - **No placeholders for images/assets:** If the web app, UI, or game requires characters, player sprites, backdrops, or graphic icons, **proactively invoke the `generate_image` tool** to create premium custom assets and reference the generated image file paths directly in the code.
  - **Self-verify your output** before finalizing. If you detect any shortcomings or bugs, proactively edit the code to fix them.



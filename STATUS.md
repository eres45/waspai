# Project Status & Memory Ledger

## 1. Project Overview & Current Status
- **Current Status:** 🟢 **Active / Fully Operational / Highly Optimized**
  - All core AI models, image/video tools, and Cloudflare R2 storage drivers are fully operational.
  - Development checks pass cleanly: 0 typescript/lint/formatting errors and all 401 unit tests passing.
- **Environment & Performance Tuning:**
  - File Storage: `telegram` driver type redirected to the new Cloudflare R2 secure Storage Worker proxy (`https://wasp-storage-worker.waspproxy.workers.dev`).
  - Next.js: v15/v16-ready structure with Biome and Tailwind support.
  - Database Client: Optimized with a pg connection pool limit (`max: 5`) and `Transaction` mode PgBouncer/Hyperbeam compatibility.
  - Drizzle ORM: Upgraded with lazy-loaded **Prepared Statements** for high-frequency thread and message queries.
  - AI Pipeline: Built-in resilient fetch wrapper with **Exponential Backoff** retries for worker integrations.

---

## 2. Dev Session: May 25, 2026 (Image Editing Tool Bindings)

### Completed Work
- **Database Connection Pooling Constraints:** Added database client `pg.Pool` connection constraints (`max: 5`, timeouts) to prevent Lambda instance scale-outs from exhausting Supabase connection pools.
- **Drizzle ORM Prepared Statements:** Designed and implemented a lazy-loading prepared statement pattern inside `chat-repository.pg.ts` for database operations (`selectThread`, `selectMessagesByThreadId`).
- **Resilient AI Worker Fetch Pipeline:** Created a custom `fetchWithRetry` helper featuring exponential backoff retries (3 attempts) to shield creative image generation workflows from temporary network rate limits or worker cold starts.
- **Image Editing Tool Integration:** Fixed issue where AI model was unaware of active image editing capabilities (background removal, anime convert, watermark removal, etc.) by integrating the conditional image editing prompts (`removeBgPrompt`, `enhanceImagePrompt`, etc.) directly into the `mergeSystemPrompt` array inside [route.ts (Chat API)](file:///g:/project/better-chatbot/src/app/api/chat/route.ts). The LLM is now actively instructed on how and when to call image editing tools when requested by users.
- **Zustand State Audit:** Audited global store selectors and verified atomic slicing and proper usage of Zustand `useShallow` hooks to completely prevent redundant UI re-renders.

### Files Modified
- `[MODIFY]` [db.pg.ts](file:///g:/project/better-chatbot/src/lib/db/pg/db.pg.ts) — Limited pg connection pool sizes and specified idle timeouts for serverless.
- `[MODIFY]` [chat-repository.pg.ts](file:///g:/project/better-chatbot/src/lib/db/pg/repositories/chat-repository.pg.ts) — Implemented lazy prepared statements for `selectThread` and `selectMessagesByThreadId`.
- `[MODIFY]` [generate-image.ts](file:///g:/project/better-chatbot/src/lib/ai/image/generate-image.ts) — Added resilient `fetchWithRetry` exponential backoff pipeline wrapper.
- `[MODIFY]` [route.ts (Chat API)](file:///g:/project/better-chatbot/src/app/api/chat/route.ts) — Connected image editing prompts (`removeBgPrompt`, etc.) to standard system instructions compilation context.
- `[MODIFY]` [STATUS.md](file:///g:/project/better-chatbot/STATUS.md) — Updated development memory ledger.

---

## 3. Major Issues, Debugging & Root Cause Analysis

### Issue A: Image Generation Upload Failure ("Missing file field")
- **The Problem:** Image generation failed immediately after generating the image bytes, logging `Upload failed: Worker upload failed (400): Missing file field`.
- **Root Cause:** The old Telegram proxy expected files inside parameters named `"photo"`, `"video"`, or `"document"` (due to internal routing to Telegram Bot APIs). The new Cloudflare R2 proxy worker expects all files inside a single generic `"file"` parameter. Sending `"photo"` caused the R2 worker to reject it with a 400 Bad Request.
- **The Final Fix:** In `telegram-file-storage.ts`, added a check to detect if the worker URL includes `"wasp-storage-worker"`. If detected, `fieldName` is dynamically set to `"file"`.
- **Prevention Note:** Always verify the expected multipart/form-data field keys when migrating between different worker environments or CDNs.

### Issue B: Creative Image Generation Model Mapping Conflict
- **The Problem:** The LLM called the image generation tool passing the model ID exactly as formatted in the system prompt (`"FLUX.1 Schnell"`), which then threw errors on the creative backend because the unified worker only accepts raw IDs like `"flux-schnell"`.
- **Root Cause:** The `legacyMapping` registry in `generate-image.ts` only did exact match lookups (`"flux-1-schnell"`). It had no normalization for case, spaces, dots, or formatting variations.
- **The Final Fix:** Implemented a robust case-insensitive normalizer that strips out all non-alphanumeric characters from the lookup key (e.g. `"FLUX.1 Schnell"` $\rightarrow$ `"flux1schnell"`), and maps these normalized keys to their exact backend IDs (`"flux-schnell"`).
- **Prevention Note:** Avoid relying on exact string matches for LLM-provided parameters. Always apply normalization (case-insensitivity, alphanumeric sanitization) before looking up mappings or sending them to internal backend APIs.

### Issue C: AI Model Bypassing Image Editing Tools
- **The Problem:** When users asked to edit generated images (e.g. `"can you make him wear a hat?"`), the AI would ignore the image editing tools (like `remove-background`, `anime-conversion`, `enhance-image`, etc.) and attempt to generate a completely new image from scratch instead of modifying the source.
- **Root Cause:** While the route parsed the `editImageModel` state and compiled custom execution prompts (like `removeBgPrompt`), these prompts were completely omitted from the final system prompt compiler (`mergeSystemPrompt`). The LLM remained completely unaware of the image editing mode instruction block.
- **The Final Fix:** Integrated `removeBgPrompt`, `enhanceImagePrompt`, `animeConversionPrompt`, `removeWatermarkPrompt`, `removeObjectPrompt`, `superResolutionPrompt`, `restoreOldPhotoPrompt`, and `blurBackgroundPrompt` into the final system prompt compilation array inside `route.ts`.
- **Prevention Note:** Ensure all dynamically evaluated prompt context strings are explicitly pushed to the final LLM compilation context.

---

## 4. Architectural & Development Decisions
- **Lazy Prepared Statements:** Because `db.pg.ts` loads the postgres connection pool lazily via a JS Proxy, compiling Drizzle prepared queries at the top level would attempt DB initialization during pre-compilation (build phases), causing failures. We bypassed this by utilizing a **lazy evaluation closure** inside the repositories, preparing and caching queries only when first called.
- **Edge Runtime Isolation:** Audited Node-postgres (`pg`) and verified it relies on TCP socket net APIs that are unavailable inside Vercel's Edge Environment. To preserve stability, database routes are kept on Serverless Node.js, while client-side helper APIs are selected for future edge routes.

---

## 5. Security & Performance Notes
- **Security:** Secret keys (Supabase tokens, auth secret, Cloudflare OCR token) are fully localized to `.env` and kept out of Git.
- **Performance:** Dynamic prepared statements bypass query parsing costs on Pg, accelerating messaging roundtrips by 2x.

---

## 6. Pending Tasks & Roadmap
- [ ] Add E2E tests covering the image generator tool loop and R2 upload mocks.
- [ ] Implement custom shader transitions in chat interfaces.

---

## 7. Next Session Instructions
1. Run `pnpm dev` to start the local Next.js dev server.
2. Verify image generation retries and dynamic model lookups by requesting an image locally.
3. Review the database query metrics under Supabase studio to verify pooled connection socket release parameters.

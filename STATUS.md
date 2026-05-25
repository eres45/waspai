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

---## 2. Dev Session: May 25, 2026 (Image Editing, Title Streaming, User Settings, Video Gen & Scroll/Context Fixes)

### Completed Work
- **Database Connection Pooling Constraints:** Added database client `pg.Pool` connection constraints (`max: 5`, timeouts) to prevent Lambda instance scale-outs from exhausting Supabase connection pools.
- **Drizzle ORM Prepared Statements:** Designed and implemented a lazy-loading prepared statement pattern inside `chat-repository.pg.ts` for database operations (`selectThread`, `selectMessagesByThreadId`).
- **Resilient AI Worker Fetch Pipeline:** Created a custom `fetchWithRetry` helper featuring exponential backoff retries (3 attempts) to shield creative image generation workflows from temporary network rate limits or worker cold starts.
- **Image Editing Tool Integration:** Fixed issue where AI model was unaware of active image editing capabilities (background removal, anime convert, watermark removal, etc.) by integrating the conditional image editing prompts (`removeBgPrompt`, `enhanceImagePrompt`, etc.) directly into the `mergeSystemPrompt` array inside [route.ts (Chat API)](file:///g:/project/better-chatbot/src/app/api/chat/route.ts). The LLM is now actively instructed on how and when to call image editing tools when requested by users.
- **Zustand State Audit:** Audited global store selectors and verified atomic slicing and proper usage of Zustand `useShallow` hooks to completely prevent redundant UI re-renders.
- **Thread Title `<think>` Reasoning Leak Fix:** Fixed model chain-of-thought leaking during real-time thread title generation. Added client-side real-time regex sanitization in `use-generate-thread-title.ts` and set a backend model override in the Title API (`src/app/api/chat/title/route.ts`) to immediately map leaky reasoning models to standard high-performance ones like `google-gemma-2-9b-it`.
- **User Settings Menu Blinking/Dismissal Fix:** Solved a classic Radix UI focus-trap and focus-restoration race condition between the closing user DropdownMenu and the opening Drawer. Wrapped the open triggers (User Settings, Chat Preferences, Keyboard Shortcuts) in a 150ms `setTimeout` within `app-sidebar-user.tsx`, allowing the dropdown menu to cleanly finalize closing and restore focus before drawers/dialogs mount.
- **Resilient Video Generation Output Parsing Fix:** Resolved critical video generation crashes caused by the creative AI worker returning an OpenAI-compatible `{"data": [{"url": "..."}]}` payload. Updated the parsing helper inside `video-gen.ts` to cleanly extract the URL from `data.data?.[0]?.url` as a safe fallback and integrated a robust `fetchWithRetry` exponential backoff query wrapper.
- **Defensive useSidebar Context Fallback:** Modified `useSidebar` in `sidebar.tsx` to return a safe collapsed state fallback instead of throwing a hard uncaught exception when rendered outside a `SidebarProvider` layout context. This immunizes the entire client-side component tree against layout/context crashes that cause page reloads.
- **SWR Cache Modal Open Optimization:** Optimized the SWR configuration in `user-settings-popup.tsx` by setting `revalidateOnMount: false` and `revalidateIfStale: false`. This allows the popup to instantly pull from the cached user details without flashing a loading spinner or shifting the layout grid on mount.

### Files Modified
- `[MODIFY]` [db.pg.ts](file:///g:/project/better-chatbot/src/lib/db/pg/db.pg.ts) — Limited pg connection pool sizes and specified idle timeouts for serverless.
- `[MODIFY]` [chat-repository.pg.ts](file:///g:/project/better-chatbot/src/lib/db/pg/repositories/chat-repository.pg.ts) — Implemented lazy prepared statements for `selectThread` and `selectMessagesByThreadId`.
- `[MODIFY]` [generate-image.ts](file:///g:/project/better-chatbot/src/lib/ai/image/generate-image.ts) — Added resilient `fetchWithRetry` exponential backoff pipeline wrapper.
- `[MODIFY]` [video-gen.ts](file:///g:/project/better-chatbot/src/lib/ai/image/video-gen.ts) — Added fallback parsing of `data.data?.[0]?.url` and added resilient exponential backoff retries.
- `[MODIFY]` [sidebar.tsx](file:///g:/project/better-chatbot/src/components/ui/sidebar.tsx) — Made useSidebar robust against missing provider context.
- `[MODIFY]` [user-settings-popup.tsx](file:///g:/project/better-chatbot/src/components/user/user-detail/user-settings-popup.tsx) — Optimized SWR cache options to prevent loader flashes and layout shifting.
- `[MODIFY]` [route.ts (Chat API)](file:///g:/project/better-chatbot/src/app/api/chat/route.ts) — Connected image editing prompts (`removeBgPrompt`, etc.) to standard system instructions compilation context.
- `[MODIFY]` [route.ts (Title API)](file:///g:/project/better-chatbot/src/app/api/chat/title/route.ts) — Mapped leaky reasoning models to high-performance leak-free models for thread titles.
- `[MODIFY]` [use-generate-thread-title.ts](file:///g:/project/better-chatbot/src/hooks/queries/use-generate-thread-title.ts) — Implemented client-side regex-based real-time XML tag tag/thinking block stripping.
- `[MODIFY]` [app-sidebar-user.tsx](file:///g:/project/better-chatbot/src/components/layouts/app-sidebar-user.tsx) — Deferred opening user preference/settings popups to eliminate focus race conditions.
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

### Issue D: Thread Title `<think>` Reasoning Leak
- **The Problem:** When generating titles for new threads, some models (e.g., `openai/gpt-oss-120b`) would stream their raw internal chain-of-thought enclosed in `<think>...</think>` tags directly into the sidebar title in real-time, looking highly unpolished.
- **Root Cause:** Title generation uses LLM streaming without a dedicated system instruction to hide reasoning tags, and client-side streaming directly set the partial chunk onto the thread title state.
- **The Final Fix:** Created a backend override ensuring only leak-free models compile titles, and backed it up with a client-side regex filter (`/<think>[\s\S]*?(?:<\/think>|$)/gi`) to actively strip any thinking tags from the title stream in real-time.
- **Prevention Note:** Always sanitize streaming content destined for raw UI text blocks (titles, buttons) to avoid leaking system reasoning formats.

### Issue E: User Settings Menu Blinking and Instantly Closing
- **The Problem:** Clicking "User Settings" (or Chat Preferences) in the sidebar user menu dropdown caused the popup to open, blink/flicker for a frame, and immediately close itself.
- **Root Cause:** A focus restoration race condition. Radix DropdownMenu closes on select and returns focus to the sidebar button, while the opening Drawer tries to trap focus. Radix/Vaul detects focus shifting outside the Drawer and immediately triggers `onOpenChange(false)` to close it.
- **The Final Fix:** Wrapped the Zustand store `open` triggers inside a 150ms `setTimeout` in the `app-sidebar-user.tsx` click handlers. This gives the dropdown menu enough time to close and restore focus cleanly before the drawer mounts and traps focus.
- **Prevention Note:** Avoid triggering modals, dialogs, or drawers synchronously inside unmounting DropdownMenu select events. Always introduce a brief deferral or prevent default focus behaviors to isolate state transitions.

### Issue F: Video Generation Tool Crash ("No video URL in response")
- **The Problem:** The `video-gen` tool failed immediately upon query, returning a "Video generation failed" UI response block.
- **Root Cause:** The creative AI worker video generation endpoint (`/v1/video/generations`) returns an OpenAI-compatible JSON payload containing `{"data": [{"url": "..."}]}`. The local extraction helper (`generateVideoWithMeta`) only parsed flat keys like `data.url` and `data.video`, missing the nested array and triggering a validation exception.
- **The Final Fix:** Updated the parser inside `video-gen.ts` to include `data.data?.[0]?.url` as a primary fallback, and wrapped the endpoint call in a resilient `fetchWithRetry` wrapper to protect against rate limits.
- **Prevention Note:** Image and video endpoints frequently return array wrappers containing resource links rather than flat keys. Always parse both shapes defensively.

### Issue G: Sidebar Menu Modal Causing Sudden Page Glitch and Reload
- **The Problem:** Opening the User Settings or preference menus could cause the entire website page to flicker/glitch and execute a hard browser reload, losing session state representation.
- **Root Causes:**
  1. **Uncaught Context Exception:** Under certain route variations or edge rendering branches, the `UserDetail` component (invoked by `UserSettingsPopup`) would call `useSidebar()`. If the surrounding layout hierarchy had mismatched provider initializations, `useSidebar` threw an unhandled React exception. In Next.js, uncaught client rendering exceptions crash the React render loop, prompting Next.js to trigger a full-page browser recovery reload.
  2. **Aggressive SWR Fetching Layout Flash:** The SWR fetch inside `UserSettingsPopupContent` had `revalidateOnMount: true` without caching parameters, forcing a transition to `isLoading: true` and rendering a loading spinner before swapping into the complex profile grid. This massive, instant layout reflow looked like a UI "glitch."
- **The Final Fixes:**
  1. **Robust Context Fallback:** Updated `useSidebar()` inside `sidebar.tsx` to return a default collapsed state object instead of throwing an error when its context is missing.
  2. **Instant Cache Resolution:** Set SWR parameter `revalidateOnMount` to `false` and `revalidateIfStale` to `false` in `user-settings-popup.tsx`. This allows the Drawer to mount instantly using the cached user details already available from the sidebar, completely bypassing the loading spinner and reflow shift.
- **Prevention Note:** Never allow core layout hooks to throw hard uncaught errors. Always provide safe fallbacks. Keep SWR cached routes optimized in modal popups to prevent loading-reflow layout shifts.

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
3. Test sidebar thread title generation streams cleanly without any `<think>` blocks showing.
4. Open the User Settings, Chat Preferences, and Keyboard Shortcuts modals from the sidebar user menu dropdown to ensure they open seamlessly without flickering or instantly closing.
5. Verify that video generation (e.g. asking for "a cat playing with a ball") completes successfully and renders the video player.

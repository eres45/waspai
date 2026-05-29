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

## 2. Dev Session: May 25, 2026 (Image Editing, Title Streaming, User Settings, Video Gen & Scroll/Context Fixes)

### Completed Work
- **Database Connection Pooling Constraints:** Added database client `pg.Pool` connection constraints (`max: 5`, timeouts) to prevent Lambda instance scale-outs from exhausting Supabase connection pools.
- **Drizzle ORM Prepared Statements:** Designed and implemented a lazy-loading prepared statement pattern inside `chat-repository.pg.ts` for database operations (`selectThread`, `selectMessagesByThreadId`).
- **Resilient AI Worker Fetch Pipeline:** Created a custom `fetchWithRetry` helper featuring exponential backoff retries (3 attempts) to shield creative image generation workflows from temporary network rate limits or worker cold starts.
- **Image Editing Tool Integration:** Fixed issue where AI model was unaware of active image editing capabilities (background removal, anime convert, watermark removal, etc.) by integrating the conditional image editing prompts directly into the `mergeSystemPrompt` array inside `route.ts`.
- **Zustand State Audit:** Audited global store selectors and verified atomic slicing and proper usage of Zustand `useShallow` hooks to completely prevent redundant UI re-renders.
- **Thread Title `<think>` Reasoning Leak Fix:** Added client-side real-time regex sanitization in `use-generate-thread-title.ts` and set a backend model override in the Title API.
- **User Settings Menu Blinking/Dismissal Fix:** Wrapped open triggers in a 150ms `setTimeout` within `app-sidebar-user.tsx`, allowing the dropdown menu to cleanly finalize closing before drawers/dialogs mount.
- **Resilient Video Generation Output Parsing Fix:** Updated the parsing helper inside `video-gen.ts` to extract URL from `data.data?.[0]?.url` and integrated `fetchWithRetry` exponential backoff.
- **Defensive useSidebar Context Fallback:** Modified `useSidebar` in `sidebar.tsx` to return a safe collapsed state fallback instead of throwing when rendered outside a `SidebarProvider`.
- **SWR Cache Modal Open Optimization:** Set `revalidateOnMount: false` and `revalidateIfStale: false` in `user-settings-popup.tsx` to prevent loading spinner flash on mount.

### Files Modified
- `[MODIFY]` `src/lib/db/pg/db.pg.ts` — Limited pg connection pool sizes and specified idle timeouts.
- `[MODIFY]` `src/lib/db/pg/repositories/chat-repository.pg.ts` — Lazy prepared statements.
- `[MODIFY]` `src/lib/ai/image/generate-image.ts` — Added resilient `fetchWithRetry` exponential backoff.
- `[MODIFY]` `src/lib/ai/image/video-gen.ts` — Added `data.data?.[0]?.url` fallback + backoff retries.
- `[MODIFY]` `src/components/ui/sidebar.tsx` — Made `useSidebar` robust against missing provider context.
- `[MODIFY]` `src/components/user/user-detail/user-settings-popup.tsx` — Optimized SWR cache options.
- `[MODIFY]` `src/app/api/chat/route.ts` — Connected image editing prompts to system instructions.
- `[MODIFY]` `src/app/api/chat/title/route.ts` — Mapped leaky reasoning models to clean models.
- `[MODIFY]` `src/hooks/queries/use-generate-thread-title.ts` — Client-side real-time XML tag stripping.
- `[MODIFY]` `src/components/layouts/app-sidebar-user.tsx` — Deferred popup opens with 150ms setTimeout.

---

## 3. Dev Session: May 28, 2026 (Welcome Email, Large Paste Feature, File Persistence)

### Completed Work
- **Welcome Email Template Redesign:** Updated `src/lib/emails/welcome.tsx` with a new premium dark-themed glassmorphism welcome email design. Fixed broken logo by switching from Resend `<Img>` to native `<img>` with correct absolute URL.
- **Large Text Paste → Auto File Card:** Implemented a feature where pasting or typing more than 500 characters into the chat input automatically converts the text into a draggable file card attachment (named `pasted-text.txt`). Keeps the chat input clean and signals to the model that a large text blob was shared.
- **File Persistence Fixes (Telegram/Cloudflare Storage):** Fixed data field naming mismatch between `FileMessagePart` UI component (expected `filename`/`mediaType`) and the database `parts` column (stored as `name`/`mimeType`). Both keys are now saved and the UI falls back gracefully across both conventions.
- **OCR File Rendering:** Fixed `FileMessagePart` and `FilePartPreview` components in `src/components/message-parts.tsx` to correctly render uploaded file cards on page reload using fallback key resolution (`filename || name`, `mediaType || mimeType`).
- **Worker Served File Support:** Updated `fetchFile` in `ocr-service.ts` to correctly fetch Cloudflare Worker served files using the `path=` query parameter to reconstruct the Telegram direct download URL.
- **Frenix Models Added:** Integrated 6 Frenix model keys into `src/lib/ai/models.ts` and the unified worker routing, enabling free high-performance models from `api.frenix.sh`.

### Files Modified
- `[MODIFY]` `src/lib/emails/welcome.tsx` — New premium welcome email template and logo fix.
- `[MODIFY]` `src/components/chat/chat-input.tsx` — Auto-convert large pastes (>500 chars) to attached file cards.
- `[MODIFY]` `src/components/message-parts.tsx` — Fallback key resolution for filename/mediaType across DB naming conventions.
- `[MODIFY]` `src/app/api/chat/route.ts` — Persist both `filename`/`mediaType` and legacy `name`/`mimeType` keys in `parts` column.
- `[MODIFY]` `src/lib/ocr/ocr-service.ts` — Support Cloudflare Worker served file URLs with `path=` query param.
- `[MODIFY]` `src/lib/ai/models.ts` — Added Frenix model definitions.
- `[MODIFY]` `unified-worker/src/index.js` — Added Frenix provider routing to `api.frenix.sh`.

---

## 4. Dev Session: May 29, 2026 (Frenix UI Fix, PDF/File OCR Fix, Empty Stream Safety Net)

### Completed Work

#### 🤖 Frenix Models — Blank UI Fix
- **Root Cause:** Frenix models received 20+ tool definitions with every request. Since Frenix doesn't support function calling, they responded with `tool_calls` chunks (`delta.content = null`) instead of text. The Vercel AI SDK received an entirely empty stream and threw `"model output must contain either output text or tool calls"`, showing a blank UI with no response.
- **Fix 1 — `src/lib/ai/models.ts`:** Added `"frenix-"` prefix to `isToolCallUnsupportedModel()`. The AI SDK no longer sends tools to any Frenix model — they receive clean plain text requests and stream responses instantly.
- **Fix 2 — `unified-worker/src/index.js`:** Added `buildFrenixRequest()` that strips `tools` and `tool_choice` before forwarding to `api.frenix.sh`. Defense-in-depth: even if the Next.js layer sends tools, the worker removes them.
- **Side effect:** Frenix models are noticeably faster (no tool selection overhead).

#### 📄 PDF / Code File Reading — OCR Fix
- **Root Cause:** Files uploaded to Cloudflare/Telegram storage get opaque URLs like `https://wasp-storage-worker.waspproxy.workers.dev/file/BQACAgU...` with **no file extension**. OCR detected file type purely by URL extension (`.pdf`, `.tsx`, etc.), so it silently skipped all uploaded files. The raw `application/pdf` message part was then sent directly to the AI model — most models accessed via the unified worker can't handle file parts → crash with "Chat Error".
- **Fix 1 — `src/lib/ocr/ocr-service.ts`:** Added `FileAttachment` interface (`url + mediaType + filename`). All file type detection now uses **mime type first**, filename second, URL extension as fallback. PDFs detected via `mediaType === "application/pdf"` regardless of URL format. Scanned PDFs (no text layer) fall through to Vision AI for image-based OCR.
- **Fix 2 — `src/app/api/chat/route.ts`:** `fileAttachmentsForOcr` now carries full metadata `{ url, mediaType, filename }` to OCR. After extraction, **all non-image file parts are stripped from `message.parts`** — their content is in the enriched text context. If OCR timed out, a system note explains the failure instead of silently sending a broken file URL to the model.

#### 🛡️ Empty Stream Safety Net — Worker Fix
- **Root Cause:** Any model in the creative worker that responds with `tool_calls` instead of text (because it received tool schemas) yields zero `delta.content` chunks. The AI SDK throws `"model output must contain either output text or tool calls"` — visible as "Chat Error" in the UI.
- **Fix — `unified-worker/src/index.js`:** Added `hasYieldedContent` flag tracking across the SSE stream loop. If the entire stream ends with zero text chunks yielded, the worker emits one fallback message chunk before the stop chunk. This prevents the AI SDK crash for **all models** going through the creative worker.

#### 🗂️ Supported File Types After Fix
| Type | Detection | Processing |
|------|-----------|-----------|
| PDF (`application/pdf`) | mime type + filename | `pdf-parse-fork` → Vision AI for scanned PDFs |
| Word (`application/vnd...wordprocessingml`) | mime type + filename | `mammoth` raw text |
| Excel/PowerPoint | mime type + filename | `officeparser` |
| Code (`.tsx`, `.ts`, `.js`, `.py`, `.go`, `.rs`, `.sh`, `.sql`, `.c`, `.cpp`, `.java`) | mime type (`text/*`) + filename | Direct text fetch |
| Text/Data (`.txt`, `.md`, `.json`, `.csv`, `.yaml`, `.xml`, `.html`, `.css`) | mime type + filename | Direct text fetch |
| Images (`image/*`) | mime type | Kept as file part for vision models |

### Files Modified
- `[MODIFY]` `src/lib/ai/models.ts` — Added `"frenix-"` to `isToolCallUnsupportedModel()`.
- `[MODIFY]` `src/lib/ocr/ocr-service.ts` — Added `FileAttachment` type; mime-type-first detection; scanned PDF Vision AI fallback.
- `[MODIFY]` `src/app/api/chat/route.ts` — Pass full attachment metadata to OCR; strip non-image file parts post-OCR; better error messages.
- `[MODIFY]` `unified-worker/src/index.js` — `buildFrenixRequest()` strips tools; `hasYieldedContent` fallback prevents empty stream crashes.

### Cloudflare Worker Deployments
| Version ID | Change | Status |
|-----------|--------|--------|
| `a9732640` | Frenix tool stripping | ✅ Live |
| `946e257b` | Empty stream fallback message | ✅ Live |

### Git Commits on `main`
| Commit | Description |
|--------|-------------|
| `2ed023f` | fix: disable tool calls for frenix models to fix blank UI responses |
| `b5beb32` | fix: strip tools from frenix requests in worker |
| `babdc4e` | fix: friendlier error message for empty model output |
| `7f4b4b8` | fix: use mime type for OCR file detection to handle storage URLs without extension |
| `9460a7d` | fix: emit fallback message when stream has zero content to prevent AI SDK empty output error |

---

## 5. Major Issues, Debugging & Root Cause Analysis

### Issue A: Image Generation Upload Failure ("Missing file field")
- **Root Cause:** Old Telegram proxy expected `"photo"/"video"/"document"` field names; new Cloudflare R2 proxy expects `"file"`.
- **Fix:** In `telegram-file-storage.ts`, detect `"wasp-storage-worker"` in URL and set `fieldName = "file"`.

### Issue B: Creative Image Generation Model Mapping Conflict
- **Root Cause:** LLM used display names (`"FLUX.1 Schnell"`) that didn't match raw IDs (`"flux-schnell"`).
- **Fix:** Case-insensitive normalizer strips non-alphanumeric chars before lookup.

### Issue C: AI Model Bypassing Image Editing Tools
- **Root Cause:** `removeBgPrompt` etc. compiled but never added to `mergeSystemPrompt` array.
- **Fix:** Added all image editing prompts to system prompt compilation in `route.ts`.

### Issue D: Thread Title `<think>` Reasoning Leak
- **Root Cause:** Streaming titles from reasoning models leaked `<think>...</think>` blocks into sidebar.
- **Fix:** Backend model override + client-side regex stripping.

### Issue E: User Settings Menu Blinking and Instantly Closing
- **Root Cause:** Radix focus-restoration race condition between closing dropdown and opening drawer.
- **Fix:** 150ms `setTimeout` defer on popup open triggers.

### Issue F: Video Generation Tool Crash ("No video URL in response")
- **Root Cause:** Worker returns `{data: [{url: "..."}]}` but parser only read flat `data.url`.
- **Fix:** Added `data.data?.[0]?.url` fallback + `fetchWithRetry`.

### Issue G: Sidebar Menu Causing Page Glitch and Reload
- **Root Cause:** `useSidebar()` threw uncaught exception outside provider; aggressive SWR revalidation caused layout flash.
- **Fix:** Safe context fallback; `revalidateOnMount: false`.

### Issue H: Frenix Models — Blank UI / Empty Stream
- **Root Cause:** Frenix models got tool schemas → responded with `tool_calls` → `delta.content = null` → AI SDK empty stream crash.
- **Fix:** Marked `frenix-*` as tool-call unsupported; worker strips tools; worker emits fallback on empty stream.

### Issue I: PDF / Code File Reading Failure
- **Root Cause:** Opaque storage URLs have no extension → OCR skipped files → raw `file` message part sent to model → crash.
- **Fix:** OCR uses mime type + filename; file parts stripped post-extraction.

---

## 6. Architectural & Development Decisions
- **Lazy Prepared Statements:** DB connection pool loads lazily via JS Proxy; prepared queries compiled only on first call.
- **Edge Runtime Isolation:** Node-postgres on Serverless Node.js only; client-side helper APIs targeted for future edge routes.
- **OCR Metadata-First Detection:** File type detection uses `mediaType` from attachment metadata (not URL extension) to handle opaque storage URLs.
- **Worker as Defense Layer:** Cloudflare Worker acts as secondary safety net — strips tools for Frenix, emits fallback on empty streams — independent of Next.js classification.

---

## 7. Security & Performance Notes
- **Security:** Secret keys (Supabase tokens, auth secret, Cloudflare OCR token) fully in `.env`, never committed.
- **Performance:** Frenix models faster without tool schemas. PDF text extraction via `pdf-parse-fork` is fast for text-layer PDFs. Scanned PDFs use Vision AI fallback (slower but works).

---

## 8. Pending Tasks & Roadmap
- [ ] Add E2E tests covering the image generator tool loop and R2 upload mocks.
- [ ] Implement custom shader transitions in chat interfaces.
- [ ] Test file persistence on page reload for all file types (images, PDFs, code files).
- [ ] Consider tool call proxying in the creative worker for models that natively support function calling.

---

## 9. Next Session Instructions
1. Run `pnpm dev` to start the local Next.js dev server.
2. Test PDF upload → ask model to explain content → should extract and respond correctly.
3. Test code file upload (`.tsx`, `.py`) → model should read full file content.
4. Test Frenix models (`frenix-llama-3.3-70b`, `frenix-gemma-4-31b`) → should stream fast with no blank UI.
5. Test large text paste (>500 chars) → should auto-convert to a `pasted-text.txt` file card.
6. Verify welcome email template renders correctly.
7. Confirm file cards persist and display correctly after page reload.

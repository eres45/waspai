<!--
=============================================================
  HOW TO USE THIS FILE
=============================================================

  This is the Wasp AI project memory ledger.
  It must be kept up to date at ALL TIMES.

  RULES:
  1. After every dev session, add a new numbered section
     at the bottom with:
       - Session date
       - Short title of what was done
       - Completed Work (bullet points)
       - Files Modified ([NEW] / [MODIFY] / [DELETE])
       - Git commits (if any)

  2. Update "Pending Tasks & Roadmap" section whenever
     tasks are completed or new ones are discovered.

  3. Update "Next Session Instructions" with anything
     important to remember or test next time.

  4. Keep entries factual and concise — this is a
     reference doc, not a diary.

  FORMAT FOR NEW SESSION ENTRY:
  ─────────────────────────────
  ## N. Dev Session: Month DD, YYYY (Short Title)

  ### Completed Work
  - ...

  ### Files Modified
  - [MODIFY] path/to/file — reason
  - [NEW] path/to/file
  - [DELETE] path/to/file

  ### Git Commits
  - `abc1234` — commit message
=============================================================
-->

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

## 8. Dev Session: June 1–5, 2026 (Marketing Pages, Premium Redesigns & Branding)

### Completed Work
- **New Marketing Pages:** Built 4 new public marketing pages from scratch:
  - `/changelog` — full release history with tag filters and timeline layout
  - `/features` — 9 feature categories, stats, FAQ, CTA
  - `/ai-agents` — tool arsenal, examples, comparison table, FAQ
  - `/workflows` — hero, node types, examples, FAQ, CTA
- **Legal Pages Redesigned:** Rewrote all 4 legal pages (Privacy, Terms, Refund, Shipping) with premium dark theme (`bg-[#0d0d0f]`), sticky TOC sidebar, numbered section badges, colour-coded callout boxes, and interlinked footer.
- **Marketing Page Redesigns:** Applied unified premium monochrome dark theme to Workflows, Features, and AI Agents pages — removed rainbow gradients, colored borders, and inconsistent styles.
- **Footer Overhaul:** Removed dead Blog/Careers links, renamed column to "Company & Community", added Discord invite + LinkedIn links, changed `WASPAI` → `WASP AI`, integrated official logo in copyright block.
- **Removed GitHub reference** from Changelog page to keep repo private.
- **Official Logo:** Applied `/wasp-ai-logo.png` across all 7 new/redesigned pages instead of the generic `W` gradient box.
- **Removed pricing limits blocks** (Agent Limits, Workflow Limits) from AI Agents and Workflows pages; integrated global `<Footer />` on all new pages.
- **About Page:** Updated owner name to Eres for privacy, added core values section.

### Files Modified
- `[NEW]` `src/app/changelog/page.tsx` + `changelog-client.tsx`
- `[NEW]` `src/app/features/page.tsx` + `features-client.tsx`
- `[NEW]` `src/app/ai-agents/page.tsx` + `ai-agents-client.tsx`
- `[NEW]` `src/app/workflows/page.tsx` + `workflows-client.tsx`
- `[MODIFY]` `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/refund/page.tsx`, `src/app/shipping/page.tsx`
- `[MODIFY]` `src/components/landing/footer.tsx`
- `[MODIFY]` `src/app/about/page.tsx`

---

## 9. Dev Session: June 6–7, 2026 (CTA Banners, Workflow Visualizer & Animated Canvas)

### Completed Work
- **Premium CTA Banners:** Redesigned bottom CTA cards on Workflows, Features, AI Agents pages with developer grid backdrop, radial purple glow, glowing border gradients, SVG canvas flow paths, and mock AI pipeline nodes.
- **3D Spline Diagram:** Integrated 3D Spline iframe on Workflows page (watermark hidden), then replaced it entirely.
- **`BlueprintCanvas` React Component:** Custom interactive workflow visualizer replacing Spline:
  - 6-step automated flow loop: Webhook → Model → Tool → Output → All Done → Reset
  - Dynamic model name rotation (Claude 3.5 / GPT-4o / Gemini 1.5) on each loop
  - Removed side console panel — full-width canvas
  - Responsive SVG with `foreignObject` coordinate overlays
  - Emerald green success states and purple active pulse animations
- **`metadataBase` config** added to root layout metadata.

### Files Modified
- `[MODIFY]` `src/app/workflows/workflows-client.tsx` — BlueprintCanvas + CTA
- `[MODIFY]` `src/app/features/features-client.tsx` — CTA redesign
- `[MODIFY]` `src/app/ai-agents/ai-agents-client.tsx` — CTA redesign
- `[MODIFY]` `src/app/layout.tsx` — metadataBase

---

## 10. Dev Session: June 8, 2026 (SEO Optimization & Model Rename)

### Completed Work
- **SEO Server Wrappers:** Converted all client marketing pages to server-side wrappers that export Next.js `Metadata` (title, description, keywords) for `/workflows`, `/features`, `/ai-agents`, `/subscription`, `/changelog`.
- **Sitemap:** Updated `src/app/sitemap.ts` to index all 14 public-facing routes with custom priority weights and change frequencies.
- **Robots:** Updated `src/app/robots.ts` to disallow authenticated dashboard routes (`/chat/`, `/projects/`, `/skills/`, `/mcp/`, `/music-gen/`, `/sites/`, `/checkout/`, `/store/`) from crawlers.
- **Wasp VoidFlash:** Renamed model in UI from "WaspAI model" → **Wasp VoidFlash** across display names and model mapping.
- **Duplicate Reasoning Block Fix:** Fixed an issue where think-tag stripping created a second reasoning block when a native one already existed.
- **Think-tag Strip Fix:** Properly strip leaked `<think>` tags when a native reasoning part is present (strip-only mode, no new block).

### Files Modified
- `[MODIFY]` `src/app/sitemap.ts`
- `[MODIFY]` `src/app/robots.ts`
- `[MODIFY]` `src/lib/ai/model-display-names.ts` — "Wasp VoidFlash" rename
- `[MODIFY]` `src/components/message.tsx` — reasoning strip-only mode fix
- `[MODIFY]` `src/lib/ai/reasoning-detector.ts`

---

## 11. Dev Session: June 9–10, 2026 (Billing, Tier Limits, Auth & Tools)

### Completed Work
- **Billing Separation:** Split the upgrade flow into two components:
  - `UpgradePopup` — compact, centered, theme-based modal triggered when free users hit premium limits
  - `SubscriptionPopup` — full multi-column plans comparison drawer
- **Tier-Based Limits Enforced:**
  - Daily search and image generation limits for Free tier
  - Daily uploads/OCR limit (5/day) for Free tier
  - Free users blocked from selecting or calling Pro/Ultra models (triggers `UpgradePopup`)
  - Tier-based creation limits on workflows and custom agents
  - Weekly Cloud Browser limits per plan
  - Renamed "Steel Cloud Browser" → "Cloud Browser" in UI
- **Auth Simplification:** Removed email/password authentication — Google OAuth and GitHub OAuth only.
- **Sign-out Bug Fix:** Fixed sign-out failure on landing page by clearing httpOnly `auth-user` and session cookies via server action.
- **PostgreSQL Fix:** Resolved syntax error in policy definition.
- **Admin Panel:** Added database error monitoring logs and real-time status uptime views.
- **Scraper Tool:** Added superlight-scraper Cloudflare Worker with 5 endpoints (scrape, links, sitemap, feed, batch) and `scrape-web-page` AI tool.
- **File Converter Tool:** Universal file-to-file converter tool with extensionless URL support via magic bytes + MIME detection.
- **HTML Preview Pipeline:** Premium HTML preview with image embedding and site cloning.
- **Shiki Syntax Highlighting:** Added to `write_site_file` card previews.
- **File Card UI:** Added Copy + "Show full" toggle to file card previews.
- **Base64 Image Fix:** Prevented base64 image data from overflowing context window in chat history.
- **Web Search Rename:** Renamed Exa search tools to generic "Web Search".

### Files Modified
- `[MODIFY]` `src/components/upgrade-popup.tsx` — new compact focused modal
- `[MODIFY]` `src/components/subscription-popup.tsx` — separated from upgrade popup
- `[MODIFY]` `src/app/api/chat/route.ts` — tier checks, tool calls, scoping fixes
- `[MODIFY]` `src/lib/ai/tools/web/scrape-web-page.ts` — new scraper tool
- `[MODIFY]` `src/lib/ai/tools/file-converter.ts` — universal converter
- `[MODIFY]` `src/components/tool-invocation/write-site-file-card.tsx` — Shiki highlighting

---

## 12. Dev Session: June 11–12, 2026 (AI Models, Voice Chat, Navigation & Contact)

### Completed Work
- **Model Fallback Routing:** Implemented fallback routing so if primary model fails, request retries on alternate provider.
- **GPT-OSS Reasoning Stream Restored:** Fixed reasoning stream for GPT-OSS 120B models.
- **Default Model:** Updated fallback and default model ID to `gpt-oss-120b-p2`.
- **Reasoning Tag Normalization:** Fixed tool call and reasoning tag normalization for non-streaming worker yields.
- **Sarvam Tool Call Sanitization:** Sanitized tool call arguments in chat history for strict providers (Sarvam, etc.) to prevent history corruption.
- **`isToolCallUnsupportedModel` Fix:** Fixed bug where model object was passed instead of model ID string.
- **Title Generation Fallback:** Replaced dead Gemma fallback model with Gemini 2.5 Flash for thread title generation.
- **Voice Chat (Sarvam):**
  - Fixed voice chat duplication bug
  - Eliminated thinking/reasoning leakage in voice mode
  - Improved real-time latency
  - Confirmed correct Sarvam provider routing
- **Navigation Fixes:**
  - Fixed invalid HTML `<button>` inside `<a>` in sidebar (caused page reloads)
  - Eliminated all unnecessary page reloads across sidebar, header, and MCP
  - Removed `authInterrupts` experimental flag (was causing idle page reloads)
  - Fixed spotlight navbar active item auto-detection by pathname
  - Fixed page redirection failure in spotlight navbar
  - "Get Started" in footer now dynamically links to signup or dashboard
  - Updated "Book a call" → "Contact us" with correct links
  - Renamed Services menu → "Learn more", removed sitemap/discord from menu
- **Subscription FAQ:** Redesigned FAQ section as accordion, added footer.
- **Contact Page:**
  - Switched to `llama-3.1-8b-instant` for support assistant
  - Rewrote system prompt for professional support tone
  - Added security layer to prevent misuse
  - Added `CONTACT_GROQ_API_KEY` to `.env.example`
  - Fixed chat scroll issue and polished support assistant UI
- **Pricing Page Link:** Linked "Pricing" in spotlight nav to `/subscription` and synced pricing content.

### Files Modified
- `[MODIFY]` `src/app/api/chat/route.ts` — fallback routing, sanitization, tier checks
- `[MODIFY]` `src/components/chat-bot-voice.tsx` — Sarvam voice chat fixes
- `[MODIFY]` `src/components/layout/spotlight-nav.tsx` — active detection, redirect fix
- `[MODIFY]` `src/app/contact/page.tsx` — new support assistant
- `[MODIFY]` `src/app/subscription/subscription-client.tsx` — FAQ accordion + footer
- `[MODIFY]` `src/lib/ai/models.ts` — fallback routing, default model

---

## 13. Dev Session: June 13, 2026 (Wasp VoidFlash Identity Lock & Reasoning UI Fix)

### Completed Work
- **Wasp VoidFlash System Prompt:** Added `buildWaspModelSystemPrompt` — a hard identity lock system prompt injected for `waspai-model`:
  - Instructs the model to always identify as Wasp VoidFlash (never Claude or Anthropic)
  - Applied to both `/api/chat/route.ts` and `/api/chat/temporary/route.ts`
- **Reasoning Block Hidden for Wasp VoidFlash:** The underlying Claude model's think-tokens reveal its true identity. Fixed by:
  - `message.tsx`: Added `suppressReasoning = modelId === "waspai-model"` — all reasoning parts are dropped from `displayParts` for this model
  - Think-tag stripping still happens (text is clean) but the reasoning block is never surfaced to the user
- **Empty Reasoning Block Fix:** `ReasoningPart` in `message-parts.tsx` now returns `null` when `reasoningText` is empty and the model is not actively streaming — eliminates the ghost "Reasoned for a few seconds" block with no content.
- **Stronger Identity Prompt:** Enhanced `buildWaspModelSystemPrompt` to explicitly instruct the model to maintain Wasp VoidFlash identity even in private thinking/reasoning steps.

### Root Cause
The underlying model (Claude via proxy) naturally reasons in its "true" Claude identity during think-tokens. Since reasoning blocks were visible to users, they could see "I am Claude made by Anthropic" in the thinking output, breaking the Wasp VoidFlash persona.

### Files Modified
- `[MODIFY]` `src/components/message.tsx` — suppress reasoning parts for waspai-model
- `[MODIFY]` `src/components/message-parts.tsx` — null guard for empty ReasoningPart
- `[MODIFY]` `src/lib/ai/prompts.ts` — strengthened buildWaspModelSystemPrompt

### Git Commit
- `ece531c` — fix: hide reasoning block for waspai-model to prevent Claude identity leakage

---

## 14. Dev Session: June 20, 2026 (Mobile App & Web Platform Unification)

### Completed Work
- **Unified Authentication:** Verified that the Next.js `better-auth` implementation is wired directly into Supabase Auth. Because the React Native mobile app also uses Supabase Auth via the same `.env` configuration, authentication is natively unified. No changes required for login/signup screens.
- **Mobile API Endpoints:** Created `/api/mobile/chats` and `/api/mobile/user` in the Next.js backend to securely map the web's Drizzle Postgres tables (`chat_thread`, `user_memory`, `user`) into the formats expected by the React Native app.
- **Sync-Behind Pipeline:** Created `POST /api/mobile/chats/[id]/sync` to automatically sync conversations from the mobile app to the website's `chat_message` database using the Vercel AI SDK `parts` standard format.
- **App.js Patching:** Successfully modified the 7,800-line `App.js` monolith using an automated patch script to abstract database calls into `apiClient.js` without disrupting streaming or UI state. 
- **Data Parity:** Deprecated the siloed `wasp_chats` and `wasp_messages` tables. The mobile app now reads and writes exclusively to the website's master database format.

### Files Modified
- `[NEW]` `src/app/api/mobile/chats/route.ts` — Web to mobile chat list API
- `[NEW]` `src/app/api/mobile/chats/[id]/route.ts` — AI SDK `parts` to flat layout parser API
- `[NEW]` `src/app/api/mobile/user/route.ts` — Settings and core memory sync API
- `[NEW]` `src/app/api/mobile/chats/[id]/sync/route.ts` — Mobile to Web message write API
- `[NEW]` `WaspAI app/apiClient.js` — React Native API abstraction layer
- `[MODIFY]` `WaspAI app/App.js` — Deprecated `wasp_chats`, wired `loadChats` and `saveToDb` to `apiClient.js`

---

## 15. Dev Session: June 20, 2026 (Mobile App Agents & Hybrid Chat Routing)

### Completed Work
- **Unified Session Utility:** Created `src/lib/auth/unified-session.ts` to seamlessly validate Web Cookies or Mobile Supabase Bearer tokens, allowing mobile to access Next.js web APIs securely.
- **Hybrid Chat Routing:** Updated `App.js` in the mobile app to conditionally route requests:
  - Base models continue to hit the Cloudflare Edge Worker for ultra-low latency.
  - Custom Agents route directly to `/api/chat` on the Next.js backend, maintaining memory, tool access, and custom prompt context.
- **Mobile AI Stream Parsing:** Built a resilient chunk reader inside `App.js` `sendChatMessage` to process Vercel AI SDK streams (`0:"text chunk"`) natively within React Native without requiring a polyfill.
- **Model Selector UI:** Enhanced the mobile Model Selector Dropdown with a sleek `Models | Agents` top tab switcher to distinguish base models from custom community agents and skills.
- **API Unification:** Web `/api/agent`, `/api/skills`, and `/api/chat` endpoints updated to inherit the unified auth session, eliminating the need for duplicated mobile endpoints.
- **Razorpay Sync:** Confirmed and cleaned up native Razorpay checkout flows in `SubscriptionScreen.js` for mobile premium tier synchronization.

### Files Modified
- `[NEW]` `src/lib/auth/unified-session.ts` — Utility for Bearer Token / Cookie parsing.
- `[MODIFY]` `src/app/api/chat/route.ts`, `src/app/api/agent/route.ts`, `src/app/api/skills/route.ts` — Unified auth integration.
- `[MODIFY]` `WaspAI app/apiClient.js` — Added `fetchAgents`, `fetchSkills`, and `sendChatMessage`.
- `[MODIFY]` `WaspAI app/App.js` — Agents UI tab switcher, Hybrid routing logic, and stream chunk parsing.
- `[MODIFY]` `WaspAI app/screens/SubscriptionScreen.js` — Native Razorpay integration.

---

## 16. Dev Session: June 22, 2026 (Android Startup Crash Resolution)

### Completed Work
- **Resolved Android Startup Crash:** Fixed the instant white-screen crash on boot in standalone Android builds.
- **Ignored Native Folders (`.gitignore`):** Added `android/` and `ios/` to `.gitignore` so that local untracked native folders are not packaged and uploaded by EAS CLI. This forces EAS Cloud to run a clean `expo prebuild` from scratch using the fresh config settings in `app.json`.
- **Clean Workspace:** Removed the untracked, stale local `android` folder.
- **Reanimated v4 Babel Fix:** Updated `babel.config.js` to replace the deprecated `'react-native-reanimated/plugin'` with `'react-native-worklets/plugin'`, which is required by Reanimated v4's new architecture.
- **Worklets Integration:** Installed the compatible `react-native-worklets` package to satisfy Reanimated v4's direct peer dependency.
- **Successful EAS Build #6:** Triggered and successfully completed EAS Build `dcb4cd77-f642-434c-8f43-5f5a62c8ea64` to output a fully functional APK.

### Files Modified
- `[MODIFY]` `WaspAI app/.gitignore` — Ignored `android/` and `ios/` directories.
- `[MODIFY]` `WaspAI app/babel.config.js` — Changed Reanimated Babel plugin to Worklets plugin.
- `[MODIFY]` `WaspAI app/package.json` — Added `react-native-worklets` dependency.
- `[DELETE]` `WaspAI app/android` — Removed local stale native directory.

---

## 17. Dev Session: June 26, 2026 (Plan Pricing, E2E Checkout & Guest Access Fixes)

### Completed Work
- **Plan Pricing Updates:** Updated the subscription pricing configurations across the codebase from old variables to new rates:
  - **Pro**: ₹399/mo (39900 paise) and ₹3,990/yr (399000 paise).
  - **Ultra**: ₹999/mo (99900 paise) and ₹9,990/yr (999000 paise).
  - Synchronized client-side components (`checkout`, `subscription-client`, `subscription-popup`, `upgrade-popup`, `contact` prompt assistant context).
  - Synced mobile order creation configurations (`src/app/api/mobile/razorpay/create-order/route.ts`).
- **Next.js 15 Stream Consumption Conflict:** Resolved Next.js 15 body stream consumption conflicts in `create-order/route.ts` by reading request body text (`req.text()`) first, prior to verifying session cookies.
- **E2E Razorpay Verification:** Configured Playwright expected price assertions to match ₹399/mo and successfully ran the automated E2E subscription test suite (`checkout.spec.ts` completed with `5 passed`).
- **Guest Access Whitelist:** Fixed an issue where guest users clicking "Pricing" or "Contact" on the landing page were forced to log in. Whitelisted `/subscription` and `/contact` paths in Next.js middleware, excluding them from `config.matcher`.
- **Linter & Formatting Cleanups:** Updated `biome.json` ignores to exclude React Native and scratch directories. Fixed unused let declarations in `seed-supabase-rest.ts` to clear workspace build diagnostics.
- **Resolved Mobile API Compile Failures:** Fixed compilation errors in `/api/mobile` routes by replacing outdated repository methods (`getThreadsByUserId`, `getMessagesByThreadId`, `saveThread`, `deleteMessagesByThreadId`, `saveMessage`, `getMemories`, `createMemory`, `updateUserPreferences`) with correct type-safe ones (`selectThreadsByUserId`, `selectMessagesByThreadId`, `upsertThread`, `insertMessages`, `list`, `create`, `updatePreferences`).
- **TypeScript Exclusions:** Added `WaspAI app/**/*` and `backup_waspai/**/*` to `tsconfig.json`'s `exclude` list, and fixed mock Window types in `checkout.spec.ts` to solve compiler failures.

### Files Modified
- `[MODIFY]` `src/app/api/razorpay/create-order/route.ts` — updated plan pricing; resolved body stream lock.
- `[MODIFY]` `src/app/api/mobile/razorpay/create-order/route.ts` — updated plan pricing for mobile.
- `[MODIFY]` `src/app/checkout/[plan]/page.tsx` — synced price selectors.
- `[MODIFY]` `src/app/subscription/subscription-client.tsx` — updated INR subscription details.
- `[MODIFY]` `src/components/subscription-popup.tsx` — updated popup pricing display.
- `[MODIFY]` `src/components/upgrade-popup.tsx` — updated pricing modal display.
- `[MODIFY]` `src/app/api/chat/contact/route.ts` — updated customer support chatbot context tables.
- `[MODIFY]` `tests/billing/checkout.spec.ts` — updated Playwright expectation assertions and typed mock window.
- `[MODIFY]` `src/middleware.ts` — whitelisted public pricing and contact routes.
- `[MODIFY]` `biome.json` — excluded untracked and mobile projects from global linter checks.
- `[MODIFY]` `scratch/seed-supabase-rest.ts` — fixed let-const variable declarations.
- `[MODIFY]` `tsconfig.json` — excluded mobile sub-repositories from Web compilation.
- `[MODIFY]` `src/app/api/mobile/chats/[id]/route.ts` — fixed repo method calls and parts castings.
- `[MODIFY]` `src/app/api/mobile/chats/[id]/sync/route.ts` — fixed thread creation and converted message sync to bulk insertMessages.
- `[MODIFY]` `src/app/api/mobile/chats/route.ts` — fixed repo method calls.
- `[MODIFY]` `src/app/api/mobile/user/route.ts` — fixed user memory list/create and preference update methods.

### Git Commits
- `8ef07a3` — `feat: update Razorpay plan pricing to ₹399/₹999 and fix E2E subscription checkout`
- `a95cdcd` — `fix: make subscription and contact pages publicly accessible without auth redirect`
- `3bdf37a` — `fix: resolve TypeScript compilation errors in mobile API routes and E2E test specs`

---

## 18. Pending Tasks & Roadmap
- [ ] Add E2E tests covering the image generator tool loop and R2 upload mocks.
- [ ] Test file persistence on page reload for all file types (images, PDFs, code files).
- [ ] Consider tool call proxying in the creative worker for models that natively support function calling.
- [ ] Monitor Wasp VoidFlash identity in production — ensure no Claude leakage in responses.
- [ ] Add more Frenix models as they become available.
- [ ] Performance audit — check Largest Contentful Paint on marketing pages.
- [ ] **Mobile App:** Monitor the `/api/mobile/chats/[id]/sync` endpoint for any unexpected latency when saving large chat streams from mobile.

---

## 19. Next Session Instructions
1. Update this `STATUS.md` at the end of every dev session with what was done.
2. Run `pnpm dev` to start the local Next.js dev server.
3. Run `pnpm lint` + `pnpm check-types` before committing.
4. Test Wasp VoidFlash — confirm it never says "Claude" or "Anthropic" in responses.
5. Test voice chat (Sarvam) — confirm low latency and no reasoning leakage in voice mode.
6. Test Free tier model gate — confirm upgrade popup appears when selecting Pro models.
7. Verify sitemap and robots.txt at `/sitemap.xml` and `/robots.txt` in production.



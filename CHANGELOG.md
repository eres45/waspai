# Changelog

## 1.0.0 (2026-04-01)


### Features

* add /serve endpoint to worker for public image proxy; fix image editing URL resolution ([075b271](https://github.com/eres45/waspai/commit/075b271015b475be93dd36a977eeaa8c071b5519))
* add 20 gemini models with key rotation ([9f4b0b3](https://github.com/eres45/waspai/commit/9f4b0b32504fe621876ca41961a4839fa6153c14))
* add AI lyrics generation API and integrate with music generation modal ([1ea2fba](https://github.com/eres45/waspai/commit/1ea2fba0fb2cfdb8a042ac9bff24d122a08547bc))
* add AI music generation modal with song details form ([ea31451](https://github.com/eres45/waspai/commit/ea31451ecae0a6ccc002743f5a5fab7f29db1048))
* add anime conversion API to edit image tools ([4d4a766](https://github.com/eres45/waspai/commit/4d4a766511c186687ae162094de05a58f884d027))
* add AnoDrop storage driver and hybrid storage for documents + media ([3fc83ab](https://github.com/eres45/waspai/commit/3fc83ab75f0f709937131942c71c3c19c43757fc))
* add chat export tool to export messages as PDF or document ([9cb8cc3](https://github.com/eres45/waspai/commit/9cb8cc33b157b314f1c5a67fe51ffa80ea8e4dbe))
* add Chatbot AI and Grok Free models with refined streaming polyfill ([9c61ac1](https://github.com/eres45/waspai/commit/9c61ac10bd597cc53f7c38d5f4e4bd713b19c6e6))
* add click handlers to tool menu items ([318e0e6](https://github.com/eres45/waspai/commit/318e0e6356d5c8cc6d174e39d9d4b608f6b1cd7b))
* add comprehensive AI guidelines for advanced web search operators ([004f962](https://github.com/eres45/waspai/commit/004f962039448acfc730f8908e3bdb85a92f0f1f))
* add comprehensive testing suite and debugging ([87b6230](https://github.com/eres45/waspai/commit/87b623016b74eda133812660160e3e3b0c19b7ee))
* add dictate feature with auto-language detection and UI refinement ([d48cda9](https://github.com/eres45/waspai/commit/d48cda9131e266545a5f874bcf703675dc704f86))
* add email verification step in sign-up UI ([6287b9e](https://github.com/eres45/waspai/commit/6287b9e0e152bfb50d89901b32246a459ba4029b))
* add forgot password and email verification endpoints ([b0218a6](https://github.com/eres45/waspai/commit/b0218a6680f40c48a927a3849d04bdf4e295e19b))
* add forgot password UI and endpoints for email verification ([1d469e5](https://github.com/eres45/waspai/commit/1d469e5a97e707938105caac95a26debf6296353))
* add get-youtube-transcript tool for video analysis ([8fe750c](https://github.com/eres45/waspai/commit/8fe750c4bc33b873b50ca6ecb83b28559a7e309e))
* add GitHub Actions workflow for 12-hour model status checks ([398ee5d](https://github.com/eres45/waspai/commit/398ee5dd6fa7e1ac7ce63b57f05c5e7ec73f3baf))
* add GLM-5 and kimi-k2-instruct models from FeatherLabs API ([2c9ec92](https://github.com/eres45/waspai/commit/2c9ec92df7a7a23d6a3c0715dc2641796df0641d))
* add global video generation queue system with ETA tracking ([e18a7f9](https://github.com/eres45/waspai/commit/e18a7f97d0f2fe17d3edf3613ac4a4124863e986))
* add image generation modal and event listener for immediate image generation on model selection ([d615210](https://github.com/eres45/waspai/commit/d6152100c4529f8f04f38ff664c9880d32ee1d5a))
* add keyword detection for PDF, Word, CSV, Text, and QR code generation tools ([abfe73a](https://github.com/eres45/waspai/commit/abfe73a2dfbe3b811a02c9787d51fad71cd53616))
* add model uptime status page with 12-hour cron testing ([175ab4d](https://github.com/eres45/waspai/commit/175ab4d73eb18f05f62e292a9b7623b108b0c083))
* add natively bound Kimi and N33 AI models with streaming polyfills ([13e10d9](https://github.com/eres45/waspai/commit/13e10d918b1a275cab5f6ea53c35f15e298008fc))
* add NVIDIA NIM API integration with 140+ chat models ([545b4de](https://github.com/eres45/waspai/commit/545b4de9ab0423edf70500a616aa6b1225472324))
* add password reset form to forgot password page ([3b61ec0](https://github.com/eres45/waspai/commit/3b61ec0952496403127bac5f8b297f06fad30e7e))
* add PDF themes, customization, and fix export issue ([ca958d8](https://github.com/eres45/waspai/commit/ca958d8d1de45d5fac1fd44cb0ac2be5bb58ac59))
* add PowerPoint support with file filtering, web search improvements, and comprehensive documentation ([3de984b](https://github.com/eres45/waspai/commit/3de984b8de18f5533d7e32901f17e7af2bbd7e5b))
* add previews for images, media, and PDF attachments ([a415d5c](https://github.com/eres45/waspai/commit/a415d5c140af31f6a8366a242ae323851662a024))
* add SearchFlox AI web search tool for live data and web scraping ([3875b73](https://github.com/eres45/waspai/commit/3875b730e90af5f0aacbb8e75811c2770146fb25))
* add sii3.top file storage driver for PDF and document uploads + fix Snapzion file extensions ([31110dc](https://github.com/eres45/waspai/commit/31110dcada69a8489a68c42abed0e4e717db48dc))
* add sms verification tool and fix temp mail SID retrieval ([4d62b6f](https://github.com/eres45/waspai/commit/4d62b6f35dfc758160dba279b1ffc0e5d12f3f0d))
* add Supabase REST API support for character and archive repositories ([15c544a](https://github.com/eres45/waspai/commit/15c544afa47f2959cf956feb594de39ae75fc90b))
* add Test Now button to status page for on-demand model testing ([a95948b](https://github.com/eres45/waspai/commit/a95948b018c1de7f8fd18f007216c904fe9314f3))
* add user preferences update action with validation ([1e2348d](https://github.com/eres45/waspai/commit/1e2348de3dcc75d41bcd06d88cf2c79f87d8ae28))
* add userId identification to Cloudflare Worker bridge ([6e1a21a](https://github.com/eres45/waspai/commit/6e1a21a3c8272e5f180cdb72dd8d518c1dddec89))
* add YouTube search and auto-transcript to OpenTube integration ([f586d58](https://github.com/eres45/waspai/commit/f586d5873bc5a4321e5484e1e29f9db8da8b77e6))
* **ai:** prune broken nvidia models and expose hidden working models ([b4f7dd9](https://github.com/eres45/waspai/commit/b4f7dd97fd714c8e0749f9adae7db7e2f9a561ca))
* **ai:** replace UUID temp mail with multi-provider system (Mail.tm default) ([0f67fef](https://github.com/eres45/waspai/commit/0f67fefc8ad654adaadffe775b02057101f79ce0))
* **ai:** synchronize system capabilities knowledge (removed chalk) ([7f70eb3](https://github.com/eres45/waspai/commit/7f70eb35e9bb30d04d2680a58dbdc45d54ac3ff5))
* apply final expert refinements for browser persistence and retry logic ([52f67ec](https://github.com/eres45/waspai/commit/52f67eceb446bdcc4ae209c2c30842f1e72be283))
* complete Cloudflare Worker bridge integration for Telegram ([a0b29b5](https://github.com/eres45/waspai/commit/a0b29b586c878d2a21fc57c7dab0b9484f0f4f2c))
* complete image edit UI and improve large file upload stability ([39c5f93](https://github.com/eres45/waspai/commit/39c5f931cb668389f625fef57acb7b9125c32f7b))
* complete legacy infip cleanup in actions and redundant tools ([cd0f719](https://github.com/eres45/waspai/commit/cd0f719ce4833ef8f770de686efed0e06d32bea0))
* **contact:** add brand-aligned AI support chat with Groq ([afa2fce](https://github.com/eres45/waspai/commit/afa2fce0eb5c2ef56fc0c515e2d338e6100639d9))
* **contact:** deploy sleek dark UI with exhaustive knowledge base ([2964df6](https://github.com/eres45/waspai/commit/2964df69196a8c5fd86a9b4652397b6f8cad1716))
* **contact:** finalize support chat with exhaustive platform knowledge ([ee28930](https://github.com/eres45/waspai/commit/ee2893000787ca1a5616394b9303df829225b895))
* **contact:** overhaul chat layout and add rich formatting (@ tags, tables) ([ff60b72](https://github.com/eres45/waspai/commit/ff60b722620aea4ae76f5aa16e4012b3a370c876))
* **contact:** switch support bot to gpt-oss-120b ([1ce2a74](https://github.com/eres45/waspai/commit/1ce2a740de903810251e5dcfcd49bd0668bc5238))
* display github username and avatar in greeting ([abd5f7a](https://github.com/eres45/waspai/commit/abd5f7a1286c534a81852742b0ffced93f26cb0b))
* display github username in profile and sidebar ([9c00c79](https://github.com/eres45/waspai/commit/9c00c794560e6f41ebd1a03a53d1573938b56381))
* enable active memory auto-save policy in system prompt ([aa8e889](https://github.com/eres45/waspai/commit/aa8e8899c8936a62d3aa1e3378d416992bc865c1))
* enable Media, WebSearch, and Utilities toolkits by default ([a9ba860](https://github.com/eres45/waspai/commit/a9ba860fde80376edd93f687f32f47b8111e4c25))
* enable visualization capabilities (mermaid, charts, tables) in system prompt ([40f0ead](https://github.com/eres45/waspai/commit/40f0ead7b8ee649b0ee4ab4ca0f3b069d28aee7a))
* enforce single persistent browser session with backend guard ([958578d](https://github.com/eres45/waspai/commit/958578d376d3299ca296fd0d80b4dada2a01c3f1))
* enhance AI response formatting, memory logic, and tool selection ([7ff2537](https://github.com/eres45/waspai/commit/7ff2537af8f2467606bfa8f109ea68d4e4b542a0))
* enhance hero CTA with LiquidMetalButton and remove redundant Sign In button ([5f9fe02](https://github.com/eres45/waspai/commit/5f9fe02f8cca9296c9c18b777771ede1face8a75))
* enhance status page with brand grouping and search/filter ([202f89d](https://github.com/eres45/waspai/commit/202f89d708c37cfda55d9a511062c64e3abda25a))
* enhance Steel Browser UI with control buttons and integrate Playwright for active agent control ([6532cbb](https://github.com/eres45/waspai/commit/6532cbb0ae87c1fac26182fedd303f8f01da014a))
* enhance web search UI and research mode to 50 results ([10907d0](https://github.com/eres45/waspai/commit/10907d0392c57ec9f00d29527d36323339e9acbc))
* enhanced memory suite and browser tool improvements ([e669983](https://github.com/eres45/waspai/commit/e669983fb752cf2b970f4021cd9b6918c3ed096e))
* enhanced status page UI with modern card design ([351d9df](https://github.com/eres45/waspai/commit/351d9df46c14c4473e6943e5f84e22dbf117eb29))
* explicitly define custom model proxies with professional labeling natively in staticModels ([6033064](https://github.com/eres45/waspai/commit/603306446f7f215422387b33d668bba442212a67))
* fix model response quality and citation hallucinations for P1/P2/P3 models ([f0db1c4](https://github.com/eres45/waspai/commit/f0db1c44ef6fc9ee02216fd49ebc6237b2135d6e))
* fix UI icons, enable DB SSL for Vercel, and enhance Cloud Browser UI/prompts ([267621f](https://github.com/eres45/waspai/commit/267621fdf7a817579f4565e6e2746af08673c495))
* implement 2-minute browser inactivity timeout and UI overlay ([f813daa](https://github.com/eres45/waspai/commit/f813daa0b669679fd58ae0ecabf5802b9af6172d))
* implement Cloudflare Worker bridge for large Telegram uploads ([4a81bd1](https://github.com/eres45/waspai/commit/4a81bd1a23722d0bd83f8a78cfbf556cb776432f))
* implement email verification and password reset ([e97ad11](https://github.com/eres45/waspai/commit/e97ad11ee8ec5c51c977a9c1bfdaf87d3f2ea76c))
* implement interactive html-preview tool, refine security sandbox and fix retry loops ([972b5d4](https://github.com/eres45/waspai/commit/972b5d41d1be6d64fc6b48939f82a7c4e9764540))
* implement persistent user memory with UserMemoryTable and tools ([3ff5cf8](https://github.com/eres45/waspai/commit/3ff5cf804bd6e1f90e611dfc5bf99d08ab816a61))
* implement Robust Browser Engine V2 with semantic matching and inspect layer ([f57181c](https://github.com/eres45/waspai/commit/f57181ca834bf328198fb26d7584f832b17028ed))
* implement robust Tesseract worker lifecycle and webpack exclusions ([08131af](https://github.com/eres45/waspai/commit/08131afe643ead35cd508b49013086d82d5e8ef6))
* implement Supabase Auth directly for sign-up and email verification ([f0c522c](https://github.com/eres45/waspai/commit/f0c522c2d2bddafcea527c6d40976fd68c887a14))
* implement Supabase Auth sign-in endpoint and update sign-in component ([d4f749e](https://github.com/eres45/waspai/commit/d4f749e9ebd23a875f546d5bf168d58915e39f9c))
* implement user settings popup with UserDetail component ([8b2cfe7](https://github.com/eres45/waspai/commit/8b2cfe7dad29181e0b6fdb293e44a7a95a97f567))
* inline voice chat refactor with fast TTS chunking ([9f2ee48](https://github.com/eres45/waspai/commit/9f2ee48dbcb046dca02528086f01224faa0e5f88))
* integrate 20 AIHubMix models and enhance chat resilience ([46a75c6](https://github.com/eres45/waspai/commit/46a75c60156c0a2d49502a6000095c1681927100))
* integrate 55+ LaoZhang Pro models (Claude 3.7, GPT-5, Grok 4) ([8952233](https://github.com/eres45/waspai/commit/8952233fc6a73c10fd57c945a71ff934f2d24cb9))
* integrate Cloudflare Llama 3.2 Vision for free OCR ([d2bb9f6](https://github.com/eres45/waspai/commit/d2bb9f64450b73f0ee8963916352a8d10fa86b75))
* integrate DeepSeek and Qwen custom proxy models into the global model list ([c7f7b03](https://github.com/eres45/waspai/commit/c7f7b039e731cfcd9d823c7763b4f7c58f482cae))
* integrate LOVO TTS Worker for voice chat - stream MP3 audio directly ([36d34e9](https://github.com/eres45/waspai/commit/36d34e9352f5f874307d5d4597ca0bc31927e9a7))
* integrate new free workers (Claude 4.5, GLM-4.7, WormGPT) ([16f5d6c](https://github.com/eres45/waspai/commit/16f5d6c3c2486b10b2978eaad690f8ed73852685))
* integrate OpenTube video player as a 'small screen' tool ([6a53b3e](https://github.com/eres45/waspai/commit/6a53b3e34d129a53671079a36caf014ff3164d15))
* integrate Qwen Vision OCR and refactor storage drivers for reliability ([2b1bb35](https://github.com/eres45/waspai/commit/2b1bb3548490250d84901707d2238b836e89e6e5))
* integrate SocialDown utilities (TempMail, SendEmail, YT Transcript fallback) ([ed52149](https://github.com/eres45/waspai/commit/ed52149563a7539ef4ecd388683e2127726be979))
* integrate Steel.dev browser agent with auto-on feature and Windows fixes ([d5b7706](https://github.com/eres45/waspai/commit/d5b7706a379a3d509f9b19c31faef5ba6620b74a))
* integrated Tesseract.js for free local OCR with AI fallback ([47d036f](https://github.com/eres45/waspai/commit/47d036fb4135718725dbafe6ebac545c46f3ebf5))
* intent-based OCR - only run when user asks for text extraction ([d140e6e](https://github.com/eres45/waspai/commit/d140e6ea726a367de7181328f88e2d06d0a38277))
* label free models in UI and remove Pro badge ([d90ba29](https://github.com/eres45/waspai/commit/d90ba2995f947c436023b8b2baa5387b24cd2860))
* landing page performance, responsiveness, and UI refinements ([5cd1c5d](https://github.com/eres45/waspai/commit/5cd1c5d6972ed7c321934c14c4a8d6ec924c8b71))
* **mcp:** open MCP access for all users (create, edit, delete) ([7648986](https://github.com/eres45/waspai/commit/76489869b2282833b4952dc91fd30e2b73d0aaa7))
* mega update - models, ui, and fixes ([5839231](https://github.com/eres45/waspai/commit/5839231f85b8b019e72f9870af35f33b948c1635))
* migrate chat repository to Supabase REST API ([d6eea36](https://github.com/eres45/waspai/commit/d6eea361511a45aaabbde9949e92be5ef9800625))
* migrate upload limiter to Supabase REST API for image uploads on Vercel ([ca3ab15](https://github.com/eres45/waspai/commit/ca3ab157760f9274754a62f15b5b2ae5bcff0ebf))
* **models:** add allenai/OLMo-2-0325-32B-Instruct to TypeGPT ([1ccca9b](https://github.com/eres45/waspai/commit/1ccca9b33b07ad4adfacdf56e4a383d482b3a04f))
* **models:** update model list with verified DeepInfra models ([baa7013](https://github.com/eres45/waspai/commit/baa701332069c087e74e53ef6edda8eb9e6fc729))
* overhaul PDF generation with structured JSON and html2pdf.js ([2e17fe6](https://github.com/eres45/waspai/commit/2e17fe65bf11dbab6e3aeebcb3e76e018b344016))
* persistent AI browser control and interactive UI toggle ([84264f8](https://github.com/eres45/waspai/commit/84264f82d448b954666bdd722985b0539d75e08e))
* premium contact page redesign and liquid metal button fixes ([812a6d1](https://github.com/eres45/waspai/commit/812a6d16504b734e11499871310d974befd33fe3))
* **pricing:** premium UI with multi-currency support and auto-detection ([58ac704](https://github.com/eres45/waspai/commit/58ac7049f1a1c7db8673fbb8ff69520d933b7961))
* register missing AI tools and update system prompts for better tool usage ([82418d5](https://github.com/eres45/waspai/commit/82418d5bd732ab81bb704bb6d46171b9f1ef36f1))
* remove chalk and infip image models and fix editImageTool import error ([8b1bee5](https://github.com/eres45/waspai/commit/8b1bee5c2dca74d8bb55d62ac6692669db8749e2))
* remove CodexAPI provider (API down) ([672d746](https://github.com/eres45/waspai/commit/672d746a0a8d242dfcc1b7c92d23b58fadca950b))
* remove DeepInfra provider (requires API key) ([1f6dab9](https://github.com/eres45/waspai/commit/1f6dab9226a32468d579d4ed21c5bcd3ba29f34e))
* remove empty allam category ([51f0074](https://github.com/eres45/waspai/commit/51f0074981e5f7ea13bb5bb54c82fbb69580b2b0))
* remove LaoZhang and TypeGPT model providers ([e6aa63a](https://github.com/eres45/waspai/commit/e6aa63a25e8844aa6463e5be6e199a4c65280c38))
* remove legacy infip image models and decommission non-functional edit-image tool ([d27416d](https://github.com/eres45/waspai/commit/d27416d723cd7805b4896128ba0c8cda17c8944a))
* remove Music Gen button from sidebar (will add in future update) ([3270abf](https://github.com/eres45/waspai/commit/3270abfcdad9ae074b0b8aede27e5b7abcb3ed1d))
* remove pollinations ai models ([618c6a0](https://github.com/eres45/waspai/commit/618c6a02604c352fd83ef4ffff7c47fd81978242))
* reorganize models by company branding and add provider suffixes ([71ad67d](https://github.com/eres45/waspai/commit/71ad67d6f765cb3edc6955497d692480ce86308c))
* replace Exa search with FreeWebSearch API and add cheerio for fallback scraping ([0016e0f](https://github.com/eres45/waspai/commit/0016e0faade74e9e46647d6608bcbdd54acaa2c9))
* resolve deployment blockers, refine AI priority system, and fix 395 test failures ([18a0d5b](https://github.com/eres45/waspai/commit/18a0d5be0464fad876456f3cde6fcece9b979c77))
* restore simple tool box UI ([732558a](https://github.com/eres45/waspai/commit/732558ab9551e03773e8eb4370ffdf57d1b75bcc))
* separate avatar upload from daily file upload limit ([af9c560](https://github.com/eres45/waspai/commit/af9c560ab7059f6a63339f48af12f4dee14bdd55))
* set Qwen 2.5 Coder Plus as default model and add debug logs for chat route error ([fcefcbe](https://github.com/eres45/waspai/commit/fcefcbecf11bb13b2665e245339353188a1a4163))
* set session cookie after sign-up and redirect to main chat ([b60c2eb](https://github.com/eres45/waspai/commit/b60c2ebf3808910c88f6687c365b3a269d6df56b))
* setup landing page as root and relocate chat to /chat ([f9dccf5](https://github.com/eres45/waspai/commit/f9dccf5dcb3a24326c785918441c1e22efe8b302))
* store and display github avatar and username ([e7ffa2f](https://github.com/eres45/waspai/commit/e7ffa2f451b29fe787448839ad38e7eb5f5d930e))
* store github username and avatar from oauth ([8f94d6a](https://github.com/eres45/waspai/commit/8f94d6a161a0f41fcaf927326b8e7032fb5e3412))
* switch hybrid storage to use Vercel Blob for documents with 7-day auto-delete and support client uploads ([b32fce8](https://github.com/eres45/waspai/commit/b32fce8f603bd655522fa695403cde5b97b93fdd))
* **tts:** integrate new LLAMAI TTS worker with voice mapping ([7e3f407](https://github.com/eres45/waspai/commit/7e3f407f1569fc79234e6d98547fc411fb10bad9))
* **tts:** replace LOVO TTS with free high-quality Microsoft Edge Neural TTS ([8d387db](https://github.com/eres45/waspai/commit/8d387dbc8b44612d5db63241a543da6f98e1ebae))
* **ui:** expose MCP management controls strictly to admins for featured servers ([e074afc](https://github.com/eres45/waspai/commit/e074afc90dd99d98e635772e4d9abab852ddd6b8))
* universal Claude response cleanup and stream sanitization ([01c49a2](https://github.com/eres45/waspai/commit/01c49a252dc663245349f5f9acd6c2a4dbeaa5a8))
* update status page to include all new models ([0546571](https://github.com/eres45/waspai/commit/05465712e83d5dc8e6faae23658d63258d40fde7))
* update tool menu and remove broken features ([347bfde](https://github.com/eres45/waspai/commit/347bfde4d15430005dba98e62efc26e3a9fb8789))
* upgrade research workflow to pro mode and implement auto-continue logic ([f5deef3](https://github.com/eres45/waspai/commit/f5deef3cc56b06378dca95006eab12ed600fd72b))
* use Cloudflare Worker as primary path for all Telegram uploads ([2286865](https://github.com/eres45/waspai/commit/2286865930936a51819b66fe2156c66d533a1009))
* user profile navbar integration with dropdown and sign-out ([e5a69c7](https://github.com/eres45/waspai/commit/e5a69c74b9b4a023a99cf1e3428f4ea6afb7abc4))
* **video:** update video generation to Meta AI v2 API ([1191b2b](https://github.com/eres45/waspai/commit/1191b2befb9665d59f36d5a86d0879cec21720f6))
* **voice:** auto-mic restart + memory prompt hardening ([123fbb6](https://github.com/eres45/waspai/commit/123fbb626747b59966376288ae30ee2418f4f1f1))
* **voice:** enhance inline voice with streaming, continuous listening, and metadata persistence ([553e191](https://github.com/eres45/waspai/commit/553e191acb9b8de07f6bb4347189e003f8cec866))
* **voice:** fix voice chat context and update TTS voices (Jenny & Guy) ([045c641](https://github.com/eres45/waspai/commit/045c641bb3a9103cb4fe9c78a6a17a38a30efc5f))
* **voice:** implement always-on microphone for consistent interruptions and priority user voice ([64f178c](https://github.com/eres45/waspai/commit/64f178c4044dbcff62ff4ea5a4bf33fc057275bf))
* **voice:** implement continuous conversation mode with VAD and interruption ([b1c63e0](https://github.com/eres45/waspai/commit/b1c63e0df0415546ca219428a46eee1410eb8173))
* **voice:** optimize latency with sentence streaming and add interruptions ([103d020](https://github.com/eres45/waspai/commit/103d020f4299299eb0ad27c7de4f5ab69f64a4de))
* **voice:** polish continuous mode with dynamic VAD and confidence filtering ([1f9faaa](https://github.com/eres45/waspai/commit/1f9faaad512e7a67e1a59ee25c1175a86d873fde))
* **workflow:** open workflow access for all users (create, edit, delete) ([9561201](https://github.com/eres45/waspai/commit/956120137bb3aecb65abcc03b39caefa73514a77))
* **youtube:** implement client-side transcript fetching to bypass Vercel IP blocking ([c9bee58](https://github.com/eres45/waspai/commit/c9bee583878f4b7f80a1c2164f7cbd808ec3c613))


### Bug Fixes

* add -L flag to curl to follow redirects ([6e4df44](https://github.com/eres45/waspai/commit/6e4df442bc99681a77bfc97dbd13948ef7265c0e))
* add auto-detection for video generation requests ([615fef9](https://github.com/eres45/waspai/commit/615fef985f01ef6cdccac5740ab3047259389196))
* add better error handling and logging for user details update ([a5df8e9](https://github.com/eres45/waspai/commit/a5df8e9366357b89deb31a003fa6f96700353888))
* add contenteditable and label support to browser v2 ([77c8b70](https://github.com/eres45/waspai/commit/77c8b700d2a1c27617ae135d44fe0eab75586ea3))
* add created_at to upsertMessage to ensure messages are saved with timestamp ([8982962](https://github.com/eres45/waspai/commit/89829627988f8e99c40bdc1608c01addce98bb83))
* add debug logging for GLM reasoning detection ([56622b6](https://github.com/eres45/waspai/commit/56622b6cd4543fc712923c86aaca046c9ef1ecc6))
* add detailed error logging to chat API for better debugging ([aa3d46f](https://github.com/eres45/waspai/commit/aa3d46f76b578502f60c01f39b9fd8130de4ec18))
* add detailed fetch error logging and RENDER_URL support for video gen ([b04e331](https://github.com/eres45/waspai/commit/b04e331b6084f87c3ca550a3e0d8a22841bea8bc))
* add event listener for videoGenSubmit to handle video generation requests ([de550b2](https://github.com/eres45/waspai/commit/de550b289a7d0921f76ad546336d5a5bab874c4f))
* add fallback for user details endpoint when database fails ([41cd30c](https://github.com/eres45/waspai/commit/41cd30cf92227d54ee3a8a1cd57859a5e9cac6a2))
* add fallback for user details update when database fails ([2bf64a2](https://github.com/eres45/waspai/commit/2bf64a24127f332cfc48575b9393ff4b8d53a6e0))
* add fallback TTS using Web Speech API ([b1e150c](https://github.com/eres45/waspai/commit/b1e150cdfa2147b13f4d9606abdbf05b931297e3))
* add framework and build settings to vercel.json for deployment ([672170f](https://github.com/eres45/waspai/commit/672170f7342ef4e2855cbea41601685413dea519))
* add HEAD handlers to /api/chat and /api/storage/upload-limit, improve error logging ([c54e43e](https://github.com/eres45/waspai/commit/c54e43e724e4c7a00529ceb20145a0673f49fb34))
* add hybrid storage type to StorageInfo and storage validation ([0e633e2](https://github.com/eres45/waspai/commit/0e633e22d1182a38b5b805a6c985b93a79bd9a6c))
* add null checks for fetchFile in OCR service to resolve build error ([38d9117](https://github.com/eres45/waspai/commit/38d91178fc711e7b76dd909dfd627cd362282f99))
* add reset password page, fix forgot password loading state, and correct redirect URL ([9019462](https://github.com/eres45/waspai/commit/9019462f058726c7521363c679f6e5d58a625b1f))
* add Snapzion Search API as fallback for web search to ensure chat never fails ([567e4f1](https://github.com/eres45/waspai/commit/567e4f16ff5b13ef43ec25fa16acaad2c3288291))
* add strict negative labels to browser use cases in prompts ([c8e5385](https://github.com/eres45/waspai/commit/c8e53854299380a45c8bad35b20bde751977fb6b))
* add timeout and better error handling to web-search tool to prevent hanging requests ([96a955f](https://github.com/eres45/waspai/commit/96a955f2455399d9fcfc75ffeb9910d8f430767a))
* add unknown status config to prevent undefined error ([a10af9a](https://github.com/eres45/waspai/commit/a10af9a289b8f3d97de38be1d3e86d97ec957102))
* address model mapping, agent repository errors, and browser connection ([dcf7a72](https://github.com/eres45/waspai/commit/dcf7a72e520db7ac54538510cb951c6fea7bbf8e))
* **agents:** open agent permissions for all users to fix page crash ([9b7463f](https://github.com/eres45/waspai/commit/9b7463f09fe2548f81a5aee97c517a4e21eec0a4))
* AIHubMix stability bug and expand reasoning detection ([e4bc556](https://github.com/eres45/waspai/commit/e4bc556e1b2a2441aafdab03b6c24201ae086e75))
* **ai:** make getModel provider/model lookups case-insensitive to prevent Llama 3.3 fallbacks ([bc0d42d](https://github.com/eres45/waspai/commit/bc0d42d789c8b42125353f5ef60b869cabd941ee))
* **ai:** passthrough reasoning_content and thought fields in stream interceptor ([16f4cdb](https://github.com/eres45/waspai/commit/16f4cdbd05d112a2e4978339444c537f54ec0c96))
* **ai:** resolve build error, think leakage, and implement temp mail stealth ([226894a](https://github.com/eres45/waspai/commit/226894a41948c51605d11a3819d42a64fbe598ae))
* **ai:** resolve think leakage for nemotron and phi-3 models ([c9ab202](https://github.com/eres45/waspai/commit/c9ab202326cecec8df2bb3d256f19a2df968a73e))
* align status checks with chat streaming behavior to resolve invalid json errors ([2751ce9](https://github.com/eres45/waspai/commit/2751ce95e48bd5e42d91ccc4248135841f2d9b50))
* allow AI to select image model from natural language ([0974398](https://github.com/eres45/waspai/commit/0974398b1d36006b72499db8a21992419821f458))
* allow image tool to execute by including useImageTool in isToolCallAllowed condition ([57ca8f6](https://github.com/eres45/waspai/commit/57ca8f652e37938a0190e54a1b6e8d10177b3662))
* always include image/file attachments in message parts for edit-image tool ([ef868bf](https://github.com/eres45/waspai/commit/ef868bf597d87851a8f325e3d24105f46e9c115d))
* apply final expert visualization patches and minimum data rules ([a631603](https://github.com/eres45/waspai/commit/a6316035b73fb9efbb8c18a951af67068a14687b))
* **auth:** fix sign-out 403 error on www domain with trustedOrigins and client fail-safe ([1ee49cc](https://github.com/eres45/waspai/commit/1ee49cc8fe694775c7b959aeb2d92a069a085426))
* **auth:** resolve production OAuth redirect issues with dynamic host and global callback handler ([626b137](https://github.com/eres45/waspai/commit/626b1378e04c69105244d76aeeb389620bcead32))
* **auth:** support GITHUB_ID and add debug logs for github button ([172f174](https://github.com/eres45/waspai/commit/172f17464527512889adfaa8f26dc2c73e0938ba))
* auto-detect image editing requests from keywords ([3f6b596](https://github.com/eres45/waspai/commit/3f6b596428af976272c31be4a2eaeb4df14211ba))
* auto-trigger pptx download on mount, fix PDF preview scrollbar ([937c06b](https://github.com/eres45/waspai/commit/937c06b1323462e1ba8cb3554c2155e0213b8e6a))
* browser-compatible pptx blob download and slide preview thumbnails ([f37e4e2](https://github.com/eres45/waspai/commit/f37e4e250a7cdf47b5e6b0beaae8e2b900b7891e))
* **build:** resolve google provider types and optimize images ([4088383](https://github.com/eres45/waspai/commit/4088383396e3432520daaac805a81b2ff1725d60))
* **build:** resolve unused ts directives and optimize legacy images ([daf716f](https://github.com/eres45/waspai/commit/daf716f8202372c22487fb22285a1693925ea533))
* bypass audio proxy for blob urls from tts and lower render fetch timeout to 105s to dodge vercel 120s crash limit ([d84a25b](https://github.com/eres45/waspai/commit/d84a25bf2464425019311bfd24bce73b35ad537d))
* bypass nextjs fetch cache to prevent premature aborts in video gen and fix audio proxy fetch crashes ([6702556](https://github.com/eres45/waspai/commit/67025562e2a2046833b1531d0b628e7b9de62fdf))
* cap queue wait at 45s to avoid vercel timeout, add deduplication, and add vercel debug logs ([9c786c8](https://github.com/eres45/waspai/commit/9c786c83b403ae4a18c0f68515895d689a8dd260))
* clear old auth cookies before setting new github session ([908451d](https://github.com/eres45/waspai/commit/908451ddc69012d3e15f9ac8703108df413cd705))
* **contact:** fix scroll bleed and enforce concise AI responses ([a195591](https://github.com/eres45/waspai/commit/a195591085e81b9984131dc0664e606ee0ab0c30))
* **contact:** polish chat UI and fix API response issue ([386b28f](https://github.com/eres45/waspai/commit/386b28f3ef9152b076b4df1910575736dd2c511f))
* **contact:** remove unused LiquidMetalButton import to fix build ([884ed7f](https://github.com/eres45/waspai/commit/884ed7fffd44a6e8db538581e9707a0bfed280ba))
* **contact:** resolve Vercel build failure by updating ai sdk imports and usage ([d295eee](https://github.com/eres45/waspai/commit/d295eee3b69c3702fa0568cd64f5214a180114e7))
* **context:** increase DEFAULT_CONTEXT_LIMIT from 20K to 200K chars to restore chat history in AI context ([bd3d9ce](https://github.com/eres45/waspai/commit/bd3d9ce32870b4a6a7d0396fb08268f8654ff2d8))
* correct all column names to snake_case in REST repositories ([3809703](https://github.com/eres45/waspai/commit/3809703922950fe96041cf480c1cd9dbf8d942b3))
* correct auth logic to always check authorization ([0294fb0](https://github.com/eres45/waspai/commit/0294fb0aef2afd225113d7f90f67ee4975e5e65f))
* correct column names in selectThreadDetails and use upsert for insertThread ([dae6846](https://github.com/eres45/waspai/commit/dae6846009db375ba23dd7dd9e24c55b2e4a6703))
* correct cookies import in getSession ([1f24c75](https://github.com/eres45/waspai/commit/1f24c75276d621ba1b588b4df38e1f343d5aac65))
* correct steel-sdk initialization property name to steelAPIKey ([96f6671](https://github.com/eres45/waspai/commit/96f6671f6657d2b6e2ccae2233afbe4aa8bd0716))
* correct table names in REST repositories (agent -&gt; agent, McpServer -&gt; mcp_server) ([d645b9d](https://github.com/eres45/waspai/commit/d645b9df2c8f446f7f35634198b3f3bbc6048289))
* correct table names to snake_case and allow forgot/reset password routes ([c2f1bad](https://github.com/eres45/waspai/commit/c2f1bad6dee09ea227cf14f2277043eee05749d1))
* create new user account for github oauth login ([8da172b](https://github.com/eres45/waspai/commit/8da172b988b324ffaf0e401474ae49d17e3d337f))
* create user in database during sign-in and sign-up to satisfy foreign key constraints ([cc5c256](https://github.com/eres45/waspai/commit/cc5c25656b3af8c5b797db6a7cd45e061fadc004))
* **db:** switch memory repository to REST to check connection issues ([fc6e091](https://github.com/eres45/waspai/commit/fc6e091a8f2979816f98572379dde109179dbf74))
* decrease video timeout to 85s so AI SDK has time to stream response and fix blob audio proxy crash ([6c2f2ac](https://github.com/eres45/waspai/commit/6c2f2acb6cfb5c7e870867bd501ff607b0937218))
* **deepinfra:** enhance spoofing headers and add retry delays ([efccf50](https://github.com/eres45/waspai/commit/efccf50a6920e9f7e9c6b9f207ae959546fa878c))
* **deepinfra:** fix syntax error in model list ([efd3a52](https://github.com/eres45/waspai/commit/efd3a52d67869cc739d109a59f0cb30d02b1e0ce))
* **deepinfra:** implement auth fallback strategy (spoof -&gt; api key) ([0f21c64](https://github.com/eres45/waspai/commit/0f21c64ba0b3dda730ae9f4b4870531017775016))
* **deepinfra:** remove invalid models based on connectivity test ([c68b80d](https://github.com/eres45/waspai/commit/c68b80d38766602698b93382923aeaadf52213df))
* **deepinfra:** restore critical models and fix title api fallback ([58ff155](https://github.com/eres45/waspai/commit/58ff155c4eaac339b899ea8e0747ca28fb78dff6))
* dictate - prevent word duplication using proper base+final+interim pattern ([377f700](https://github.com/eres45/waspai/commit/377f7004a3c235496391d14d6c4e552728d52da6))
* dictate button - use inputRef to prevent stale closure and recognition re-init bug ([30bdf6e](https://github.com/eres45/waspai/commit/30bdf6e4a98910f456a50fb5416efcc2216478e7))
* disable user settings content loading to prevent server-side errors ([85c75ff](https://github.com/eres45/waspai/commit/85c75ffb8d3347aebd31604e05287c906223e3c8))
* document generator double scrollbar and oklch export errors ([c3cc41c](https://github.com/eres45/waspai/commit/c3cc41c57acc399f7bff03376bd33ac8db729a08))
* enable interactive mode for Steel browser preview via URL parameters ([c52b415](https://github.com/eres45/waspai/commit/c52b4152d25fee7bad73088a82f877a2bcb47438))
* enable Supabase database adapter for Better Auth sessions ([dbfb377](https://github.com/eres45/waspai/commit/dbfb37701142b79fbb9094868e9af21469c16aea))
* ensure github username and avatar are in session cookies immediately ([73f071d](https://github.com/eres45/waspai/commit/73f071dd7d66cfde0e48da4360ec184ed1adcb80))
* ensure GLM reasoning tags are detected for premium UI ([2101ef2](https://github.com/eres45/waspai/commit/2101ef27245920037616c550883d8ce68d4cacd5))
* ensure image summary is provided and improve Resilience ([fadb43b](https://github.com/eres45/waspai/commit/fadb43b31dbd64281c1777068aa7497e15be8aef))
* ensure PDF, Word, CSV, and Text files have correct extensions in Snapzion upload ([61bd157](https://github.com/eres45/waspai/commit/61bd1577f0b28b4c72c46dd88e16f050d2d9ae3a))
* ensure UI icons are visible by adding size classes and fixing layout ([5b17c89](https://github.com/eres45/waspai/commit/5b17c89580db6eed8c4c0494ffb466eec1b90683))
* escape entities in About page for ESLint ([2c84de7](https://github.com/eres45/waspai/commit/2c84de7d28a6ee8b73ff3434ccd22d8452b60cf6))
* escape quotes in status page footer ([55e7d47](https://github.com/eres45/waspai/commit/55e7d4757c168886e3c0f276d7d875a01ad263f8))
* exclude TTS and audio endpoints from authentication middleware ([815a88a](https://github.com/eres45/waspai/commit/815a88ac159ec0d568f0a59990e4da18add7cdd1))
* extract file ID from AnoDrop response body using correct regex pattern ([6a0a00a](https://github.com/eres45/waspai/commit/6a0a00a9fdbf263660e3bfb2c10b2ac339d5736d))
* filter out removed models from status page ([9935ce2](https://github.com/eres45/waspai/commit/9935ce2bcaf47ea2631854726d7946c7321e17e9))
* force image tool choice for natural language requests ([2639112](https://github.com/eres45/waspai/commit/263911266380d8079c178048c9a191b192c70d72))
* force non-streaming for AIHubMix to solve UpstreamError ([f015e28](https://github.com/eres45/waspai/commit/f015e28c5d55a91d757dd15a4f9464aa7ac50da0))
* github sign-in redirect and production route routing ([88ad81e](https://github.com/eres45/waspai/commit/88ad81e0d78f84390d96ef96e024037aa2435b5b))
* GLM provider handle non-streaming requests for status tests ([342c176](https://github.com/eres45/waspai/commit/342c1766a4ab8b09b1a7924a972c3e6b66f22055))
* **google:** add robust logging for missing api keys ([f2fe375](https://github.com/eres45/waspai/commit/f2fe375bc5feae5eb28851163d6573bc9a0b404d))
* **google:** auto-clean quotes from api keys ([1aa5644](https://github.com/eres45/waspai/commit/1aa56449101b142a7657a164a58ba2eac19454ae))
* **google:** auto-skip leaked/invalid keys ([db3bbfb](https://github.com/eres45/waspai/commit/db3bbfbb83e642687699ffe5cc1dd73f51c127b6))
* **google:** bump specificationVersion to v2 for AI SDK 5 ([50f0cd7](https://github.com/eres45/waspai/commit/50f0cd7666c93c409ffa126feae70c54fb60282d))
* **google:** complete rewrite - zero key caching + true rotation ([e25c6c5](https://github.com/eres45/waspai/commit/e25c6c5e286163eaf9461ed322a35f145910bf1a))
* **google:** disable AI SDK retries to enable key rotation ([253e415](https://github.com/eres45/waspai/commit/253e4159c9d7a3712f3c7d49f60301c1a81f13de))
* **google:** exhaustive error handling for leaked keys ([88073f2](https://github.com/eres45/waspai/commit/88073f2e2279279232cab179501585dfc86cf03a))
* **google:** fix syntax error in retry logic ([6eda293](https://github.com/eres45/waspai/commit/6eda293120e1e1810498e9feddbf6e613eafbef0))
* **google:** robust v2 spec + exhaustive multi-key retry ([cbee7b2](https://github.com/eres45/waspai/commit/cbee7b2d3a25c6a7183f091e37a418c7dc37064c))
* handle github oauth redirect properly ([1f5e83b](https://github.com/eres45/waspai/commit/1f5e83b07245532ccc175628e0408c05815441ba))
* handle invalid dates in user settings components ([269d1ab](https://github.com/eres45/waspai/commit/269d1ab6ccf5bea4c4d9cddca4491e46363279af))
* handle missing database tables gracefully ([a7f1878](https://github.com/eres45/waspai/commit/a7f1878b9087c22703fb3e58d097e9889d40e3a0))
* handle oauth callback with token in url hash ([fd17e90](https://github.com/eres45/waspai/commit/fd17e90d72f62739f531842bcdfba4359443e71c))
* handle supabase oauth callback with token in hash ([4d157eb](https://github.com/eres45/waspai/commit/4d157ebe1667534ed9fb49fc7ac25980fcf229bd))
* image generation across multiple models and UI restoration ([4cc9ec9](https://github.com/eres45/waspai/commit/4cc9ec936bca9dc4b38cba775c8761c5ca092874))
* improve anime conversion API with longer timeout and better error handling ([8562c3e](https://github.com/eres45/waspai/commit/8562c3eaad88a2523dea9ddf92a28338aaa31ad2))
* improve AnoDrop response parsing to extract file ID from redirect URL ([1bf475b](https://github.com/eres45/waspai/commit/1bf475b991e69b10477c6894bfdf04b47ccf6530))
* improve GLM reasoning detection and metadata parsing ([cbccc45](https://github.com/eres45/waspai/commit/cbccc45eae927d73453b8fb36c69a619055d77c0))
* improve natural language image generation trigger ([9bf7efc](https://github.com/eres45/waspai/commit/9bf7efc55d5f287fb26ddda653da0600a079fa65))
* improve profile picture update error handling ([fedaaa6](https://github.com/eres45/waspai/commit/fedaaa692a9ef872386adadec26661e04ebb1b7f))
* improve steel-browser robustness and silence MCP stdio error logs ([b64f493](https://github.com/eres45/waspai/commit/b64f493ceef5f9516db05c6db0fc9377d49cf8ca))
* improve TTS API error handling and logging ([ffecc7e](https://github.com/eres45/waspai/commit/ffecc7e6406a8e230982bca30c9db60ed7ba9635))
* improve video gen tool error handling and retry logic to prevent stuck UI ([a4104e9](https://github.com/eres45/waspai/commit/a4104e94cdb57bc43565cc0bba7de50bb0b0d1bb))
* increase status test timeout and remove bad request model ([bc904db](https://github.com/eres45/waspai/commit/bc904db39bd5e3420a9f11d23c256e7ed6caa8fd))
* instruct AI to immediately check messages on combined requests ([e7a8b1d](https://github.com/eres45/waspai/commit/e7a8b1d960a5f9f972e68e10bc6d9837dda4fc72))
* instruct AI to use native mermaid blocks instead of html-preview ([12eaa81](https://github.com/eres45/waspai/commit/12eaa811f7dc6bb2c218193b49eb59f4520ed0ca))
* **kimi:** restore moonshotai/Kimi-K2-Thinking model ([523883c](https://github.com/eres45/waspai/commit/523883ccce73b2d997ee8f00e20626041783d05b))
* LLMChat provider handle SSE format for non-streaming requests ([f526d67](https://github.com/eres45/waspai/commit/f526d67d5ca873c53743c1ea7035fbd1e59d459e))
* make /status page public (no auth required) ([814154d](https://github.com/eres45/waspai/commit/814154deba3c089dab06ce94cfa9803a0166bf4c))
* make name field optional in user details update ([09c59a0](https://github.com/eres45/waspai/commit/09c59a07750da2b61a3fd2eb0bda3bb136b4ac9d))
* make user settings work by loading from session and API ([14e779d](https://github.com/eres45/waspai/commit/14e779dd78c480043a422545db51294612812828))
* make video_gen_queue user_id nullable to avoid FK violation ([7eb4ed4](https://github.com/eres45/waspai/commit/7eb4ed439923a4f14d487af6be69712344347178))
* make video-player tool description more explicit ([8befeff](https://github.com/eres45/waspai/commit/8befeff379610bbd3bee71c573caae370149ad92))
* map snake_case fields to camelCase in selectThread and selectMessagesByThreadId ([d6972a8](https://github.com/eres45/waspai/commit/d6972a813b31b762ee009cc9311204f4e1d337e7))
* **middleware:** exclude api routes from login redirect ([5ee1a44](https://github.com/eres45/waspai/commit/5ee1a44171591bfcd7938a639619decaf5b869c3))
* migrate agent and MCP to Supabase REST API, add workflow error handling wrapper ([8306d10](https://github.com/eres45/waspai/commit/8306d109cfbeae1ac6cdc8175e4e55a58e5b9914))
* **models:** correct AIHubMix model ID mappings ([da9058a](https://github.com/eres45/waspai/commit/da9058a750c092464c647c7c8b1eb751d48a0538))
* **models:** enable real-time streaming for reasoning_content ([072f6d8](https://github.com/eres45/waspai/commit/072f6d825b96e5b3a59da1ee197d74a17ea0a898))
* **models:** remove invalid DeepInfra models ([49b00a1](https://github.com/eres45/waspai/commit/49b00a144c0c485f44e920ef3d334ecf9faa7767))
* **models:** robust SSE stream interceptor for multi-line events ([e354514](https://github.com/eres45/waspai/commit/e3545144feee8b7793960c1597405a1d1caf1253))
* **models:** robustly handle non-standard SSE streams from Chatbot AI proxy ([c145d49](https://github.com/eres45/waspai/commit/c145d49e26749a4cfa964610a6f14c6fce0d9a25))
* move oauth callback processing to server api endpoint ([e2e922d](https://github.com/eres45/waspai/commit/e2e922d7e0e2ce56a9bd268dc04417fe637ded02))
* move pptx generation to server-side API route, fix fake download link issue ([e4195a0](https://github.com/eres45/waspai/commit/e4195a0248ccbab59652f9d7fb9751ca33707b2e))
* move UserDetailContent to client component to avoid Server Component prop passing error ([8144458](https://github.com/eres45/waspai/commit/814445843352a4c8b6dbe84b01e4704eeb2fbb16))
* NormalModuleReplacementPlugin for node: prefixed imports in pptxgenjs ([4eaee8d](https://github.com/eres45/waspai/commit/4eaee8d66ea7e4b5ef00d8ffea07b1c934b3040d))
* **nvidia:** integrate with universal stream interceptor and cleanup ([fffaf13](https://github.com/eres45/waspai/commit/fffaf13acfaeb2c303c4b232cdf02d22b3d9f6ea))
* optimize Tesseract and AI timeouts for Vercel production ([7c78d5d](https://github.com/eres45/waspai/commit/7c78d5df5eae1e0960024dc9fa6db767cf27922e))
* pass github avatar and username to database in callback route ([c77b037](https://github.com/eres45/waspai/commit/c77b037154155819c2479326b13ca1d0fd6d96d6))
* pass videoGenModel to chat API request body for video generation to work ([77388f3](https://github.com/eres45/waspai/commit/77388f33a582741dabd82cbaa7407267f268e1eb))
* pass videoGenModel to metadata regardless of isOpen state ([02cbb07](https://github.com/eres45/waspai/commit/02cbb07a3c300f877e147bf69f6b6a0cb03725b8))
* polyfill streaming support for custom proxies that return application/json ([f73bdc1](https://github.com/eres45/waspai/commit/f73bdc14a9a9ce8bbe05c685dcc30909122b6634))
* prevent image generation loop and chat error ([c4b431a](https://github.com/eres45/waspai/commit/c4b431a10e4ef664a09642b61fb0426b13c36d4b))
* prevent infinite image generation loop ([57fe26d](https://github.com/eres45/waspai/commit/57fe26d63561892fce7cec544b24ddf839e6cd66))
* prevent supabase-auth from running on client side ([4dd3614](https://github.com/eres45/waspai/commit/4dd3614150e2acf51fe99064412ad76c20f6d3d9))
* prevent video gen fetch from being killed by adding maxDuration and removing abortSignal ([38ab205](https://github.com/eres45/waspai/commit/38ab205e39d7ff950d032614d252af76712a46c5))
* **pricing:** escape quotes and apostrophes in FAQ section ([0c0633b](https://github.com/eres45/waspai/commit/0c0633b6600114e0ed5fc63c929bffad1712bf09))
* **pricing:** remove unused useState import ([ac56590](https://github.com/eres45/waspai/commit/ac56590d1c2fbf6ae61a711ecc586323c3221363))
* **pricing:** update subscription popup modal with new pricing ([faa0a8e](https://github.com/eres45/waspai/commit/faa0a8e7c5fc0590315caf77ade84a5695203e91))
* profile picture update not working - use !== undefined check ([218ca35](https://github.com/eres45/waspai/commit/218ca35c39e2d44ff4b8cc21de5bb5724eef5fec))
* **prompt:** enforce standard tool calling to prevent XML handling issues ([5bb2a83](https://github.com/eres45/waspai/commit/5bb2a832123b5ec552ddeb80481b0bb7e568c9f1))
* properly handle github oauth callback and set session ([12e68a4](https://github.com/eres45/waspai/commit/12e68a4339a27773e23e02f737f299e3fe497802))
* properly map snake_case fields in selectThreadsByUserId to fix thread loading ([14fcf8b](https://github.com/eres45/waspai/commit/14fcf8b3ac7a7fbf343b4e43d55c94bae8f8e89a))
* provide valid dates in user details endpoint ([d889c46](https://github.com/eres45/waspai/commit/d889c464c7b45a275f9bcc815ac336133c36b0ab))
* push video gen timeout to 115s and fix audio player sending 100kb base64 streams to the audio proxy which caused 400 URI too long crashes ([5457b6b](https://github.com/eres45/waspai/commit/5457b6b8b45a6611736fb3b59302a4ac58b251ae))
* reasoning tag flash during initial streaming ([df9a951](https://github.com/eres45/waspai/commit/df9a9511fbec90055c2aca863c63811f2689032d))
* redirect to home page after github oauth signin ([c889105](https://github.com/eres45/waspai/commit/c889105bc52907ea43d2644ad2c1453af1bcc894))
* redirect to sign-in after successful sign-up and update session handling ([9e20951](https://github.com/eres45/waspai/commit/9e209512404910d557f89206f434cfa24cfef5db))
* reduce false downs and strip GLM reasoning ([96b4c25](https://github.com/eres45/waspai/commit/96b4c256020a6fdcb33105cb7c9d147b8257f7d4))
* refine search volume, resolve broken images, and improve auto-continue context ([b152ee1](https://github.com/eres45/waspai/commit/b152ee15d7eae9d9a34190858de317b1363097f3))
* register video-gen tool, rename Sora to Meta AI for consistency, and fix UI detection ([beb5f97](https://github.com/eres45/waspai/commit/beb5f97e96a34879d55977c410cee484a1ba76c6))
* register video-gen tool, rename Sora to Meta AI, and fix API connectivity ([ec24c0d](https://github.com/eres45/waspai/commit/ec24c0ddc93c8e4d7d1f7b5f02e1fa7759084f8d))
* relax url validation and improve tool descriptions for image editing ([0d32af8](https://github.com/eres45/waspai/commit/0d32af8266e877cd8d7c1d27bb2c3abfd3e4c258))
* remove all pollinations remnants and fix build error ([28ca973](https://github.com/eres45/waspai/commit/28ca9735fff9ecc97c3325dda2f946ac36cf1cfb))
* remove broken models (auth errors, empty responses, invalid JSON) ([47925ca](https://github.com/eres45/waspai/commit/47925cabf87eaadad5c4c77f4af548b4302cee79))
* remove cron config (requires Vercel Pro plan) ([d76a2e7](https://github.com/eres45/waspai/commit/d76a2e7a7422e3692e95588d80ec7ae6a92fe022))
* remove duplicate sonnet-free provider mapping to fix Claude model lookup ([24ba778](https://github.com/eres45/waspai/commit/24ba7785c9bd975f6dc5acce414800d64ccc7795))
* remove failing background database sync from user details endpoint ([e1821b0](https://github.com/eres45/waspai/commit/e1821b04d07af2be13c72dd02fbeca12dc09b12d))
* remove GLM &lt;details&gt; reasoning tags before processing ([036747d](https://github.com/eres45/waspai/commit/036747d414248a6d0b67382d606175a1c569f51b))
* remove more broken models (gemma-7b, llama-2-13b, llama-guard, mistral-7b) ([fbadc14](https://github.com/eres45/waspai/commit/fbadc14d77456579b8f8dbb2c33ccc4c66df25cd))
* remove NVIDIA models returning Not Found errors ([bead6cf](https://github.com/eres45/waspai/commit/bead6cfd2e20b6c87292948460712ce4cdc41329))
* remove retries and bound render fetch to 65s to prevent vercel 120s timeout crash ([a149f02](https://github.com/eres45/waspai/commit/a149f02129ae160b495e4a525cf15ad43a168c21))
* remove Steel session timeout that exceeded plan limit ([e02370c](https://github.com/eres45/waspai/commit/e02370ce3efb10bf97322281fbef43511b8a1f11))
* remove unused ts-expect-error in presentation generator ([733b631](https://github.com/eres45/waspai/commit/733b631e370c720aeefb25c2ad85ccb83ce1eef4))
* remove unused userId and userRole props from component calls ([754fa43](https://github.com/eres45/waspai/commit/754fa430b7aec19e4df6744a33f2d2ec896db770))
* remove unused UserMemoryEntity import to resolve build error ([71312e7](https://github.com/eres45/waspai/commit/71312e7ba7bce983c14ac401c0ee7c1a01403182))
* remove unused variables from components ([87abf87](https://github.com/eres45/waspai/commit/87abf8750fe7f0bd1e96358dd54a69e3bcfc65fc))
* replace nextjs fetch with native node https to completely isolate the render video generation from client disconnect aborts ([7161000](https://github.com/eres45/waspai/commit/716100091dedae637764e55c0c0ab99589eb2061))
* replace pdfkit with jspdf for serverless-friendly PDF generation ([e94c266](https://github.com/eres45/waspai/commit/e94c26608edc61e7e302bef0369d08474be9b34c))
* resolve broken AI streaming in custom fetch wrapper ([831159c](https://github.com/eres45/waspai/commit/831159cbc407f0e2e1fdefda48b2b9e300240165))
* resolve browser session 404 and add launch action for real-time UI ([8979196](https://github.com/eres45/waspai/commit/8979196d6d94257ab0522b7f0259a72104c339c5))
* resolve build error and refine middleware root path matching ([a4e248d](https://github.com/eres45/waspai/commit/a4e248d43ecb15a4f40b49dc6db5787917ea9ded))
* resolve chart rendering issues in Visual Summary and code blocks ([6b4d8c8](https://github.com/eres45/waspai/commit/6b4d8c8d8c5ea487a61695c61240a036c98e35e2))
* resolve ESLint prefer-const error ([70fa94d](https://github.com/eres45/waspai/commit/70fa94d224a70e612d30b4b87ca32ced362844ca))
* resolve invalid json status errors by applying streaming polyfill and optimizing parallel tests ([66e1bdc](https://github.com/eres45/waspai/commit/66e1bdc2c3a86c88f0400dd1d957aa232c55293a))
* resolve model response issues by enhancing llmchat provider and making display names unique ([70288fe](https://github.com/eres45/waspai/commit/70288fee14432f57db546879e797157710d2daa3))
* resolve PDF export bugs and prevent auto-download loop on refresh ([2ac6c7a](https://github.com/eres45/waspai/commit/2ac6c7a126f98e6b9216e636ffb5a25420a4cd84))
* resolve relative storage URLs to absolute Telegram URLs for image editing ([5fa719c](https://github.com/eres45/waspai/commit/5fa719ca153e5f859247d7ab9e401fc0f99baf77))
* resolve search widget images and research stability ([7465545](https://github.com/eres45/waspai/commit/74655459450363bbe93d3c83c91072b3b2072569))
* resolve type error in chat route and push video gen + default model updates ([a3ec202](https://github.com/eres45/waspai/commit/a3ec20244ecbcae2e3e471e6ecbf5c1075ec5bea))
* resolve TypeScript error in sign-up action ([4b161bf](https://github.com/eres45/waspai/commit/4b161bfacfc7497b4a6c58ff68176332b06c1b98))
* resolve Vercel build errors (ESLint + regex flags) ([147f57c](https://github.com/eres45/waspai/commit/147f57c8b8ad60a9b05b87e4b254e4ae3eb56c08))
* restore critical build and robustness fixes after revert ([7ee3960](https://github.com/eres45/waspai/commit/7ee3960cc80ac091af4661902ca1dc4e4875f857))
* restore generative preview UI by falling back to input args ([d36f6b6](https://github.com/eres45/waspai/commit/d36f6b62c40f20d1ac8b8a16f06b879a8fc8ce04))
* restore missing exports in web-search.ts and correct tool name in prompts ([ebaf586](https://github.com/eres45/waspai/commit/ebaf58606df59f3d5a2e0cce7b065a7b64425f03))
* restore missing variable declaration in reasoning-detector.ts ([2c58136](https://github.com/eres45/waspai/commit/2c58136f8f3d3bb0b460ec72646e80672c935412))
* restore OCR functionality by providing raw image bytes to vision model ([42687dd](https://github.com/eres45/waspai/commit/42687dd0ae81f727d06e9e57a56317a13b0dcca4))
* restore singleton logic and add 5s Tesseract timeout ([2289134](https://github.com/eres45/waspai/commit/2289134c41147cc0fc5ab7b8b0ed423a67a6cf6c))
* restore stable stepCount usage and finalize image summary flow ([f43a30f](https://github.com/eres45/waspai/commit/f43a30f73a94b1c68c41230ab4d4c516d67ff9bd))
* restrict excessive memory usage by AI models ([34c2c0f](https://github.com/eres45/waspai/commit/34c2c0f5181a597949769eff5fef952b18834360))
* revert Steel browser tool to simpler stable navigation ([e3ff354](https://github.com/eres45/waspai/commit/e3ff35433680784df913137927775270ab000ddd))
* revert to passing userSettingsComponent as prop to avoid dynamic import issues ([814ca80](https://github.com/eres45/waspai/commit/814ca80f8d6b1ddb10e686a913a4e18ef02a3107))
* revert unsafe unawaited background promise that caused vercel container to suspend and abort render fetch, replaced with robust 5s UI wait boundary ([7f60935](https://github.com/eres45/waspai/commit/7f609353adc6cb7b9d0bc5eaa39540f852f0cca4))
* rewrite status API to use Supabase REST instead of direct PostgreSQL ([77b1483](https://github.com/eres45/waspai/commit/77b1483b0db7cf021d8601301047e2294bfdb861))
* robust URL resolution and tighter timeouts for image editing ([b04a7bf](https://github.com/eres45/waspai/commit/b04a7bfbaee9b595b496f102ea49736b77885af7))
* run openai-compatible parse script during Vercel build to ensure custom proxy models initialize ([23565d5](https://github.com/eres45/waspai/commit/23565d5cfa4ea7dcf1894aad862c5cd177040342))
* save user message before streamText to prevent thread corruption ([4873974](https://github.com/eres45/waspai/commit/4873974f9cb3235de58dd485fa34788da413d5a6))
* set Better-Auth session token cookie for middleware compatibility ([130e09e](https://github.com/eres45/waspai/commit/130e09eae93570330a50a7cdbb8d0d44d9fed2ca))
* set Qwen as default model and fix case-sensitive provider icons ([e344083](https://github.com/eres45/waspai/commit/e34408397f23aa12f58d272b9390ef0f7684a529))
* set user role to 'user' on github oauth login ([47747e8](https://github.com/eres45/waspai/commit/47747e8c5d6d3d1854520c9e48bb1b44f559681d))
* set worker AUTH_TOKEN ([83ffecc](https://github.com/eres45/waspai/commit/83ffeccd2a2ac2f2c8a5135a19c7073db42b6fd3))
* show full edited image and remove URL text from response ([171b7d6](https://github.com/eres45/waspai/commit/171b7d62dbea9f86ad381e11d8f9c2501d7ccd18))
* simplify curl command to properly capture HTTP code ([46b0886](https://github.com/eres45/waspai/commit/46b08868f33f0e8cbfa78a780e382fb076cb200d))
* status GET returns full model list ([b6d03b8](https://github.com/eres45/waspai/commit/b6d03b8a254cde300be05c957107a8441e04f65b))
* status UI handles non-JSON + clearer empty response ([4492262](https://github.com/eres45/waspai/commit/4492262bc0b0cde1acb0f3d7eac36477fd2eb277))
* strictly ignore AI SDK abortSignal so video requests are not cancelled mid-flight ([3e7c6ac](https://github.com/eres45/waspai/commit/3e7c6ac587829be488a7db4a21b1ae7489cc941c))
* strip unterminated GLM details reasoning ([448bc40](https://github.com/eres45/waspai/commit/448bc40edfc5b89655a41c213879a478d167a2ef))
* switch github oauth from better-auth to supabase ([1488b45](https://github.com/eres45/waspai/commit/1488b45de3192cfa71cab227c71c01aa009114f0))
* switch nano-banana edit API from POST to GET method ([4d3330c](https://github.com/eres45/waspai/commit/4d3330c472e1b565b8f47a81360543d22319430a))
* synchronize dependencies and stabilize OCR build (bypass husky) ([bc5034f](https://github.com/eres45/waspai/commit/bc5034f4bbbde462de6e524f11852f45e50bf0a5))
* temporarily allow test secret for GitHub Actions debugging ([267f836](https://github.com/eres45/waspai/commit/267f83659a6a0a7ddc73ccb432a021cf50f481cf))
* **tools:** force youtube-transcript to always be available ([c705332](https://github.com/eres45/waspai/commit/c705332eaefca54a322c638e16ba4f1b5d901c33))
* try multiple cookie names for session retrieval to support sign-in ([1c5009a](https://github.com/eres45/waspai/commit/1c5009af707b130215bcb2b248137c099695da3c))
* **tts:** hybrid chunking for ultra-fast TTFB and continuous playback ([9557bbb](https://github.com/eres45/waspai/commit/9557bbb435a0f3b3c5160f0afdafaac393d05301))
* **tts:** revert to full-message tts processing ([acdc2ab](https://github.com/eres45/waspai/commit/acdc2ab7ab636005c2d23efe5f129bcfd40325cb))
* TypeScript type narrowing in video-player tool ([38f81a0](https://github.com/eres45/waspai/commit/38f81a08b2fc48b6635b3a17fdc156e104809f01))
* **ui:** resolve dual scrollbars and remove duplicate generated images ([f00e664](https://github.com/eres45/waspai/commit/f00e664d0c75c0158ef3e3a8bf5000c5fdec1a33))
* universal OCR compatibility for Telegram and relative URLs ([c9523fb](https://github.com/eres45/waspai/commit/c9523fbea2bca105c57fc10a55b50ead35260e0e))
* update github oauth env variable names ([2706df8](https://github.com/eres45/waspai/commit/2706df849f27c82e34e264490350b41fdbcb5106))
* update hybrid storage validation to check BLOB_READ_WRITE_TOKEN instead of ANODROP_API_KEY ([492f306](https://github.com/eres45/waspai/commit/492f306f0b9923abf4845c783b8f48e81dc83dae))
* update session cookie when user details change ([1ef16eb](https://github.com/eres45/waspai/commit/1ef16eb11620668a8c9855373438360a20cbfa57))
* update steel-sdk to 0.17.0 and sync pnpm-lock.yaml ([28f6f6a](https://github.com/eres45/waspai/commit/28f6f6ad2824fe510c115910f1ba67fc6122edf7))
* use /api/user/me endpoint for current user settings ([2b68d8a](https://github.com/eres45/waspai/commit/2b68d8a50b0dde28c71fa4ce8394eac18a95365e))
* use correct Better Auth cookie names for session retrieval ([d554696](https://github.com/eres45/waspai/commit/d55469669e787d3c2e2fc728831ecc5d8e6ada75))
* use database update instead of better auth api for user details ([a92964f](https://github.com/eres45/waspai/commit/a92964f4ff61985d051a43275e5a8563f55cae89))
* use dedicated API endpoint for profile picture updates ([a4711c6](https://github.com/eres45/waspai/commit/a4711c61cb7e438ff7b13a036e24a5b3579d5a63))
* use dynamic player URL from liveDetails for unauthenticated Steel preview ([0dc5a65](https://github.com/eres45/waspai/commit/0dc5a65fd95dc70bbdbb0f51e0409efd1a4aa58c))
* use hardcoded secret in workflow to match API ([f46ecec](https://github.com/eres45/waspai/commit/f46ecec31c98ca04292d4a3f144837c7632d08fd))
* use pdf-parse-fork to resolve build error ([1d02185](https://github.com/eres45/waspai/commit/1d021856f5ec85b4d1602ba21fc178e1c35e1a53))
* use public sessionViewerUrl for Steel browser preview ([6ddad7a](https://github.com/eres45/waspai/commit/6ddad7ab807c0a472d2b2ca8e900682aff758e1c))
* use REST API for getUserById to avoid direct PostgreSQL connection ([7e1fd17](https://github.com/eres45/waspai/commit/7e1fd1726ee4f33405d5bfa2b133af8d57509df5))
* use simple secret waspai2024status everywhere ([b0d7d49](https://github.com/eres45/waspai/commit/b0d7d4985f8e707d97d3c61faa0c5c38af3be4c6))
* use supabase rest api for user details endpoint ([d89e088](https://github.com/eres45/waspai/commit/d89e0886fbfd5d43039a7e28818f926ab0a8de60))
* use supabase rest api for user updates instead of direct postgres ([1b5ddd3](https://github.com/eres45/waspai/commit/1b5ddd38cc2aac262cad0e8c320bbb0b9a0802b0))
* use window.location for full page reload after sign-in and add forgot password UI ([5510432](https://github.com/eres45/waspai/commit/5510432d167ca8413cf7471140f15d5e0b235961))
* **visualization:** relax create-table validation to prevent UI crashes with nested object/array inputs ([7e739ab](https://github.com/eres45/waspai/commit/7e739abb0c3a937e00419a220eaf15fee19a56c4))
* voice chat audio silence and update LOVO voice list ([eb2fe2d](https://github.com/eres45/waspai/commit/eb2fe2d1ab6eae3fbf1df2fc53d6d85716d1a1b5))
* **voice:** fix API provider and improve continuous listening reliability ([ff46440](https://github.com/eres45/waspai/commit/ff4644007eb1a3e8943948c33d0867aa3cc1e9f3))
* **voice:** prevent inline voice from reading last session message on start ([e1f84f4](https://github.com/eres45/waspai/commit/e1f84f40d6677ca40640df5896bd54d92a3a8f41))
* **voice:** skip conversation history on activation ([aeba7c5](https://github.com/eres45/waspai/commit/aeba7c54299d93d409fa832afd8f698b48bb741b))
* **web-search:** replace json-schema with zod coerce to handle stringified numResults bug from AI model ([be95d7c](https://github.com/eres45/waspai/commit/be95d7c8b7d7bcb133a0966a764ef8e4f8a1978a))
* **web-search:** resolve undefined tool results by unifying tool names and handling malformed inputs ([3272eec](https://github.com/eres45/waspai/commit/3272eecd6d92a086a15ddc6f97c7ed16df38cda5))
* **workflow:** replace Exa with SearchFlox for web search (no API key needed) ([1efa536](https://github.com/eres45/waspai/commit/1efa5364b10fbe85004ad5809c4215eb2b7c8551))
* wrap agent loading in try-catch to prevent chat errors ([fb5e474](https://github.com/eres45/waspai/commit/fb5e4749781c6c7bc904594acd6249973fa96fe5))
* **youtube:** add ref-based locking to ensure async fetch completes before message sends ([1389d7e](https://github.com/eres45/waspai/commit/1389d7e5a465b328723a9574834abbc3642e0503))
* **youtube:** improve bot detection error messages with context about IP blocking ([fb0b84e](https://github.com/eres45/waspai/commit/fb0b84e4dc285808c3e79972517ccb25cc6db7ac))
* **youtube:** remove server-side tool to prevent conflict with client-side implementation ([8bd7504](https://github.com/eres45/waspai/commit/8bd75048d32695f04fd9327bd9f3f1010a686658))
* **youtube:** use @playzone/youtube-transcript to bypass blocks ([fcf5895](https://github.com/eres45/waspai/commit/fcf5895c7808466784566b0e6c2ae9695365d3e9))


### Performance Improvements

* optimize landing page with visibility-aware shaders and lazy-loaded gifs ([14d776d](https://github.com/eres45/waspai/commit/14d776df3d16708b5bbc844bd3b98fb7e1dac9ba))
* optimize user details endpoint and greeting loading ([80d4cae](https://github.com/eres45/waspai/commit/80d4caef24b5da69fa7743c373767ee873bbcf0e))
* **prompt:** remove 4 duplicated system prompt blocks, make doc-reading conditional — saves ~5K chars/request ([36be634](https://github.com/eres45/waspai/commit/36be63432fcf1499afd9d227054a6c2ed8d94c3e))
* tighten timeouts for OCR and Image Editing to fit Vercel 10s Hobby limit ([bdbc19b](https://github.com/eres45/waspai/commit/bdbc19b90249aa9565994f75639f66a57f43e663))

## [1.25.0](https://github.com/cgoinglove/better-chatbot/compare/v1.24.0...v1.25.0) (2025-10-30)


### Features

* s3 storage and richer file support ([#301](https://github.com/cgoinglove/better-chatbot/issues/301)) ([051a974](https://github.com/cgoinglove/better-chatbot/commit/051a9740a6ecf774bfead9ce327c376ea5b279a5)) by @mrjasonroy


### Bug Fixes

* model name for gpt-4.1-mini in staticModels ([#299](https://github.com/cgoinglove/better-chatbot/issues/299)) ([4513ac0](https://github.com/cgoinglove/better-chatbot/commit/4513ac0e842f588a24d7075af8700e3cc7a3eb39)) by @mayur9210

## [1.24.0](https://github.com/cgoinglove/better-chatbot/compare/v1.23.0...v1.24.0) (2025-10-06)


### Features

* generate image Tool (Nano Banana) ([#284](https://github.com/cgoinglove/better-chatbot/issues/284)) ([984ce66](https://github.com/cgoinglove/better-chatbot/commit/984ce665ceef7225870f4eb751afaf65bf8a2dd4)) by @cgoinglove
* openai image generate ([#287](https://github.com/cgoinglove/better-chatbot/issues/287)) ([0deef6e](https://github.com/cgoinglove/better-chatbot/commit/0deef6e8a83196afb1f44444ab2f13415de20e73)) by @cgoinglove

## [1.23.0](https://github.com/cgoinglove/better-chatbot/compare/v1.22.0...v1.23.0) (2025-10-04)


### Features

* export chat thread ([#278](https://github.com/cgoinglove/better-chatbot/issues/278)) ([23e79cd](https://github.com/cgoinglove/better-chatbot/commit/23e79cd570c24bab0abc496eca639bfffcb6060b)) by @cgoinglove
* **file-storage:** image uploads, generate profile with ai ([#257](https://github.com/cgoinglove/better-chatbot/issues/257)) ([46eb43f](https://github.com/cgoinglove/better-chatbot/commit/46eb43f84792d48c450f3853b48b24419f67c7a1)) by @brrock


### Bug Fixes

* Apply DISABLE_SIGN_UP to OAuth providers ([#282](https://github.com/cgoinglove/better-chatbot/issues/282)) ([bcc0db8](https://github.com/cgoinglove/better-chatbot/commit/bcc0db8eb81997e54e8904e64fc76229fbfc1338)) by @cgoing-bot
* ollama disable issue ([#283](https://github.com/cgoinglove/better-chatbot/issues/283)) ([5e0a690](https://github.com/cgoinglove/better-chatbot/commit/5e0a690bb6c3f074680d13e09165ca9fff139f93)) by @cgoinglove

## [1.22.0](https://github.com/cgoinglove/better-chatbot/compare/v1.21.0...v1.22.0) (2025-09-25)

### Features

- admin and roles ([#270](https://github.com/cgoinglove/better-chatbot/issues/270)) ([63bddca](https://github.com/cgoinglove/better-chatbot/commit/63bddcaa4bc62bc85204a0982a06f2bed09fc5f5)) by @mrjasonroy
- groq provider ([#268](https://github.com/cgoinglove/better-chatbot/issues/268)) ([aef213d](https://github.com/cgoinglove/better-chatbot/commit/aef213d2f9dd0255996cc4184b03425db243cd7b)) by @cgoinglove
- hide LLM providers without API keys in model selection ([#269](https://github.com/cgoinglove/better-chatbot/issues/269)) ([63c15dd](https://github.com/cgoinglove/better-chatbot/commit/63c15dd386ea99b8fa56f7b6cb1e58e5779b525d)) by @cgoinglove
- **voice-chat:** binding agent tools ([#275](https://github.com/cgoinglove/better-chatbot/issues/275)) ([ed45e82](https://github.com/cgoinglove/better-chatbot/commit/ed45e822eb36447f2a02ef3aa69eeec88009e357)) by @cgoinglove

### Bug Fixes

- ensure PKCE works for MCP Server auth ([#256](https://github.com/cgoinglove/better-chatbot/issues/256)) ([09b938f](https://github.com/cgoinglove/better-chatbot/commit/09b938f17ca78993a1c7b84c5a702b95159542b2)) by @jvg123

## [1.21.0](https://github.com/cgoinglove/better-chatbot/compare/v1.20.2...v1.21.0) (2025-08-24)

### Features

- agent sharing ([#226](https://github.com/cgoinglove/better-chatbot/issues/226)) ([090dd8f](https://github.com/cgoinglove/better-chatbot/commit/090dd8f4bf4fb82beb2cd9bfa0b427425bbbf352)) by @mrjasonroy
- ai v5 ([#230](https://github.com/cgoinglove/better-chatbot/issues/230)) ([0461879](https://github.com/cgoinglove/better-chatbot/commit/0461879740860055a278c96656328367980fa533)) by @cgoinglove
- improve markdown table styling ([#244](https://github.com/cgoinglove/better-chatbot/issues/244)) ([7338e04](https://github.com/cgoinglove/better-chatbot/commit/7338e046196f72a7cc8ec7903593d94ecabcc05e)) by @hakonharnes

### Bug Fixes

- [#111](https://github.com/cgoinglove/better-chatbot/issues/111) prevent MCP server disconnection during long-running tool calls ([#238](https://github.com/cgoinglove/better-chatbot/issues/238)) ([b5bb3dc](https://github.com/cgoinglove/better-chatbot/commit/b5bb3dc40a025648ecd78f547e0e1a2edd8681ca)) by @cgoinglove

## [1.20.2](https://github.com/cgoinglove/better-chatbot/compare/v1.20.1...v1.20.2) (2025-08-09)

### Bug Fixes

- improve error display with better UX and animation handling ([#227](https://github.com/cgoinglove/better-chatbot/issues/227)) ([35d62e0](https://github.com/cgoinglove/better-chatbot/commit/35d62e05bb21760086c184511d8062444619696c)) by @cgoinglove
- **mcp:** ensure database and memory manager sync across server instances ([#229](https://github.com/cgoinglove/better-chatbot/issues/229)) ([c4b8ebe](https://github.com/cgoinglove/better-chatbot/commit/c4b8ebe9566530986951671e36111a2e529bf592)) by @cgoinglove

## [1.20.1](https://github.com/cgoinglove/better-chatbot/compare/v1.20.0...v1.20.1) (2025-08-06)

### Bug Fixes

- **mcp:** fix MCP infinite loading issue ([#220](https://github.com/cgoinglove/better-chatbot/issues/220)) ([c25e351](https://github.com/cgoinglove/better-chatbot/commit/c25e3515867c76cc5494a67e79711e9343196078)) by @cgoing-bot

## [1.20.0](https://github.com/cgoinglove/better-chatbot/compare/v1.19.1...v1.20.0) (2025-08-04)

### Features

- add qwen3 coder to models file for openrouter ([#206](https://github.com/cgoinglove/better-chatbot/issues/206)) ([3731d00](https://github.com/cgoinglove/better-chatbot/commit/3731d007100ac36a814704f8bde8398ce1378a4e)) by @brrock
- improve authentication configuration and social login handling ([#211](https://github.com/cgoinglove/better-chatbot/issues/211)) ([cd25937](https://github.com/cgoinglove/better-chatbot/commit/cd25937020710138ab82458e70ea7f6cabfd03ca)) by @mrjasonroy
- introduce interactive table creation and enhance visualization tools ([#205](https://github.com/cgoinglove/better-chatbot/issues/205)) ([623a736](https://github.com/cgoinglove/better-chatbot/commit/623a736f6895b8737acaa06811088be2dc1d0b3c)) by @cgoing-bot
- **mcp:** oauth ([#208](https://github.com/cgoinglove/better-chatbot/issues/208)) ([136aded](https://github.com/cgoinglove/better-chatbot/commit/136aded6de716367380ff64c2452d1b4afe4aa7f)) by @cgoinglove
- **web-search:** replace Tavily API with Exa AI integration ([#204](https://github.com/cgoinglove/better-chatbot/issues/204)) ([7140487](https://github.com/cgoinglove/better-chatbot/commit/7140487dcdadb6c5cb6af08f92b06d42411f7168)) by @cgoing-bot

### Bug Fixes

- implement responsive horizontal layout for chat mention input with improved UX And generate Agent Prompt ([43ec980](https://github.com/cgoinglove/better-chatbot/commit/43ec98059e0d27ab819491518263df55fb1c9ad3)) by @cgoinglove
- **mcp:** Safe MCP manager init logic for the Vercel environment ([#202](https://github.com/cgoinglove/better-chatbot/issues/202)) ([708fdfc](https://github.com/cgoinglove/better-chatbot/commit/708fdfcfed70299044a90773d3c9a76c9a139f2f)) by @cgoing-bot

## [1.19.1](https://github.com/cgoinglove/better-chatbot/compare/v1.19.0...v1.19.1) (2025-07-29)

### Bug Fixes

- **agent:** improve agent loading logic and validation handling in EditAgent component [#198](https://github.com/cgoinglove/better-chatbot/issues/198) ([ec034ab](https://github.com/cgoinglove/better-chatbot/commit/ec034ab51dfc656d7378eca1e2b4dc94fbb67863)) by @cgoinglove
- **agent:** update description field to allow nullish values in ChatMentionSchema ([3e4532d](https://github.com/cgoinglove/better-chatbot/commit/3e4532d4c7b561ad03836c743eefb7cd35fe9e74)) by @cgoinglove
- **i18n:** update agent description fields in English, Spanish, and French JSON files to improve clarity and consistency ([f07d1c4](https://github.com/cgoinglove/better-chatbot/commit/f07d1c4dc64b96584faa7e558f981199834a5370)) by @cgoinglove
- Invalid 'tools': array too long. Expected an array with maximum length 128, but got an array with length 217 instead. [#197](https://github.com/cgoinglove/better-chatbot/issues/197) ([b967e3a](https://github.com/cgoinglove/better-chatbot/commit/b967e3a30be3a8a48f3801b916e26ac4d7dd50f4)) by @cgoinglove

## [1.19.0](https://github.com/cgoinglove/better-chatbot/compare/v1.18.0...v1.19.0) (2025-07-28)

### Features

- Add Azure OpenAI provider support with comprehensive testing ([#189](https://github.com/cgoinglove/better-chatbot/issues/189)) ([edad917](https://github.com/cgoinglove/better-chatbot/commit/edad91707d49fcb5d3bd244a77fbaae86527742a)) by @shukyr
- add bot name preference to user settings ([f4aa588](https://github.com/cgoinglove/better-chatbot/commit/f4aa5885d0be06cc21149d09e604c781e551ec4a)) by @cgoinglove
- **agent:** agent and archive ([#192](https://github.com/cgoinglove/better-chatbot/issues/192)) ([c63ae17](https://github.com/cgoinglove/better-chatbot/commit/c63ae179363b66bfa4f4b5524bdf27b71166c299)) by @cgoinglove

### Bug Fixes

- enhance event handling for keyboard shortcuts in chat components ([95dad3b](https://github.com/cgoinglove/better-chatbot/commit/95dad3bd1dac4b6e56be2df35957a849617ba056)) by @cgoinglove
- refine thinking prompt condition in chat API ([0192151](https://github.com/cgoinglove/better-chatbot/commit/0192151fec1e33f3b7bc1f08b0a9582d66650ef0)) by @cgoinglove

## [1.18.0](https://github.com/cgoinglove/better-chatbot/compare/v1.17.1...v1.18.0) (2025-07-24)

### Features

- add sequential thinking tool and enhance UI components ([#183](https://github.com/cgoinglove/better-chatbot/issues/183)) ([5bcbde2](https://github.com/cgoinglove/better-chatbot/commit/5bcbde2de776b17c3cc1f47f4968b13e22fc65b2)) by @cgoinglove

## [1.17.1](https://github.com/cgoinglove/better-chatbot/compare/v1.17.0...v1.17.1) (2025-07-23)

### Bug Fixes

- ensure thread date fallback to current date in AppSidebarThreads component ([800b504](https://github.com/cgoinglove/better-chatbot/commit/800b50498576cfe1717da4385e2a496ac33ea0ad)) by @cgoinglove
- link to the config generator correctly ([#184](https://github.com/cgoinglove/better-chatbot/issues/184)) ([1865ecc](https://github.com/cgoinglove/better-chatbot/commit/1865ecc269e567838bc391a3236fcce82c213fc0)) by @brrock
- python executor ([ea58742](https://github.com/cgoinglove/better-chatbot/commit/ea58742cccd5490844b3139a37171b1b68046f85)) by @cgoinglove

## [1.17.0](https://github.com/cgoinglove/better-chatbot/compare/v1.16.0...v1.17.0) (2025-07-18)

### Features

- add Python execution tool and integrate Pyodide support ([#176](https://github.com/cgoinglove/better-chatbot/issues/176)) ([de2cf7b](https://github.com/cgoinglove/better-chatbot/commit/de2cf7b66444fe64791ed142216277a5f2cdc551)) by @cgoinglove

### Bug Fixes

- generate title by user message ([9ee4be6](https://github.com/cgoinglove/better-chatbot/commit/9ee4be69c6b90f44134d110e90f9c3da5219c79f)) by @cgoinglove
- generate title sync ([5f3afdc](https://github.com/cgoinglove/better-chatbot/commit/5f3afdc4cb7304460606b3480f54f513ef24940c)) by @cgoinglove

## [1.16.0](https://github.com/cgoinglove/better-chatbot/compare/v1.15.0...v1.16.0) (2025-07-15)

### Features

- Lazy Chat Title Generation: Save Empty Title First, Then Generate and Upsert in Parallel ([#162](https://github.com/cgoinglove/better-chatbot/issues/162)) ([31dfd78](https://github.com/cgoinglove/better-chatbot/commit/31dfd7802e33d8d4e91aae321c3d16a07fe42552)) by @cgoinglove
- publish container to GitHub registry ([#149](https://github.com/cgoinglove/better-chatbot/issues/149)) ([9f03cbc](https://github.com/cgoinglove/better-chatbot/commit/9f03cbc1d2890746f14919ebaad60f773b0a333d)) by @codingjoe
- update mention ux ([#161](https://github.com/cgoinglove/better-chatbot/issues/161)) ([7ceb9c6](https://github.com/cgoinglove/better-chatbot/commit/7ceb9c69c32de25d523a4d14623b25a34ffb3c9d)) by @cgoinglove

### Bug Fixes

- bug(LineChart): series are incorrectly represented [#165](https://github.com/cgoinglove/better-chatbot/issues/165) ([4e4905c](https://github.com/cgoinglove/better-chatbot/commit/4e4905c0f7f6a3eca73ea2ac06f718fa29b0f821)) by @cgoinglove
- ignore tool binding on unsupported models (server-side) ([#160](https://github.com/cgoinglove/better-chatbot/issues/160)) ([277b4fe](https://github.com/cgoinglove/better-chatbot/commit/277b4fe986d5b6d9780d9ade83f294d8f34806f6)) by @cgoinglove
- js executor tool and gemini model version ([#169](https://github.com/cgoinglove/better-chatbot/issues/169)) ([e25e10a](https://github.com/cgoinglove/better-chatbot/commit/e25e10ab9fac4247774b0dee7e01d5f6a4b16191)) by @cgoinglove
- **scripts:** parse openai compatible on windows ([#164](https://github.com/cgoinglove/better-chatbot/issues/164)) ([41f5ff5](https://github.com/cgoinglove/better-chatbot/commit/41f5ff55b8d17c76a23a2abf4a6e4cb0c4d95dc5)) by @axel7083
- **workflow-panel:** fix save button width ([#168](https://github.com/cgoinglove/better-chatbot/issues/168)) ([3e66226](https://github.com/cgoinglove/better-chatbot/commit/3e6622630c9cc40ff3d4357e051c45f8c860fc10)) by @axel7083

## [1.15.0](https://github.com/cgoinglove/better-chatbot/compare/v1.14.1...v1.15.0) (2025-07-11)

### Features

- Add js-execution tool and bug fixes(tool call) ([#148](https://github.com/cgoinglove/better-chatbot/issues/148)) ([12b18a1](https://github.com/cgoinglove/better-chatbot/commit/12b18a1cf31a17e565eddc05764b5bd2d0b0edee)) by @cgoinglove

### Bug Fixes

- enhance ToolModeDropdown with tooltip updates and debounce functionality ([d06db0b](https://github.com/cgoinglove/better-chatbot/commit/d06db0b3e1db34dc4785eb31ebd888d7c2ae0d64)) by @cgoinglove

## [1.14.1](https://github.com/cgoinglove/better-chatbot/compare/v1.14.0...v1.14.1) (2025-07-09)

### Bug Fixes

- tool select ui ([#141](https://github.com/cgoinglove/better-chatbot/issues/141)) ([0795524](https://github.com/cgoinglove/better-chatbot/commit/0795524991a7aa3e17990777ca75381e32eaa547)) by @cgoinglove

## [1.14.0](https://github.com/cgoinglove/better-chatbot/compare/v1.13.0...v1.14.0) (2025-07-07)

### Features

- web-search with images ([bea76b3](https://github.com/cgoinglove/better-chatbot/commit/bea76b3a544d4cf5584fa29e5c509b0aee1d4fee)) by @cgoinglove
- **workflow:** add auto layout feature for workflow nodes and update UI messages ([0cfbffd](https://github.com/cgoinglove/better-chatbot/commit/0cfbffd631c9ae5c6ed57d47ca5f34b9acbb257d)) by @cgoinglove
- **workflow:** stable workflow ( add example workflow : baby-research ) ([#137](https://github.com/cgoinglove/better-chatbot/issues/137)) ([c38a7ea](https://github.com/cgoinglove/better-chatbot/commit/c38a7ea748cdb117a4d0f4b886e3d8257a135956)) by @cgoinglove

### Bug Fixes

- **api:** handle error case in chat route by using orElse for unwrap ([25580a2](https://github.com/cgoinglove/better-chatbot/commit/25580a2a9f6c9fbc4abc29fee362dc4b4f27f9b4)) by @cgoinglove
- **workflow:** llm structure Output ([c529292](https://github.com/cgoinglove/better-chatbot/commit/c529292ddc1a4b836a5921e25103598afd7e3ab7)) by @cgoinglove

## [1.13.0](https://github.com/cgoinglove/better-chatbot/compare/v1.12.1...v1.13.0) (2025-07-04)

### Features

- Add web search and content extraction tools using Tavily API ([#126](https://github.com/cgoinglove/better-chatbot/issues/126)) ([f7b4ea5](https://github.com/cgoinglove/better-chatbot/commit/f7b4ea5828b33756a83dd881b9afa825796bf69f)) by @cgoing-bot

### Bug Fixes

- workflow condition node issue ([78b7add](https://github.com/cgoinglove/better-chatbot/commit/78b7addbba51b4553ec5d0ce8961bf90be5d649c)) by @cgoinglove
- **workflow:** improve mention handling by ensuring empty values are represented correctly ([92ff9c3](https://github.com/cgoinglove/better-chatbot/commit/92ff9c3e14b97d9f58a22f9df2559e479f14537c)) by @cgoinglove
- **workflow:** simplify mention formatting by removing bold styling for non-empty values ([ef65fd7](https://github.com/cgoinglove/better-chatbot/commit/ef65fd713ab59c7d8464cae480df7626daeff5cd)) by @cgoinglove

## [1.12.1](https://github.com/cgoinglove/better-chatbot/compare/v1.12.0...v1.12.1) (2025-07-02)

### Bug Fixes

- **workflow:** enhance structured output handling and improve user notifications ([dd43de9](https://github.com/cgoinglove/better-chatbot/commit/dd43de99881d64ca0c557e29033e953bcd4adc0e)) by @cgoinglove

## [1.12.0](https://github.com/cgoinglove/better-chatbot/compare/v1.11.0...v1.12.0) (2025-07-01)

### Features

- **chat:** enable [@mention](https://github.com/mention) and tool click to trigger workflow execution in chat ([#122](https://github.com/cgoinglove/better-chatbot/issues/122)) ([b4e7f02](https://github.com/cgoinglove/better-chatbot/commit/b4e7f022fa155ef70be2aee9228a4d1d2643bf10)) by @cgoing-bot

### Bug Fixes

- clean changlelog and stop duplicate attributions in the changelog file ([#119](https://github.com/cgoinglove/better-chatbot/issues/119)) ([aa970b6](https://github.com/cgoinglove/better-chatbot/commit/aa970b6a2d39ac1f0ca22db761dd452e3c7a5542)) by @brrock

## [1.11.0](https://github.com/cgoinglove/better-chatbot/compare/v1.10.0...v1.11.0) (2025-06-28)

### Features

- **workflow:** Add HTTP and Template nodes with LLM structured output supportWorkflow node ([#117](https://github.com/cgoinglove/better-chatbot/issues/117)) ([10ec438](https://github.com/cgoinglove/better-chatbot/commit/10ec438f13849f0745e7fab652cdd7cef8e97ab6)) by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot
- **workflow:** add HTTP node configuration and execution support ([7d2f65f](https://github.com/cgoinglove/better-chatbot/commit/7d2f65fe4f0fdaae58ca2a69abb04abee3111c60)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

### Bug Fixes

- add POST endpoint for MCP client saving with session validation ([fa005aa](https://github.com/cgoinglove/better-chatbot/commit/fa005aaecbf1f8d9279f5b4ce5ba85343e18202b)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- split theme system into base themes and style variants ([61ebd07](https://github.com/cgoinglove/better-chatbot/commit/61ebd0745bcfd7a84ba3ad65c3f52b7050b5131a)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- update ToolMessagePart to use isExecuting state instead of isExpanded ([752f8f0](https://github.com/cgoinglove/better-chatbot/commit/752f8f06e319119569e9ee7c04d621ab1c43ca54)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

## [1.10.0](https://github.com/cgoinglove/better-chatbot/compare/v1.9.0...v1.10.0) (2025-06-27)

### Features

- **releases:** add debug logging to the add authors and update release step ([#105](https://github.com/cgoinglove/better-chatbot/issues/105)) ([c855a6a](https://github.com/cgoinglove/better-chatbot/commit/c855a6a94c49dfd93c9a8d1d0932aeda36bd6c7e)) by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock
- workflow beta ([#100](https://github.com/cgoinglove/better-chatbot/issues/100)) ([2f5ada2](https://github.com/cgoinglove/better-chatbot/commit/2f5ada2a66e8e3cd249094be9d28983e4331d3a1)) by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot

### Bug Fixes

- update tool selection logic in McpServerSelector to maintain current selections ([4103c1b](https://github.com/cgoinglove/better-chatbot/commit/4103c1b828c3e5b513679a3fb9d72bd37301f99d)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- **workflow:** MPC Tool Response Structure And Workflow ([#113](https://github.com/cgoinglove/better-chatbot/issues/113)) ([836ffd7](https://github.com/cgoinglove/better-chatbot/commit/836ffd7ef5858210bdce44d18ca82a1c8f0fc87f)) by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot

## [1.9.0](https://github.com/cgoinglove/better-chatbot/compare/v1.8.0...v1.9.0) (2025-06-16)

### Features

- credit contributors in releases and changlogs ([#104](https://github.com/cgoinglove/better-chatbot/issues/104)) ([e0e4443](https://github.com/cgoinglove/better-chatbot/commit/e0e444382209a36f03b6e898f26ebd805032c306)) by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock

### Bug Fixes

- increase maxTokens for title generation in chat actions issue [#102](https://github.com/cgoinglove/better-chatbot/issues/102) ([bea2588](https://github.com/cgoinglove/better-chatbot/commit/bea2588e24cf649133e8ce5f3b6391265b604f06)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- temporary chat initial model ([0393f7a](https://github.com/cgoinglove/better-chatbot/commit/0393f7a190463faf58cbfbca1c21d349a9ff05dc)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- update adding-openAI-like-providers.md ([#101](https://github.com/cgoinglove/better-chatbot/issues/101)) ([2bb94e7](https://github.com/cgoinglove/better-chatbot/commit/2bb94e7df63a105e33c1d51271751c7b89fead23)) by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock
- update config file path in release workflow ([7209cbe](https://github.com/cgoinglove/better-chatbot/commit/7209cbeb89bd65b14aee66a40ed1abb5c5f2e018)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

## [1.8.0](https://github.com/cgoinglove/better-chatbot/compare/v1.7.0...v1.8.0) (2025-06-11)

### Features

- add openAI compatible provider support ([#92](https://github.com/cgoinglove/better-chatbot/issues/92)) ([6682c9a](https://github.com/cgoinglove/better-chatbot/commit/6682c9a320aff9d91912489661d27ae9bb0f4440)) by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock by @brrock

### Bug Fixes

- Enhance component styles and configurations ([a7284f1](https://github.com/cgoinglove/better-chatbot/commit/a7284f12ca02ee29f7da4d57e4fe6e8c6ecb2dfc)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

## [1.7.0](https://github.com/cgoinglove/better-chatbot/compare/v1.6.2...v1.7.0) (2025-06-06)

### Features

- Per User Custom instructions ([#86](https://github.com/cgoinglove/better-chatbot/issues/86)) ([d45c968](https://github.com/cgoinglove/better-chatbot/commit/d45c9684adfb0d9b163c83f3bb63310eef572279)) by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu by @vineetu

## [1.6.2](https://github.com/cgoinglove/better-chatbot/compare/v1.6.1...v1.6.2) (2025-06-04)

### Bug Fixes

- enhance error handling in chat bot component ([1519799](https://github.com/cgoinglove/better-chatbot/commit/15197996ba1f175db002b06e3eac2765cfae1518)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- improve session error handling in authentication ([eb15b55](https://github.com/cgoinglove/better-chatbot/commit/eb15b550facf5368f990d58b4b521bf15aecbf72)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- support OpenAI real-time chat project instructions ([2ebbb5e](https://github.com/cgoinglove/better-chatbot/commit/2ebbb5e68105ef6706340a6cfbcf10b4d481274a)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- unify SSE and streamable config as RemoteConfig ([#85](https://github.com/cgoinglove/better-chatbot/issues/85)) ([66524a0](https://github.com/cgoinglove/better-chatbot/commit/66524a0398bd49230fcdec73130f1eb574e97477)) by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot

## [1.6.1](https://github.com/cgoinglove/better-chatbot/compare/v1.6.0...v1.6.1) (2025-06-02)

### Bug Fixes

- speech ux ([baa849f](https://github.com/cgoinglove/better-chatbot/commit/baa849ff2b6b147ec685c6847834385652fc3191)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

## [1.6.0](https://github.com/cgoinglove/better-chatbot/compare/v1.5.2...v1.6.0) (2025-06-01)

### Features

- add husky for formatting and checking commits ([#71](https://github.com/cgoinglove/better-chatbot/issues/71)) ([a379cd3](https://github.com/cgoinglove/better-chatbot/commit/a379cd3e869b5caab5bcaf3b03f5607021f988ef)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- add Spanish, French, Japanese, and Chinese language support with UI improvements ([#74](https://github.com/cgoinglove/better-chatbot/issues/74)) ([e34d43d](https://github.com/cgoinglove/better-chatbot/commit/e34d43df78767518f0379a434f8ffb1808b17e17)) by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot
- implement cold start-like auto connection for MCP server and simplify status ([#73](https://github.com/cgoinglove/better-chatbot/issues/73)) ([987c442](https://github.com/cgoinglove/better-chatbot/commit/987c4425504d6772e0aefe08b4e1911e4cb285c1)) by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot by @cgoing-bot

## [1.5.2](https://github.com/cgoinglove/better-chatbot/compare/v1.5.1...v1.5.2) (2025-06-01)

### Features

- Add support for Streamable HTTP Transport [#56](https://github.com/cgoinglove/better-chatbot/issues/56) ([8783943](https://github.com/cgoinglove/better-chatbot/commit/878394337e3b490ec2d17bcc302f38c695108d73)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- implement speech system prompt and update voice chat options for enhanced user interaction ([5a33626](https://github.com/cgoinglove/better-chatbot/commit/5a336260899ab542407c3c26925a147c1a9bba11)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- update MCP server UI and translations for improved user experience ([1e2fd31](https://github.com/cgoinglove/better-chatbot/commit/1e2fd31f8804669fbcf55a4c54ccf0194a7e797c)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

### Bug Fixes

- enhance mobile UI experience with responsive design adjustments ([2eee8ba](https://github.com/cgoinglove/better-chatbot/commit/2eee8bab078207841f4d30ce7708885c7268302e)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove
- UI improvements for mobile experience ([#66](https://github.com/cgoinglove/better-chatbot/issues/66)) ([b4349ab](https://github.com/cgoinglove/better-chatbot/commit/b4349abf75de69f65a44735de2e0988c6d9d42d8)) by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove by @cgoinglove

### Miscellaneous Chores

- release 1.5.2 ([d185514](https://github.com/cgoinglove/better-chatbot/commit/d1855148cfa53ea99c9639f8856d0e7c58eca020)) by @cgoinglove

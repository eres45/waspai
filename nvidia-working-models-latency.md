# NVIDIA Working Models Latency Report (First 10 Tested)

* **Date tested:** 2026-05-27
* **API Endpoint:** `https://integrate.api.nvidia.com/v1`

Below are the models from the first batch of 10 that successfully responded, sorted by latency (fastest first):

| Model ID | Provider | Status | Latency (ms) | Sample Response |
|---|---|---|---|---|
| `meta/llama-3.1-8b-instruct` | Meta | ✅ Working | 232 ms | "How can I assist you today?" |
| `google/gemma-2-2b-it` | Google | ✅ Working | 290 ms | "Hi! 👋 How can I help you today" |
| `meta/llama-3.2-11b-vision-instruct` | Meta | ✅ Working | 339 ms | "How can I assist you today?" |
| `google/gemma-3n-e2b-it` | Google | ✅ Working | 770 ms | "Hi there! 👋 How can I help" |
| `google/gemma-3n-e4b-it` | Google | ✅ Working | 1167 ms | "Hi there! 👋 How can I help" |
| `meta/llama-3.1-70b-instruct` | Meta | ✅ Working | 3488 ms | "It's nice to meet you. Is there something" |

## Excluded (Failed/Timed Out)
* `abacusai/dracarys-llama-3.1-70b-instruct` (Timeout > 15s)
* `google/gemma-4-31b-it` (Timeout > 15s)
* `meta/llama-3.2-1b-instruct` (Timeout > 15s)
* `ibm/granite-guardian-3.0-8b` (Bad Payload/Response format)


## Batch 2 Model Testing Results (Tested across all 4 Keys)
Below are the results for the second batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `meta/llama-3.2-3b-instruct` | ✅ 397ms | ✅ 269ms | ✅ 273ms | ✅ 368ms | "How can I assist you" |
| `meta/llama-3.2-90b-vision-instruct` | ✅ 539ms | ✅ 935ms | ✅ 465ms | ✅ 917ms | "It's nice to meet" |
| `meta/llama-3.3-70b-instruct` | ✅ 270ms | ✅ 273ms | ✅ 548ms | ✅ 252ms | "It's nice to meet" |
| `meta/llama-4-maverick-17b-128e-instruct` | ✅ 795ms | ✅ 1038ms | ✅ 1036ms | ✅ 973ms | "Hello! How are you" |
| `meta/llama-guard-4-12b` | ✅ 639ms | ✅ 741ms | ✅ 609ms | ✅ 244ms | "safe" |
| `microsoft/phi-3.5-vision-instruct` | ❌ Fail (33ms) | ❌ Fail (31ms) | ❌ Fail (176ms) | ❌ Fail (30ms) | "N/A" |
| `microsoft/phi-4-multimodal-instruct` | ✅ 248ms | ✅ 383ms | ✅ 503ms | ✅ 243ms | "Hello! How can I" |
| `mistralai/ministral-14b-instruct-2512` | ✅ 695ms | ✅ 279ms | ✅ 1389ms | ✅ 261ms | "Hello! 😊" |
| `mistralai/mistral-7b-instruct-v0.3` | ❌ Fail (150ms) | ❌ Fail (68ms) | ❌ Fail (36ms) | ❌ Fail (37ms) | "N/A" |
| `mistralai/mistral-large-3-675b-instruct-2512` | ❌ Fail (5013ms) | ❌ Fail (5007ms) | ❌ Fail (5011ms) | ✅ 3858ms | "Hello! How can I" |


## Batch 3 Model Testing Results (Tested across all 4 Keys)
Below are the results for the third batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `mistralai/mistral-nemotron` | ✅ 653ms | ❌ Fail (5010ms) | ❌ Fail (5015ms) | ✅ 445ms | "Hello! How can I" |
| `mistralai/mistral-small-4-119b-2603` | ✅ 388ms | ✅ 677ms | ✅ 326ms | ✅ 305ms | "Hello! 😊" |
| `mistralai/mixtral-8x7b-instruct-v0.1` | ✅ 806ms | ✅ 1029ms | ✅ 1514ms | ✅ 769ms | "Hello! How can I" |
| `nvidia/gliner-pii` | ✅ 281ms | ✅ 219ms | ✅ 227ms | ✅ 2225ms | "{"total_entities": 0, "entities": [], "tagged_text": "Hi"}" |
| `nvidia/llama-3.1-nemoguard-8b-content-safety` | ✅ 663ms | ✅ 625ms | ✅ 649ms | ✅ 710ms | "{"User Safety": "" |
| `nvidia/llama-3.1-nemoguard-8b-topic-control` | ✅ 642ms | ✅ 249ms | ✅ 238ms | ✅ 249ms | "on-topic" |
| `nvidia/llama-3.1-nemotron-nano-8b-v1` | ❌ Fail (5005ms) | ❌ Fail (5011ms) | ❌ Fail (5016ms) | ❌ Fail (5004ms) | "N/A" |
| `nvidia/llama-3.1-nemotron-nano-vl-8b-v1` | ✅ 319ms | ✅ 643ms | ✅ 615ms | ✅ 719ms | "Hello! How can I" |
| `nvidia/llama-3.1-nemotron-safety-guard-8b-v3` | ✅ 758ms | ✅ 484ms | ✅ 568ms | ✅ 299ms | "{"User Safety": "" |
| `nvidia/llama-3.3-nemotron-super-49b-v1.5` | ✅ 434ms | ✅ 531ms | ✅ 727ms | ✅ 576ms | "N/A" |


## Batch 4 Model Testing Results (Tested across all 4 Keys)
Below are the results for the final batch of 16 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `nvidia/nemotron-3-nano-30b-a3b` | ✅ 387ms | ✅ 256ms | ✅ 258ms | ✅ 539ms | "N/A" |
| `nvidia/nemotron-3-super-120b-a12b` | ✅ 4073ms | ✅ 2751ms | ❌ Fail (5011ms) | ✅ 1057ms | "Okay, the user just" |
| `nvidia/nemotron-content-safety-reasoning-4b` | ✅ 409ms | ✅ 380ms | ✅ 288ms | ✅ 268ms | "Hi there! How'" |
| `nvidia/nemotron-mini-4b-instruct` | ✅ 469ms | ✅ 1406ms | ✅ 611ms | ✅ 449ms | "Hello! How can I" |
| `nvidia/nemotron-nano-12b-v2-vl` | ✅ 467ms | ✅ 3274ms | ✅ 334ms | ✅ 4781ms | "Hello! How can I" |
| `nvidia/nvidia-nemotron-nano-9b-v2` | ✅ 412ms | ✅ 435ms | ✅ 301ms | ✅ 396ms | "N/A" |
| `nvidia/riva-translate-4b-instruct-v1.1` | ✅ 281ms | ✅ 608ms | ✅ 628ms | ✅ 207ms | "Hi" |
| `openai/gpt-oss-120b` | ✅ 444ms | ✅ 696ms | ✅ 292ms | ✅ 217ms | "N/A" |
| `openai/gpt-oss-20b` | ✅ 223ms | ✅ 218ms | ✅ 661ms | ✅ 346ms | "N/A" |
| `qwen/qwen3-coder-480b-a35b-instruct` | ❌ Fail (5010ms) | ✅ 4517ms | ✅ 1616ms | ✅ 2806ms | "Hello! How can I" |
| `qwen/qwen3-next-80b-a3b-instruct` | ❌ Fail (5004ms) | ❌ Fail (5006ms) | ❌ Fail (5002ms) | ❌ Fail (5005ms) | "N/A" |
| `qwen/qwen3.5-397b-a17b` | ❌ Fail (920ms) | ✅ 2532ms | ✅ 574ms | ✅ 936ms | "Hello! How can I" |
| `sarvamai/sarvam-m` | ✅ 374ms | ✅ 358ms | ✅ 342ms | ✅ 353ms | "Okay, the user just" |
| `stepfun-ai/step-3.5-flash` | ✅ 2850ms | ✅ 877ms | ✅ 324ms | ❌ Fail (5012ms) | "N/A" |
| `stockmark/stockmark-2-100b-instruct` | ✅ 425ms | ✅ 498ms | ✅ 468ms | ✅ 431ms | "こんにちは!何かお手伝いできる" |
| `upstage/solar-10.7b-instruct` | ✅ 381ms | ✅ 346ms | ✅ 311ms | ✅ 317ms | "Hello there! How can" |


## Discovered Working Live Models (From remaining 76 models)
Below are the additional live models that successfully responded:

| Model ID | Status | Latency | Sample Response |
|---|---|---|---|
| `bytedance/seed-oss-36b-instruct` | ✅ Working | 4808ms | "" |
| `mistralai/mistral-medium-3.5-128b` | ✅ Working | 388ms | "Hello! How can I" |
| `nvidia/ising-calibration-1-35b-a3b` | ✅ Working | 3936ms | "Hey! I'm NVIDIA" |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | ✅ Working | 757ms | "**Hello!**  It" |
| `nvidia/nemotron-3-content-safety` | ✅ Working | 336ms | "User Safety: safe" |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | ✅ Working | 227ms | "" |
| `qwen/qwen3.5-122b-a10b` | ✅ Working | 2285ms | "" |


## Batch 5 Model Testing Results (Tested across all 4 Keys)
Below are the results for the fifth batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `01-ai/yi-large` | ❌ Fail (335ms) | ❌ Fail (70ms) | ❌ Fail (72ms) | ❌ Fail (75ms) | "N/A" |
| `adept/fuyu-8b` | ❌ Fail (66ms) | ❌ Fail (71ms) | ❌ Fail (105ms) | ❌ Fail (70ms) | "N/A" |
| `ai21labs/jamba-1.5-large-instruct` | ❌ Fail (69ms) | ❌ Fail (85ms) | ❌ Fail (55ms) | ❌ Fail (171ms) | "N/A" |
| `aisingapore/sea-lion-7b-instruct` | ❌ Fail (41ms) | ❌ Fail (86ms) | ❌ Fail (115ms) | ❌ Fail (107ms) | "N/A" |
| `baai/bge-m3` | ❌ Fail (173ms) | ❌ Fail (91ms) | ❌ Fail (129ms) | ❌ Fail (314ms) | "N/A" |
| `bigcode/starcoder2-15b` | ❌ Fail (56ms) | ❌ Fail (33ms) | ❌ Fail (31ms) | ❌ Fail (35ms) | "N/A" |
| `bytedance/seed-oss-36b-instruct` | ❌ Fail (5012ms) | ❌ Fail (5011ms) | ❌ Fail (5014ms) | ❌ Fail (5009ms) | "N/A" |
| `databricks/dbrx-instruct` | ❌ Fail (64ms) | ❌ Fail (56ms) | ❌ Fail (80ms) | ❌ Fail (52ms) | "N/A" |
| `deepseek-ai/deepseek-coder-6.7b-instruct` | ❌ Fail (125ms) | ❌ Fail (220ms) | ❌ Fail (54ms) | ❌ Fail (57ms) | "N/A" |
| `deepseek-ai/deepseek-v4-flash` | ❌ Fail (5007ms) | ❌ Fail (5012ms) | ❌ Fail (5011ms) | ❌ Fail (5006ms) | "N/A" |


## Batch 6 Model Testing Results (Tested across all 4 Keys)
Below are the results for the sixth batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `deepseek-ai/deepseek-v4-pro` | ❌ Fail (5016ms) | ❌ Fail (5004ms) | ❌ Fail (5010ms) | ❌ Fail (5001ms) | "N/A" |
| `google/codegemma-1.1-7b` | ❌ Fail (72ms) | ❌ Fail (58ms) | ❌ Fail (61ms) | ❌ Fail (63ms) | "N/A" |
| `google/codegemma-7b` | ❌ Fail (59ms) | ❌ Fail (73ms) | ❌ Fail (82ms) | ❌ Fail (56ms) | "N/A" |
| `google/deplot` | ❌ Fail (57ms) | ❌ Fail (55ms) | ❌ Fail (74ms) | ❌ Fail (89ms) | "N/A" |
| `google/gemma-2b` | ❌ Fail (94ms) | ❌ Fail (411ms) | ❌ Fail (55ms) | ❌ Fail (53ms) | "N/A" |
| `google/gemma-3-12b-it` | ❌ Fail (68ms) | ❌ Fail (55ms) | ❌ Fail (56ms) | ❌ Fail (71ms) | "N/A" |
| `google/gemma-3-4b-it` | ❌ Fail (60ms) | ❌ Fail (68ms) | ❌ Fail (52ms) | ❌ Fail (55ms) | "N/A" |
| `google/recurrentgemma-2b` | ❌ Fail (59ms) | ❌ Fail (146ms) | ❌ Fail (53ms) | ❌ Fail (70ms) | "N/A" |
| `ibm/granite-3.0-3b-a800m-instruct` | ❌ Fail (65ms) | ❌ Fail (93ms) | ❌ Fail (55ms) | ❌ Fail (96ms) | "N/A" |
| `ibm/granite-3.0-8b-instruct` | ❌ Fail (128ms) | ❌ Fail (67ms) | ❌ Fail (68ms) | ❌ Fail (55ms) | "N/A" |


## Batch 7 Model Testing Results (Tested across all 4 Keys)
Below are the results for the seventh batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `ibm/granite-34b-code-instruct` | ❌ Fail (194ms) | ❌ Fail (58ms) | ❌ Fail (70ms) | ❌ Fail (59ms) | "N/A" |
| `ibm/granite-8b-code-instruct` | ❌ Fail (51ms) | ❌ Fail (132ms) | ❌ Fail (89ms) | ❌ Fail (57ms) | "N/A" |
| `meta/codellama-70b` | ❌ Fail (85ms) | ❌ Fail (222ms) | ❌ Fail (63ms) | ❌ Fail (54ms) | "N/A" |
| `meta/llama2-70b` | ❌ Fail (51ms) | ❌ Fail (57ms) | ❌ Fail (63ms) | ❌ Fail (61ms) | "N/A" |
| `microsoft/kosmos-2` | ❌ Fail (68ms) | ❌ Fail (547ms) | ❌ Fail (475ms) | ❌ Fail (59ms) | "N/A" |
| `microsoft/phi-3-vision-128k-instruct` | ❌ Fail (70ms) | ❌ Fail (54ms) | ❌ Fail (64ms) | ❌ Fail (64ms) | "N/A" |
| `microsoft/phi-3.5-moe-instruct` | ❌ Fail (64ms) | ❌ Fail (68ms) | ❌ Fail (59ms) | ❌ Fail (56ms) | "N/A" |
| `microsoft/phi-4-mini-instruct` | ✅ 546ms | ✅ 311ms | ✅ 247ms | ❌ Fail (5016ms) | "Hello! How can I" |
| `minimaxai/minimax-m2.7` | ❌ Fail (5001ms) | ❌ Fail (5015ms) | ❌ Fail (5014ms) | ❌ Fail (5012ms) | "N/A" |
| `mistralai/codestral-22b-instruct-v0.1` | ❌ Fail (276ms) | ❌ Fail (33ms) | ❌ Fail (52ms) | ❌ Fail (48ms) | "N/A" |


## Batch 8 Model Testing Results (Tested across all 4 Keys)
Below are the results for the eighth batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `mistralai/mistral-large` | ❌ Fail (315ms) | ❌ Fail (91ms) | ❌ Fail (88ms) | ❌ Fail (365ms) | "N/A" |
| `mistralai/mistral-large-2-instruct` | ❌ Fail (262ms) | ❌ Fail (157ms) | ❌ Fail (156ms) | ❌ Fail (133ms) | "N/A" |
| `mistralai/mistral-medium-3.5-128b` | ✅ 412ms | ✅ 733ms | ✅ 398ms | ✅ 468ms | "Hello! How can I" |
| `mistralai/mixtral-8x22b-v0.1` | ❌ Fail (385ms) | ❌ Fail (38ms) | ❌ Fail (100ms) | ❌ Fail (51ms) | "N/A" |
| `moonshotai/kimi-k2.6` | ✅ 434ms | ✅ 439ms | ✅ 1222ms | ❌ Fail (5008ms) | "Hello! How can I" |
| `nv-mistralai/mistral-nemo-12b-instruct` | ❌ Fail (57ms) | ❌ Fail (65ms) | ❌ Fail (81ms) | ❌ Fail (186ms) | "N/A" |
| `nvidia/ai-synthetic-video-detector` | ❌ Fail (267ms) | ❌ Fail (247ms) | ❌ Fail (186ms) | ❌ Fail (177ms) | "N/A" |
| `nvidia/cosmos-reason2-8b` | ❌ Fail (89ms) | ❌ Fail (69ms) | ❌ Fail (59ms) | ❌ Fail (59ms) | "N/A" |
| `nvidia/embed-qa-4` | ❌ Fail (285ms) | ❌ Fail (52ms) | ❌ Fail (54ms) | ❌ Fail (55ms) | "N/A" |
| `nvidia/ising-calibration-1-35b-a3b` | ✅ 504ms | ✅ 442ms | ✅ 881ms | ✅ 417ms | "Hey! I'm NVIDIA" |


## Batch 9 Model Testing Results (Tested across all 4 Keys)
Below are the results for the ninth batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `nvidia/llama-3.1-nemotron-51b-instruct` | ❌ Fail (251ms) | ❌ Fail (222ms) | ❌ Fail (85ms) | ❌ Fail (59ms) | "N/A" |
| `nvidia/llama-3.1-nemotron-70b-instruct` | ❌ Fail (119ms) | ❌ Fail (66ms) | ❌ Fail (55ms) | ❌ Fail (53ms) | "N/A" |
| `nvidia/llama-3.1-nemotron-ultra-253b-v1` | ❌ Fail (52ms) | ❌ Fail (60ms) | ❌ Fail (81ms) | ❌ Fail (108ms) | "N/A" |
| `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | ❌ Fail (32ms) | ❌ Fail (56ms) | ❌ Fail (30ms) | ❌ Fail (36ms) | "N/A" |
| `nvidia/llama-3.2-nv-embedqa-1b-v1` | ❌ Fail (57ms) | ❌ Fail (30ms) | ❌ Fail (568ms) | ❌ Fail (31ms) | "N/A" |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | ✅ 520ms | ✅ 693ms | ❌ Fail (5014ms) | ✅ 2268ms | "**Hello!**  It" |
| `nvidia/llama-nemotron-embed-1b-v2` | ❌ Fail (63ms) | ❌ Fail (38ms) | ❌ Fail (31ms) | ❌ Fail (39ms) | "N/A" |
| `nvidia/llama-nemotron-embed-vl-1b-v2` | ❌ Fail (35ms) | ❌ Fail (33ms) | ❌ Fail (76ms) | ❌ Fail (32ms) | "N/A" |
| `nvidia/llama3-chatqa-1.5-70b` | ❌ Fail (67ms) | ❌ Fail (74ms) | ❌ Fail (67ms) | ❌ Fail (62ms) | "N/A" |
| `nvidia/mistral-nemo-minitron-8b-8k-instruct` | ❌ Fail (76ms) | ❌ Fail (79ms) | ❌ Fail (79ms) | ❌ Fail (70ms) | "N/A" |


## Batch 10 Model Testing Results (Tested across all 4 Keys)
Below are the results for the tenth batch of 10 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `nvidia/nemoretriever-parse` | ❌ Fail (492ms) | ❌ Fail (252ms) | ❌ Fail (199ms) | ❌ Fail (208ms) | "N/A" |
| `nvidia/nemotron-3-content-safety` | ✅ 513ms | ✅ 276ms | ✅ 530ms | ✅ 258ms | "User Safety: safe" |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | ✅ 299ms | ❌ Fail (5013ms) | ✅ 436ms | ✅ 268ms | "N/A" |
| `nvidia/nemotron-4-340b-instruct` | ❌ Fail (58ms) | ❌ Fail (66ms) | ❌ Fail (240ms) | ❌ Fail (58ms) | "N/A" |
| `nvidia/nemotron-4-340b-reward` | ❌ Fail (60ms) | ❌ Fail (92ms) | ❌ Fail (70ms) | ❌ Fail (67ms) | "N/A" |
| `nvidia/nemotron-nano-3-30b-a3b` | ❌ Fail (234ms) | ❌ Fail (723ms) | ❌ Fail (175ms) | ❌ Fail (177ms) | "N/A" |
| `nvidia/nemotron-parse` | ❌ Fail (485ms) | ❌ Fail (193ms) | ❌ Fail (186ms) | ❌ Fail (189ms) | "N/A" |
| `nvidia/neva-22b` | ❌ Fail (51ms) | ❌ Fail (53ms) | ❌ Fail (53ms) | ❌ Fail (67ms) | "N/A" |
| `nvidia/nv-embed-v1` | ❌ Fail (649ms) | ❌ Fail (144ms) | ❌ Fail (54ms) | ❌ Fail (45ms) | "N/A" |
| `nvidia/nv-embedcode-7b-v1` | ❌ Fail (32ms) | ❌ Fail (43ms) | ❌ Fail (38ms) | ❌ Fail (31ms) | "N/A" |


## Batch 11 Model Testing Results (Tested across all 4 Keys)
Below are the results for the eleventh (final) batch of 13 models. Latency is shown for each of the 4 rotating keys:

| Model ID | Key 1 Status/Latency | Key 2 Status/Latency | Key 3 Status/Latency | Key 4 Status/Latency | Sample Response |
|---|---|---|---|---|---|
| `nvidia/nv-embedqa-e5-v5` | ❌ Fail (352ms) | ❌ Fail (54ms) | ❌ Fail (242ms) | ❌ Fail (57ms) | "N/A" |
| `nvidia/nv-embedqa-mistral-7b-v2` | ❌ Fail (124ms) | ❌ Fail (43ms) | ❌ Fail (129ms) | ❌ Fail (364ms) | "N/A" |
| `nvidia/nvclip` | ❌ Fail (514ms) | ❌ Fail (51ms) | ❌ Fail (34ms) | ❌ Fail (35ms) | "N/A" |
| `nvidia/riva-translate-4b-instruct` | ❌ Fail (67ms) | ❌ Fail (107ms) | ❌ Fail (71ms) | ❌ Fail (62ms) | "N/A" |
| `nvidia/vila` | ❌ Fail (53ms) | ❌ Fail (136ms) | ❌ Fail (73ms) | ❌ Fail (96ms) | "N/A" |
| `qwen/qwen3.5-122b-a10b` | ✅ 396ms | ✅ 802ms | ✅ 405ms | ❌ Fail (5006ms) | "Hello! How can I" |
| `snowflake/arctic-embed-l` | ❌ Fail (503ms) | ❌ Fail (59ms) | ❌ Fail (67ms) | ❌ Fail (36ms) | "N/A" |
| `writer/palmyra-creative-122b` | ❌ Fail (455ms) | ❌ Fail (86ms) | ❌ Fail (832ms) | ❌ Fail (52ms) | "N/A" |
| `writer/palmyra-fin-70b-32k` | ❌ Fail (76ms) | ❌ Fail (63ms) | ❌ Fail (118ms) | ❌ Fail (139ms) | "N/A" |
| `writer/palmyra-med-70b` | ❌ Fail (128ms) | ❌ Fail (236ms) | ❌ Fail (65ms) | ❌ Fail (121ms) | "N/A" |
| `writer/palmyra-med-70b-32k` | ❌ Fail (77ms) | ❌ Fail (63ms) | ❌ Fail (58ms) | ❌ Fail (53ms) | "N/A" |
| `z-ai/glm-5.1` | ❌ Fail (5013ms) | ❌ Fail (5008ms) | ❌ Fail (5006ms) | ❌ Fail (5006ms) | "N/A" |
| `zyphra/zamba2-7b-instruct` | ❌ Fail (192ms) | ❌ Fail (97ms) | ❌ Fail (58ms) | ❌ Fail (69ms) | "N/A" |

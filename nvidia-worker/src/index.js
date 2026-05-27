/**
 * NVIDIA NIM API Worker - OpenAI Compatible
 * Ultra-fast GPU inference with API key rotation
 */

// NVIDIA API configuration
const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";
const NVIDIA_API_KEYS = [
  "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",
  "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",
  "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",
  "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",
];

// Available NVIDIA NIM models (110 verified working models)
const NVIDIA_MODELS = [
  {
    id: "google/gemma-2-2b-it",
    name: "Gemma 2 2B",
    provider: "google",
    context: 8192,
  },
  {
    id: "google/gemma-3n-e2b-it",
    name: "Gemma 3N E2B",
    provider: "google",
    context: 8192,
  },
  {
    id: "google/gemma-3n-e4b-it",
    name: "Gemma 3N E4B",
    provider: "google",
    context: 8192,
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "meta",
    context: 131072,
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    provider: "meta",
    context: 131072,
  },
  {
    id: "meta/llama-3.2-11b-vision-instruct",
    name: "Llama 3.2 Vision 11B",
    provider: "meta",
    context: 8192,
  },
  {
    id: "meta/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    provider: "meta",
    context: 8192,
  },
  {
    id: "meta/llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 Vision 90B",
    provider: "meta",
    context: 8192,
  },
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "meta",
    context: 131072,
  },
  {
    id: "meta/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick 17B",
    provider: "meta",
    context: 131072,
  },
  {
    id: "meta/llama-guard-4-12b",
    name: "Llama Guard 4 12B",
    provider: "meta",
    context: 8192,
  },
  {
    id: "microsoft/phi-4-multimodal-instruct",
    name: "Phi-4 Multimodal",
    provider: "microsoft",
    context: 8192,
  },
  {
    id: "mistralai/ministral-14b-instruct-2512",
    name: "Ministral 14B",
    provider: "mistral",
    context: 8192,
  },
  {
    id: "mistralai/mistral-large-3-675b-instruct-2512",
    name: "Mistral Large 3 675B",
    provider: "mistral",
    context: 131072,
    keyIndex: 3, // Pinned to Key 4 (only working key)
  },
  {
    id: "mistralai/mistral-nemotron",
    name: "Mistral Nemotron",
    provider: "mistral",
    context: 8192,
    keyIndex: 3, // Pinned to Key 4 (reliable key)
  },
  {
    id: "mistralai/mistral-small-4-119b-2603",
    name: "Mistral Small 4 119B",
    provider: "mistral",
    context: 8192,
  },
  {
    id: "mistralai/mixtral-8x7b-instruct-v0.1",
    name: "Mixtral 8x7B",
    provider: "mistral",
    context: 8192,
  },
  {
    id: "nvidia/gliner-pii",
    name: "GLiNER PII",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/llama-3.1-nemoguard-8b-content-safety",
    name: "NemoGuard Content Safety",
    provider: "nvidia",
    context: 131072,
  },
  {
    id: "nvidia/llama-3.1-nemoguard-8b-topic-control",
    name: "NemoGuard Topic Control",
    provider: "nvidia",
    context: 131072,
  },
  {
    id: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    name: "Nemotron Nano VL 8B",
    provider: "nvidia",
    context: 131072,
  },
  {
    id: "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
    name: "Nemotron Safety Guard",
    provider: "nvidia",
    context: 131072,
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    name: "Nemotron Super 49B v1.5",
    provider: "nvidia",
    context: 131072,
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b",
    name: "Nemotron 3 Nano 30B",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 3 Super 120B",
    provider: "nvidia",
    context: 131072,
  },
  {
    id: "nvidia/nemotron-content-safety-reasoning-4b",
    name: "Nemotron Safety Reasoning",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/nemotron-mini-4b-instruct",
    name: "Nemotron Mini 4B",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/nemotron-nano-12b-v2-vl",
    name: "Nemotron Nano 12B VL",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/nvidia-nemotron-nano-9b-v2",
    name: "Nemotron Nano 9B v2",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/riva-translate-4b-instruct-v1.1",
    name: "Riva Translate 4B",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "openai",
    context: 8192,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    provider: "openai",
    context: 8192,
  },
  {
    id: "qwen/qwen3-coder-480b-a35b-instruct",
    name: "Qwen3 Coder 480B",
    provider: "qwen",
    context: 131072,
    keyIndex: 2, // Pinned to Key 3 (fastest response)
  },
  {
    id: "qwen/qwen3.5-397b-a17b",
    name: "Qwen3.5 397B",
    provider: "qwen",
    context: 131072,
    keyIndex: 2, // Pinned to Key 3 (fastest response)
  },
  {
    id: "sarvamai/sarvam-m",
    name: "Sarvam M",
    provider: "sarvam",
    context: 8192,
  },
  {
    id: "stepfun-ai/step-3.5-flash",
    name: "Step 3.5 Flash",
    provider: "stepfun",
    context: 8192,
    keyIndex: 2, // Avoid Key 4 (failed key)
  },
  {
    id: "stockmark/stockmark-2-100b-instruct",
    name: "Stockmark 2 100B",
    provider: "stockmark",
    context: 8192,
  },
  {
    id: "upstage/solar-10.7b-instruct",
    name: "Solar 10.7B",
    provider: "upstage",
    context: 8192,
  },
  // --- Newly Discovered Working Live Models ---
  {
    id: "bytedance/seed-oss-36b-instruct",
    name: "Seed-OSS 36B",
    provider: "bytedance",
    context: 8192,
  },
  {
    id: "mistralai/mistral-medium-3.5-128b",
    name: "Mistral Medium 3.5 128B",
    provider: "mistral",
    context: 131072,
  },
  {
    id: "nvidia/ising-calibration-1-35b-a3b",
    name: "Ising Calibration 35B",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1",
    name: "Nemotron Super 49B v1",
    provider: "nvidia",
    context: 131072,
    keyIndex: 0, // Pinned to Key 1
  },
  {
    id: "nvidia/nemotron-3-content-safety",
    name: "Nemotron 3 Content Safety",
    provider: "nvidia",
    context: 8192,
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    name: "Nemotron 3 Nano Omni Reasoning",
    provider: "nvidia",
    context: 8192,
    keyIndex: 2, // Pinned to Key 3
  },
  {
    id: "qwen/qwen3.5-122b-a10b",
    name: "Qwen 3.5 122B",
    provider: "qwen",
    context: 131072,
    keyIndex: 2, // Pinned to Key 3
  },
  {
    id: "microsoft/phi-4-mini-instruct",
    name: "Phi-4 Mini",
    provider: "microsoft",
    context: 8192,
    keyIndex: 2, // Pinned to Key 3
  },
  {
    id: "moonshotai/kimi-k2.6",
    name: "Kimi K2.6",
    provider: "moonshot",
    context: 8192,
    keyIndex: 2, // Pinned to Key 3
  },
];

// API key rotation state
let currentKeyIndex = 0;
let keyFailureCount = new Array(NVIDIA_API_KEYS.length).fill(0);

export default {
  async fetch(request, _env, _ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-API-Key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      const url = new URL(request.url);

      // Route: /v1/chat/completions - OpenAI compatible chat
      if (
        url.pathname === "/v1/chat/completions" ||
        url.pathname === "/v1/chat/completions/"
      ) {
        return await handleChatCompletions(request);
      }

      // Route: /v1/models - List available models
      if (url.pathname === "/v1/models" || url.pathname === "/v1/models/") {
        return await handleListModels();
      }

      // Route: /test - Test endpoint
      if (url.pathname === "/test" || url.pathname === "/test/") {
        return await handleTest();
      }

      // Route: /health - Health check
      if (url.pathname === "/health" || url.pathname === "/health/") {
        return await handleHealth();
      }

      // Default: Return API info
      return new Response(
        JSON.stringify({
          name: "NVIDIA NIM API Worker",
          version: "1.0.0",
          openai_compatible: true,
          provider: "nvidia",
          endpoints: {
            "/v1/chat/completions": "OpenAI-compatible chat completions",
            "/v1/models": "List available NVIDIA NIM models",
            "/test": "Run API tests",
            "/health": "Health check",
          },
          models_count: NVIDIA_MODELS.length,
          features: [
            "Ultra-fast GPU inference",
            "API key rotation (4 keys)",
            "OpenAI-compatible format",
            "Multiple model support",
            "Enterprise-grade performance",
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  },
};

/**
 * Get next API key with rotation logic
 */
function getNextApiKey() {
  // Find the key with lowest failure count
  let minFailures = Math.min(...keyFailureCount);
  let availableKeys = [];

  keyFailureCount.forEach((failures, idx) => {
    if (failures === minFailures) {
      availableKeys.push(idx);
    }
  });

  // Pick randomly from available keys
  const selectedIndex =
    availableKeys[Math.floor(Math.random() * availableKeys.length)];
  currentKeyIndex = selectedIndex;

  return NVIDIA_API_KEYS[selectedIndex];
}

/**
 * Record API key failure
 */
function recordKeyFailure(keyIndex) {
  keyFailureCount[keyIndex]++;
  console.log(
    `API Key ${keyIndex + 1} failed. Failure count: ${keyFailureCount[keyIndex]}`,
  );
}

/**
 * Record API key success
 */
function recordKeySuccess(keyIndex) {
  // Reset failure count on success
  if (keyFailureCount[keyIndex] > 0) {
    keyFailureCount[keyIndex] = Math.max(0, keyFailureCount[keyIndex] - 1);
  }
}

/**
 * Fetch with a timeout using AbortController
 */
async function fetchWithTimeout(url, options, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Handle chat completions
 */
async function handleChatCompletions(request) {
  try {
    const requestData = await request.json();

    // Validate required fields
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              'Invalid request: "messages" field is required and must be an array',
            type: "invalid_request_error",
            param: "messages",
            code: "invalid_parameter",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Determine model to use
    const requestedModel = requestData.model || "meta/llama-3.1-70b-instruct";

    // Find model config to see if it is pinned to a specific working key
    const modelConfig = NVIDIA_MODELS.find((m) => m.id === requestedModel);
    let apiKey;
    let keyIndex;

    if (modelConfig && typeof modelConfig.keyIndex === "number") {
      keyIndex = modelConfig.keyIndex;
      apiKey = NVIDIA_API_KEYS[keyIndex];
    } else {
      apiKey = getNextApiKey();
      keyIndex = currentKeyIndex;
    }

    // Make request to NVIDIA API
    let nvidiaResponse;
    try {
      nvidiaResponse = await fetchWithTimeout(
        `${NVIDIA_API_BASE}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...sanitizePayload(requestData),
            model: requestedModel,
          }),
        },
        3500,
      );
    } catch (err) {
      console.log(`First request failed or timed out: ${err.message || err}`);
      // Simulate failed response for failover retry
      nvidiaResponse = {
        ok: false,
        status: 504,
        json: async () => ({
          error: {
            message: `Gateway Timeout: Request took too long on key index ${keyIndex}`,
          },
        }),
      };
    }

    const isStream = requestData.stream === true;

    // Handle errors
    if (!nvidiaResponse.ok) {
      recordKeyFailure(keyIndex);

      // Try with another key if available
      if (NVIDIA_API_KEYS.length > 1 && keyFailureCount[keyIndex] < 3) {
        const retryKey = getNextApiKey();
        let retryResponse;
        try {
          retryResponse = await fetchWithTimeout(
            `${NVIDIA_API_BASE}/chat/completions`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${retryKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...sanitizePayload(requestData),
                model: requestedModel,
              }),
            },
            5000, // slightly longer timeout for fallback to ensure completion
          );
        } catch (err) {
          console.log(
            `Retry request failed or timed out: ${err.message || err}`,
          );
          retryResponse = {
            ok: false,
            status: 504,
            json: async () => ({
              error: {
                message: "Gateway Timeout: Retry request took too long.",
              },
            }),
          };
        }

        if (retryResponse.ok) {
          recordKeySuccess(currentKeyIndex);
          if (isStream) {
            return new Response(retryResponse.body, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*",
              },
            });
          } else {
            const retryData = await retryResponse.json();
            return new Response(JSON.stringify(retryData), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        } else {
          const retryData = await retryResponse.json();
          return new Response(JSON.stringify(retryData), {
            status: retryResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      }

      const responseData = await nvidiaResponse.json();
      return new Response(JSON.stringify(responseData), {
        status: nvidiaResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    recordKeySuccess(keyIndex);

    if (isStream) {
      return new Response(nvidiaResponse.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      const responseData = await nvidiaResponse.json();
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Internal server error: ${error.message}`,
          type: "server_error",
          param: null,
          code: "internal_error",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

/**
 * Handle model listing
 */
async function handleListModels() {
  const models = NVIDIA_MODELS.map((model) => ({
    id: model.id,
    object: "model",
    created: 1678000000,
    owned_by: model.provider,
    permission: [],
    root: model.id,
    parent: null,
    metadata: {
      name: model.name,
      context_length: model.context,
      type: "chat",
    },
  }));

  return new Response(
    JSON.stringify({
      object: "list",
      data: models,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

/**
 * Handle test endpoint
 */
async function handleTest() {
  const results = [];

  // Test each API key
  for (let i = 0; i < NVIDIA_API_KEYS.length; i++) {
    try {
      const response = await fetch(`${NVIDIA_API_BASE}/models`, {
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEYS[i]}`,
        },
      });

      results.push({
        key_index: i + 1,
        status: response.status,
        valid: response.ok,
      });
    } catch (error) {
      results.push({
        key_index: i + 1,
        status: 0,
        valid: false,
        error: error.message,
      });
    }
  }

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      api_keys_tested: results.length,
      valid_keys: results.filter((r) => r.valid).length,
      results: results,
      models_available: NVIDIA_MODELS.length,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

/**
 * Handle health check
 */
async function handleHealth() {
  return new Response(
    JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      worker: "nvidia-nim-worker",
      version: "1.0.0",
      models_count: NVIDIA_MODELS.length,
      api_keys_configured: NVIDIA_API_KEYS.length,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

const ALLOWED_PARAMS = [
  "model",
  "messages",
  "temperature",
  "top_p",
  "n",
  "stream",
  "stop",
  "max_tokens",
  "presence_penalty",
  "frequency_penalty",
  "logit_bias",
  "user",
  "response_format",
  "seed",
  "tools",
  "tool_choice",
];

function sanitizePayload(data) {
  const sanitized = {};
  for (const key of ALLOWED_PARAMS) {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

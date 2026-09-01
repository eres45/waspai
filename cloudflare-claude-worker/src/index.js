/**
 * WaspAI Claude Worker
 * - Models: claude-sonnet-5, claude-opus-5, claude-fable-5
 * - Auto Key Rotation & Failover across provided API keys
 * - OpenAI-compatible /v1/chat/completions + Anthropic-compatible /v1/messages
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, anthropic-version",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// Default keys list (can be extended via env.CLAUDE_API_KEYS comma-separated)
const DEFAULT_API_KEYS = [
  "sk-T2G09Cn2s87Y9V2RYnLDpmWcU6c4CwicIdvRmFxfJLrvTHn1",
];

// Mapping incoming model aliases to upstream supported models
const MODEL_MAPPING = {
  "claude-opus-5": "claude-opus-5",
  "claude-sonnet-5": "claude-opus-5", // Routes to working Claude Opus 5
  "claude-fable-5": "claude-opus-5", // Routes to working Claude Opus 5
  // Aliases for compatibility
  "claude-sonnet": "claude-opus-5",
  "claude-opus": "claude-opus-5",
};

let keyIndex = 0;

function getAvailableKeys(env) {
  if (env?.CLAUDE_API_KEYS) {
    const envKeys = env.CLAUDE_API_KEYS.split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (envKeys.length > 0) return envKeys;
  }
  return DEFAULT_API_KEYS;
}

function getNextKey(keys) {
  const key = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

// ============================================================================
// OpenAI-Compatible Handler (/v1/chat/completions)
// ============================================================================

async function handleChatCompletions(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { message: "Invalid JSON body" } }, 400);
  }

  const requestedModel = body.model || "claude-opus-5";
  const upstreamModel = MODEL_MAPPING[requestedModel] || requestedModel;
  const stream = !!body.stream;

  const payload = {
    ...body,
    model: upstreamModel,
  };

  const keys = getAvailableKeys(env);
  let lastError = null;

  // Key rotation with retry on auth/rate-limit errors
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextKey(keys);

    try {
      const upstreamRes = await fetch(
        "https://tabitoken.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          body: JSON.stringify(payload),
        },
      );

      // If upstream rejects the key or rate limits, rotate to next key
      if ([401, 402, 403, 429].includes(upstreamRes.status)) {
        const errText = await upstreamRes.text().catch(() => "");
        lastError = `Key ${apiKey.slice(0, 8)}... failed (${upstreamRes.status}): ${errText.slice(0, 100)}`;
        console.warn(`[Key Rotation] ${lastError}, trying next key...`);
        continue;
      }

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        return jsonResponse(
          {
            error: {
              message: `Upstream error ${upstreamRes.status}: ${errText}`,
            },
          },
          upstreamRes.status,
        );
      }

      // If streaming response, forward the SSE stream directly
      if (stream) {
        const { readable, writable } = new TransformStream();
        upstreamRes.body.pipeTo(writable).catch((err) => {
          console.error("Pipe stream error:", err);
        });

        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...CORS_HEADERS,
          },
        });
      }

      // Non-streaming response: rewrite model name to match what client requested
      const data = await upstreamRes.json();
      if (data.model) {
        data.model = requestedModel;
      }
      return jsonResponse(data);
    } catch (err) {
      lastError = err.message;
      console.warn(`[Upstream Exception] ${err.message}, trying next key...`);
    }
  }

  return jsonResponse(
    { error: { message: `All API keys exhausted. Last error: ${lastError}` } },
    502,
  );
}

// ============================================================================
// Anthropic-Compatible Handler (/v1/messages)
// ============================================================================

async function handleAnthropicMessages(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { message: "Invalid JSON body" } }, 400);
  }

  const requestedModel = body.model || "claude-opus-5";
  const upstreamModel = MODEL_MAPPING[requestedModel] || requestedModel;
  const stream = !!body.stream;

  const payload = {
    ...body,
    model: upstreamModel,
  };

  const keys = getAvailableKeys(env);
  let lastError = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextKey(keys);

    try {
      const upstreamRes = await fetch("https://tabitoken.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: `Bearer ${apiKey}`,
          "anthropic-version":
            request.headers.get("anthropic-version") || "2023-06-01",
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify(payload),
      });

      if ([401, 402, 403, 429].includes(upstreamRes.status)) {
        const errText = await upstreamRes.text().catch(() => "");
        lastError = `Key ${apiKey.slice(0, 8)}... failed (${upstreamRes.status}): ${errText.slice(0, 100)}`;
        console.warn(
          `[Key Rotation Messages] ${lastError}, trying next key...`,
        );
        continue;
      }

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        return jsonResponse(
          {
            error: {
              message: `Upstream error ${upstreamRes.status}: ${errText}`,
            },
          },
          upstreamRes.status,
        );
      }

      if (stream) {
        const { readable, writable } = new TransformStream();
        upstreamRes.body.pipeTo(writable).catch((err) => {
          console.error("Messages pipe error:", err);
        });

        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...CORS_HEADERS,
          },
        });
      }

      const data = await upstreamRes.json();
      if (data.model) {
        data.model = requestedModel;
      }
      return jsonResponse(data);
    } catch (err) {
      lastError = err.message;
    }
  }

  return jsonResponse(
    { error: { message: `All API keys exhausted. Last error: ${lastError}` } },
    502,
  );
}

// ============================================================================
// Model List (/v1/models)
// ============================================================================

function handleModels(env) {
  const keys = getAvailableKeys(env);
  const models = [
    {
      id: "claude-sonnet-5",
      object: "model",
      owned_by: "anthropic",
      permission: [],
      description: "Claude Sonnet 5 — High intelligence with fast reasoning",
    },
    {
      id: "claude-opus-5",
      object: "model",
      owned_by: "anthropic",
      permission: [],
      description:
        "Claude Opus 5 — Top-tier deep reasoning and coding capability",
    },
    {
      id: "claude-fable-5",
      object: "model",
      owned_by: "anthropic",
      permission: [],
      description: "Claude Fable 5 — Creative and narrative generation",
    },
  ];

  return jsonResponse({
    object: "list",
    data: models,
    active_keys_count: keys.length,
  });
}

// ============================================================================
// Worker Router
// ============================================================================

export default {
  async fetch(request, env, _ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // OpenAI Chat Completions endpoint
    if (path === "/v1/chat/completions" && request.method === "POST") {
      return handleChatCompletions(request, env);
    }

    // Anthropic Messages endpoint
    if (path === "/v1/messages" && request.method === "POST") {
      return handleAnthropicMessages(request, env);
    }

    // Models endpoint
    if (path === "/v1/models" && request.method === "GET") {
      return handleModels(env);
    }

    // Health / Root info
    if (path === "/" || path === "/health") {
      const keys = getAvailableKeys(env);
      return jsonResponse({
        status: "active",
        service: "WaspAI Claude Worker",
        models: ["claude-sonnet-5", "claude-opus-5", "claude-fable-5"],
        active_keys_count: keys.length,
        endpoints: {
          openai_chat: "POST /v1/chat/completions",
          anthropic_messages: "POST /v1/messages",
          models_list: "GET /v1/models",
        },
      });
    }

    return jsonResponse({ error: { message: "Not found", path } }, 404);
  },
};

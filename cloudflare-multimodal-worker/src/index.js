/**
 * WaspAI Multimodal Worker
 * - /v1/chat/completions -> Reverse-engineered DeepSeek (deepseek/deepseek-v4-flash)
 * - /v1/images/generations -> Reverse-engineered PicAI (gpt-image-2, flux-schnell, etc.)
 * - /v1/images/edits -> PicAI Image Editing (gpt-image-2-edit)
 * - /v1/models -> OpenAI-compatible model catalog
 */

// ============================================================================
// CORS & Utility Helpers
// ============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, X-CSRF-TOKEN",
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

function getRandomUsIp() {
  const b = Math.floor(Math.random() * 200) + 10;
  const c = Math.floor(Math.random() * 200) + 10;
  return `104.28.${b}.${c}`;
}

// ============================================================================
// DeepSeek Chat State & Handshake
// ============================================================================

let currentSession = null;
let sessionUsageCount = 0;

async function getDeepSeekSession(forceRefresh = false) {
  // Rotate to a fresh IP and session every 5 requests to avoid the 10 msg/IP cap
  if (!forceRefresh && currentSession && sessionUsageCount < 5) {
    sessionUsageCount++;
    return currentSession;
  }

  const freshIp = getRandomUsIp();
  const pageRes = await fetch("https://deep-seek.ai/chat", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "X-Forwarded-For": freshIp,
    },
  });

  const cookies = pageRes.headers.getSetCookie
    ? pageRes.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ")
    : pageRes.headers.get("set-cookie") || "";

  const html = await pageRes.text();
  const match = html.match(
    /<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i,
  );
  const csrfToken = match ? match[1] : null;

  if (!csrfToken) {
    throw new Error("Failed to extract CSRF token from deep-seek.ai");
  }

  currentSession = { csrfToken, cookies, ip: freshIp };
  sessionUsageCount = 1;

  return currentSession;
}

// ============================================================================
// Chat Handler (/v1/chat/completions)
// ============================================================================

async function handleChatCompletions(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { message: "Invalid JSON body" } }, 400);
  }

  const incomingMessages = body.messages || [];
  const stream = !!body.stream;
  const requestedModel = body.model || "deepseek-v4-flash";
  const upstreamModel = "deepseek/deepseek-v4-flash";

  // IMPORTANT: deep-seek.ai rejects 'system' role messages and redirects to an HTML error page!
  // Sanitize by prepending system instructions into the first user message.
  let systemInstructions = "";
  const sanitizedMessages = [];
  for (const m of incomingMessages) {
    const content =
      typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    if (m.role === "system") {
      systemInstructions += (systemInstructions ? "\n\n" : "") + content;
    } else if (m.role === "user" && systemInstructions) {
      sanitizedMessages.push({
        role: "user",
        content: `[System Instructions: ${systemInstructions}]\n\n${content}`,
      });
      systemInstructions = "";
    } else {
      sanitizedMessages.push({
        role: m.role || "user",
        content: content,
      });
    }
  }
  if (systemInstructions && sanitizedMessages.length === 0) {
    sanitizedMessages.push({ role: "user", content: systemInstructions });
  }

  let session;
  try {
    session = await getDeepSeekSession();
  } catch (err) {
    return jsonResponse(
      { error: { message: "DeepSeek handshake failed: " + err.message } },
      502,
    );
  }

  const makeCall = async (s) => {
    return fetch("https://deep-seek.ai/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Origin: "https://deep-seek.ai",
        Referer: "https://deep-seek.ai/chat",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "X-CSRF-TOKEN": s.csrfToken,
        Cookie: s.cookies,
        "X-Forwarded-For": s.ip,
      },
      body: JSON.stringify({
        model: upstreamModel,
        messages: sanitizedMessages,
      }),
    });
  };

  let upstreamRes = await makeCall(session);

  // If token expired or limit reached, get a fresh session and retry
  if (
    upstreamRes.status === 419 ||
    upstreamRes.status === 403 ||
    upstreamRes.status === 429
  ) {
    session = await getDeepSeekSession(true);
    upstreamRes = await makeCall(session);
  }

  if (!upstreamRes.ok) {
    const errText = await upstreamRes.text();
    return jsonResponse(
      {
        error: {
          message: `DeepSeek upstream error ${upstreamRes.status}: ${errText}`,
        },
      },
      upstreamRes.status,
    );
  }

  // --- STREAMING MODE ---
  if (stream) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            if (trimmed.includes("[DONE]")) {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const data = JSON.parse(trimmed.slice(6));
              const deltaContent = data.choices?.[0]?.delta?.content ?? "";
              const deltaReasoning = data.choices?.[0]?.delta?.reasoning ?? "";

              const chunk = {
                id: data.id || `chatcmpl-${Date.now()}`,
                object: "chat.completion.chunk",
                created: data.created || Math.floor(Date.now() / 1000),
                model: requestedModel,
                choices: [
                  {
                    index: 0,
                    delta: {
                      ...(deltaContent ? { content: deltaContent } : {}),
                      ...(deltaReasoning
                        ? { reasoning_content: deltaReasoning }
                        : {}),
                    },
                    finish_reason: data.choices?.[0]?.finish_reason || null,
                  },
                ],
              };
              await writer.write(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
              );
            } catch {
              // Pass raw line if unparseable
              await writer.write(encoder.encode(`${trimmed}\n\n`));
            }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Stream forward error:", err);
      } finally {
        await writer.close();
      }
    })();

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

  // --- NON-STREAMING MODE ---
  const text = await upstreamRes.text();
  const lines = text.split("\n");
  let fullContent = "";
  let fullReasoning = "";
  let lastId = `chatcmpl-${Date.now()}`;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ") && !trimmed.includes("[DONE]")) {
      try {
        const json = JSON.parse(trimmed.slice(6));
        if (json.id) lastId = json.id;
        const delta = json.choices?.[0]?.delta;
        if (delta?.content) fullContent += delta.content;
        if (delta?.reasoning) fullReasoning += delta.reasoning;
      } catch {}
    }
  }

  return jsonResponse({
    id: lastId,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: requestedModel,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: fullContent,
          ...(fullReasoning ? { reasoning_content: fullReasoning } : {}),
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: fullContent.length,
      total_tokens: fullContent.length,
    },
  });
}

// ============================================================================
// PicAI Image Generation Handler (/v1/images/generations)
// ============================================================================

async function handleImageGenerations(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { message: "Invalid JSON body" } }, 400);
  }

  const prompt = body.prompt;
  if (!prompt) {
    return jsonResponse({ error: { message: "Prompt is required" } }, 400);
  }

  const requestedModel = (body.model || "gpt-image-2").toLowerCase();
  // Model aliases
  let modelId = "gpt-image-2";
  if (requestedModel.includes("schnell")) modelId = "flux-schnell";
  else if (requestedModel.includes("flux-pro")) modelId = "flux-pro";
  else if (requestedModel.includes("recraft")) modelId = "recraft-v3";
  else if (requestedModel.includes("ideogram")) modelId = "ideogram-v2";
  else if (requestedModel.includes("seedream")) modelId = "seedream-v4";
  else if (requestedModel.includes("banana")) modelId = "nano-banana";

  const spoofedIp = getRandomUsIp();

  const runRes = await fetch("https://picai.com/api/fal/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: "https://picai.com",
      Referer: "https://picai.com/app/ai-image-generator",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Forwarded-For": spoofedIp,
    },
    body: JSON.stringify({
      modelId: modelId,
      input: {
        prompt: prompt,
        aspect_ratio: body.aspect_ratio || "1:1",
        image_size: "square_hd",
        width: 1024,
        height: 1024,
      },
      libraryMeta: { prompt: prompt },
    }),
  });

  const cookies = runRes.headers.getSetCookie
    ? runRes.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ")
    : runRes.headers.get("set-cookie") || "";

  const runData = await runRes.json().catch(() => ({}));
  const jobId = runData.jobId || runData.id;

  if (!runRes.ok || !jobId) {
    return jsonResponse(
      {
        error: {
          message: `PicAI generation failed (${runRes.status}): ${JSON.stringify(runData)}`,
        },
      },
      runRes.status >= 400 ? runRes.status : 502,
    );
  }

  // Poll for job completion
  const startTime = Date.now();
  const maxWaitMs = 60000; // 60s timeout

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(`https://picai.com/api/fal/jobs/${jobId}`, {
      headers: {
        Accept: "application/json, text/plain, */*",
        Origin: "https://picai.com",
        Referer: "https://picai.com/app/ai-image-generator",
        "User-Agent": "Mozilla/5.0",
        "X-Forwarded-For": spoofedIp,
        ...(cookies ? { Cookie: cookies } : {}),
      },
    });

    const pollData = await pollRes.json().catch(() => ({}));

    if (pollData.status === "succeeded") {
      const outputUrl = pollData.outputs?.[0]?.url;
      if (!outputUrl) {
        return jsonResponse(
          { error: { message: "No output URL returned" } },
          502,
        );
      }
      return jsonResponse({
        created: Math.floor(Date.now() / 1000),
        data: [{ url: outputUrl }],
      });
    }

    if (pollData.status === "failed") {
      return jsonResponse(
        {
          error: {
            message: `Image rendering failed: ${pollData.error || "Unknown error"}`,
          },
        },
        500,
      );
    }
  }

  return jsonResponse(
    { error: { message: "Image generation timed out after 60s" } },
    504,
  );
}

// ============================================================================
// PicAI Image Edit Handler (/v1/images/edits)
// ============================================================================

async function handleImageEdits(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { message: "Invalid JSON body" } }, 400);
  }

  const prompt = body.prompt;
  const imageUrl = body.image || body.image_url || body.imageUrl;

  if (!prompt || !imageUrl) {
    return jsonResponse(
      {
        error: {
          message: "Both 'prompt' and 'image' (or 'image_url') are required",
        },
      },
      400,
    );
  }

  const spoofedIp = getRandomUsIp();

  const runRes = await fetch("https://picai.com/api/fal/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: "https://picai.com",
      Referer: "https://picai.com/app/ai-image-editing",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Forwarded-For": spoofedIp,
    },
    body: JSON.stringify({
      modelId: "gpt-image-2-edit",
      input: {
        prompt: prompt,
        image_urls: [imageUrl],
        aspect_ratio: "1:1",
        image_size: "square_hd",
        width: 1024,
        height: 1024,
      },
      libraryMeta: {
        prompt: prompt,
        sourceUrl: imageUrl,
      },
    }),
  });

  const cookies = runRes.headers.getSetCookie
    ? runRes.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ")
    : runRes.headers.get("set-cookie") || "";

  const runData = await runRes.json().catch(() => ({}));
  const jobId = runData.jobId || runData.id;

  if (!runRes.ok || !jobId) {
    return jsonResponse(
      {
        error: {
          message: `PicAI edit failed (${runRes.status}): ${JSON.stringify(runData)}`,
        },
      },
      runRes.status >= 400 ? runRes.status : 502,
    );
  }

  const startTime = Date.now();
  const maxWaitMs = 60000;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(`https://picai.com/api/fal/jobs/${jobId}`, {
      headers: {
        Accept: "application/json, text/plain, */*",
        Origin: "https://picai.com",
        Referer: "https://picai.com/app/ai-image-editing",
        "User-Agent": "Mozilla/5.0",
        "X-Forwarded-For": spoofedIp,
        ...(cookies ? { Cookie: cookies } : {}),
      },
    });

    const pollData = await pollRes.json().catch(() => ({}));

    if (pollData.status === "succeeded") {
      const outputUrl = pollData.outputs?.[0]?.url;
      return jsonResponse({
        created: Math.floor(Date.now() / 1000),
        data: [{ url: outputUrl }],
      });
    }

    if (pollData.status === "failed") {
      return jsonResponse(
        {
          error: {
            message: `Image edit failed: ${pollData.error || "Unknown error"}`,
          },
        },
        500,
      );
    }
  }

  return jsonResponse(
    { error: { message: "Image edit timed out after 60s" } },
    504,
  );
}

// ============================================================================
// Model Catalog (/v1/models)
// ============================================================================

function handleModels() {
  const models = [
    {
      id: "deepseek-v4-flash",
      object: "model",
      owned_by: "deepseek",
      permission: [],
      type: "chat",
    },
    {
      id: "deepseek-chat",
      object: "model",
      owned_by: "deepseek",
      permission: [],
      type: "chat",
    },
    {
      id: "gpt-image-2",
      object: "model",
      owned_by: "openai-fal",
      permission: [],
      type: "image",
    },
    {
      id: "gpt-image-2-edit",
      object: "model",
      owned_by: "openai-fal",
      permission: [],
      type: "image-edit",
    },
    {
      id: "flux-schnell",
      object: "model",
      owned_by: "black-forest-labs",
      permission: [],
      type: "image",
    },
    {
      id: "flux-pro",
      object: "model",
      owned_by: "black-forest-labs",
      permission: [],
      type: "image",
    },
    {
      id: "recraft-v3",
      object: "model",
      owned_by: "recraft",
      permission: [],
      type: "image",
    },
    {
      id: "ideogram-v2",
      object: "model",
      owned_by: "ideogram",
      permission: [],
      type: "image",
    },
    {
      id: "seedream-v4",
      object: "model",
      owned_by: "bytedance",
      permission: [],
      type: "image",
    },
  ];

  return jsonResponse({ object: "list", data: models });
}

// ============================================================================
// Main Worker Fetch Handler
// ============================================================================

export default {
  async fetch(request, _env, _ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Chat endpoint
    if (path === "/v1/chat/completions" && request.method === "POST") {
      return handleChatCompletions(request);
    }

    // Image generations endpoint
    if (path === "/v1/images/generations" && request.method === "POST") {
      return handleImageGenerations(request);
    }

    // Image edits endpoint
    if (path === "/v1/images/edits" && request.method === "POST") {
      return handleImageEdits(request);
    }

    // Models endpoint
    if (path === "/v1/models" && request.method === "GET") {
      return handleModels();
    }

    // Health / Root info
    if (path === "/" || path === "/health") {
      return jsonResponse({
        status: "active",
        service: "WaspAI Multimodal Worker",
        endpoints: {
          chat: "POST /v1/chat/completions (DeepSeek v4 Flash)",
          images:
            "POST /v1/images/generations (GPT-Image-2, FLUX Schnell, etc.)",
          edits: "POST /v1/images/edits (GPT-Image-2 Edit)",
          models: "GET /v1/models",
        },
      });
    }

    return jsonResponse({ error: { message: "Not found", path } }, 404);
  },
};

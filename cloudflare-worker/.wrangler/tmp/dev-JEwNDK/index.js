var __defProp = Object.defineProperty;
var __name = (target, value) =>
  __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-hJ6U06/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url =
    request instanceof URL
      ? request
      : new URL(
          (typeof request === "string" ? new Request(request, init) : request)
            .url,
        );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`,
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  },
});

// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (
      url.pathname === "/health" ||
      (url.pathname === "/" && request.method === "GET")
    ) {
      return new Response("OK", { status: 200 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (url.pathname === "/vision" && request.method === "POST") {
      const authHeader = request.headers.get("X-Auth-Token");
      if (authHeader !== env.AUTH_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }
      const { image } = await request.json();
      if (!image) return new Response("Missing image", { status: 400 });
      try {
        const binaryString = atob(image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const response = await env.AI.run(
          "@cf/meta/llama-3.2-11b-vision-instruct",
          {
            image: [...bytes],
            prompt:
              "Extract all text from this image exactly as it appears. Maintain formatting. Return ONLY the extracted text.",
          },
        );
        return new Response(JSON.stringify(response), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }
    if (url.pathname === "/serve" && request.method === "GET") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return new Response("Missing path", { status: 400 });
      const botToken = env.TELEGRAM_BOT_TOKEN;
      if (!botToken)
        return new Response("Worker not configured", { status: 500 });
      try {
        const telegramUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
        const imgRes = await fetch(telegramUrl);
        if (!imgRes.ok) {
          return new Response(`Failed to fetch file: ${imgRes.status}`, {
            status: imgRes.status,
          });
        }
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const body = await imgRes.arrayBuffer();
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(`Serve error: ${err.message}`, { status: 500 });
      }
    }
    if (url.pathname === "/upload" && request.method === "POST") {
      const authHeader = request.headers.get("X-Auth-Token");
      if (authHeader !== env.AUTH_TOKEN) {
        return new Response("Unauthorized", {
          status: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
      try {
        const formData = await request.formData();
        const tgToken = env.TELEGRAM_BOT_TOKEN;
        const tgChatId = env.TELEGRAM_CHAT_ID;
        const userId = formData.get("userId") || "anonymous";
        const filename = formData.get("filename") || "file";
        const fileSize = formData.get("fileSize") || "0";
        if (!tgToken || !tgChatId) {
          return new Response("Worker configuration missing", {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
        if (!formData.has("chat_id")) formData.append("chat_id", tgChatId);
        const caption = [
          "\u{1F4C1} File Upload via Cloudflare Bridge",
          `Name: ${filename}`,
          `Size: ${Math.round(fileSize / 1024)}KB`,
          `User: ${userId}`,
          `Time: ${(/* @__PURE__ */ new Date()).toISOString()}`,
        ].join("\n");
        formData.append("caption", caption);
        const hasPhoto = formData.has("photo");
        const hasVideo = formData.has("video");
        const method = hasPhoto
          ? "sendPhoto"
          : hasVideo
            ? "sendVideo"
            : "sendDocument";
        const tgUrl = `https://api.telegram.org/bot${tgToken}/${method}`;
        const tgRes = await fetch(tgUrl, { method: "POST", body: formData });
        const responseData = await tgRes.json();
        if (responseData.ok && responseData.result) {
          let fileId;
          const result = responseData.result;
          if (result.photo)
            fileId = result.photo[result.photo.length - 1].file_id;
          else if (result.video) fileId = result.video.file_id;
          else if (result.document) fileId = result.document.file_id;
          if (fileId) {
            const fileRes = await fetch(
              `https://api.telegram.org/bot${tgToken}/getFile?file_id=${fileId}`,
            );
            const fileData = await fileRes.json();
            if (fileData.ok && fileData.result.file_path) {
              responseData.file_path = fileData.result.file_path;
              responseData.proxied_url = `/api/storage/file/${fileData.result.file_path}`;
            }
          }
        }
        return new Response(JSON.stringify(responseData), {
          status: tgRes.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }
    return new Response("Not Found", { status: 404 });
  },
};

// C:/Users/Ronit/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(
  async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } finally {
      try {
        if (request.body !== null && !request.bodyUsed) {
          const reader = request.body.getReader();
          while (!(await reader.read()).done) {}
        }
      } catch (e) {
        console.error("Failed to drain the unused request body.", e);
      }
    }
  },
  "drainBody",
);
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/Ronit/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause),
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(
  async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" },
      });
    }
  },
  "jsonError",
);
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-hJ6U06/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default,
];
var middleware_insertion_facade_default = src_default;

// C:/Users/Ronit/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    },
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware,
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-hJ6U06/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (
    __INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 ||
    __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
  ) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function (request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function (type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {},
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    },
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (
    __INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 ||
    __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
  ) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {},
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher,
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
};
//# sourceMappingURL=index.js.map

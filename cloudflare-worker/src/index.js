export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Simple health check
    if (
      url.pathname === "/health" ||
      (url.pathname === "/" && request.method === "GET")
    ) {
      return new Response("OK", { status: 200 });
    }

    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
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
        // Convert base64 to Uint8Array for Workers AI
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

    if (url.pathname !== "/upload" || request.method !== "POST") {
      return new Response("Not Found", { status: 404 });
    }

    // Auth Check
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
        return new Response(
          "Worker configuration missing: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
          {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
          },
        );
      }

      // Ensure chat_id is present
      if (!formData.has("chat_id")) {
        formData.append("chat_id", tgChatId);
      }

      // Add proper caption
      const caption = [
        "📁 File Upload via Cloudflare Bridge",
        `Name: ${filename}`,
        `Size: ${Math.round(fileSize / 1024)}KB`,
        `User: ${userId}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n");

      formData.append("caption", caption);

      // Determine endpoint
      const hasPhoto = formData.has("photo");
      const hasVideo = formData.has("video");
      const method = hasPhoto
        ? "sendPhoto"
        : hasVideo
          ? "sendVideo"
          : "sendDocument";

      const tgUrl = `https://api.telegram.org/bot${tgToken}/${method}`;

      const tgRes = await fetch(tgUrl, {
        method: "POST",
        body: formData,
      });

      const responseData = await tgRes.json();

      if (responseData.ok && responseData.result) {
        // Get file_id from the result
        let fileId;
        const result = responseData.result;
        if (result.photo)
          fileId = result.photo[result.photo.length - 1].file_id;
        else if (result.video) fileId = result.video.file_id;
        else if (result.document) fileId = result.document.file_id;

        if (fileId) {
          // Fetch file path
          const fileRes = await fetch(
            `https://api.telegram.org/bot${tgToken}/getFile?file_id=${fileId}`,
          );
          const fileData = await fileRes.json();
          if (fileData.ok && fileData.result.file_path) {
            responseData.file_path = fileData.result.file_path;
            // Provide a convenient full URL for our proxy
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
  },
};

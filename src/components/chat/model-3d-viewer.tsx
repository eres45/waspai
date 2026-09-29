"use client";

/**
 * 3D Model Viewer — uses Google's <model-viewer> web component loaded from CDN
 * inside a sandboxed iframe. Zero npm dependencies, supports GLB/GLTF natively
 * with orbit controls, auto-rotate, environment lighting, and AR support.
 */

export function Model3DViewer({
  src,
  fileName,
}: {
  src: string;
  fileName: string;
}) {
  // Build a self-contained HTML page that loads model-viewer from CDN
  const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Preview</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0f0f13; overflow: hidden; }
    model-viewer {
      width: 100%;
      height: 100%;
      --progress-bar-color: #6366f1;
      --progress-bar-height: 3px;
    }
    .info {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(8px);
      color: rgba(255,255,255,0.75);
      font: 11px/1.4 system-ui, sans-serif;
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      white-space: nowrap;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <model-viewer
    src="${src}"
    alt="${fileName}"
    auto-rotate
    auto-rotate-delay="500"
    rotation-per-second="30deg"
    camera-controls
    shadow-intensity="1"
    environment-image="neutral"
    exposure="1"
    shadow-softness="0.8"
    tone-mapping="commerce"
    style="width:100%;height:100%"
  ></model-viewer>
  <div class="info">Drag to orbit · Scroll to zoom · Two-finger pan</div>
</body>
</html>`;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Hint bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[11px] text-muted-foreground shrink-0">
        <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
        3D Preview — powered by model-viewer
        <span className="ml-auto font-mono text-[10px] truncate max-w-[180px]">
          {fileName}
        </span>
      </div>

      {/* Sandboxed iframe hosting model-viewer */}
      <iframe
        srcDoc={srcdoc}
        title={`3D Preview: ${fileName}`}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

const VS = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FS = `
  precision highp float;
  uniform float iTime;
  uniform vec3 iResolution;
  uniform vec3 uColor;
  uniform float uAmplitude;
  uniform float uDistance;
  uniform vec2 uMouse;

  #define PI 3.1415926538
  const int u_line_count = 40;
  const float u_line_width = 7.0;
  const float u_line_blur = 10.0;

  float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0/71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0/951.135664));
    vec4 hash_y = fract(Pt * (1.0/642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x*grad_x + grad_y*grad_y)
      * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
      * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
  }

  float px(float count) {
    return (1.0 / max(iResolution.x, iResolution.y)) * count;
  }

  float lineFn(vec2 st, float width, float perc) {
    float split_point = 0.1 + perc * 0.4;
    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float finalAmplitude = amplitude_normal * 0.5 * uAmplitude * (1.0 + (uMouse.y - 0.5) * 0.2);
    float time_scaled = iTime / 10.0 + (uMouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;
    float xnoise = mix(
      Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
      Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
      st.x * 0.3
    );
    float y = 0.5 + (perc - 0.5) * uDistance + xnoise / 2.0 * finalAmplitude;
    float line_start = smoothstep(y + (width/2.0) + (u_line_blur * px(1.0) * blur), y, st.y);
    float line_end   = smoothstep(y, y - (width/2.0) - (u_line_blur * px(1.0) * blur), st.y);
    return clamp((line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))), 0.0, 1.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float line_strength = 1.0;
    for (int i = 0; i < 40; i++) {
      float p = float(i) / 40.0;
      line_strength *= (1.0 - lineFn(uv, u_line_width * px(1.0) * (1.0 - p), p));
    }
    float colorVal = 1.0 - line_strength;
    gl_FragColor = vec4(uColor * colorVal, colorVal);
  }
`;

interface ThreadsProps {
  color?: [number, number, number];
  amplitude?: number;
  distance?: number;
  enableMouseInteraction?: boolean;
  className?: string;
}

export function Threads({
  color = [1, 1, 1],
  amplitude = 1,
  distance = 0,
  enableMouseInteraction = false,
  className,
}: ThreadsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      return sh;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen triangle (OGL Triangle equivalent)
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "iTime");
    const uRes = gl.getUniformLocation(program, "iResolution");
    const uColorU = gl.getUniformLocation(program, "uColor");
    const uAmp = gl.getUniformLocation(program, "uAmplitude");
    const uDist = gl.getUniformLocation(program, "uDistance");
    const uMouseU = gl.getUniformLocation(program, "uMouse");

    gl.uniform3f(uColorU, color[0], color[1], color[2]);
    gl.uniform1f(uAmp, amplitude);
    gl.uniform1f(uDist, distance);
    gl.uniform2f(uMouseU, 0.5, 0.5);

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
      gl!.uniform3f(uRes, w, h, w / h);
    }
    window.addEventListener("resize", resize);
    resize();

    const currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      targetMouse = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ];
    }
    function onMouseLeave() {
      targetMouse = [0.5, 0.5];
    }

    if (enableMouseInteraction) {
      container.addEventListener("mousemove", onMouseMove);
      container.addEventListener("mouseleave", onMouseLeave);
    }

    function frame(t: number) {
      const s = 0.05;
      currentMouse[0] += s * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += s * (targetMouse[1] - currentMouse[1]);
      gl!.uniform2f(uMouseU, currentMouse[0], currentMouse[1]);
      gl!.uniform1f(uTime, t * 0.001);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      if (enableMouseInteraction) {
        container.removeEventListener("mousemove", onMouseMove);
        container.removeEventListener("mouseleave", onMouseLeave);
      }
      if (container.contains(canvas)) container.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, amplitude, distance, enableMouseInteraction]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

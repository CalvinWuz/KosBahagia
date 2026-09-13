// Minimal equirectangular viewer on raw WebGL: a full-screen triangle whose
// fragment shader turns each pixel into a view ray and samples the panorama.
// No library, ~150 lines, renders only when asked (battery friendly).

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAGMENT = `
precision highp float;
uniform sampler2D tex;
uniform vec2 res;
uniform float yaw;
uniform float pitch;
uniform float tanHalf;
void main() {
  vec2 ndc = (gl_FragCoord.xy / res) * 2.0 - 1.0;
  float aspect = res.x / res.y;
  vec3 d = normalize(vec3(ndc.x * tanHalf * aspect, ndc.y * tanHalf, -1.0));
  float cp = cos(pitch), sp = sin(pitch);
  d = vec3(d.x, d.y * cp - d.z * sp, d.y * sp + d.z * cp);
  float cy = cos(yaw), sy = sin(yaw);
  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);
  float lon = atan(d.x, -d.z);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  vec2 uv = vec2(lon / 6.28318530718 + 0.5, 0.5 - lat / 3.14159265359);
  gl_FragColor = texture2D(tex, uv);
}`;

export type Kamera = { yaw: number; pitch: number; fov: number }; // radians; fov is vertical

export type Mesin = {
  /** Largest texture edge this GPU accepts; skip the full version above it. */
  maksTekstur: number;
  muat(url: string): Promise<{ lebar: number; tinggi: number }>;
  gambar(k: Kamera): void;
  ukur(): void;
  /** Screen position of a world direction (degrees), or null when behind the camera. */
  proyeksi(k: Kamera, yawDeg: number, pitchDeg: number): { x: number; y: number } | null;
  hancur(): void;
};

function kompilasi(gl: WebGLRenderingContext, jenis: number, src: string): WebGLShader | null {
  const s = gl.createShader(jenis);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/** Returns null when WebGL is unavailable. Never throws. */
export function buatMesin(canvas: HTMLCanvasElement): Mesin | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: false }) ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const ctx = gl;

  const vs = kompilasi(ctx, ctx.VERTEX_SHADER, VERTEX);
  const fs = kompilasi(ctx, ctx.FRAGMENT_SHADER, FRAGMENT);
  const prog = ctx.createProgram();
  if (!vs || !fs || !prog) return null;
  ctx.attachShader(prog, vs);
  ctx.attachShader(prog, fs);
  ctx.linkProgram(prog);
  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return null;
  ctx.useProgram(prog);

  const buf = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
  const locP = ctx.getAttribLocation(prog, "p");
  ctx.enableVertexAttribArray(locP);
  ctx.vertexAttribPointer(locP, 2, ctx.FLOAT, false, 0, 0);

  const u = {
    res: ctx.getUniformLocation(prog, "res"),
    yaw: ctx.getUniformLocation(prog, "yaw"),
    pitch: ctx.getUniformLocation(prog, "pitch"),
    tanHalf: ctx.getUniformLocation(prog, "tanHalf"),
  };

  const tex = ctx.createTexture();
  ctx.bindTexture(ctx.TEXTURE_2D, tex);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
  // A 1×1 placeholder so the first draw is valid.
  ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, 1, 1, 0, ctx.RGB, ctx.UNSIGNED_BYTE, new Uint8Array([220, 234, 253]));

  let hancur = false;
  const ukur = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.viewport(0, 0, w, h);
  };

  return {
    maksTekstur: ctx.getParameter(ctx.MAX_TEXTURE_SIZE) as number,
    muat(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.onload = () => {
          if (hancur) return reject(new Error("mesin sudah dihancurkan"));
          try {
            ctx.bindTexture(ctx.TEXTURE_2D, tex);
            ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, ctx.RGB, ctx.UNSIGNED_BYTE, img);
            resolve({ lebar: img.naturalWidth, tinggi: img.naturalHeight });
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        };
        img.onerror = () => reject(new Error(`gagal memuat ${url}`));
        img.src = url;
      });
    },
    gambar(k) {
      if (hancur) return;
      ukur();
      ctx.uniform2f(u.res, canvas.width, canvas.height);
      ctx.uniform1f(u.yaw, k.yaw);
      ctx.uniform1f(u.pitch, k.pitch);
      ctx.uniform1f(u.tanHalf, Math.tan(k.fov / 2));
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    },
    ukur,
    proyeksi(k, yawDeg, pitchDeg) {
      const lon = (yawDeg * Math.PI) / 180;
      const lat = (pitchDeg * Math.PI) / 180;
      // world direction of the hotspot
      let x = Math.cos(lat) * Math.sin(lon);
      let y = Math.sin(lat);
      let z = -Math.cos(lat) * Math.cos(lon);
      // inverse yaw, then inverse pitch (the shader applies pitch then yaw)
      const cy = Math.cos(k.yaw), sy = Math.sin(k.yaw);
      [x, z] = [x * cy - z * sy, x * sy + z * cy];
      const cp = Math.cos(k.pitch), sp = Math.sin(k.pitch);
      [y, z] = [y * cp + z * sp, -y * sp + z * cp];
      if (z >= -0.05) return null;
      const tanHalf = Math.tan(k.fov / 2);
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      const nx = x / (-z * tanHalf * aspect);
      const ny = y / (-z * tanHalf);
      if (Math.abs(nx) > 1.2 || Math.abs(ny) > 1.2) return null;
      return { x: ((nx + 1) / 2) * canvas.clientWidth, y: ((1 - ny) / 2) * canvas.clientHeight };
    },
    hancur() {
      hancur = true;
      ctx.deleteTexture(tex);
      ctx.deleteBuffer(buf);
      ctx.deleteProgram(prog);
      ctx.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

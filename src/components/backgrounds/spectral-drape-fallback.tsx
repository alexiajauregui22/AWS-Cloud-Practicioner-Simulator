/**
 * Spectral Drape (implementación local de respaldo)
 * -------------------------------------------------
 * Un manto de puntos luminosos que se pliega en 3D.
 *
 * Este archivo existe para que la app funcione sin licencia. Expone la misma
 * interfaz de props que el componente "Spectral Drape" de React Bits Pro, así que
 * cuando instales el original con
 *   npx shadcn@latest add @reactbits-starter/spectral-drape-tw
 * solo cambia el import en src/components/backgrounds/Backdrop.tsx.
 *
 * Es código original (canvas 2D, sin dependencias); no contiene código de React Bits Pro.
 */
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SpectralDrapeProps {
  colors?: string[];
  backgroundColor?: string;
  density?: number;
  dotSize?: number;
  strands?: number;
  amplitude?: number;
  frequency?: number;
  thickness?: number;
  depth?: number;
  softness?: number;
  intensity?: number;
  colorShift?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  zoom?: number;
  flow?: number;
  speed?: number;
  interactive?: boolean;
  brush?: number;
  brushRadius?: number;
  parallax?: number;
  clickRipples?: boolean;
  seed?: number;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const v = h.replace("#", "");
  const n = Number.parseInt(v.length === 3 ? v.replace(/./g, "$&$&") : v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rad = (d: number) => (d * Math.PI) / 180;

function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const BUCKETS = 14;

export default function SpectralDrape({
  colors = ["#6A4BFF", "#E4DBFF"],
  backgroundColor = "#0a0a0a",
  density = 1,
  dotSize = 1,
  strands = 8,
  amplitude = 1,
  frequency = 1,
  thickness = 0.7,
  depth = 1,
  softness = 0.6,
  intensity = 1,
  colorShift = 0.3,
  tilt = -40,
  turn = -45,
  roll = 110,
  zoom = 1,
  flow = 1,
  speed = 1,
  interactive = true,
  brush = 1,
  brushRadius = 0.2,
  parallax = 1,
  clickRipples = true,
  seed = 0,
  paused = false,
  dpr = 2,
  className,
  style,
  children,
}: SpectralDrapeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useRef({ colors, backgroundColor, dotSize, strands, amplitude, frequency, thickness, depth, softness, intensity, colorShift, tilt, turn, roll, zoom, flow, speed, interactive, brush, brushRadius, parallax, clickRipples, paused });
  props.current = { colors, backgroundColor, dotSize, strands, amplitude, frequency, thickness, depth, softness, intensity, colorShift, tilt, turn, roll, zoom, flow, speed, interactive, brush, brushRadius, parallax, clickRipples, paused };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // rejilla de puntos en coordenadas (u, v) en [-1, 1]
    const cols = Math.round(150 * Math.sqrt(density));
    const rows = Math.round(84 * Math.sqrt(density));
    const N = cols * rows;
    const U = new Float32Array(N);
    const V = new Float32Array(N);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        U[k] = (i / (cols - 1)) * 2 - 1;
        V[k] = (j / (rows - 1)) * 2 - 1;
      }
    const rand = rng(seed + 1);
    const phases = Array.from({ length: 12 }, () => ({ p: rand() * Math.PI * 2, o: rand() * 2 - 1, s: 0.6 + rand() * 0.8 }));

    let w = 0;
    let h = 0;
    let ratio = 1;
    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, dpr);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * ratio));
      canvas.height = Math.max(1, Math.floor(h * ratio));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, active: false };
    const ripples: number[] = [];
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointer.px = e.clientX - r.left;
      pointer.py = e.clientY - r.top;
      pointer.tx = (pointer.px / r.width) * 2 - 1;
      pointer.ty = (pointer.py / r.height) * 2 - 1;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.tx = 0;
      pointer.ty = 0;
    };
    const onClick = () => {
      if (props.current.clickRipples) ripples.push(time);
      if (ripples.length > 6) ripples.shift();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onClick);

    // por cubeta de color: coordenadas y tamaños
    const bx: Float32Array[] = Array.from({ length: BUCKETS }, () => new Float32Array(N));
    const by: Float32Array[] = Array.from({ length: BUCKETS }, () => new Float32Array(N));
    const bs: Float32Array[] = Array.from({ length: BUCKETS }, () => new Float32Array(N));
    const bn = new Int32Array(BUCKETS);

    let time = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const frame = (now: number) => {
      const P = props.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!P.paused && !reduce) time += dt * P.speed;

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      const c0 = hex(P.colors[0] ?? "#6A4BFF");
      const c1 = hex(P.colors[1] ?? "#E4DBFF");
      const palette = Array.from({ length: BUCKETS }, (_, b) => mix(c0, c1, b / (BUCKETS - 1)));

      const par = P.interactive ? P.parallax : 0;
      const tx = rad(P.tilt + pointer.y * 6 * par);
      const ty = rad(P.turn + pointer.x * 8 * par);
      const tz = rad(P.roll);
      const [sx, cx] = [Math.sin(tx), Math.cos(tx)];
      const [sy, cy] = [Math.sin(ty), Math.cos(ty)];
      const [sz, cz] = [Math.sin(tz), Math.cos(tz)];

      const scale = Math.min(w, h) * 0.62 * P.zoom;
      const spreadX = Math.max(w, h) / Math.min(w, h);
      const fov = 2.6;
      const nStr = Math.max(1, Math.min(12, Math.round(P.strands)));
      const thick2 = (0.05 + 0.25 * P.thickness) ** 2;
      const flowT = time * 0.35 * P.flow;
      const brushR = P.brushRadius * h;
      const brushOn = P.interactive && P.brush > 0 && pointer.active;
      const baseSize = Math.max(0.6, (Math.min(w, h) / 520) * 1.25 * P.dotSize) * ratio;

      bn.fill(0);
      for (let k = 0; k < N; k++) {
        const u = U[k] * spreadX;
        const v = V[k];
        // pliegues: cada hebra es una cresta sinuosa a lo largo de u
        let z = 0;
        for (let s = 0; s < nStr; s++) {
          const ph = phases[s];
          const center = ph.o * 0.9 + 0.35 * P.amplitude * Math.sin(u * 1.6 * P.frequency * ph.s + ph.p + flowT * ph.s);
          const d = v - center;
          z += Math.exp(-(d * d) / thick2) * (0.55 + 0.45 * Math.sin(u * 0.9 + ph.p - flowT));
        }
        z = (z / Math.sqrt(nStr)) * 0.55 * P.depth;

        // rotaciones: roll (plano), tilt (x), turn (y)
        let x = u * cz - v * sz;
        let y = u * sz + v * cz;
        let zz = z;
        const y1 = y * cx - zz * sx;
        const z1 = y * sx + zz * cx;
        y = y1;
        zz = z1;
        const x2 = x * cy + zz * sy;
        const z2 = -x * sy + zz * cy;
        x = x2;
        zz = z2;

        const persp = fov / (fov + zz + 1.2);
        let px = w / 2 + x * scale * persp;
        let py = h / 2 + y * scale * persp;
        if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;

        let glow = 0;
        if (brushOn) {
          const dx = px - pointer.px;
          const dy = py - pointer.py;
          const dist = Math.hypot(dx, dy);
          if (dist < brushR && dist > 0.001) {
            const f = (1 - dist / brushR) ** 2 * 26 * P.brush;
            px += (dx / dist) * f;
            py += (dy / dist) * f;
            glow += (1 - dist / brushR) * 0.5;
          }
        }
        for (const r0 of ripples) {
          const age = time - r0;
          if (age > 3) continue;
          const rr = age * 1.4;
          const dd = Math.abs(Math.hypot(U[k] * spreadX, v) - rr);
          if (dd < 0.18) glow += (1 - dd / 0.18) * (1 - age / 3) * 0.9;
        }

        const crest = Math.max(0, Math.min(1, z / (0.55 * P.depth + 0.0001)));
        const tone = Math.max(0, Math.min(1, crest * 0.85 + (U[k] * 0.5 + 0.5) * P.colorShift * 0.6 + glow * 0.5));
        const b = Math.min(BUCKETS - 1, Math.floor(tone * BUCKETS));
        const i = bn[b]++;
        bx[b][i] = px * ratio;
        by[b][i] = py * ratio;
        bs[b][i] = baseSize * persp * (0.7 + crest * 0.9 + glow * 0.6);
      }

      ctx.globalCompositeOperation = "source-over";
      if (P.backgroundColor === "transparent") ctx.clearRect(0, 0, canvas.width, canvas.height);
      else {
        ctx.fillStyle = P.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.globalCompositeOperation = "lighter";
      for (let b = 0; b < BUCKETS; b++) {
        const n = bn[b];
        if (!n) continue;
        const [r, g, bl] = palette[b];
        const alpha = Math.min(1, (0.32 + (b / BUCKETS) * 0.68) * P.intensity);
        // halo suave
        if (P.softness > 0.05) {
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},${alpha * 0.22 * P.softness})`;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const s = bs[b][i] * (1.8 + P.softness * 1.6);
            ctx.rect(bx[b][i] - s / 2, by[b][i] - s / 2, s, s);
          }
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},${alpha})`;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const s = bs[b][i];
          ctx.rect(bx[b][i] - s / 2, by[b][i] - s / 2, s, s);
        }
        ctx.fill();
      }

      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible && !reduce) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);
    // con movimiento reducido dibuja un solo cuadro y lo vuelve a dibujar al redimensionar
    const ro2 = reduce ? new ResizeObserver(() => requestAnimationFrame(frame)) : null;
    ro2?.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ro2?.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onClick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density, seed, dpr]);

  return (
    <div className={cn("relative overflow-hidden", className)} ref={wrapRef} style={style}>
      <canvas aria-hidden="true" className="absolute inset-0 block" ref={canvasRef} />
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}

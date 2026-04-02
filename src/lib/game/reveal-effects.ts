// ---------------------------------------------------------------------------
// reveal-effects.ts  --  7 magical image-reveal effects for the typing game
// ---------------------------------------------------------------------------
//
// The host canvas has already been set up by GameCanvas:
//   canvas.width  = logicalW * dpr   (physical pixels)
//   canvas.height = logicalH * dpr
//   ctx.scale(dpr, dpr)              (so ctx draws in logical coords)
//
// Effects receive the *logical* width/height. When they need offscreen
// canvases they multiply by dpr to match the physical resolution.
// ---------------------------------------------------------------------------

import type { RevealEffectType } from "@/lib/types/game";

// ---- public interface -----------------------------------------------------

export interface RevealEffect {
  name: string;
  init(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
  ): void;
  update(progress: number, prevProgress: number): void;
  render(dt: number): void;
  destroy(): void;
}

// ---- constants & tiny helpers ---------------------------------------------

const LAVENDER = "#E6E0FF";
const PINK = "#FFB6C1";
const MINT = "#B5EAD7";
const GOLD = "#FFD700";

const LERP_SPEED = 6; // units/s  ~160 ms settle time

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Deterministic xorshift32 PRNG */
function makeRng(seed: number) {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- base class with smooth-lerp plumbing ---------------------------------

abstract class BaseEffect implements RevealEffect {
  abstract name: string;

  protected canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  protected image!: HTMLImageElement;
  /** CSS / logical dimensions (the ctx is already scaled so draw in these) */
  protected w = 0;
  protected h = 0;
  protected dpr = 1;

  protected targetProgress = 0;
  protected currentProgress = 0;

  init(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
  ): void {
    this.canvas = canvas;
    this.ctx = ctx;
    this.image = image;
    this.w = width;
    this.h = height;
    this.dpr = Math.min(
      typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1,
      2,
    );
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.onInit();
  }

  update(progress: number, _prev: number): void {
    this.targetProgress = clamp(progress, 0, 1);
  }

  render(dt: number): void {
    const t = clamp(1 - Math.exp(-LERP_SPEED * dt), 0, 1);
    this.currentProgress = lerp(this.currentProgress, this.targetProgress, t);
    if (Math.abs(this.currentProgress - this.targetProgress) < 0.0005) {
      this.currentProgress = this.targetProgress;
    }
    this.onRender(dt);
  }

  destroy(): void {
    this.onDestroy();
  }

  // Subclass hooks
  protected abstract onInit(): void;
  protected abstract onRender(dt: number): void;
  protected onDestroy(): void {}
}

// ===========================================================================
// 1.  BlurReveal
// ===========================================================================

export class BlurReveal extends BaseEffect {
  name = "blur";

  private off!: HTMLCanvasElement;
  private offCtx!: CanvasRenderingContext2D;

  protected onInit(): void {
    this.off = document.createElement("canvas");
    this.offCtx = this.off.getContext("2d")!;
  }

  protected onRender(): void {
    const { ctx, w, h, currentProgress: p, image, off, offCtx, dpr } = this;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);

    // Resolution ramps quadratically from ~2 % to 100 %
    const scale = 0.02 + 0.98 * p * p;
    const sw = Math.max(2, Math.round(pw * scale));
    const sh = Math.max(2, Math.round(ph * scale));

    off.width = sw;
    off.height = sh;
    offCtx.drawImage(image, 0, 0, sw, sh);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(off, 0, 0, w, h);
    ctx.restore();
  }

  protected onDestroy(): void {
    this.off.width = 0;
    this.off.height = 0;
  }
}

// ===========================================================================
// 2.  MosaicReveal
// ===========================================================================

export class MosaicReveal extends BaseEffect {
  name = "mosaic";

  private off!: HTMLCanvasElement;
  private offCtx!: CanvasRenderingContext2D;

  protected onInit(): void {
    this.off = document.createElement("canvas");
    this.offCtx = this.off.getContext("2d")!;
  }

  protected onRender(): void {
    const { ctx, w, h, currentProgress: p, image, off, offCtx, dpr } = this;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);

    const scale = 0.02 + 0.98 * (p * p);
    const sw = Math.max(2, Math.round(pw * scale));
    const sh = Math.max(2, Math.round(ph * scale));

    off.width = sw;
    off.height = sh;
    offCtx.drawImage(image, 0, 0, sw, sh);

    ctx.save();
    ctx.imageSmoothingEnabled = false; // blocky!
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(off, 0, 0, w, h);
    ctx.restore();
  }

  protected onDestroy(): void {
    this.off.width = 0;
    this.off.height = 0;
  }
}

// ===========================================================================
// 3.  JigsawReveal  (4x4 grid, pieces pop in with a bounce)
// ===========================================================================

const JIGSAW_COLS = 4;
const JIGSAW_ROWS = 4;
const JIGSAW_BOUNCE_MS = 300;

interface JigsawPiece {
  col: number;
  row: number;
  revealedAt: number; // performance.now() when revealed, 0 = hidden
}

export class JigsawReveal extends BaseEffect {
  name = "jigsaw";

  private pieces: JigsawPiece[] = [];
  private order: number[] = [];
  private revealedCount = 0;
  private pw = 0; // piece width  (logical)
  private ph = 0; // piece height (logical)

  protected onInit(): void {
    const rng = makeRng(42);
    this.pw = this.w / JIGSAW_COLS;
    this.ph = this.h / JIGSAW_ROWS;
    this.pieces = [];
    this.revealedCount = 0;

    for (let r = 0; r < JIGSAW_ROWS; r++) {
      for (let c = 0; c < JIGSAW_COLS; c++) {
        this.pieces.push({ col: c, row: r, revealedAt: 0 });
      }
    }
    this.order = shuffleArray(
      Array.from({ length: this.pieces.length }, (_, i) => i),
      rng,
    );
  }

  update(progress: number, prev: number): void {
    super.update(progress, prev);
    const shouldReveal = Math.floor(progress * this.pieces.length);
    const now = performance.now();
    while (this.revealedCount < shouldReveal && this.revealedCount < this.order.length) {
      this.pieces[this.order[this.revealedCount]].revealedAt = now;
      this.revealedCount++;
    }
  }

  protected onRender(): void {
    const { ctx, w, h, image } = this;
    const { pw: pieceW, ph: pieceH } = this;
    const now = performance.now();

    ctx.clearRect(0, 0, w, h);

    // Lavender background
    ctx.fillStyle = LAVENDER;
    ctx.fillRect(0, 0, w, h);

    // Draw each revealed piece with a bounce animation
    for (const piece of this.pieces) {
      if (piece.revealedAt === 0) continue;

      const elapsed = now - piece.revealedAt;
      const t = clamp(elapsed / JIGSAW_BOUNCE_MS, 0, 1);
      // 0 -> 1.1 -> 1.0  (overshoot then settle)
      const scale = t < 0.6
        ? (t / 0.6) * 1.1
        : 1.1 - 0.1 * ((t - 0.6) / 0.4);

      const cx = (piece.col + 0.5) * pieceW;
      const cy = (piece.row + 0.5) * pieceH;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(clamp(scale, 0, 1.1), clamp(scale, 0, 1.1));
      ctx.translate(-cx, -cy);
      ctx.beginPath();
      ctx.rect(piece.col * pieceW, piece.row * pieceH, pieceW, pieceH);
      ctx.clip();
      ctx.drawImage(image, 0, 0, w, h);
      ctx.restore();
    }

    // White grid lines
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    for (let c = 1; c < JIGSAW_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * pieceW, 0);
      ctx.lineTo(c * pieceW, h);
      ctx.stroke();
    }
    for (let r = 1; r < JIGSAW_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * pieceH);
      ctx.lineTo(w, r * pieceH);
      ctx.stroke();
    }
  }
}

// ===========================================================================
// 4.  CurtainReveal  (12 pastel strips, removed center-outward)
// ===========================================================================

const CURTAIN_STRIPS = 12;
const CURTAIN_ANIM_MS = 400;
const CURTAIN_COLORS = [LAVENDER, PINK, MINT, "#FFE4B5", "#B0E0E6", "#DDA0DD"];

interface CurtainStrip {
  x: number;
  width: number;
  color: string;
  removedAt: number; // 0 = still covering
}

export class CurtainReveal extends BaseEffect {
  name = "curtain";

  private strips: CurtainStrip[] = [];
  private removalOrder: number[] = [];
  private removedCount = 0;

  protected onInit(): void {
    const stripW = this.w / CURTAIN_STRIPS;
    this.strips = [];
    this.removedCount = 0;

    for (let i = 0; i < CURTAIN_STRIPS; i++) {
      this.strips.push({
        x: i * stripW,
        width: stripW,
        color: CURTAIN_COLORS[i % CURTAIN_COLORS.length],
        removedAt: 0,
      });
    }

    // Center-outward order
    const mid = CURTAIN_STRIPS / 2;
    const sorted = Array.from({ length: CURTAIN_STRIPS }, (_, i) => ({
      idx: i,
      dist: Math.abs(i + 0.5 - mid),
    }));
    sorted.sort((a, b) => a.dist - b.dist);
    this.removalOrder = sorted.map((o) => o.idx);
  }

  update(progress: number, prev: number): void {
    super.update(progress, prev);
    const shouldRemove = Math.floor(progress * CURTAIN_STRIPS);
    const now = performance.now();
    while (this.removedCount < shouldRemove && this.removedCount < this.removalOrder.length) {
      this.strips[this.removalOrder[this.removedCount]].removedAt = now;
      this.removedCount++;
    }
  }

  protected onRender(): void {
    const { ctx, w, h, image } = this;
    const now = performance.now();

    // Full image behind
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);

    // Pastel strips that shrink away when removed
    for (const strip of this.strips) {
      let vis = strip.width;
      if (strip.removedAt > 0) {
        const t = clamp((now - strip.removedAt) / CURTAIN_ANIM_MS, 0, 1);
        vis = strip.width * (1 - easeOutCubic(t));
      }
      if (vis < 0.5) continue;

      const cx = strip.x + strip.width / 2;
      ctx.fillStyle = strip.color;
      ctx.fillRect(cx - vis / 2, 0, vis, h);
    }
  }
}

// ===========================================================================
// 5.  SpotlightReveal  (expanding circle with golden glow)
// ===========================================================================

export class SpotlightReveal extends BaseEffect {
  name = "spotlight";

  private maxRadius = 0;
  private cx = 0;
  private cy = 0;

  protected onInit(): void {
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.maxRadius = Math.sqrt(this.w * this.w + this.h * this.h) / 2;
  }

  protected onRender(): void {
    const { ctx, w, h, image, cx, cy } = this;
    const radius = this.maxRadius * easeOutCubic(this.currentProgress);

    ctx.clearRect(0, 0, w, h);

    if (radius < 0.5) {
      ctx.fillStyle = LAVENDER;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // Image underneath
    ctx.drawImage(image, 0, 0, w, h);

    // Lavender overlay with circular hole (even-odd fill)
    ctx.save();
    const cover = new Path2D();
    cover.rect(0, 0, w, h);
    cover.arc(cx, cy, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = LAVENDER;
    ctx.fill(cover, "evenodd");
    ctx.restore();

    // Golden glow ring
    const glowW = Math.max(6, 14);
    const innerR = Math.max(0, radius - glowW);
    const outerR = radius + glowW;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.clip("evenodd");

    const glow = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    glow.addColorStop(0, "rgba(255,215,0,0)");
    glow.addColorStop(0.35, "rgba(255,215,0,0.4)");
    glow.addColorStop(0.65, "rgba(255,215,0,0.4)");
    glow.addColorStop(1, "rgba(255,215,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - outerR, cy - outerR, outerR * 2, outerR * 2);
    ctx.restore();
  }
}

// ===========================================================================
// 6.  SparkleReveal  (soft holes punched through a lavender mask + particles)
// ===========================================================================

const SPARKLE_GRID = 8;
const SPARKLE_PARTICLE_LIFE_MS = 800;

interface SparkleHole {
  x: number;
  y: number;
  radius: number;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  size: number;
  color: string;
  rot: number;
  rotV: number;
}

export class SparkleReveal extends BaseEffect {
  name = "sparkle";

  private mask!: HTMLCanvasElement;
  private maskCtx!: CanvasRenderingContext2D;
  private holes: SparkleHole[] = [];
  private revealedHoles = 0;
  private particles: SparkleParticle[] = [];
  private starPath!: Path2D;

  private static readonly COLORS = [GOLD, "#FFF7AE", PINK, "#E0E7FF", "#FFFFFF"];

  protected onInit(): void {
    const { w, h, dpr } = this;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);

    // Mask at physical resolution
    this.mask = document.createElement("canvas");
    this.mask.width = pw;
    this.mask.height = ph;
    this.maskCtx = this.mask.getContext("2d")!;
    this.maskCtx.fillStyle = LAVENDER;
    this.maskCtx.fillRect(0, 0, pw, ph);

    // Pre-compute jittered grid holes (in physical coords)
    const rng = makeRng(123);
    const cellW = pw / SPARKLE_GRID;
    const cellH = ph / SPARKLE_GRID;
    this.holes = [];
    for (let r = 0; r < SPARKLE_GRID; r++) {
      for (let c = 0; c < SPARKLE_GRID; c++) {
        this.holes.push({
          x: (c + 0.5) * cellW + (rng() - 0.5) * cellW * 0.6,
          y: (r + 0.5) * cellH + (rng() - 0.5) * cellH * 0.6,
          radius: Math.max(cellW, cellH) * (0.7 + rng() * 0.4),
        });
      }
    }
    this.holes = shuffleArray(this.holes, rng);
    this.revealedHoles = 0;
    this.particles = [];

    // Pre-build a 5-pointed star unit path
    this.starPath = new Path2D();
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? 1 : 0.4;
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) this.starPath.moveTo(x, y);
      else this.starPath.lineTo(x, y);
    }
    this.starPath.closePath();
  }

  update(progress: number, prev: number): void {
    super.update(progress, prev);

    const shouldReveal = Math.floor(progress * this.holes.length);
    const now = performance.now();
    const rng = makeRng((now & 0xffff) + this.revealedHoles);

    while (this.revealedHoles < shouldReveal && this.revealedHoles < this.holes.length) {
      const hole = this.holes[this.revealedHoles];

      // Punch a soft radial hole in the mask
      const grad = this.maskCtx.createRadialGradient(
        hole.x, hole.y, 0,
        hole.x, hole.y, hole.radius,
      );
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.8)");
      grad.addColorStop(1, "rgba(0,0,0,0)");

      this.maskCtx.save();
      this.maskCtx.globalCompositeOperation = "destination-out";
      this.maskCtx.fillStyle = grad;
      this.maskCtx.beginPath();
      this.maskCtx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
      this.maskCtx.fill();
      this.maskCtx.restore();

      // Spawn sparkle particles (in logical coords)
      const holeLogicalX = hole.x / this.dpr;
      const holeLogicalY = hole.y / this.dpr;
      const count = 4 + Math.floor(rng() * 4);
      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const speed = 40 + rng() * 80;
        this.particles.push({
          x: holeLogicalX,
          y: holeLogicalY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          born: now,
          size: 3 + rng() * 5,
          color: SparkleReveal.COLORS[
            Math.floor(rng() * SparkleReveal.COLORS.length)
          ],
          rot: rng() * Math.PI * 2,
          rotV: (rng() - 0.5) * 8,
        });
      }

      this.revealedHoles++;
    }
  }

  protected onRender(dt: number): void {
    const { ctx, w, h, image, mask } = this;
    const now = performance.now();

    ctx.clearRect(0, 0, w, h);

    // Full image
    ctx.drawImage(image, 0, 0, w, h);

    // Overlay the mask (physical-resolution canvas drawn into logical rect)
    ctx.drawImage(mask, 0, 0, w, h);

    // Sparkle particles
    this.particles = this.particles.filter((p) => {
      const age = now - p.born;
      if (age > SPARKLE_PARTICLE_LIFE_MS) return false;

      const t = age / SPARKLE_PARTICLE_LIFE_MS;
      const alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt; // gentle gravity
      p.vx *= 0.98;
      p.rot += p.rotV * dt;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.size, p.size);
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fill(this.starPath);
      ctx.restore();

      return true;
    });
  }

  protected onDestroy(): void {
    this.mask.width = 0;
    this.mask.height = 0;
    this.particles = [];
  }
}

// ===========================================================================
// 7.  PaintBrushReveal  (bezier brush strokes wipe away lavender mask)
// ===========================================================================

interface BrushStroke {
  points: { x: number; y: number }[];
  maxWidth: number;
}

export class PaintBrushReveal extends BaseEffect {
  name = "paintbrush";

  private mask!: HTMLCanvasElement;
  private maskCtx!: CanvasRenderingContext2D;
  private strokes: BrushStroke[] = [];
  private revealedStrokes = 0;

  protected onInit(): void {
    const { w, h, dpr } = this;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);

    this.mask = document.createElement("canvas");
    this.mask.width = pw;
    this.mask.height = ph;
    this.maskCtx = this.mask.getContext("2d")!;
    this.maskCtx.fillStyle = LAVENDER;
    this.maskCtx.fillRect(0, 0, pw, ph);

    // Pre-generate brush strokes that meander across the canvas (physical coords)
    const rng = makeRng(777);
    const strokeCount = 20;
    this.strokes = [];
    this.revealedStrokes = 0;

    for (let i = 0; i < strokeCount; i++) {
      const points: { x: number; y: number }[] = [];
      let x = rng() * pw;
      let y = rng() * ph;
      const segCount = 6 + Math.floor(rng() * 6);
      points.push({ x, y });

      for (let s = 0; s < segCount; s++) {
        const angle = rng() * Math.PI * 2;
        const dist = pw * 0.08 + rng() * pw * 0.15;
        x = clamp(x + Math.cos(angle) * dist, 0, pw);
        y = clamp(y + Math.sin(angle) * dist, 0, ph);
        points.push({ x, y });
      }

      this.strokes.push({
        points,
        maxWidth: (25 + rng() * 40) * dpr,
      });
    }
  }

  update(progress: number, prev: number): void {
    super.update(progress, prev);
    const shouldReveal = Math.floor(progress * this.strokes.length);
    while (
      this.revealedStrokes < shouldReveal &&
      this.revealedStrokes < this.strokes.length
    ) {
      this.paintStroke(this.strokes[this.revealedStrokes]);
      this.revealedStrokes++;
    }
  }

  private paintStroke(stroke: BrushStroke): void {
    const mctx = this.maskCtx;
    const pts = stroke.points;
    if (pts.length < 2) return;

    mctx.save();
    mctx.globalCompositeOperation = "destination-out";
    mctx.lineCap = "round";
    mctx.lineJoin = "round";

    const total = pts.length - 1;
    for (let i = 0; i < total; i++) {
      // Sinusoidal width: thick in middle, thin at edges
      const t = (i + 0.5) / total;
      const widthFactor = Math.sin(t * Math.PI);
      const lineW = Math.max(4, stroke.maxWidth * (0.3 + 0.7 * widthFactor));

      mctx.beginPath();
      mctx.lineWidth = lineW;
      mctx.strokeStyle = "rgba(0,0,0,1)";

      if (i === 0) {
        mctx.moveTo(pts[0].x, pts[0].y);
        mctx.lineTo(pts[1].x, pts[1].y);
      } else {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[i + 1];
        const mx0 = (prev.x + curr.x) / 2;
        const my0 = (prev.y + curr.y) / 2;
        const mx1 = (curr.x + next.x) / 2;
        const my1 = (curr.y + next.y) / 2;
        mctx.moveTo(mx0, my0);
        mctx.quadraticCurveTo(curr.x, curr.y, mx1, my1);
      }
      mctx.stroke();
    }

    mctx.restore();
  }

  protected onRender(): void {
    const { ctx, w, h, image, mask } = this;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);
    ctx.drawImage(mask, 0, 0, w, h);
  }

  protected onDestroy(): void {
    this.mask.width = 0;
    this.mask.height = 0;
  }
}

// ===========================================================================
// Factory
// ===========================================================================

export function createEffect(type: RevealEffectType): RevealEffect {
  switch (type) {
    case "blur":
      return new BlurReveal();
    case "mosaic":
      return new MosaicReveal();
    case "jigsaw":
      return new JigsawReveal();
    case "curtain":
      return new CurtainReveal();
    case "spotlight":
      return new SpotlightReveal();
    case "sparkle":
      return new SparkleReveal();
    case "paintbrush":
      return new PaintBrushReveal();
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown effect type: ${_exhaustive}`);
    }
  }
}

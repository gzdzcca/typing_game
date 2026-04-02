"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { RevealEffectType } from "@/lib/types/game";
import { createEffect, type RevealEffect } from "@/lib/game/reveal-effects";
import { UI_TEXT } from "@/lib/utils/ui-text";

interface GameCanvasProps {
  imageSrc: string;
  progress: number;
  effectType: RevealEffectType;
}

export default function GameCanvas({
  imageSrc,
  progress,
  effectType,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectRef = useRef<RevealEffect | null>(null);
  const prevProgressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, image: HTMLImageElement) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Calculate CSS size (max 500px, responsive)
      const containerWidth = Math.min(
        canvas.parentElement?.clientWidth ?? 500,
        500,
      );
      const aspectRatio = image.naturalWidth / image.naturalHeight;
      let cssWidth = containerWidth;
      let cssHeight = containerWidth / aspectRatio;

      if (cssHeight > 500) {
        cssHeight = 500;
        cssWidth = 500 * aspectRatio;
      }

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      // Create and initialize effect
      const effect = createEffect(effectType);
      effect.init(canvas, ctx, image, cssWidth, cssHeight);
      effectRef.current = effect;
      prevProgressRef.current = 0;

      // Start animation loop
      lastTimeRef.current = performance.now();

      function animate(time: number) {
        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        if (effectRef.current) {
          effectRef.current.render(dt);
        }

        animFrameRef.current = requestAnimationFrame(animate);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [effectType],
  );

  // Load image and set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      setImageLoaded(true);
      setupCanvas(canvas, image);
    };

    image.src = imageSrc;

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, [imageSrc, setupCanvas]);

  // Update effect when progress changes
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.update(progress, prevProgressRef.current);
      prevProgressRef.current = progress;
    }
  }, [progress]);

  return (
    <div className="flex items-center justify-center w-full px-4">
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        {!imageLoaded && (
          <div className="flex flex-col items-center justify-center w-64 h-64 bg-pink-pale rounded-2xl">
            <span className="text-5xl animate-bounce-gentle">🌟</span>
            <p className="text-lg text-pink-bright font-bold mt-2">
              {UI_TEXT.loading}
            </p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`rounded-2xl ${imageLoaded ? "block" : "hidden"}`}
        />
      </div>
    </div>
  );
}

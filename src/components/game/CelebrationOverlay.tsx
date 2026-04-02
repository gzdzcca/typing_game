"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { UI_TEXT } from "@/lib/utils/ui-text";

interface CelebrationOverlayProps {
  onNext: () => void;
  onRetry: () => void;
}

export default function CelebrationOverlay({
  onNext,
  onRetry,
}: CelebrationOverlayProps) {
  const [showButtons, setShowButtons] = useState(false);
  const [celebrationText] = useState(() => {
    const texts = UI_TEXT.celebrations;
    return texts[Math.floor(Math.random() * texts.length)];
  });

  useEffect(() => {
    // Fire confetti burst
    const duration = 2000;
    const end = Date.now() + duration;

    function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: ["#FFB6C1", "#FF6B9D", "#B0E0FF", "#E6E0FF", "#B5EAD7", "#FFF3B0"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ["#FFB6C1", "#FF6B9D", "#B0E0FF", "#E6E0FF", "#B5EAD7", "#FFF3B0"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    frame();

    // Also fire a big center burst
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#FFB6C1", "#FF6B9D", "#B0E0FF", "#E6E0FF", "#B5EAD7", "#FFF3B0"],
    });

    // Show buttons after 2s delay
    const timer = setTimeout(() => setShowButtons(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/30 backdrop-blur-sm rounded-2xl">
      {/* Celebration text */}
      <p
        className="text-6xl font-bold text-pink-bright animate-pop-in"
        style={{ textShadow: "0 2px 10px rgba(255, 107, 157, 0.4)" }}
      >
        {celebrationText}
      </p>

      {/* Buttons */}
      {showButtons && (
        <div className="flex gap-4 mt-8 animate-pop-in">
          <button
            onClick={onNext}
            className="px-8 py-4 bg-pink-soft text-white font-bold text-2xl rounded-2xl
                       min-w-40 hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            {UI_TEXT.next}
          </button>
          <button
            onClick={onRetry}
            className="px-8 py-4 bg-lavender text-purple-700 font-bold text-2xl rounded-2xl
                       min-w-40 hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            {UI_TEXT.retry}
          </button>
        </div>
      )}
    </div>
  );
}

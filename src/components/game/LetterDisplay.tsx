"use client";

import { useEffect, useRef, useState } from "react";
import { UI_TEXT } from "@/lib/utils/ui-text";

interface LetterDisplayProps {
  word: string;
  typedCount: number;
}

export default function LetterDisplay({ word, typedCount }: LetterDisplayProps) {
  const letters = word.split("");
  const currentLetter = letters[typedCount] ?? "";
  const [wobble, setWobble] = useState(false);
  const prevTypedRef = useRef(typedCount);
  const [lastFilledStar, setLastFilledStar] = useState(-1);

  // Track when a star was just filled for animation
  useEffect(() => {
    if (typedCount > prevTypedRef.current) {
      setLastFilledStar(typedCount - 1);
      const timer = setTimeout(() => setLastFilledStar(-1), 500);
      prevTypedRef.current = typedCount;
      return () => clearTimeout(timer);
    }
    prevTypedRef.current = typedCount;
  }, [typedCount]);

  // Expose wobble trigger via a custom event
  useEffect(() => {
    function handleWobble() {
      setWobble(true);
      setTimeout(() => setWobble(false), 400);
    }
    window.addEventListener("typing-wrong", handleWobble);
    return () => window.removeEventListener("typing-wrong", handleWobble);
  }, []);

  return (
    <div className={`flex flex-col items-center gap-3 py-4 ${wobble ? "animate-wobble" : ""}`}>
      {/* Next letter prompt */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-lg text-gray-500 font-bold">
          {UI_TEXT.nextLetter}:
        </p>
        <span className="text-7xl font-bold text-pink-bright animate-bounce-gentle leading-none">
          {currentLetter}
        </span>
      </div>

      {/* Letter row */}
      <div className="flex gap-1.5 md:gap-2 flex-wrap justify-center px-2">
        {letters.map((letter, i) => {
          const isTyped = i < typedCount;
          const isCurrent = i === typedCount;
          return (
            <span
              key={i}
              className={`
                font-bold rounded-lg px-2 py-1 transition-all duration-200
                ${isTyped
                  ? "text-white bg-mint text-xl md:text-2xl scale-90"
                  : isCurrent
                    ? "text-pink-bright bg-pink-pale text-2xl md:text-3xl scale-110 shadow-md"
                    : "text-gray-400 bg-gray-100 text-xl md:text-2xl"
                }
              `}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Star progress */}
      <div className="flex gap-1 flex-wrap justify-center">
        {letters.map((_, i) => {
          const isFilled = i < typedCount;
          const justFilled = i === lastFilledStar;
          return (
            <span
              key={i}
              className={`
                text-2xl transition-all duration-200
                ${isFilled ? "text-yellow-soft" : "text-gray-300"}
                ${justFilled ? "animate-star-fill" : ""}
              `}
            >
              {isFilled ? "★" : "☆"}
            </span>
          );
        })}
      </div>
    </div>
  );
}

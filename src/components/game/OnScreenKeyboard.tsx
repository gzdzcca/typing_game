"use client";

import { useState, useEffect, useCallback } from "react";
import type { TypingMode } from "@/lib/types/game";

const ALPHABET_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const HIRAGANA_ROWS = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "ゆ", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "を", "ん", "ー"],
  ["が", "ぎ", "ぐ", "げ", "ご"],
  ["ざ", "じ", "ず", "ぜ", "ぞ"],
  ["だ", "ぢ", "づ", "で", "ど"],
  ["ば", "び", "ぶ", "べ", "ぼ"],
  ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
  ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ"],
  ["っ", "ゃ", "ゅ", "ょ"],
];

interface OnScreenKeyboardProps {
  typingMode: TypingMode;
  nextKey: string;
  onKeyPress: (key: string) => void;
  visible: boolean;
}

const KEY_COLORS = [
  "bg-pink-pale",
  "bg-blue-pale",
  "bg-lavender-pale",
  "bg-mint-pale",
  "bg-yellow-pale",
];

export default function OnScreenKeyboard({
  typingMode,
  nextKey,
  onKeyPress,
  visible,
}: OnScreenKeyboardProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handlePress = useCallback(
    (key: string) => {
      setPressedKey(key);
      onKeyPress(key);
      setTimeout(() => setPressedKey(null), 150);
    },
    [onKeyPress]
  );

  // Prevent default touch behavior to avoid double-tap zoom
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest(".on-screen-keyboard")) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchstart", preventZoom, { passive: false });
    return () => document.removeEventListener("touchstart", preventZoom);
  }, []);

  if (!visible) return null;

  if (typingMode === "alphabet") {
    return (
      <div className="on-screen-keyboard w-full px-1 pb-2 pt-1 select-none">
        {ALPHABET_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 mb-1">
            {row.map((key) => {
              const isNext = key.toLowerCase() === nextKey.toLowerCase();
              const isPressed = pressedKey === key;
              return (
                <button
                  key={key}
                  onTouchStart={() => handlePress(key)}
                  onClick={() => handlePress(key)}
                  className={`
                    min-w-[36px] min-h-[48px] md:min-w-[48px] md:min-h-[56px]
                    rounded-xl text-lg md:text-xl font-bold
                    transition-all duration-100
                    ${isNext
                      ? "bg-pink-bright text-white scale-110 shadow-lg animate-pulse-glow"
                      : KEY_COLORS[rowIdx % KEY_COLORS.length] + " text-gray-700"
                    }
                    ${isPressed ? "scale-90 brightness-90" : ""}
                    active:scale-90
                  `}
                >
                  {key.toUpperCase()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Hiragana mode: show in a compact grid
  // Only show rows that contain characters used in the word
  return (
    <div className="on-screen-keyboard w-full px-1 pb-2 pt-1 select-none overflow-y-auto max-h-[240px]">
      <div className="grid grid-cols-5 gap-1 max-w-[320px] mx-auto">
        {HIRAGANA_ROWS.flat().map((key) => {
          const isNext = key === nextKey;
          const isPressed = pressedKey === key;
          return (
            <button
              key={key}
              onTouchStart={() => handlePress(key)}
              onClick={() => handlePress(key)}
              className={`
                min-h-[48px] rounded-xl text-lg font-bold
                transition-all duration-100
                ${isNext
                  ? "bg-pink-bright text-white scale-110 shadow-lg animate-pulse-glow"
                  : "bg-lavender-pale text-gray-700"
                }
                ${isPressed ? "scale-90 brightness-90" : ""}
                active:scale-90
              `}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

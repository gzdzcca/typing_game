"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Game, RevealEffectType, GameStatus } from "@/lib/types/game";
import { UI_TEXT } from "@/lib/utils/ui-text";
import GameSelector from "@/components/game/GameSelector";
import LetterDisplay from "@/components/game/LetterDisplay";
import GameCanvas from "@/components/game/GameCanvas";
import CelebrationOverlay from "@/components/game/CelebrationOverlay";
import OnScreenKeyboard from "@/components/game/OnScreenKeyboard";
import MusicToggle from "@/components/ui/MusicToggle";
import { useMusic } from "@/hooks/useMusic";
import { speakLetter } from "@/lib/audio/letter-voice";

const ALL_EFFECTS: RevealEffectType[] = [
  "blur",
  "mosaic",
  "jigsaw",
  "curtain",
  "spotlight",
  "sparkle",
  "paintbrush",
];

function pickRandomEffect(): RevealEffectType {
  return ALL_EFFECTS[Math.floor(Math.random() * ALL_EFFECTS.length)];
}

export default function GamePage() {
  const [status, setStatus] = useState<GameStatus>("selecting");
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [typedCount, setTypedCount] = useState(0);
  const [effectType, setEffectType] = useState<RevealEffectType>("blur");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const typedCountRef = useRef(0);
  const currentGameRef = useRef<Game | null>(null);
  const { playCorrect, playWrong, playCelebration } = useMusic();

  // Keep refs in sync with state
  useEffect(() => {
    typedCountRef.current = typedCount;
  }, [typedCount]);

  useEffect(() => {
    currentGameRef.current = currentGame;
  }, [currentGame]);

  // Fetch all games for "next" functionality
  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("/api/games");
        if (res.ok) {
          const data = await res.json();
          setAllGames(data);
        }
      } catch {
        // Fail silently
      }
    }
    fetchGames();
  }, []);

  const startGame = useCallback((game: Game) => {
    setCurrentGame(game);
    setTypedCount(0);
    setEffectType(pickRandomEffect());
    setStatus("playing");
    // Speak the first letter
    if (game.word.length > 0) {
      setTimeout(() => speakLetter(game.word[0], game.typingMode), 300);
    }
  }, []);

  const handleNext = useCallback(() => {
    // Pick a random game that's different from the current one
    const otherGames = allGames.filter(
      (g) => g.id !== currentGameRef.current?.id,
    );
    if (otherGames.length > 0) {
      const nextGame =
        otherGames[Math.floor(Math.random() * otherGames.length)];
      startGame(nextGame);
    } else if (allGames.length > 0) {
      // Only one game, replay it
      startGame(allGames[0]);
    } else {
      setStatus("selecting");
    }
  }, [allGames, startGame]);

  const handleRetry = useCallback(() => {
    if (currentGameRef.current) {
      startGame(currentGameRef.current);
    }
  }, [startGame]);

  // Detect touch device to show on-screen keyboard
  useEffect(() => {
    const handleTouch = () => { setShowKeyboard(true); };
    const handlePhysicalKey = () => { setShowKeyboard(false); };
    window.addEventListener("touchstart", handleTouch, { once: true });
    window.addEventListener("keydown", handlePhysicalKey, { once: false });
    // Default: show keyboard on mobile/tablet
    if ("ontouchstart" in window) setShowKeyboard(true);
    return () => {
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("keydown", handlePhysicalKey);
    };
  }, []);

  // Shared letter check logic
  const checkLetter = useCallback((pressedChar: string) => {
    const game = currentGameRef.current;
    if (!game) return;
    const currentIndex = typedCountRef.current;
    if (currentIndex >= game.word.length) return;

    const expectedChar = game.word[currentIndex];
    let isCorrect = false;
    if (game.typingMode === "alphabet") {
      isCorrect = pressedChar.toLowerCase() === expectedChar.toLowerCase();
    } else {
      isCorrect = pressedChar === expectedChar;
    }

    if (isCorrect) {
      playCorrect();
      const newCount = currentIndex + 1;
      setTypedCount(newCount);
      if (newCount >= game.word.length) {
        playCelebration();
        setStatus("celebrating");
      } else {
        // Speak the next letter after a short delay
        setTimeout(() => speakLetter(game.word[newCount], game.typingMode), 200);
      }
    } else {
      if (pressedChar.length === 1) {
        playWrong();
        window.dispatchEvent(new Event("typing-wrong"));
      }
    }
  }, [playCorrect, playWrong, playCelebration]);

  // Physical keyboard handler
  useEffect(() => {
    if (status !== "playing") return;
    function handleKeyDown(e: KeyboardEvent) {
      checkLetter(e.key);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [status, checkLetter]);

  // On-screen keyboard handler
  const handleOnScreenKey = useCallback((key: string) => {
    checkLetter(key);
  }, [checkLetter]);

  const progress =
    currentGame ? typedCount / currentGame.word.length : 0;

  return (
    <div className="flex flex-col items-center min-h-screen py-4 px-4">
      <MusicToggle />

      {/* Selecting state */}
      {status === "selecting" && (
        <div className="flex flex-col items-center gap-8 w-full flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-pink-bright animate-bounce-gentle">
            {UI_TEXT.selectGame}
          </h1>
          <GameSelector onSelectGame={startGame} />
        </div>
      )}

      {/* Playing state */}
      {status === "playing" && currentGame && (
        <div className="flex flex-col items-center gap-2 w-full flex-1 relative">
          {/* Back button */}
          <div className="self-start">
            <button
              onClick={() => setStatus("selecting")}
              className="px-4 py-2 bg-pink-pale text-pink-bright font-bold text-lg rounded-xl
                         hover:scale-105 active:scale-95 transition-transform"
            >
              {UI_TEXT.back}
            </button>
          </div>

          {/* Game canvas area - fill most of the screen */}
          <div className="flex-[4] flex items-center justify-center w-full relative">
            <GameCanvas
              imageSrc={currentGame.imagePath}
              progress={progress}
              effectType={effectType}
            />
          </div>

          {/* Letter display */}
          <div className="flex-[1] flex items-start justify-center w-full">
            <LetterDisplay
              word={currentGame.word}
              typedCount={typedCount}
            />
          </div>

          {/* On-screen keyboard */}
          {showKeyboard && currentGame && (
            <OnScreenKeyboard
              typingMode={currentGame.typingMode}
              nextKey={currentGame.word[typedCount] ?? ""}
              onKeyPress={handleOnScreenKey}
              visible={true}
            />
          )}
        </div>
      )}

      {/* Celebrating state */}
      {status === "celebrating" && currentGame && (
        <div className="flex flex-col items-center justify-center w-full flex-1 relative gap-3 py-4">
          {/* Revealed image with decorative frame + Gemini icons */}
          <div className="relative p-3 md:p-5 rounded-3xl bg-white/90 shadow-2xl
                          border-4 border-pink-soft
                          animate-pop-in"
               style={{ maxWidth: "92vw", maxHeight: "65vh" }}>
            {/* Corner icons - Gemini 3 Pro generated */}
            <img src="/ui/icon-strawberry.png" alt="" className="absolute -top-5 -left-5 w-10 h-10 md:w-12 md:h-12 animate-float mix-blend-multiply" style={{ animationDelay: "0s" }} />
            <img src="/ui/icon-star.png" alt="" className="absolute -top-5 -right-5 w-10 h-10 md:w-12 md:h-12 animate-float mix-blend-multiply" style={{ animationDelay: "0.3s" }} />
            <img src="/ui/icon-heart.png" alt="" className="absolute -bottom-5 -left-5 w-10 h-10 md:w-12 md:h-12 animate-float mix-blend-multiply" style={{ animationDelay: "0.6s" }} />
            <img src="/ui/icon-strawberry.png" alt="" className="absolute -bottom-5 -right-5 w-10 h-10 md:w-12 md:h-12 animate-float mix-blend-multiply" style={{ animationDelay: "0.9s" }} />
            {/* Mid-edge icons */}
            <img src="/ui/icon-heart.png" alt="" className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 animate-float mix-blend-multiply" style={{ animationDelay: "0.4s" }} />
            <img src="/ui/icon-star.png" alt="" className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 animate-float mix-blend-multiply" style={{ animationDelay: "0.7s" }} />

            {/* Full-resolution image (no canvas/effect - just the crisp image) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentGame.imagePath}
              alt={currentGame.displayName}
              className="rounded-2xl object-contain"
              style={{ maxWidth: "85vw", maxHeight: "58vh" }}
            />
          </div>

          {/* Display name under the image */}
          <p className="text-3xl md:text-4xl font-bold text-pink-bright">
            {currentGame.displayName}
          </p>

          {/* Celebration overlay (confetti + buttons) */}
          <CelebrationOverlay
            onNext={handleNext}
            onRetry={handleRetry}
          />
        </div>
      )}
    </div>
  );
}

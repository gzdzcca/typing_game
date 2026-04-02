"use client";

import Link from "next/link";
import { UI_TEXT } from "@/lib/utils/ui-text";
import MusicToggle from "@/components/ui/MusicToggle";

const FLOATING_DECORATIONS = [
  { char: "✦", top: "10%", left: "10%", delay: "0s", size: "text-2xl", color: "text-pink-soft" },
  { char: "♡", top: "15%", right: "15%", delay: "0.5s", size: "text-3xl", color: "text-pink-bright" },
  { char: "✦", top: "25%", left: "5%", delay: "1s", size: "text-xl", color: "text-lavender" },
  { char: "♡", top: "70%", right: "10%", delay: "1.5s", size: "text-2xl", color: "text-pink-soft" },
  { char: "✦", top: "80%", left: "12%", delay: "2s", size: "text-xl", color: "text-yellow-soft" },
  { char: "♡", top: "60%", left: "8%", delay: "0.8s", size: "text-xl", color: "text-mint" },
  { char: "✦", top: "40%", right: "8%", delay: "1.2s", size: "text-2xl", color: "text-blue-soft" },
  { char: "♡", top: "85%", right: "20%", delay: "1.8s", size: "text-xl", color: "text-peach" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden px-4">
      <MusicToggle />
      {/* Floating decorations */}
      {FLOATING_DECORATIONS.map((deco, i) => (
        <span
          key={i}
          className={`absolute ${deco.size} ${deco.color} animate-float pointer-events-none opacity-60`}
          style={{
            top: deco.top,
            left: deco.left,
            right: deco.right,
            animationDelay: deco.delay,
          }}
        >
          {deco.char}
        </span>
      ))}

      {/* Title */}
      <h1
        className="text-5xl md:text-7xl font-bold animate-bounce-gentle mb-12 text-center"
        style={{
          background: "linear-gradient(135deg, #FF6B9D, #E6E0FF, #FF6B9D)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {UI_TEXT.gameTitle}
      </h1>

      {/* Buttons */}
      <div className="flex flex-col gap-6 items-center z-10">
        <Link
          href="/game"
          className="flex items-center justify-center min-w-48 min-h-20 px-12 py-5
                     text-2xl font-bold text-white rounded-2xl shadow-lg
                     hover:scale-105 active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, #FFB6C1, #FF6B9D)",
          }}
        >
          {UI_TEXT.play}
        </Link>

        <Link
          href="/admin"
          className="flex items-center justify-center min-w-48 min-h-20 px-12 py-5
                     bg-lavender text-purple-700 text-2xl font-bold rounded-2xl shadow-lg
                     hover:scale-105 active:scale-95 transition-transform"
        >
          {UI_TEXT.admin}
        </Link>
      </div>
    </div>
  );
}

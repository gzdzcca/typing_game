"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Game } from "@/lib/types/game";
import { UI_TEXT } from "@/lib/utils/ui-text";

const PASTEL_COLORS = [
  "bg-pink-pale border-pink-soft",
  "bg-blue-pale border-blue-soft",
  "bg-lavender-pale border-lavender",
  "bg-mint-pale border-mint",
  "bg-yellow-pale border-yellow-soft",
];

interface GameSelectorProps {
  onSelectGame: (game: Game) => void;
}

export default function GameSelector({ onSelectGame }: GameSelectorProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("/api/games");
        if (res.ok) {
          const data = await res.json();
          setGames(data);
        }
      } catch {
        // Failed to fetch games
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="text-5xl animate-bounce-gentle">🌸</div>
        <p className="text-2xl text-pink-bright font-bold">
          {UI_TEXT.loading}
        </p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="text-6xl">🎀</div>
        <p className="text-2xl text-pink-bright font-bold">
          {UI_TEXT.noGames}
        </p>
        <Link
          href="/admin"
          className="px-8 py-4 bg-lavender text-purple-700 font-bold text-xl rounded-2xl
                     hover:scale-105 transition-transform min-w-48 text-center"
        >
          {UI_TEXT.addFromAdmin}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-4 w-full max-w-3xl">
      {games.map((game, index) => (
        <button
          key={game.id}
          onClick={() => onSelectGame(game)}
          className={`${PASTEL_COLORS[index % PASTEL_COLORS.length]}
            border-2 rounded-2xl min-h-[120px] p-4
            flex flex-col items-center justify-center gap-2
            hover:scale-105 active:scale-95 transition-transform
            cursor-pointer shadow-md hover:shadow-lg`}
        >
          <span className="text-4xl">？</span>
          <span className="text-xl md:text-2xl font-bold text-gray-700">
            {game.displayName}
          </span>
        </button>
      ))}
    </div>
  );
}

"use client";

import { useMusic } from "@/hooks/useMusic";
import { getMusicManager } from "@/lib/audio/music-manager";

export default function MusicToggle() {
  const { isPlaying, toggle } = useMusic();

  const handleClick = () => {
    getMusicManager().unlock();
    toggle();
  };

  return (
    <button
      onClick={handleClick}
      className="
        fixed top-4 right-4 z-50
        w-12 h-12 md:w-14 md:h-14
        rounded-full
        bg-white/80 backdrop-blur-sm
        shadow-md hover:shadow-lg
        flex items-center justify-center
        text-2xl
        transition-all duration-200
        hover:scale-110 active:scale-95
      "
      aria-label={isPlaying ? "おんがく おふ" : "おんがく おん"}
    >
      {isPlaying ? "🎵" : "🔇"}
    </button>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { getMusicManager } from "@/lib/audio/music-manager";

export function useMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("music-enabled");
    if (saved === "true") {
      const manager = getMusicManager();
      manager.play();
      setIsPlaying(true);
    }
  }, []);

  const toggle = useCallback(() => {
    const manager = getMusicManager();
    manager.unlock();
    const playing = manager.toggle();
    setIsPlaying(playing);
    localStorage.setItem("music-enabled", String(playing));
  }, []);

  const setVolume = useCallback((v: number) => {
    const manager = getMusicManager();
    manager.setVolume(v);
    setVolumeState(v);
  }, []);

  const playCorrect = useCallback(() => {
    getMusicManager().playCorrect();
  }, []);

  const playWrong = useCallback(() => {
    getMusicManager().playWrong();
  }, []);

  const playCelebration = useCallback(() => {
    getMusicManager().playCelebration();
  }, []);

  return {
    isPlaying,
    toggle,
    volume,
    setVolume,
    playCorrect,
    playWrong,
    playCelebration,
  };
}

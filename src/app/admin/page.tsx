"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Game, TypingMode } from "@/lib/types/game";
import { UI_TEXT } from "@/lib/utils/ui-text";

export default function AdminPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [word, setWord] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [typingMode, setTypingMode] = useState<TypingMode>("alphabet");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGames = useCallback(async () => {
    const res = await fetch("/api/games");
    if (res.ok) {
      const data: Game[] = await res.json();
      setGames(data);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile || !word || !displayName) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("word", word);
      formData.append("displayName", displayName);
      formData.append("typingMode", typingMode);

      const res = await fetch("/api/games", { method: "POST", body: formData });
      if (res.ok) {
        setWord("");
        setDisplayName("");
        setTypingMode("alphabet");
        setImageFile(null);
        setImagePreview(null);

        // Reset the file input
        const fileInput = document.getElementById(
          "image-input",
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";

        await fetchGames();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchGames();
    }
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      {/* Header */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-pink-bright">
            {UI_TEXT.admin}
          </h1>
          <Link
            href="/"
            className="flex min-h-[48px] items-center rounded-full bg-lavender px-6 text-lg font-bold text-purple-700 shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            {UI_TEXT.back}
          </Link>
        </div>

        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-3xl bg-white p-6 shadow-lg"
        >
          <h2 className="mb-4 text-xl font-bold text-pink-bright">
            {UI_TEXT.upload}
          </h2>

          {/* Image picker */}
          <div className="mb-4">
            <label
              htmlFor="image-input"
              className="mb-1 block text-sm font-bold text-gray-600"
            >
              {UI_TEXT.image}
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-xl border-2 border-dashed border-pink-soft p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:text-sm file:font-bold file:text-pink-bright"
            />
            {imagePreview && (
              <div className="mt-3 overflow-hidden rounded-xl">
                <Image
                  src={imagePreview}
                  alt="preview"
                  width={200}
                  height={200}
                  className="h-40 w-40 rounded-xl object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* Word input */}
          <div className="mb-4">
            <label
              htmlFor="word-input"
              className="mb-1 block text-sm font-bold text-gray-600"
            >
              {UI_TEXT.word}
            </label>
            <input
              id="word-input"
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="apple"
              className="w-full rounded-xl border-2 border-blue-soft p-3 text-lg focus:border-pink-bright focus:outline-none"
            />
          </div>

          {/* Display name input */}
          <div className="mb-4">
            <label
              htmlFor="display-name-input"
              className="mb-1 block text-sm font-bold text-gray-600"
            >
              {UI_TEXT.displayName}
            </label>
            <input
              id="display-name-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="りんご"
              className="w-full rounded-xl border-2 border-blue-soft p-3 text-lg focus:border-pink-bright focus:outline-none"
            />
          </div>

          {/* Typing mode select */}
          <div className="mb-6">
            <label
              htmlFor="typing-mode-select"
              className="mb-1 block text-sm font-bold text-gray-600"
            >
              {UI_TEXT.typingMode}
            </label>
            <select
              id="typing-mode-select"
              value={typingMode}
              onChange={(e) => setTypingMode(e.target.value as TypingMode)}
              className="w-full rounded-xl border-2 border-blue-soft p-3 text-lg focus:border-pink-bright focus:outline-none"
            >
              <option value="alphabet">{UI_TEXT.alphabet}</option>
              <option value="hiragana">{UI_TEXT.hiragana}</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !imageFile || !word || !displayName}
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-pink-bright px-6 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? UI_TEXT.loading : UI_TEXT.save}
          </button>
        </form>

        {/* Game List */}
        <h2 className="mb-4 text-xl font-bold text-pink-bright">
          {UI_TEXT.admin}
        </h2>

        {games.length === 0 ? (
          <p className="rounded-3xl bg-white p-8 text-center text-lg text-gray-400 shadow-lg">
            {UI_TEXT.noGames}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md"
              >
                <Image
                  src={game.imagePath}
                  alt={game.displayName}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-xl object-cover"
                  unoptimized
                />
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-700">
                    {game.displayName}
                  </p>
                  <p className="text-sm text-gray-400">{game.word}</p>
                  <p className="text-xs text-purple-400">
                    {game.typingMode === "alphabet"
                      ? UI_TEXT.alphabet
                      : UI_TEXT.hiragana}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(game.id)}
                  className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-red-100 px-4 text-sm font-bold text-red-500 transition-transform hover:scale-105 active:scale-95"
                >
                  {UI_TEXT.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

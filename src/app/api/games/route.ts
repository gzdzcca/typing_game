import { NextResponse } from "next/server";
import path from "path";
import { getGames, createGame } from "@/lib/storage/game-store";
import type { TypingMode } from "@/lib/types/game";

export async function GET() {
  const games = await getGames();
  return NextResponse.json(games);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get("image") as File | null;
    const word = formData.get("word") as string | null;
    const displayName = formData.get("displayName") as string | null;
    const typingMode = formData.get("typingMode") as TypingMode | null;

    if (!imageFile || !word || !displayName || !typingMode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (typingMode !== "alphabet" && typingMode !== "hiragana") {
      return NextResponse.json(
        { error: "Invalid typingMode" },
        { status: 400 },
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageExtension = path.extname(imageFile.name) || ".png";

    const game = await createGame({
      word,
      displayName,
      typingMode,
      imageBuffer,
      imageExtension,
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Failed to create game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 },
    );
  }
}

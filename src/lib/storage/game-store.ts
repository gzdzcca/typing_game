import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { Game, TypingMode } from "@/lib/types/game";

const DATA_PATH = path.join(process.cwd(), "data", "games.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function readGamesFile(): Promise<Game[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as Game[];
  } catch {
    return [];
  }
}

async function writeGamesFile(games: Game[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(games, null, 2), "utf-8");
}

export async function getGames(): Promise<Game[]> {
  return readGamesFile();
}

export async function getGame(id: string): Promise<Game | undefined> {
  const games = await readGamesFile();
  return games.find((g) => g.id === id);
}

export async function createGame(data: {
  word: string;
  displayName: string;
  typingMode: TypingMode;
  imageBuffer: Buffer;
  imageExtension: string;
}): Promise<Game> {
  const games = await readGamesFile();

  const id = nanoid();
  const filename = `${id}${data.imageExtension}`;
  const imagePath = `/uploads/${filename}`;

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), data.imageBuffer);

  const game: Game = {
    id,
    word: data.word,
    displayName: data.displayName,
    typingMode: data.typingMode,
    imagePath,
    createdAt: new Date().toISOString(),
  };

  games.push(game);
  await writeGamesFile(games);

  return game;
}

export async function deleteGame(id: string): Promise<boolean> {
  const games = await readGamesFile();
  const index = games.findIndex((g) => g.id === id);

  if (index === -1) {
    return false;
  }

  const game = games[index];

  // Delete the image file
  try {
    const absoluteImagePath = path.join(process.cwd(), "public", game.imagePath);
    await fs.unlink(absoluteImagePath);
  } catch {
    // Image file may already be deleted; continue
  }

  games.splice(index, 1);
  await writeGamesFile(games);

  return true;
}

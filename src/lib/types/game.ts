export type TypingMode = "alphabet" | "hiragana";

export type RevealEffectType =
  | "blur"
  | "mosaic"
  | "jigsaw"
  | "curtain"
  | "spotlight"
  | "sparkle"
  | "paintbrush";

export interface Game {
  id: string;
  word: string;
  displayName: string;
  typingMode: TypingMode;
  imagePath: string;
  createdAt: string;
}

export type GameStatus = "selecting" | "playing" | "celebrating";

export interface GameState {
  status: GameStatus;
  currentGame: Game | null;
  typedLetters: number;
  totalLetters: number;
  revealProgress: number;
  currentEffect: RevealEffectType | null;
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPTS: Record<string, string> = {
  "menu-bg":
    "A cute kawaii pastel background pattern with small stars, hearts, clouds, and flowers scattered around. Soft pink, lavender, mint, and yellow colors. Sanrio-inspired cute style. No text. Seamless tileable pattern.",
  "play-icon":
    "A cute kawaii pink play button icon shaped like a star with sparkles around it. Pastel colors, rounded edges, children's game style. No text. Transparent background.",
  "celebration":
    "Cute kawaii explosion of colorful stars, hearts, confetti, and sparkles. Pastel rainbow colors - pink, blue, yellow, mint, lavender. Children's celebration style. No text.",
  "game-card":
    "A cute kawaii question mark icon with sparkles, pastel pink and lavender colors, rounded bubbly style, children's game mystery card. No text.",
};

export async function generateUIImage(
  promptKey: string
): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set, skipping UI image generation");
    return null;
  }

  const prompt = PROMPTS[promptKey];
  if (!prompt) {
    console.warn(`Unknown prompt key: ${promptKey}`);
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      // @ts-expect-error - image generation config
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }

    console.warn("No image data in Gemini response");
    return null;
  } catch (error) {
    console.error("Gemini image generation failed:", error);
    return null;
  }
}

export function getAvailablePrompts(): string[] {
  return Object.keys(PROMPTS);
}

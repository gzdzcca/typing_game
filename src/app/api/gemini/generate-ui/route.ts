import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  generateUIImage,
  getAvailablePrompts,
} from "@/lib/gemini/generate-ui-image";

export async function POST(request: Request) {
  try {
    const { promptKey } = await request.json();

    if (!promptKey || !getAvailablePrompts().includes(promptKey)) {
      return NextResponse.json(
        { error: "Invalid prompt key" },
        { status: 400 }
      );
    }

    const imageBuffer = await generateUIImage(promptKey);
    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Save to public/ui/
    const uiDir = path.join(process.cwd(), "public", "ui");
    await mkdir(uiDir, { recursive: true });

    const filename = `${promptKey}.png`;
    const filepath = path.join(uiDir, filename);
    await writeFile(filepath, imageBuffer);

    return NextResponse.json({
      success: true,
      path: `/ui/${filename}`,
    });
  } catch (error) {
    console.error("Generate UI image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ prompts: getAvailablePrompts() });
}

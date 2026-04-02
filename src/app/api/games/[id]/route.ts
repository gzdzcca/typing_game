import { NextResponse } from "next/server";
import { deleteGame } from "@/lib/storage/game-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const deleted = await deleteGame(id);

  if (!deleted) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

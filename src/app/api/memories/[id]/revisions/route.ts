import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { reviseMemory } from "@/domain/invariants";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memoryId = params.id;
    const body = await req.json();
    const {
      title,
      content,
      summary,
      confidence,
      tags,
      authorId,
      reasonForChange,
    } = body;

    const repo = getRepository();
    const existing = await repo.getMemoryById(memoryId);
    if (!existing) {
      return NextResponse.json(
        { error: `Memory with ID '${memoryId}' not found.` },
        { status: 404 }
      );
    }

    const author =
      authorId && authorId.trim().length > 0 ? authorId.trim() : "anonymous-engineer";

    // Enforce domain invariant: revisions require reasonForChange and produce immutable version
    const { updatedMemory, newVersion } = reviseMemory({
      currentMemory: existing,
      title,
      content,
      summary,
      confidence: confidence !== undefined ? Number(confidence) : undefined,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : undefined,
      authorId: author,
      reasonForChange,
    });

    const saved = await repo.reviseMemory({ updatedMemory, newVersion });

    return NextResponse.json(
      {
        data: saved,
        newVersion,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memoryId = params.id;
    const repo = getRepository();

    const memory = await repo.getMemoryById(memoryId);
    if (!memory) {
      return NextResponse.json(
        { error: `Memory with ID '${memoryId}' not found.` },
        { status: 404 }
      );
    }

    const versions = await repo.getMemoryVersions(memoryId);
    const sourceRefs = await repo.getSourceReferences(memoryId);

    // Resolve sources details
    const sources = await Promise.all(
      sourceRefs.map(async (ref) => {
        const source = await repo.getSourceById(ref.sourceId);
        return {
          ...ref,
          source,
        };
      })
    );

    return NextResponse.json({
      data: {
        memory,
        versions,
        sources,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

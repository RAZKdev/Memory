import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { Decision, Memory } from "@/domain/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const repo = getRepository();

    const collection = await repo.getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json(
        { error: `Collection with ID '${collectionId}' not found.` },
        { status: 404 }
      );
    }

    const resolvedMemories: Memory[] = [];
    for (const mId of collection.memoryIds) {
      const mem = await repo.getMemoryById(mId);
      if (mem) resolvedMemories.push(mem);
    }

    const resolvedDecisions: Decision[] = [];
    for (const dId of (collection.decisionIds || [])) {
      const dec = await repo.getDecisionById(dId);
      if (dec) resolvedDecisions.push(dec);
    }

    return NextResponse.json({
      data: {
        collection,
        memories: resolvedMemories,
        decisions: resolvedDecisions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const body = await req.json();
    const repo = getRepository();

    const updated = await repo.updateCollection(collectionId, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const repo = getRepository();
    await repo.deleteCollection(collectionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

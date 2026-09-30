import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decisionId = params.id;
    const repo = getRepository();

    const decision = await repo.getDecisionById(decisionId);
    if (!decision) {
      return NextResponse.json(
        { error: `Decision with ID '${decisionId}' not found.` },
        { status: 404 }
      );
    }

    // Resolve linked memories
    const relatedMemories = await Promise.all(
      decision.relatedMemoryIds.map((mId) => repo.getMemoryById(mId))
    );

    // Resolve linked sources
    const relatedSources = await Promise.all(
      decision.sourceIds.map((sId) => repo.getSourceById(sId))
    );

    return NextResponse.json({
      data: {
        decision,
        relatedMemories: relatedMemories.filter(Boolean),
        relatedSources: relatedSources.filter(Boolean),
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
    const decisionId = params.id;
    const body = await req.json();
    const repo = getRepository();

    const updated = await repo.updateDecision(decisionId, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

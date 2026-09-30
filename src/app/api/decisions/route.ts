import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { DecisionStatus } from "@/domain/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectScopeId = searchParams.get("projectScopeId") || undefined;
    const status = (searchParams.get("status") as DecisionStatus) || undefined;

    const repo = getRepository();
    const decisions = await repo.getDecisions({ projectScopeId, status });
    return NextResponse.json({ data: decisions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectScopeId,
      title,
      context,
      decisionText,
      consequences,
      status = "accepted",
      relatedMemoryIds = [],
      sourceIds = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Decision title is required" }, { status: 400 });
    }
    if (!context || typeof context !== "string" || !context.trim()) {
      return NextResponse.json({ error: "Context is required" }, { status: 400 });
    }
    if (!decisionText || typeof decisionText !== "string" || !decisionText.trim()) {
      return NextResponse.json({ error: "Decision text is required" }, { status: 400 });
    }
    if (!projectScopeId) {
      return NextResponse.json({ error: "Project scope is required" }, { status: 400 });
    }

    const repo = getRepository();
    const project = await repo.getProjectScopeById(projectScopeId);
    if (!project) {
      return NextResponse.json(
        { error: `Project scope '${projectScopeId}' not found.` },
        { status: 404 }
      );
    }

    const id = `dec-${Date.now()}`;
    const decision = await repo.createDecision({
      id,
      projectScopeId,
      title: title.trim(),
      context: context.trim(),
      decisionText: decisionText.trim(),
      consequences: consequences?.trim(),
      status,
      relatedMemoryIds: Array.isArray(relatedMemoryIds) ? relatedMemoryIds : [],
      sourceIds: Array.isArray(sourceIds) ? sourceIds : [],
    });

    return NextResponse.json({ data: decision }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

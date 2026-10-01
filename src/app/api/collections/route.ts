import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectScopeId = searchParams.get("projectScopeId") || undefined;

    const repo = getRepository();
    const collections = await repo.getCollections({ projectScopeId });
    return NextResponse.json({ data: collections });
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
      description,
      memoryIds = [],
      decisionIds = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Collection title is required" },
        { status: 400 }
      );
    }
    if (!projectScopeId) {
      return NextResponse.json(
        { error: "Project scope is required" },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const project = await repo.getProjectScopeById(projectScopeId);
    if (!project) {
      return NextResponse.json(
        { error: `Project scope '${projectScopeId}' not found.` },
        { status: 404 }
      );
    }

    const id = `col-${Date.now()}`;
    const collection = await repo.createCollection({
      id,
      projectScopeId,
      title: title.trim(),
      description: description?.trim(),
      memoryIds: Array.isArray(memoryIds) ? memoryIds : [],
      decisionIds: Array.isArray(decisionIds) ? decisionIds : [],
    });

    return NextResponse.json({ data: collection }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { createMemoryWithVersion } from "@/domain/invariants";
import { MemoryStatus } from "@/domain/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectScopeId = searchParams.get("projectScopeId") || undefined;
    const status = (searchParams.get("status") as MemoryStatus) || undefined;
    const tag = searchParams.get("tag") || undefined;
    const searchQuery = searchParams.get("q") || undefined;

    const repo = getRepository();
    const memories = await repo.getMemories({
      projectScopeId,
      status,
      tag,
      searchQuery,
    });

    return NextResponse.json({ data: memories });
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
      content,
      summary,
      confidence,
      tags,
      authorId,
      sourceTitle,
      sourceType,
      sourceUri,
      citationSnippet,
      locationReference,
    } = body;

    const repo = getRepository();

    // Verify project scope exists
    const project = await repo.getProjectScopeById(projectScopeId);
    if (!project) {
      return NextResponse.json(
        { error: `Project scope '${projectScopeId}' not found.` },
        { status: 404 }
      );
    }

    const memoryId = `mem-${Date.now()}`;
    const author = authorId && authorId.trim().length > 0 ? authorId.trim() : "anonymous-engineer";

    // Enforce domain invariants via pure function
    const { memory, initialVersion } = createMemoryWithVersion({
      id: memoryId,
      projectScopeId,
      title,
      content,
      summary,
      confidence: confidence !== undefined ? Number(confidence) : 1.0,
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map(t => t.trim()) : [],
      authorId: author,
      initialReason: "Initial memory creation via API",
    });

    // Optional source creation and citation linking
    let sourceReferences: Array<{
      sourceId: string;
      citationSnippet?: string;
      locationReference?: string;
    }> | undefined;

    if (sourceTitle && sourceTitle.trim().length > 0) {
      const sourceId = `src-${Date.now()}`;
      const createdSource = await repo.createSource({
        id: sourceId,
        projectScopeId,
        title: sourceTitle.trim(),
        type: sourceType || "document",
        uri: sourceUri?.trim(),
      });

      sourceReferences = [
        {
          sourceId: createdSource.id,
          citationSnippet: citationSnippet?.trim(),
          locationReference: locationReference?.trim(),
        },
      ];
    }

    const savedMemory = await repo.createMemory({
      memory,
      initialVersion,
      sourceReferences,
    });

    return NextResponse.json(
      {
        data: savedMemory,
        version: initialVersion,
        sourcesCount: sourceReferences ? sourceReferences.length : 0,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

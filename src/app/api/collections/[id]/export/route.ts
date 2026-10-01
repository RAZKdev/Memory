import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { buildContextExportBundle } from "@/domain/export-adapter";
import {
  ContextExportDecision,
  ContextExportItem,
  Decision,
  ExportFormat,
  Memory,
  SourceReference,
} from "@/domain/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") as ExportFormat) || "markdown";

    const repo = getRepository();
    const collection = await repo.getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json(
        { error: `Collection with ID '${collectionId}' not found.` },
        { status: 404 }
      );
    }

    const project = await repo.getProjectScopeById(collection.projectScopeId);

    const exportMemories: ContextExportItem[] = [];
    for (const mId of collection.memoryIds) {
      const mem = await repo.getMemoryById(mId);
      if (!mem) continue;

      const sourceRefs: SourceReference[] = await repo.getSourceReferences(mem.id);
      const citations = [];
      for (const ref of sourceRefs) {
        const source = await repo.getSourceById(ref.sourceId);
        citations.push({
          title: source?.title || "Internal Document",
          snippet: ref.citationSnippet,
          location: ref.locationReference,
          uri: source?.uri,
        });
      }

      exportMemories.push({
        id: mem.id,
        title: mem.title,
        currentVersion: mem.currentVersion,
        confidence: mem.confidence,
        tags: mem.tags,
        content: mem.content,
        provenanceCitations: citations.length > 0 ? citations : undefined,
      });
    }

    // Resolve decisions
    const rawDecisions = await Promise.all(
      (collection.decisionIds || []).map((dId: string) => repo.getDecisionById(dId))
    );

    const exportDecisions: ContextExportDecision[] = [];
    for (const d of rawDecisions) {
      if (d) {
        exportDecisions.push({
          id: d.id,
          title: d.title,
          status: d.status,
          context: d.context,
          decisionText: d.decisionText,
          consequences: d.consequences,
        });
      }
    }

    // Build authoritative export bundle
    const bundle = buildContextExportBundle({
      collectionId: collection.id,
      collectionTitle: collection.title,
      projectScopeId: collection.projectScopeId,
      projectScopeName: project?.name,
      format,
      memories: exportMemories,
      decisions: exportDecisions,
    });

    return NextResponse.json({ data: bundle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

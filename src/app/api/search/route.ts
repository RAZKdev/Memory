import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const projectScopeId = searchParams.get("projectScopeId") || undefined;
    const mode = (searchParams.get("mode") as "hybrid" | "keyword" | "semantic") || "hybrid";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    if (!query.trim()) {
      return NextResponse.json({ data: [] });
    }

    const repo = getRepository();
    const results = await repo.searchMemories({
      query: query.trim(),
      projectScopeId,
      mode,
      limit,
    });

    return NextResponse.json({
      data: results,
      meta: {
        query: query.trim(),
        mode,
        count: results.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

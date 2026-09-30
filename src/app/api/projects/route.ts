import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { validateProjectSlug } from "@/domain/invariants";

export async function GET() {
  try {
    const repo = getRepository();
    const projects = await repo.getProjectScopes();
    return NextResponse.json({ data: projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug ? slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    validateProjectSlug(cleanSlug);

    const repo = getRepository();
    const id = `proj-${Date.now()}`;
    const project = await repo.createProjectScope({
      id,
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim(),
      isArchived: false,
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

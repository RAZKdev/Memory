import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { AccessPolicy, AccessPolicyLevel } from "@/domain/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectScopeId = params.id;
    const repo = getRepository();

    const project = await repo.getProjectScopeById(projectScopeId);
    if (!project) {
      return NextResponse.json(
        { error: `Project scope with ID '${projectScopeId}' not found.` },
        { status: 404 }
      );
    }

    const policy = await repo.getAccessPolicy(projectScopeId);

    // Default to private policy if none has been explicitly configured
    const effectivePolicy: AccessPolicy = policy || {
      id: `pol-${projectScopeId}`,
      projectScopeId,
      level: "private",
      allowedProjectIds: [],
      description: "Default private isolation policy",
      createdAt: project.createdAt,
    };

    return NextResponse.json({ data: effectivePolicy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectScopeId = params.id;
    const body = await req.json();
    const { level, allowedProjectIds, description } = body;

    const validLevels: AccessPolicyLevel[] = [
      "private",
      "project_internal",
      "shared_read",
    ];

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        {
          error: `Invalid access policy level '${level}'. Must be one of: ${validLevels.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const project = await repo.getProjectScopeById(projectScopeId);
    if (!project) {
      return NextResponse.json(
        { error: `Project scope with ID '${projectScopeId}' not found.` },
        { status: 404 }
      );
    }

    const existingPolicy = await repo.getAccessPolicy(projectScopeId);
    const policyId = existingPolicy?.id || `pol-${Date.now()}`;

    const savedPolicy = await repo.setAccessPolicy({
      id: policyId,
      projectScopeId,
      level,
      allowedProjectIds: Array.isArray(allowedProjectIds) ? allowedProjectIds : [],
      description: description?.trim(),
      createdAt: existingPolicy?.createdAt || new Date().toISOString(),
    });

    return NextResponse.json({ data: savedPolicy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

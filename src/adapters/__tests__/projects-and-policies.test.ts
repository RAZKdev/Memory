import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryMemoryRepository } from "../in-memory-memory-repository";
import { AccessPolicy, ProjectScope } from "@/domain/types";
import { GET, PUT } from "@/app/api/projects/[id]/policy/route";
import { NextRequest } from "next/server";
import { getRepository, resetRepositoryForTesting } from "@/lib/repository";

describe("Project Scope Governance & Access Policies", () => {
  let repo: InMemoryMemoryRepository;

  beforeEach(() => {
    resetRepositoryForTesting();
    repo = getRepository() as InMemoryMemoryRepository;
  });

  it("defaults to private policy when no explicit policy exists", async () => {
    const project = await repo.createProjectScope({
      id: "scope-test-1",
      slug: "scope-test-1",
      name: "Test Scope 1",
      isArchived: false,
    });

    const policy = await repo.getAccessPolicy(project.id);
    expect(policy).toBeNull();

    // Verify GET route handler returns default private policy
    const req = new NextRequest(`http://localhost:3000/api/projects/${project.id}/policy`);
    const res = await GET(req, { params: { id: project.id } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.level).toBe("private");
    expect(json.data.projectScopeId).toBe(project.id);
    expect(json.data.allowedProjectIds).toEqual([]);
  });

  it("updates and persists an access policy with allowed peer projects", async () => {
    const projectA = await repo.createProjectScope({
      id: "scope-a",
      slug: "scope-a",
      name: "Scope A",
      isArchived: false,
    });

    const projectB = await repo.createProjectScope({
      id: "scope-b",
      slug: "scope-b",
      name: "Scope B",
      isArchived: false,
    });

    const putReq = new NextRequest(`http://localhost:3000/api/projects/${projectA.id}/policy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "shared_read",
        allowedProjectIds: [projectB.id],
        description: "Shared for cross-project audit read",
      }),
    });

    const putRes = await PUT(putReq, { params: { id: projectA.id } });
    expect(putRes.status).toBe(200);

    const putJson = await putRes.json();
    expect(putJson.data.level).toBe("shared_read");
    expect(putJson.data.allowedProjectIds).toContain(projectB.id);
    expect(putJson.data.description).toBe("Shared for cross-project audit read");

    // Verify GET reflects the newly saved policy
    const getReq = new NextRequest(`http://localhost:3000/api/projects/${projectA.id}/policy`);
    const getRes = await GET(getReq, { params: { id: projectA.id } });
    const getJson = await getRes.json();
    expect(getJson.data.level).toBe("shared_read");
    expect(getJson.data.allowedProjectIds).toEqual([projectB.id]);
  });

  it("rejects invalid access policy levels with 400 Bad Request", async () => {
    const project = await repo.createProjectScope({
      id: "scope-c",
      slug: "scope-c",
      name: "Scope C",
      isArchived: false,
    });

    const req = new NextRequest(`http://localhost:3000/api/projects/${project.id}/policy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "public_unrestricted", // Invalid level!
      }),
    });

    const res = await PUT(req, { params: { id: project.id } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid access policy level/);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryMemoryRepository } from "../in-memory-memory-repository";
import { createMemoryWithVersion, reviseMemory } from "@/domain/invariants";

describe("InMemoryMemoryRepository", () => {
  let repo: InMemoryMemoryRepository;

  beforeEach(() => {
    repo = new InMemoryMemoryRepository();
  });

  it("creates and retrieves project scopes", async () => {
    const scope = await repo.createProjectScope({
      id: "proj-1",
      slug: "core-system",
      name: "Core System",
      isArchived: false,
    });

    expect(scope.id).toBe("proj-1");
    const retrieved = await repo.getProjectScopeById("proj-1");
    expect(retrieved?.name).toBe("Core System");

    const all = await repo.getProjectScopes();
    expect(all).toHaveLength(1);
  });

  it("stores a memory, initial version snapshot, and source references", async () => {
    await repo.createProjectScope({
      id: "proj-1",
      slug: "core-system",
      name: "Core System",
      isArchived: false,
    });

    const source = await repo.createSource({
      id: "src-1",
      projectScopeId: "proj-1",
      title: "RFC 004: SSR Cookies",
      type: "rfc",
    });

    const { memory, initialVersion } = createMemoryWithVersion({
      id: "mem-1",
      projectScopeId: "proj-1",
      title: "Use Supabase SSR Helper",
      content: "Ensure all cookies are set via @supabase/ssr cookie handler.",
      authorId: "eng-1",
      confidence: 1.0,
      tags: ["Auth", "Security"],
    });

    const saved = await repo.createMemory({
      memory,
      initialVersion,
      sourceReferences: [
        {
          sourceId: source.id,
          citationSnippet: "Section 3.2: Cookie Delegation",
          locationReference: "RFC-004#L45",
        },
      ],
    });

    expect(saved.id).toBe("mem-1");
    expect(saved.currentVersion).toBe(1);

    // Verify memory query
    const fetched = await repo.getMemoryById("mem-1");
    expect(fetched?.title).toBe("Use Supabase SSR Helper");

    // Verify versions
    const versions = await repo.getMemoryVersions("mem-1");
    expect(versions).toHaveLength(1);
    expect(versions[0].versionNumber).toBe(1);

    // Verify source references
    const refs = await repo.getSourceReferences("mem-1");
    expect(refs).toHaveLength(1);
    expect(refs[0].sourceId).toBe("src-1");
    expect(refs[0].citationSnippet).toBe("Section 3.2: Cookie Delegation");
  });

  it("records revisions while keeping history intact", async () => {
    const { memory, initialVersion } = createMemoryWithVersion({
      id: "mem-2",
      projectScopeId: "proj-1",
      title: "Indexing Strategy",
      content: "Use B-Tree index on project_scope_id.",
      authorId: "eng-1",
    });

    await repo.createMemory({ memory, initialVersion });

    const { updatedMemory, newVersion } = reviseMemory({
      currentMemory: memory,
      content: "Use B-Tree index on project_scope_id and HNSW for embeddings.",
      authorId: "eng-2",
      reasonForChange: "Added pgvector HNSW indexing requirement",
    });

    await repo.reviseMemory({ updatedMemory, newVersion });

    const updated = await repo.getMemoryById("mem-2");
    expect(updated?.currentVersion).toBe(2);
    expect(updated?.content).toContain("HNSW");

    const history = await repo.getMemoryVersions("mem-2");
    expect(history).toHaveLength(2);
    expect(history[0].versionNumber).toBe(2); // Newest first
    expect(history[1].versionNumber).toBe(1);
    expect(history[0].reasonForChange).toBe(
      "Added pgvector HNSW indexing requirement"
    );
  });
});

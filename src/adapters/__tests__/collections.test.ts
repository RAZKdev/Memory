import { describe, expect, it } from "vitest";
import { InMemoryMemoryRepository } from "../in-memory-memory-repository";
import { createMemoryWithVersion } from "@/domain/invariants";
import { buildContextExportBundle } from "@/domain/export-adapter";

describe("Collections & Cross-Project Export Integration", () => {
  it("creates a thematic collection grouping memories and ADR decisions, then exports an AI prompt bundle", async () => {
    const repo = new InMemoryMemoryRepository();

    const project = await repo.createProjectScope({
      id: "proj-sec-eng",
      slug: "sec-eng",
      name: "Security Engineering",
      isArchived: false,
    });

    // 1. Create Memories
    const { memory: m1, initialVersion: v1 } = createMemoryWithVersion({
      id: "mem-rls-rule",
      projectScopeId: project.id,
      title: "Mandatory Row-Level Security",
      content: "All tables must enable RLS by default. No public write policies permitted.",
      authorId: "sec-lead",
      confidence: 1.0,
      tags: ["rls", "postgres", "security"],
    });
    await repo.createMemory({ memory: m1, initialVersion: v1 });

    const { memory: m2, initialVersion: v2 } = createMemoryWithVersion({
      id: "mem-secret-rule",
      projectScopeId: project.id,
      title: "Zero Secrets in Client Bundles",
      content: "Privileged tokens and secret keys must strictly reside on server runtimes.",
      authorId: "sec-lead",
      confidence: 1.0,
      tags: ["secrets", "security", "asvs"],
    });
    await repo.createMemory({ memory: m2, initialVersion: v2 });

    // 2. Create Decision (ADR)
    const decision = await repo.createDecision({
      id: "dec-asvs-5",
      projectScopeId: project.id,
      title: "ADR-005: Benchmark Against OWASP ASVS 5.0",
      context: "Security posture across LLM tools must be standardized against an industry baseline.",
      decisionText: "Adopt OWASP ASVS 5.0.0 Level 2 as the benchmark for all endpoints.",
      consequences: "Mandatory audit logging and server-side authorization checks on all mutations.",
      status: "accepted",
      relatedMemoryIds: [m1.id, m2.id],
      sourceIds: [],
    });

    // 3. Create Thematic Collection
    const collection = await repo.createCollection({
      id: "col-security-baseline",
      projectScopeId: project.id,
      title: "Security Baseline Context Bundle",
      description: "Critical security constraints for AI coding sessions.",
      memoryIds: [m1.id, m2.id],
      decisionIds: [decision.id],
    });

    expect(collection.id).toBe("col-security-baseline");
    expect(collection.memoryIds).toHaveLength(2);
    expect(collection.decisionIds).toContain("dec-asvs-5");

    // 4. Query Collections
    const fetched = await repo.getCollectionById("col-security-baseline");
    expect(fetched?.title).toBe("Security Baseline Context Bundle");

    const all = await repo.getCollections({ projectScopeId: project.id });
    expect(all).toHaveLength(1);

    // 5. Generate AI Context Export Bundle in Markdown
    const exportBundle = buildContextExportBundle({
      collectionId: collection.id,
      collectionTitle: collection.title,
      projectScopeId: project.id,
      projectScopeName: project.name,
      format: "markdown",
      memories: [
        {
          id: m1.id,
          title: m1.title,
          currentVersion: m1.currentVersion,
          confidence: m1.confidence,
          tags: m1.tags,
          content: m1.content,
        },
        {
          id: m2.id,
          title: m2.title,
          currentVersion: m2.currentVersion,
          confidence: m2.confidence,
          tags: m2.tags,
          content: m2.content,
        },
      ],
      decisions: [
        {
          id: decision.id,
          title: decision.title,
          status: decision.status,
          context: decision.context,
          decisionText: decision.decisionText,
          consequences: decision.consequences,
        },
      ],
    });

    expect(exportBundle.formattedOutput).toContain("ADR-005: Benchmark Against OWASP ASVS 5.0");
    expect(exportBundle.formattedOutput).toContain("Mandatory Row-Level Security");
    expect(exportBundle.formattedOutput).toContain("Zero Secrets in Client Bundles");
    expect(exportBundle.tokenEstimate).toBeGreaterThan(100);

    // 6. Delete Collection
    await repo.deleteCollection("col-security-baseline");
    const remaining = await repo.getCollectionById("col-security-baseline");
    expect(remaining).toBeNull();
  });
});

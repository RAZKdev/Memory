import { describe, expect, it } from "vitest";
import { InMemoryMemoryRepository } from "../in-memory-memory-repository";
import { createMemoryWithVersion } from "@/domain/invariants";

describe("Decisions (ADRs) & Hybrid Search Engine Integration", () => {
  it("records architectural decisions linked directly to memories and sources", async () => {
    const repo = new InMemoryMemoryRepository();

    const project = await repo.createProjectScope({
      id: "proj-arch",
      slug: "system-arch",
      name: "System Architecture",
      isArchived: false,
    });

    const source = await repo.createSource({
      id: "src-rfc",
      projectScopeId: project.id,
      title: "RFC 007: Event Sourcing & CQRS",
      type: "rfc",
    });

    const { memory, initialVersion } = createMemoryWithVersion({
      id: "mem-cqrs",
      projectScopeId: project.id,
      title: "CQRS Query Model Separation",
      content: "Queries must never mutate domain state; read models are projected asynchronously.",
      authorId: "eng-architect",
      tags: ["cqrs", "event-sourcing"],
    });
    await repo.createMemory({ memory, initialVersion });

    // Create Decision Record (ADR)
    const decision = await repo.createDecision({
      id: "dec-001",
      projectScopeId: project.id,
      title: "ADR 001: Adopt CQRS for High-Volume Reads",
      context: "Memory reading frequency exceeds write frequency by 50x.",
      decisionText: "Separate read path from write path using dedicated projected read models.",
      consequences: "Eventual consistency on read replicas; simplified caching boundaries.",
      status: "accepted",
      relatedMemoryIds: [memory.id],
      sourceIds: [source.id],
    });

    expect(decision.id).toBe("dec-001");
    expect(decision.relatedMemoryIds).toContain("mem-cqrs");
    expect(decision.sourceIds).toContain("src-rfc");

    // Retrieve decision
    const fetched = await repo.getDecisionById("dec-001");
    expect(fetched?.title).toContain("ADR 001");

    // Update status to deprecated with rationale
    const updated = await repo.updateDecision("dec-001", {
      status: "deprecated",
      consequences: "Superseded by synchronous read replicas in PostgreSQL.",
    });
    expect(updated.status).toBe("deprecated");
  });

  it("performs hybrid search combining keyword and vector semantic similarity", async () => {
    const repo = new InMemoryMemoryRepository();

    const project = await repo.createProjectScope({
      id: "proj-cloud",
      slug: "cloud-infra",
      name: "Cloud Infrastructure",
      isArchived: false,
    });

    const { memory: m1, initialVersion: v1 } = createMemoryWithVersion({
      id: "mem-rls",
      projectScopeId: project.id,
      title: "Supabase Row-Level Security Enforcers",
      content: "Ensure RLS is enabled on every single PostgreSQL table with granular tenant policies.",
      authorId: "sec-eng",
      tags: ["supabase", "postgres", "rls", "security"],
    });
    await repo.createMemory({ memory: m1, initialVersion: v1 });

    const { memory: m2, initialVersion: v2 } = createMemoryWithVersion({
      id: "mem-cache",
      projectScopeId: project.id,
      title: "Redis L1 In-Memory Caching",
      content: "Cache frequently queried tenant configurations with 60 second TTL.",
      authorId: "perf-eng",
      tags: ["redis", "cache", "latency"],
    });
    await repo.createMemory({ memory: m2, initialVersion: v2 });

    // 1. Keyword Search
    const keywordResults = await repo.searchMemories({
      query: "Row-Level Security",
      mode: "keyword",
    });
    expect(keywordResults.length).toBeGreaterThan(0);
    expect(keywordResults[0].memory.id).toBe("mem-rls");
    expect(keywordResults[0].matchType).toBe("keyword");

    // 2. Semantic Search with vocabulary variation
    const semanticResults = await repo.searchMemories({
      query: "database authorization policies table access",
      mode: "semantic",
    });
    expect(semanticResults.length).toBeGreaterThan(0);
    expect(semanticResults[0].memory.id).toBe("mem-rls");
    expect(semanticResults[0].matchType).toBe("semantic");

    // 3. Hybrid Search (fuses lexical and vector scores)
    const hybridResults = await repo.searchMemories({
      query: "Postgres RLS tenant isolation",
      projectScopeId: project.id,
      mode: "hybrid",
    });
    expect(hybridResults.length).toBeGreaterThan(0);
    expect(hybridResults[0].memory.id).toBe("mem-rls");
    expect(hybridResults[0].matchType).toBe("hybrid");
    expect(hybridResults[0].score).toBeGreaterThan(0.2);
  });
});

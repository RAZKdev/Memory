/**
 * Repository Provider
 * Supplies the active MemoryRepository instance behind a strict boundary.
 * Defaults to InMemoryMemoryRepository if Supabase credentials are not provided.
 */

import { InMemoryMemoryRepository } from "@/adapters/in-memory-memory-repository";
import { SupabaseMemoryRepository } from "@/adapters/supabase-memory-repository";
import { MemoryRepository } from "@/domain/repository";
import { createClient } from "@supabase/supabase-js";

// Global persistent in-memory instance for development server
declare global {
  // eslint-disable-next-line no-var
  var __memoryVaultRepo: MemoryRepository | undefined;
}

function initializeInMemoryRepo(): MemoryRepository {
  const repo = new InMemoryMemoryRepository({
    projectScopes: [
      {
        id: "proj-agentic-arch",
        slug: "agentic-arch",
        name: "Agentic Architecture",
        description: "Core AI agent protocols, tool schemas, and multi-agent coordination.",
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "proj-data-platform",
        slug: "data-platform",
        name: "Data Platform",
        description: "Postgres schema, pgvector indexing, and ETL pipelines.",
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    sources: [
      {
        id: "src-rfc-001",
        projectScopeId: "proj-agentic-arch",
        title: "RFC 001: Subagent Lifecycle & Invariant Verification",
        type: "rfc",
        uri: "https://internal.docs/rfcs/001-subagent-lifecycle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    memories: [
      {
        id: "mem-seed-01",
        projectScopeId: "proj-agentic-arch",
        title: "Deterministic State Transition Rule",
        content:
          "All state transitions across agent steps must be deterministic and testable. Side effects must reside strictly behind adapter interfaces to permit reproducible testing and sandboxing.",
        summary: "Deterministic transitions and adapter isolation rule.",
        status: "active",
        confidence: 1.0,
        tags: ["architecture", "determinism", "adapters"],
        currentVersion: 1,
        authorId: "eng-system-lead",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    versions: [
      {
        id: "mem-seed-01-v1",
        memoryId: "mem-seed-01",
        versionNumber: 1,
        title: "Deterministic State Transition Rule",
        content:
          "All state transitions across agent steps must be deterministic and testable. Side effects must reside strictly behind adapter interfaces to permit reproducible testing and sandboxing.",
        confidence: 1.0,
        tags: ["architecture", "determinism", "adapters"],
        authorId: "eng-system-lead",
        reasonForChange: "Foundational architectural baseline memory",
        createdAt: new Date().toISOString(),
      },
    ],
    sourceReferences: [
      {
        id: "ref-seed-01",
        memoryId: "mem-seed-01",
        sourceId: "src-rfc-001",
        citationSnippet: "Section 2.1: Determinism Invariant Guarantee",
        locationReference: "RFC-001#L14-L28",
        createdAt: new Date().toISOString(),
      },
    ],
    decisions: [
      {
        id: "dec-adr-001",
        projectScopeId: "proj-agentic-arch",
        title: "ADR-001: Boundary Port-Adapter Architecture with Immutable History",
        context:
          "AI-assisted systems suffer from hallucinated context drift if architectural memories can be silently overwritten or modified without an explicit audit trail.",
        decisionText:
          "Adopt Hexagonal/Ports-and-Adapters persistence architecture. Every technical memory must have an immutable Version 1 initial snapshot, monotonic revision increments, and mandatory change rationale.",
        consequences:
          "Zero historical data loss; reproducible verification in tests; external databases (Postgres/Supabase) are isolated behind strict repository adapters.",
        status: "accepted",
        relatedMemoryIds: ["mem-seed-01"],
        sourceIds: ["src-rfc-001"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });

  return repo;
}

export function getRepository(): MemoryRepository {
  if (global.__memoryVaultRepo) {
    return global.__memoryVaultRepo;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const client = createClient(supabaseUrl, supabaseKey);
    const repo = new SupabaseMemoryRepository(client);
    global.__memoryVaultRepo = repo;
    return repo;
  }

  const inMemory = initializeInMemoryRepo();
  global.__memoryVaultRepo = inMemory;
  return inMemory;
}

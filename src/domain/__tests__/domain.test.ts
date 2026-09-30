import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  DomainValidationError,
  createMemoryWithVersion,
  isAccessPermitted,
  isEmbeddingFresh,
  reviseMemory,
  validateConfidence,
  validateProjectSlug,
} from "../invariants";
import { AccessPolicy, DerivedEmbedding } from "../types";

describe("Domain Model: Confidence Validation", () => {
  it("accepts valid confidence scores between 0.0 and 1.0", () => {
    expect(() => validateConfidence(0.0)).not.toThrow();
    expect(() => validateConfidence(0.5)).not.toThrow();
    expect(() => validateConfidence(1.0)).not.toThrow();
  });

  it("rejects confidence scores outside [0.0, 1.0]", () => {
    expect(() => validateConfidence(-0.1)).toThrow(DomainValidationError);
    expect(() => validateConfidence(1.05)).toThrow(DomainValidationError);
    expect(() => validateConfidence(NaN)).toThrow(DomainValidationError);
  });
});

describe("Domain Model: Project Scope Slug Validation", () => {
  it("validates valid kebab-case project slugs", () => {
    expect(() => validateProjectSlug("my-project")).not.toThrow();
    expect(() => validateProjectSlug("core-arch-2026")).not.toThrow();
  });

  it("rejects invalid slugs", () => {
    expect(() => validateProjectSlug("")).toThrow(DomainValidationError);
    expect(() => validateProjectSlug("My_Project")).toThrow(DomainValidationError);
    expect(() => validateProjectSlug("project with spaces")).toThrow(DomainValidationError);
  });
});

describe("Domain Model: Memory Lifecycle & Versioning", () => {
  it("creates a memory with an initial immutable Version 1 snapshot", () => {
    const { memory, initialVersion } = createMemoryWithVersion({
      id: "mem-001",
      projectScopeId: "proj-alpha",
      title: "Authentication Boundary Decision",
      content: "Use Supabase SSR cookies exclusively on server-side.",
      authorId: "usr-eng-1",
      confidence: 0.95,
      tags: ["Auth", "Security", "SSR"],
    });

    expect(memory.id).toBe("mem-001");
    expect(memory.currentVersion).toBe(1);
    expect(memory.status).toBe("active");
    expect(memory.confidence).toBe(0.95);
    expect(memory.tags).toEqual(["auth", "security", "ssr"]);

    expect(initialVersion.id).toBe("mem-001-v1");
    expect(initialVersion.versionNumber).toBe(1);
    expect(initialVersion.content).toBe(memory.content);
    expect(initialVersion.reasonForChange).toBe("Initial memory creation");
  });

  it("fails to create a memory with empty title or content", () => {
    expect(() =>
      createMemoryWithVersion({
        id: "mem-002",
        projectScopeId: "proj-alpha",
        title: "",
        content: "Valid content",
        authorId: "usr-1",
      })
    ).toThrow(DomainValidationError);

    expect(() =>
      createMemoryWithVersion({
        id: "mem-003",
        projectScopeId: "proj-alpha",
        title: "Valid Title",
        content: "   ",
        authorId: "usr-1",
      })
    ).toThrow(DomainValidationError);
  });

  it("increments version number and creates a new audit snapshot upon revision", () => {
    const { memory } = createMemoryWithVersion({
      id: "mem-100",
      projectScopeId: "proj-beta",
      title: "Database Strategy",
      content: "PostgreSQL on Supabase.",
      authorId: "usr-eng-1",
    });

    const { updatedMemory, newVersion } = reviseMemory({
      currentMemory: memory,
      content: "PostgreSQL on Supabase with pgvector extension enabled.",
      authorId: "usr-eng-2",
      reasonForChange: "Added pgvector for derived embeddings",
    });

    expect(updatedMemory.currentVersion).toBe(2);
    expect(updatedMemory.content).toBe(
      "PostgreSQL on Supabase with pgvector extension enabled."
    );
    expect(newVersion.versionNumber).toBe(2);
    expect(newVersion.id).toBe("mem-100-v2");
    expect(newVersion.reasonForChange).toBe(
      "Added pgvector for derived embeddings"
    );
  });
});

describe("Domain Model: Access Policy & Project Boundaries", () => {
  it("allows access within the same project scope", () => {
    const permitted = isAccessPermitted({
      requestingProjectScopeId: "proj-a",
      targetProjectScopeId: "proj-a",
    });
    expect(permitted).toBe(true);
  });

  it("denies access cross-project by default (private by default)", () => {
    const permitted = isAccessPermitted({
      requestingProjectScopeId: "proj-consumer",
      targetProjectScopeId: "proj-secret",
    });
    expect(permitted).toBe(false);
  });

  it("permits cross-project access only when explicit shared policy exists", () => {
    const policy: AccessPolicy = {
      id: "pol-1",
      projectScopeId: "proj-shared",
      level: "shared_read",
      allowedProjectIds: ["proj-authorized"],
      createdAt: new Date().toISOString(),
    };

    expect(
      isAccessPermitted({
        requestingProjectScopeId: "proj-authorized",
        targetProjectScopeId: "proj-shared",
        policy,
      })
    ).toBe(true);

    expect(
      isAccessPermitted({
        requestingProjectScopeId: "proj-unauthorized",
        targetProjectScopeId: "proj-shared",
        policy,
      })
    ).toBe(false);
  });
});

describe("Domain Model: Derived Embedding Freshness", () => {
  it("verifies embedding is fresh if version matches memory current version", () => {
    const { memory } = createMemoryWithVersion({
      id: "mem-300",
      projectScopeId: "proj-1",
      title: "Title",
      content: "Content",
      authorId: "usr-1",
    });

    const embedding: DerivedEmbedding = {
      id: "emb-1",
      memoryId: "mem-300",
      memoryVersion: 1,
      model: "text-embedding-3-small",
      vector: [0.1, 0.2, 0.3],
      dimensions: 3,
      derivedAt: new Date().toISOString(),
    };

    expect(isEmbeddingFresh(embedding, memory)).toBe(true);

    // After memory revision, previous embedding is no longer fresh
    const { updatedMemory } = reviseMemory({
      currentMemory: memory,
      content: "Updated Content",
      authorId: "usr-1",
      reasonForChange: "Clarification",
    });

    expect(isEmbeddingFresh(embedding, updatedMemory)).toBe(false);
  });
});

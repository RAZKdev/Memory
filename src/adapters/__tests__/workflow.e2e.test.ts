import { describe, expect, it } from "vitest";
import { InMemoryMemoryRepository } from "../in-memory-memory-repository";
import { createMemoryWithVersion, isAccessPermitted, reviseMemory } from "@/domain/invariants";
import { AccessPolicy } from "@/domain/types";

describe("Workflow Slice: End-to-End Core Memory Lifecycle", () => {
  it("executes the full end-to-end memory workflow: creation, citation, revision, and scope isolation", async () => {
    const repo = new InMemoryMemoryRepository();

    // 1. Establish Project Scope
    const project = await repo.createProjectScope({
      id: "proj-security-core",
      slug: "security-core",
      name: "Security Core",
      description: "Cryptographic operations and authorization boundaries",
      isArchived: false,
    });
    expect(project.id).toBe("proj-security-core");

    // 2. Establish Provenance Source
    const source = await repo.createSource({
      id: "src-owasp-asvs",
      projectScopeId: project.id,
      title: "OWASP ASVS 5.0.0 Authorization Controls",
      type: "rfc",
      uri: "https://owasp.org/projects/asvs",
    });
    expect(source.id).toBe("src-owasp-asvs");

    // 3. Create Memory with Version 1 and Source Reference
    const { memory: createdMem, initialVersion } = createMemoryWithVersion({
      id: "mem-auth-01",
      projectScopeId: project.id,
      title: "Server-side Mutation Authorization Control",
      content:
        "Every mutation endpoint must verify authorization server-side directly against session claims.",
      authorId: "eng-sec-01",
      confidence: 1.0,
      tags: ["owasp", "asvs", "auth", "security"],
    });

    await repo.createMemory({
      memory: createdMem,
      initialVersion,
      sourceReferences: [
        {
          sourceId: source.id,
          citationSnippet: "V4.1: Verify authorization checks server-side on every mutation.",
          locationReference: "OWASP-ASVS-5.0#V4.1",
        },
      ],
    });

    // 4. Query memory list filtered by project scope
    const memories = await repo.getMemories({ projectScopeId: project.id });
    expect(memories).toHaveLength(1);
    expect(memories[0].title).toBe("Server-side Mutation Authorization Control");
    expect(memories[0].currentVersion).toBe(1);

    // 5. Query source provenance
    const citations = await repo.getSourceReferences("mem-auth-01");
    expect(citations).toHaveLength(1);
    expect(citations[0].citationSnippet).toContain("V4.1: Verify authorization");

    // 6. Revise Memory (creating Version 2 with audit reason)
    const { updatedMemory, newVersion } = reviseMemory({
      currentMemory: memories[0],
      content:
        "Every mutation endpoint must verify authorization server-side directly against session claims and log security audit events.",
      authorId: "eng-sec-02",
      reasonForChange: "Added mandatory security audit event logging requirement",
    });

    await repo.reviseMemory({ updatedMemory, newVersion });

    // 7. Verify updated memory state and version history
    const refreshed = await repo.getMemoryById("mem-auth-01");
    expect(refreshed?.currentVersion).toBe(2);
    expect(refreshed?.content).toContain("log security audit events");

    const history = await repo.getMemoryVersions("mem-auth-01");
    expect(history).toHaveLength(2);
    expect(history[0].versionNumber).toBe(2);
    expect(history[0].reasonForChange).toBe(
      "Added mandatory security audit event logging requirement"
    );
    expect(history[1].versionNumber).toBe(1);

    // 8. Verify Project Scope Isolation
    const crossScopeUnauthorized = isAccessPermitted({
      requestingProjectScopeId: "proj-untrusted-ui",
      targetProjectScopeId: project.id,
    });
    expect(crossScopeUnauthorized).toBe(false);

    // Now permit read access explicitly via AccessPolicy
    const policy: AccessPolicy = {
      id: "pol-shared",
      projectScopeId: project.id,
      level: "shared_read",
      allowedProjectIds: ["proj-untrusted-ui"],
      createdAt: new Date().toISOString(),
    };
    await repo.setAccessPolicy(policy);

    const crossScopeAuthorized = isAccessPermitted({
      requestingProjectScopeId: "proj-untrusted-ui",
      targetProjectScopeId: project.id,
      policy,
    });
    expect(crossScopeAuthorized).toBe(true);
  });
});

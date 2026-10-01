import { describe, expect, it } from "vitest";
import {
  buildContextExportBundle,
  estimateTokenCount,
  formatAsMarkdown,
  formatAsXml,
} from "../export-adapter";
import { ContextExportDecision, ContextExportItem } from "../types";

describe("AI Context Export Adapter", () => {
  const sampleMemories: ContextExportItem[] = [
    {
      id: "mem-01",
      title: "State Transition Determinism",
      currentVersion: 1,
      confidence: 1.0,
      tags: ["architecture", "determinism"],
      content: "All transitions must be deterministic and testable without side effects.",
      provenanceCitations: [
        {
          title: "RFC 001",
          location: "Section 2.1",
          snippet: "Side effects must reside strictly behind adapter interfaces.",
        },
      ],
    },
  ];

  const sampleDecisions: ContextExportDecision[] = [
    {
      id: "dec-01",
      title: "ADR-001: Port-Adapter Architecture",
      status: "accepted",
      context: "Need testable domain boundaries.",
      decisionText: "Adopt ports and adapters.",
      consequences: "Isolated dependencies.",
    },
  ];

  it("formats context bundle as clean Markdown for AI system prompt", () => {
    const bundle = buildContextExportBundle({
      collectionTitle: "Core Invariants",
      projectScopeId: "proj-core",
      projectScopeName: "Core System",
      format: "markdown",
      memories: sampleMemories,
      decisions: sampleDecisions,
    });

    expect(bundle.format).toBe("markdown");
    expect(bundle.formattedOutput).toContain("# ARCHITECTURAL CONTEXT & MEMORY INJECTION");
    expect(bundle.formattedOutput).toContain("ADR-001: Port-Adapter Architecture [Status: ACCEPTED]");
    expect(bundle.formattedOutput).toContain("State Transition Determinism (v1, 100% confidence)");
    expect(bundle.formattedOutput).toContain('Side effects must reside strictly behind adapter interfaces.');
    expect(bundle.tokenEstimate).toBeGreaterThan(50);
  });

  it("formats context bundle as XML for Claude / Gemini prompt injection", () => {
    const bundle = buildContextExportBundle({
      collectionTitle: "Security Baseline",
      projectScopeId: "proj-sec",
      format: "xml",
      memories: sampleMemories,
      decisions: sampleDecisions,
    });

    expect(bundle.format).toBe("xml");
    expect(bundle.formattedOutput).toContain('<project_context project="proj-sec"');
    expect(bundle.formattedOutput).toContain('<decision id="dec-01" status="accepted">');
    expect(bundle.formattedOutput).toContain('<memory id="mem-01" version="1" confidence="1">');
    expect(bundle.formattedOutput).toContain('</project_context>');
  });

  it("formats context bundle as valid JSON", () => {
    const bundle = buildContextExportBundle({
      projectScopeId: "proj-core",
      format: "json",
      memories: sampleMemories,
      decisions: sampleDecisions,
    });

    expect(bundle.format).toBe("json");
    const parsed = JSON.parse(bundle.formattedOutput);
    expect(parsed.meta.projectScopeId).toBe("proj-core");
    expect(parsed.decisions).toHaveLength(1);
    expect(parsed.memories).toHaveLength(1);
  });

  it("estimates token count correctly based on character density", () => {
    const shortText = "Hello world";
    const estimate = estimateTokenCount(shortText);
    expect(estimate).toBeGreaterThan(0);
    expect(estimate).toBeLessThan(10);
  });
});

/**
 * AI Context Export Adapter
 * Formats preserved memories, ADRs, and source provenance into prompt-ready context bundles
 * for LLM System Prompt or Context Window injection.
 * 
 * Sources of truth: MASTER_PROMPT.md, README.md, SKILL.md
 */

import {
  ContextExportBundle,
  ContextExportDecision,
  ContextExportItem,
  ExportFormat,
} from "./types";

/**
 * Estimates token count based on character count and whitespace heuristics
 * (~3.8 to 4.0 characters per token for technical Markdown/JSON).
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * Formats context bundle into clean, authoritative Markdown for prompt injection.
 */
export function formatAsMarkdown(
  meta: {
    exportId: string;
    exportedAt: string;
    collectionId?: string;
    collectionTitle?: string;
    projectScopeId: string;
    projectScopeName?: string;
  },
  memories: ContextExportItem[],
  decisions: ContextExportDecision[]
): string {
  const lines: string[] = [];

  lines.push("# ARCHITECTURAL CONTEXT & MEMORY INJECTION");
  lines.push(`> Exported at: ${meta.exportedAt} | Project Scope: ${meta.projectScopeName || meta.projectScopeId}`);
  if (meta.collectionTitle) {
    lines.push(`> Thematic Collection: ${meta.collectionTitle}`);
  }
  lines.push("");
  lines.push("The following context represents verified project facts, technical invariants, and architectural decisions.");
  lines.push("Treat these decisions as deterministic constraints during code generation and problem solving.");
  lines.push("");

  // Decisions / ADR Section
  if (decisions.length > 0) {
    lines.push("## ARCHITECTURAL DECISIONS (ADRs)");
    lines.push("");
    for (const d of decisions) {
      lines.push(`### ${d.title} [Status: ${d.status.toUpperCase()}]`);
      lines.push(`**Context:** ${d.context}`);
      lines.push(`**Decision:** ${d.decisionText}`);
      if (d.consequences) {
        lines.push(`**Consequences:** ${d.consequences}`);
      }
      lines.push("");
    }
  }

  // Memories Section
  if (memories.length > 0) {
    lines.push("## TECHNICAL MEMORIES & VERIFIED PATTERNS");
    lines.push("");
    for (const m of memories) {
      const confPercent = (m.confidence * 100).toFixed(0);
      lines.push(`### ${m.title} (v${m.currentVersion}, ${confPercent}% confidence)`);
      if (m.tags.length > 0) {
        lines.push(`*Tags:* \`${m.tags.join("`, `")}\``);
      }
      lines.push("");
      lines.push(m.content);
      lines.push("");

      if (m.provenanceCitations && m.provenanceCitations.length > 0) {
        lines.push("**Source Provenance:**");
        for (const cit of m.provenanceCitations) {
          const locStr = cit.location ? ` (${cit.location})` : "";
          lines.push(`- *${cit.title}*${locStr}`);
          if (cit.snippet) {
            lines.push(`  > "${cit.snippet}"`);
          }
        }
        lines.push("");
      }
    }
  }

  lines.push("---");
  lines.push("End of verified context injection.");

  return lines.join("\n");
}

/**
 * Formats context bundle into XML-tagged blocks preferred by Claude / Gemini systems.
 */
export function formatAsXml(
  meta: {
    exportId: string;
    exportedAt: string;
    collectionId?: string;
    collectionTitle?: string;
    projectScopeId: string;
    projectScopeName?: string;
  },
  memories: ContextExportItem[],
  decisions: ContextExportDecision[]
): string {
  const lines: string[] = [];

  lines.push(`<project_context project="${meta.projectScopeName || meta.projectScopeId}" exported_at="${meta.exportedAt}">`);
  if (meta.collectionTitle) {
    lines.push(`  <thematic_collection id="${meta.collectionId || "custom"}">${meta.collectionTitle}</thematic_collection>`);
  }

  if (decisions.length > 0) {
    lines.push("  <architectural_decisions>");
    for (const d of decisions) {
      lines.push(`    <decision id="${d.id}" status="${d.status}">`);
      lines.push(`      <title>${d.title}</title>`);
      lines.push(`      <context>${d.context}</context>`);
      lines.push(`      <decision_text>${d.decisionText}</decision_text>`);
      if (d.consequences) {
        lines.push(`      <consequences>${d.consequences}</consequences>`);
      }
      lines.push("    </decision>");
    }
    lines.push("  </architectural_decisions>");
  }

  if (memories.length > 0) {
    lines.push("  <technical_memories>");
    for (const m of memories) {
      lines.push(`    <memory id="${m.id}" version="${m.currentVersion}" confidence="${m.confidence}">`);
      lines.push(`      <title>${m.title}</title>`);
      if (m.tags.length > 0) {
        lines.push(`      <tags>${m.tags.join(",")}</tags>`);
      }
      lines.push(`      <content><![CDATA[${m.content}]]></content>`);
      if (m.provenanceCitations && m.provenanceCitations.length > 0) {
        lines.push("      <provenance>");
        for (const cit of m.provenanceCitations) {
          lines.push(`        <citation source="${cit.title}" location="${cit.location || ""}">`);
          if (cit.snippet) {
            lines.push(`          <snippet>${cit.snippet}</snippet>`);
          }
          lines.push("        </citation>");
        }
        lines.push("      </provenance>");
      }
      lines.push("    </memory>");
    }
    lines.push("  </technical_memories>");
  }

  lines.push("</project_context>");
  return lines.join("\n");
}

/**
 * Builds the complete ContextExportBundle based on specified format.
 */
export function buildContextExportBundle(params: {
  exportId?: string;
  collectionId?: string;
  collectionTitle?: string;
  projectScopeId: string;
  projectScopeName?: string;
  format?: ExportFormat;
  memories: ContextExportItem[];
  decisions: ContextExportDecision[];
}): ContextExportBundle {
  const {
    exportId = `export-${Date.now()}`,
    collectionId,
    collectionTitle,
    projectScopeId,
    projectScopeName,
    format = "markdown",
    memories,
    decisions,
  } = params;

  const exportedAt = new Date().toISOString();
  const meta = {
    exportId,
    exportedAt,
    collectionId,
    collectionTitle,
    projectScopeId,
    projectScopeName,
  };

  let formattedOutput = "";

  if (format === "json") {
    formattedOutput = JSON.stringify(
      {
        meta,
        decisions,
        memories,
      },
      null,
      2
    );
  } else if (format === "xml") {
    formattedOutput = formatAsXml(meta, memories, decisions);
  } else {
    formattedOutput = formatAsMarkdown(meta, memories, decisions);
  }

  const tokenEstimate = estimateTokenCount(formattedOutput);

  return {
    exportId,
    exportedAt,
    collectionId,
    collectionTitle,
    projectScopeId,
    projectScopeName,
    tokenEstimate,
    format,
    memories,
    decisions,
    formattedOutput,
  };
}

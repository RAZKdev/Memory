import { getRepository } from "@/lib/repository";
import { DecisionsWorkspace } from "@/components/DecisionsWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keputusan (ADR) — Arsip Konteks Teknis MemoryVault",
  description: "Kelola dan telusuri Architectural Decision Records (ADR) yang terhubung ke memori teknis.",
};

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const repo = getRepository();
  const [projects, decisions, memories, sources] = await Promise.all([
    repo.getProjectScopes(),
    repo.getDecisions(),
    repo.getMemories(),
    repo.getSources(),
  ]);

  return (
    <DecisionsWorkspace
      initialProjects={projects}
      initialDecisions={decisions}
      initialMemories={memories}
      initialSources={sources}
    />
  );
}

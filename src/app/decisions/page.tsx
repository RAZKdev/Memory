import { getRepository } from "@/lib/repository";
import { DecisionsWorkspace } from "@/components/DecisionsWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architectural Decisions (ADRs) — MemoryVault",
  description: "Preserve and inspect architectural decision records linked deterministically to technical memories.",
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

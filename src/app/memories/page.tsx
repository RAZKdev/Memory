import { getRepository } from "@/lib/repository";
import { MemoryWorkspace } from "@/components/MemoryWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memories — MemoryVault Technical Context Archive",
  description: "Browse, create, and audit preserved cross-project memories, ADRs, and source provenance.",
};

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const repo = getRepository();
  const [projects, memories] = await Promise.all([
    repo.getProjectScopes(),
    repo.getMemories(),
  ]);

  return (
    <MemoryWorkspace
      initialProjects={projects}
      initialMemories={memories}
    />
  );
}

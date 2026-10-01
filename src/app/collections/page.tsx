import { getRepository } from "@/lib/repository";
import { CollectionsWorkspace } from "@/components/CollectionsWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thematic Collections & AI Prompt Export — MemoryVault",
  description:
    "Curate technical memories and ADR decisions into exportable context bundles for AI session injection.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const repo = getRepository();
  const [projects, collections, memories, decisions] = await Promise.all([
    repo.getProjectScopes(),
    repo.getCollections(),
    repo.getMemories(),
    repo.getDecisions(),
  ]);

  return (
    <CollectionsWorkspace
      initialProjects={projects}
      initialCollections={collections}
      initialMemories={memories}
      initialDecisions={decisions}
    />
  );
}

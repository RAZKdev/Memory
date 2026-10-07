import { getRepository } from "@/lib/repository";
import { CollectionsWorkspace } from "@/components/CollectionsWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Koleksi Tematik & Ekspor Prompt AI — MemoryVault",
  description:
    "Kurasi memori teknis dan keputusan ADR ke dalam bundel konteks siap ekspor untuk injeksi sesi AI.",
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

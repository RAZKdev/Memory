import { getRepository } from "@/lib/repository";
import { MemoryWorkspace } from "@/components/MemoryWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memori — Arsip Konteks Teknis MemoryVault",
  description: "Telusuri, buat, dan audit memori teknis lintas proyek, ADR, dan sumber rujukan.",
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

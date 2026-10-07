import React from "react";
import { getRepository } from "@/lib/repository";
import { ProjectsWorkspace } from "@/components/ProjectsWorkspace";
import type { Metadata } from "next";
import { AccessPolicy } from "@/domain/types";

export const metadata: Metadata = {
  title: "Tata Kelola Proyek & Kebijakan — MemoryVault",
  description: "Kelola batasan isolasi privat dan kebijakan akses berbagi lintas proyek.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const repo = getRepository();

  const [projects, memories, decisions, collections] = await Promise.all([
    repo.getProjectScopes(),
    repo.getMemories(),
    repo.getDecisions(),
    repo.getCollections(),
  ]);

  // Fetch access policies for all projects
  const initialPolicies: Record<string, AccessPolicy> = {};
  for (const project of projects) {
    const policy = await repo.getAccessPolicy(project.id);
    if (policy) {
      initialPolicies[project.id] = policy;
    } else {
      initialPolicies[project.id] = {
        id: `pol-${project.id}`,
        projectScopeId: project.id,
        level: "private",
        allowedProjectIds: [],
        description: "Default private isolation policy",
        createdAt: project.createdAt,
      };
    }
  }

  return (
    <ProjectsWorkspace
      initialProjects={projects}
      initialPolicies={initialPolicies}
      initialMemories={memories}
      initialDecisions={decisions}
      initialCollections={collections}
    />
  );
}

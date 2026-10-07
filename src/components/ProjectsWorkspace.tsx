"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AccessPolicy,
  Collection,
  Decision,
  Memory,
  ProjectScope,
} from "@/domain/types";
import { CreateProjectModal } from "./CreateProjectModal";
import { AccessPolicyModal } from "./AccessPolicyModal";
import { HybridSearchModal } from "./HybridSearchModal";
import {
  FolderGit2,
  Plus,
  Search,
  ShieldCheck,
  Lock,
  Users,
  Globe2,
  Layers,
  GitBranch,
  Archive,
  ArrowRight,
  ExternalLink,
  Settings,
} from "lucide-react";

interface ProjectsWorkspaceProps {
  initialProjects: ProjectScope[];
  initialPolicies: Record<string, AccessPolicy>;
  initialMemories: Memory[];
  initialDecisions: Decision[];
  initialCollections: Collection[];
}

export function ProjectsWorkspace({
  initialProjects,
  initialPolicies,
  initialMemories,
  initialDecisions,
  initialCollections,
}: ProjectsWorkspaceProps) {
  const [projects, setProjects] = useState<ProjectScope[]>(initialProjects);
  const [policies, setPolicies] = useState<Record<string, AccessPolicy>>(initialPolicies);
  const [memories] = useState<Memory[]>(initialMemories);
  const [decisions] = useState<Decision[]>(initialDecisions);
  const [collections] = useState<Collection[]>(initialCollections);

  const [searchFilter, setSearchFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [policyTargetProject, setPolicyTargetProject] = useState<ProjectScope | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Refresh projects list
  async function refreshProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const json = await res.json();
        const updatedProjects: ProjectScope[] = json.data || [];
        setProjects(updatedProjects);

        // Fetch policies for new projects if needed
        const newPolicies = { ...policies };
        for (const p of updatedProjects) {
          if (!newPolicies[p.id]) {
            const pRes = await fetch(`/api/projects/${p.id}/policy`);
            if (pRes.ok) {
              const pJson = await pRes.json();
              newPolicies[p.id] = pJson.data;
            }
          }
        }
        setPolicies(newPolicies);
      }
    } catch (err) {
      console.error("Failed to refresh projects:", err);
    }
  }

  function handlePolicyUpdated(updatedPolicy: AccessPolicy) {
    setPolicies((prev) => ({
      ...prev,
      [updatedPolicy.projectScopeId]: updatedPolicy,
    }));
  }

  // Filter projects by search
  const filteredProjects = projects.filter((p) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-archive-bg text-archive-primary flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-archive-border bg-archive-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-archive-primary hover:text-archive-accent transition-colors"
            >
              <div className="w-7 h-7 rounded bg-archive-accent/10 border border-archive-accent/30 flex items-center justify-center text-archive-accent font-mono font-bold text-xs">
                MV
              </div>
              <span className="font-mono font-semibold tracking-tight text-sm">
                MemoryVault
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
              <Link
                href="/memories"
                className="px-3 py-1.5 rounded text-archive-secondary hover:text-archive-primary hover:bg-archive-subtle transition-colors"
              >
                Memori
              </Link>
              <Link
                href="/decisions"
                className="px-3 py-1.5 rounded text-archive-secondary hover:text-archive-primary hover:bg-archive-subtle transition-colors"
              >
                ADR
              </Link>
              <Link
                href="/collections"
                className="px-3 py-1.5 rounded text-archive-secondary hover:text-archive-primary hover:bg-archive-subtle transition-colors"
              >
                Koleksi
              </Link>
              <Link
                href="/projects"
                className="px-3 py-1.5 rounded bg-archive-subtle text-archive-accent font-semibold border border-archive-border"
              >
                Proyek
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buka Pencarian Hybrid"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-archive-secondary bg-archive-subtle hover:text-archive-primary border border-archive-border rounded hover:border-archive-accent/40 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-archive-accent" />
              <span className="hidden sm:inline">Cari Vault</span>
              <kbd className="hidden sm:inline px-1 py-0.5 text-[10px] bg-archive-card border border-archive-border rounded text-archive-muted">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-archive-bg bg-archive-accent hover:bg-archive-accentHover rounded font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Scope Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-archive-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderGit2 className="w-5 h-5 text-archive-accent" />
              <h1 className="text-xl font-bold font-mono tracking-tight text-archive-primary">
                Tata Kelola Scope Proyek
              </h1>
            </div>
            <p className="text-xs text-archive-muted max-w-2xl">
              Kelola batasan isolasi domain, kontrol akses lintas proyek, dan kebijakan isolasi untuk mencegah kebocoran data antar sesi agen AI.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-2 bg-archive-card border border-archive-border rounded">
              <div className="text-[10px] text-archive-muted uppercase tracking-wider">Scope</div>
              <div className="text-base font-bold text-archive-primary">{projects.length}</div>
            </div>
            <div className="px-3 py-2 bg-archive-card border border-archive-border rounded">
              <div className="text-[10px] text-archive-muted uppercase tracking-wider">Memori</div>
              <div className="text-base font-bold text-archive-primary">{memories.length}</div>
            </div>
            <div className="px-3 py-2 bg-archive-card border border-archive-border rounded">
              <div className="text-[10px] text-archive-muted uppercase tracking-wider">ADR</div>
              <div className="text-base font-bold text-archive-accent">{decisions.length}</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-archive-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter scope proyek berdasarkan nama atau slug..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-archive-card border border-archive-border rounded pl-9 pr-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const policy = policies[project.id];
            const projectMemories = memories.filter((m) => m.projectScopeId === project.id);
            const projectDecisions = decisions.filter((d) => d.projectScopeId === project.id);
            const projectCollections = collections.filter((c) => c.projectScopeId === project.id);

            const policyLevel = policy?.level || "private";
            const allowedCount = policy?.allowedProjectIds?.length || 0;

            return (
              <div
                key={project.id}
                className="bg-archive-card border border-archive-border rounded-lg p-5 flex flex-col justify-between hover:border-archive-borderHover transition-all space-y-4"
              >
                <div>
                  {/* Top Bar: Title & Access Policy Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold font-mono text-archive-primary truncate">
                        {project.name}
                      </h2>
                      <div className="text-[11px] font-mono text-archive-muted">
                        slug: <span className="text-archive-secondary">{project.slug}</span>
                      </div>
                    </div>

                    {/* Access Policy Badge */}
                    {policyLevel === "private" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-archive-amber/10 text-archive-amber border border-archive-amber/20 flex-shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>Privat (Private)</span>
                      </span>
                    )}
                    {policyLevel === "project_internal" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-archive-accent/10 text-archive-accent border border-archive-accent/20 flex-shrink-0">
                        <Users className="w-3 h-3" />
                        <span>Internal</span>
                      </span>
                    )}
                    {policyLevel === "shared_read" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-archive-emerald/10 text-archive-emerald border border-archive-emerald/20 flex-shrink-0">
                        <Globe2 className="w-3 h-3" />
                        <span>Berbagi / Shared ({allowedCount})</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-archive-secondary line-clamp-2 mb-3">
                    {project.description || "Belum ada deskripsi untuk scope ini."}
                  </p>

                  {/* Isolation Policy Description Notes */}
                  {policy?.description && (
                    <div className="p-2 rounded bg-archive-subtle/60 border border-archive-border/60 text-[11px] text-archive-muted font-mono mb-3">
                      Catatan: {policy.description}
                    </div>
                  )}

                  {/* Artifact Stats Counter */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-archive-border text-center">
                    <div>
                      <div className="text-[10px] font-mono text-archive-muted uppercase">Memori</div>
                      <div className="text-xs font-bold font-mono text-archive-primary">
                        {projectMemories.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-archive-muted uppercase">ADR</div>
                      <div className="text-xs font-bold font-mono text-archive-accent">
                        {projectDecisions.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-archive-muted uppercase">Koleksi</div>
                      <div className="text-xs font-bold font-mono text-archive-emerald">
                        {projectCollections.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPolicyTargetProject(project)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium text-archive-secondary hover:text-archive-primary bg-archive-subtle hover:bg-archive-border border border-archive-border transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-archive-accent" />
                    <span>Kebijakan</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/memories`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-archive-secondary hover:text-archive-accent transition-colors"
                    >
                      <span>Jelajahi</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 border border-dashed border-archive-border rounded-lg bg-archive-card/50">
            <FolderGit2 className="w-8 h-8 text-archive-muted mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold font-mono text-archive-primary">
              Tidak ada scope proyek ditemukan
            </h3>
            <p className="text-xs text-archive-muted mt-1 max-w-sm mx-auto">
              {searchFilter
                ? "Tidak ada scope yang cocok dengan kriteria pencarian Anda. Coba istilah lain."
                : "Buat scope proyek pertama Anda untuk mulai mengisolasi memori dan keputusan arsitektur."}
            </p>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          refreshProjects();
        }}
      />

      {/* Access Policy Modal */}
      <AccessPolicyModal
        isOpen={Boolean(policyTargetProject)}
        project={policyTargetProject}
        allProjects={projects}
        currentPolicy={policyTargetProject ? policies[policyTargetProject.id] || null : null}
        onClose={() => setPolicyTargetProject(null)}
        onSuccess={handlePolicyUpdated}
      />

      {/* Hybrid Search Modal */}
      <HybridSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMemory={() => {}}
        projectScopes={projects}
      />
    </div>
  );
}

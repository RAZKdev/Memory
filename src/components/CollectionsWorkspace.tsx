"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Collection, Decision, Memory, ProjectScope } from "@/domain/types";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { ExportModal } from "./ExportModal";
import { HybridSearchModal } from "./HybridSearchModal";
import {
  Layers,
  Plus,
  Search,
  Filter,
  Archive,
  GitBranch,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface CollectionsWorkspaceProps {
  initialProjects: ProjectScope[];
  initialCollections: Collection[];
  initialMemories: Memory[];
  initialDecisions: Decision[];
}

export function CollectionsWorkspace({
  initialProjects,
  initialCollections,
  initialMemories,
  initialDecisions,
}: CollectionsWorkspaceProps) {
  const [projects] = useState<ProjectScope[]>(initialProjects);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [memories] = useState<Memory[]>(initialMemories);
  const [decisions] = useState<Decision[]>(initialDecisions);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    initialCollections[0]?.id || null
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Refresh collections
  async function refreshCollections() {
    try {
      const params = new URLSearchParams();
      if (selectedProjectId !== "all") {
        params.set("projectScopeId", selectedProjectId);
      }
      const res = await fetch(`/api/collections?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCollections(json.data || []);
        if (json.data && json.data.length > 0) {
          if (!json.data.some((c: Collection) => c.id === selectedCollectionId)) {
            setSelectedCollectionId(json.data[0].id);
          }
        } else {
          setSelectedCollectionId(null);
        }
      }
    } catch (err) {
      console.error("Failed to refresh collections:", err);
    }
  }

  React.useEffect(() => {
    refreshCollections();
  }, [selectedProjectId]);

  const activeCollection =
    collections.find((c) => c.id === selectedCollectionId) || null;
  const activeScope = projects.find(
    (p) => p.id === activeCollection?.projectScopeId
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-archive-bg text-archive-primary">
      {/* Top Header */}
      <header className="border-b border-archive-border bg-archive-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded border border-archive-accent/40 bg-archive-subtle flex items-center justify-center text-archive-accent hover:border-archive-accent transition-colors"
            >
              <Archive className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-semibold text-archive-primary tracking-wide text-sm font-mono">
                MemoryVault
              </span>
              <span className="ml-2 text-xs font-mono text-archive-muted">
                / Koleksi Konteks Tematik
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/memories"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Memori
            </Link>
            <Link
              href="/decisions"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Keputusan (ADR)
            </Link>
            <Link
              href="/projects"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Proyek
            </Link>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-archive-subtle hover:bg-archive-border border border-archive-border text-archive-secondary hover:text-archive-primary rounded text-xs font-mono transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-archive-muted" />
              <span>Pencarian Hybrid</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-archive-accent hover:bg-archive-accentHover text-archive-bg rounded text-xs font-semibold font-mono transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Koleksi Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Column: Scope Filters & Collection List */}
        <section
          aria-label="Collections Explorer"
          className="w-full md:w-80 lg:w-96 flex flex-col gap-4 flex-shrink-0"
        >
          {/* Project Scope Filter */}
          <div className="space-y-1.5">
            <label htmlFor="col-scope-filter" className="text-xs font-mono text-archive-muted flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-archive-accent" />
              <span>Filter Scope Proyek</span>
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedProjectId("all")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex-shrink-0 ${
                  selectedProjectId === "all"
                    ? "bg-archive-accent text-archive-bg font-semibold"
                    : "bg-archive-subtle text-archive-secondary hover:text-archive-primary border border-archive-border"
                }`}
              >
                Semua Scope
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex-shrink-0 ${
                    selectedProjectId === p.id
                      ? "bg-archive-accent text-archive-bg font-semibold"
                      : "bg-archive-subtle text-archive-secondary hover:text-archive-primary border border-archive-border"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Cards */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {collections.length === 0 ? (
              <div className="p-8 text-center rounded border border-archive-border bg-archive-card/40">
                <Layers className="w-8 h-8 text-archive-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-mono text-archive-secondary">Belum ada koleksi dibuat</p>
                <p className="text-[11px] text-archive-muted mt-1">
                  Buat koleksi untuk membundel memori teknis siap injeksi prompt AI.
                </p>
              </div>
            ) : (
              collections.map((col) => {
                const isSelected = col.id === selectedCollectionId;
                const project = projects.find((p) => p.id === col.projectScopeId);
                const memoryCount = col.memoryIds.length;
                const decisionCount = (col.decisionIds || []).length;

                return (
                  <div
                    key={col.id}
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`p-3.5 rounded border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-archive-accent bg-archive-subtle shadow-sm"
                        : "border-archive-border bg-archive-card hover:border-archive-borderHover hover:bg-archive-subtle/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-archive-muted">
                        {project?.slug || "general"}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-archive-card border border-archive-border text-archive-accent">
                        Bundel
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-archive-primary line-clamp-1 font-mono">
                      {col.title}
                    </h3>
                    {col.description && (
                      <p className="text-[11px] text-archive-secondary line-clamp-2 mt-1 leading-relaxed">
                        {col.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-archive-border/40 text-[10px] font-mono text-archive-muted">
                      <span>{decisionCount} ADR • {memoryCount} Memori</span>
                      <span>{new Date(col.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Collection Inspector & Prompt Exporter */}
        <main
          id="main-content"
          aria-label="Collection Detail Inspector"
          className="flex-1 flex flex-col border border-archive-border rounded-lg bg-archive-card overflow-hidden min-h-[500px]"
        >
          {!activeCollection ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Layers className="w-12 h-12 text-archive-muted/40 mb-3" />
              <h2 className="text-sm font-semibold text-archive-secondary font-mono">
                Pilih Koleksi untuk Diperiksa & Diekspor
              </h2>
              <p className="text-xs text-archive-muted max-w-sm mt-1">
                Lihat memori dan keputusan ADR dalam bundel, lalu ekspor teks siap injeksi prompt.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-archive-border bg-archive-subtle/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-archive-muted">
                    Scope Proyek: {activeScope?.name || activeCollection.projectScopeId}
                  </span>

                  {/* Primary Export Action */}
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-archive-accent hover:bg-archive-accentHover text-archive-bg rounded font-semibold text-xs font-mono transition-colors shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ekspor Prompt AI</span>
                  </button>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-archive-primary tracking-tight font-mono">
                  {activeCollection.title}
                </h1>

                {activeCollection.description && (
                  <p className="text-xs md:text-sm text-archive-secondary mt-2 leading-relaxed font-mono">
                    {activeCollection.description}
                  </p>
                )}
              </div>

              {/* Grouped ADR Decisions */}
              <div className="p-6 border-b border-archive-border">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-archive-accent" />
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted font-semibold">
                    Keputusan ADR dalam Bundel ({(activeCollection.decisionIds || []).length})
                  </h2>
                </div>

                {(activeCollection.decisionIds || []).length === 0 ? (
                  <p className="text-xs font-mono text-archive-muted italic">
                    Tidak ada keputusan dalam koleksi ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {(activeCollection.decisionIds || []).map((dId) => {
                      const dec = decisions.find((d) => d.id === dId);
                      return (
                        <div
                          key={dId}
                          className="p-3 rounded border border-archive-border bg-archive-subtle/40 flex items-start justify-between gap-3 text-xs font-mono"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-archive-primary">
                                {dec ? dec.title : `ADR: ${dId}`}
                              </span>
                              {dec && (
                                <span className="text-[10px] uppercase font-bold text-archive-emerald px-1.5 py-0.2 bg-archive-emerald/10 border border-archive-emerald/30 rounded">
                                  {dec.status}
                                </span>
                              )}
                            </div>
                            {dec && (
                              <p className="text-[11px] text-archive-secondary line-clamp-2">
                                {dec.decisionText}
                              </p>
                            )}
                          </div>
                          <Link
                            href="/decisions"
                            className="text-archive-accent hover:underline inline-flex items-center gap-1 text-[11px] flex-shrink-0"
                          >
                            <span>Periksa</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grouped Technical Memories */}
              <div className="p-6 flex-1 bg-archive-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <Archive className="w-4 h-4 text-archive-accent" />
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted font-semibold">
                    Memori Teknis dalam Bundel ({activeCollection.memoryIds.length})
                  </h2>
                </div>

                {activeCollection.memoryIds.length === 0 ? (
                  <p className="text-xs font-mono text-archive-muted italic">
                    Tidak ada memori dalam koleksi ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeCollection.memoryIds.map((mId) => {
                      const mem = memories.find((m) => m.id === mId);
                      return (
                        <div
                          key={mId}
                          className="p-3 rounded border border-archive-border bg-archive-subtle/40 flex items-start justify-between gap-3 text-xs font-mono"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-archive-primary">
                                {mem ? mem.title : `Memori: ${mId}`}
                              </span>
                              {mem && (
                                <span className="text-[10px] text-archive-muted">
                                  v{mem.currentVersion} • {(mem.confidence * 100).toFixed(0)}% keyakinan
                                </span>
                              )}
                            </div>
                            {mem && (
                              <p className="text-[11px] text-archive-secondary line-clamp-2">
                                {mem.summary || mem.content}
                              </p>
                            )}
                          </div>
                          <Link
                            href="/memories"
                            className="text-archive-accent hover:underline inline-flex items-center gap-1 text-[11px] flex-shrink-0"
                          >
                            <span>Periksa</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshCollections}
        projectScopes={projects}
        availableMemories={memories}
        availableDecisions={decisions}
        initialProjectScopeId={selectedProjectId === "all" ? projects[0]?.id : selectedProjectId}
      />

      {/* Export Context Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        collectionId={activeCollection?.id || null}
        collectionTitle={activeCollection?.title}
      />

      {/* Global Hybrid Search Modal */}
      <HybridSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMemory={() => {}}
        projectScopes={projects}
      />
    </div>
  );
}

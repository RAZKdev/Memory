"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Decision, Memory, ProjectScope, Source } from "@/domain/types";
import { CreateDecisionModal } from "./CreateDecisionModal";
import { HybridSearchModal } from "./HybridSearchModal";
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  Layers,
  Archive,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

interface DecisionsWorkspaceProps {
  initialProjects: ProjectScope[];
  initialDecisions: Decision[];
  initialMemories: Memory[];
  initialSources: Source[];
}

export function DecisionsWorkspace({
  initialProjects,
  initialDecisions,
  initialMemories,
  initialSources,
}: DecisionsWorkspaceProps) {
  const [projects] = useState<ProjectScope[]>(initialProjects);
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions);
  const [memories] = useState<Memory[]>(initialMemories);
  const [sources] = useState<Source[]>(initialSources);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    initialDecisions[0]?.id || null
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Refresh decisions
  async function refreshDecisions() {
    try {
      const params = new URLSearchParams();
      if (selectedProjectId !== "all") {
        params.set("projectScopeId", selectedProjectId);
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }

      const res = await fetch(`/api/decisions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDecisions(json.data || []);
        if (json.data && json.data.length > 0) {
          if (!json.data.some((d: Decision) => d.id === selectedDecisionId)) {
            setSelectedDecisionId(json.data[0].id);
          }
        } else {
          setSelectedDecisionId(null);
        }
      }
    } catch (err) {
      console.error("Failed to refresh decisions:", err);
    }
  }

  React.useEffect(() => {
    refreshDecisions();
  }, [selectedProjectId, selectedStatus]);

  const activeDecision = decisions.find((d) => d.id === selectedDecisionId) || null;
  const activeScope = projects.find((p) => p.id === activeDecision?.projectScopeId);

  // Status badge helper
  function renderStatusBadge(status: string) {
    switch (status) {
      case "accepted":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-archive-emerald/10 border border-archive-emerald/30 text-archive-emerald font-semibold uppercase">
            Diterima (Accepted)
          </span>
        );
      case "proposed":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-archive-amber/10 border border-archive-amber/30 text-archive-amber font-semibold uppercase">
            Diusulkan (Proposed)
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-archive-rose/10 border border-archive-rose/30 text-archive-rose font-semibold uppercase">
            Ditolak (Rejected)
          </span>
        );
      case "deprecated":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-archive-subtle border border-archive-border text-archive-muted uppercase font-semibold">
            Usang (Deprecated)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-archive-subtle border border-archive-border text-archive-muted uppercase">
            {status}
          </span>
        );
    }
  }

  const statusOptions = [
    { value: "all", label: "Semua" },
    { value: "accepted", label: "Diterima" },
    { value: "proposed", label: "Diusulkan" },
    { value: "deprecated", label: "Usang" },
  ];

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
                / Keputusan Arsitektural (ADR)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/memories"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Memori
            </Link>
            <Link
              href="/collections"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Koleksi
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
              <span>Catat ADR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Column: Filter & Decision List */}
        <section
          aria-label="Decisions Explorer"
          className="w-full md:w-80 lg:w-96 flex flex-col gap-4 flex-shrink-0"
        >
          {/* Project Scope Filter */}
          <div className="space-y-1.5">
            <label htmlFor="decision-scope-filter" className="text-xs font-mono text-archive-muted flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-archive-accent" />
              <span>Filter Berdasarkan Scope Proyek</span>
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

          {/* ADR Status Filter */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-archive-muted">Status:</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedStatus(opt.value)}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  selectedStatus === opt.value
                    ? "bg-archive-card border border-archive-accent text-archive-accent font-semibold"
                    : "text-archive-muted hover:text-archive-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Decision Cards */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {decisions.length === 0 ? (
              <div className="p-8 text-center rounded border border-archive-border bg-archive-card/40">
                <GitBranch className="w-8 h-8 text-archive-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-mono text-archive-secondary">Belum ada keputusan tercatat</p>
                <p className="text-[11px] text-archive-muted mt-1">
                  Catat keputusan arsitektural untuk melacak pertimbangan teknis.
                </p>
              </div>
            ) : (
              decisions.map((d) => {
                const isSelected = d.id === selectedDecisionId;
                const project = projects.find((p) => p.id === d.projectScopeId);
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDecisionId(d.id)}
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
                      {renderStatusBadge(d.status)}
                    </div>

                    <h3 className="text-xs font-medium text-archive-primary line-clamp-1 font-mono">
                      {d.title}
                    </h3>
                    <p className="text-[11px] text-archive-secondary line-clamp-2 mt-1 leading-relaxed">
                      {d.decisionText}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-archive-border/40 text-[10px] font-mono text-archive-muted">
                      <span>{d.relatedMemoryIds.length} Memori Tertaut</span>
                      <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Decision Detail Inspector */}
        <main
          id="main-content"
          aria-label="Decision Detail Inspector"
          className="flex-1 flex flex-col border border-archive-border rounded-lg bg-archive-card overflow-hidden min-h-[500px]"
        >
          {!activeDecision ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <GitBranch className="w-12 h-12 text-archive-muted/40 mb-3" />
              <h2 className="text-sm font-semibold text-archive-secondary font-mono">
                Pilih Catatan Keputusan untuk Diperiksa
              </h2>
              <p className="text-xs text-archive-muted max-w-sm mt-1">
                Lihat konteks, trade-off, dan memori teknis yang tertaut secara deterministik.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-archive-border bg-archive-subtle/30">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(activeDecision.status)}
                    <span className="text-xs font-mono text-archive-muted">
                      Scope: {activeScope?.name || activeDecision.projectScopeId}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-archive-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(activeDecision.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-archive-primary tracking-tight font-mono">
                  {activeDecision.title}
                </h1>
              </div>

              {/* Context Section */}
              <div className="p-6 border-b border-archive-border space-y-2">
                <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted">
                  Konteks & Latar Belakang Masalah
                </h2>
                <div className="p-3.5 rounded bg-archive-subtle/40 border border-archive-border font-mono text-xs md:text-sm text-archive-secondary leading-relaxed">
                  {activeDecision.context}
                </div>
              </div>

              {/* Decision Text Section */}
              <div className="p-6 border-b border-archive-border space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-archive-emerald" />
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-emerald font-semibold">
                    Keputusan yang Diambil
                  </h2>
                </div>
                <div className="p-4 rounded-lg bg-archive-bg border border-archive-border font-mono text-xs md:text-sm text-archive-primary leading-relaxed whitespace-pre-wrap">
                  {activeDecision.decisionText}
                </div>
              </div>

              {/* Consequences Section */}
              {activeDecision.consequences && (
                <div className="p-6 border-b border-archive-border space-y-2">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted">
                    Konsekuensi & Trade-off
                  </h2>
                  <div className="p-3.5 rounded bg-archive-subtle/40 border border-archive-border font-mono text-xs md:text-sm text-archive-secondary leading-relaxed">
                    {activeDecision.consequences}
                  </div>
                </div>
              )}

              {/* Grounding Memories Section */}
              <div className="p-6 flex-1 bg-archive-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <Archive className="w-4 h-4 text-archive-accent" />
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted">
                    Memori Teknis Tertaut ({activeDecision.relatedMemoryIds.length})
                  </h2>
                </div>

                {activeDecision.relatedMemoryIds.length === 0 ? (
                  <p className="text-xs font-mono text-archive-muted italic">
                    Belum ada memori teknis yang ditautkan ke ADR ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeDecision.relatedMemoryIds.map((mId) => {
                      const mem = memories.find((m) => m.id === mId);
                      return (
                        <div
                          key={mId}
                          className="p-3 rounded border border-archive-border bg-archive-subtle/50 flex items-center justify-between gap-3 text-xs font-mono"
                        >
                          <div>
                            <span className="font-semibold text-archive-primary block">
                              {mem ? mem.title : `Memori: ${mId}`}
                            </span>
                            {mem && (
                              <span className="text-[11px] text-archive-muted">
                                v{mem.currentVersion} • {(mem.confidence * 100).toFixed(0)}% keyakinan
                              </span>
                            )}
                          </div>
                          <Link
                            href="/memories"
                            className="text-archive-accent hover:underline inline-flex items-center gap-1 text-[11px]"
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

      {/* Record ADR Modal */}
      <CreateDecisionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshDecisions}
        projectScopes={projects}
        availableMemories={memories}
        availableSources={sources}
        initialProjectScopeId={selectedProjectId === "all" ? projects[0]?.id : selectedProjectId}
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

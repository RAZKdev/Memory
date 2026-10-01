"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Memory, MemoryVersion, ProjectScope, SourceReference, Source } from "@/domain/types";
import { CreateMemoryModal } from "./CreateMemoryModal";
import { ReviseMemoryModal } from "./ReviseMemoryModal";
import { HybridSearchModal } from "./HybridSearchModal";
import {
  Archive,
  Plus,
  Search,
  History,
  BookOpen,
  GitBranch,
  Shield,
  Layers,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

interface MemoryWorkspaceProps {
  initialProjects: ProjectScope[];
  initialMemories: Memory[];
}

interface ResolvedSourceRef extends SourceReference {
  source?: Source | null;
}

export function MemoryWorkspace({
  initialProjects,
  initialMemories,
}: MemoryWorkspaceProps) {
  const [projects] = useState<ProjectScope[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(
    initialMemories[0]?.id || null
  );

  // Inspector details for the active memory
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [versions, setVersions] = useState<MemoryVersion[]>([]);
  const [sourceRefs, setSourceRefs] = useState<ResolvedSourceRef[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReviseOpen, setIsReviseOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch memory list with filter
  async function refreshMemories() {
    try {
      const params = new URLSearchParams();
      if (selectedProjectId !== "all") {
        params.set("projectScopeId", selectedProjectId);
      }
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      const res = await fetch(`/api/memories?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setMemories(json.data || []);
        if (json.data && json.data.length > 0) {
          // If previous selection is no longer in list, pick the first
          if (!json.data.some((m: Memory) => m.id === selectedMemoryId)) {
            setSelectedMemoryId(json.data[0].id);
          }
        } else {
          setSelectedMemoryId(null);
          setActiveMemory(null);
        }
      }
    } catch (e) {
      console.error("Failed to refresh memories:", e);
    }
  }

  // Load details whenever selectedMemoryId changes
  useEffect(() => {
    if (!selectedMemoryId) {
      setActiveMemory(null);
      setVersions([]);
      setSourceRefs([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    fetch(`/api/memories/${selectedMemoryId}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data) {
          setActiveMemory(json.data.memory);
          setVersions(json.data.versions || []);
          setSourceRefs(json.data.sources || []);
        }
      })
      .catch((err) => console.error("Error loading memory details:", err))
      .finally(() => {
        if (isMounted) setIsLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMemoryId]);

  // Refresh list when filter or search changes
  useEffect(() => {
    refreshMemories();
  }, [selectedProjectId, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-archive-bg text-archive-primary">
      {/* Top Header / App Bar */}
      <header className="border-b border-archive-border bg-archive-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-archive-accent/40 bg-archive-subtle flex items-center justify-center text-archive-accent">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-archive-primary tracking-wide text-sm font-mono">
                MemoryVault
              </span>
              <span className="ml-2 text-xs font-mono text-archive-muted">
                / Technical Context Archive
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/decisions"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              ADRs & Decisions
            </Link>
            <Link
              href="/collections"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Collections
            </Link>
            <Link
              href="/projects"
              className="text-xs font-mono text-archive-secondary hover:text-archive-primary px-2.5 py-1.5 rounded transition-colors"
            >
              Projects
            </Link>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-archive-subtle hover:bg-archive-border border border-archive-border text-archive-secondary hover:text-archive-primary rounded text-xs font-mono transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-archive-muted" />
              <span>Hybrid Search</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-archive-accent hover:bg-archive-accentHover text-archive-bg rounded text-xs font-semibold font-mono transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Memory</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Column: Scope Filters & Memory List */}
        <section
          aria-label="Memories Explorer"
          className="w-full md:w-80 lg:w-96 flex flex-col gap-4 flex-shrink-0"
        >
          {/* Project Scope Filter Pills */}
          <div className="space-y-1.5">
            <label htmlFor="scope-selector" className="text-xs font-mono text-archive-muted flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-archive-accent" />
              <span>Project Scope Boundary</span>
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
                All Scopes
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

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-archive-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search context, tags, decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-archive-subtle border border-archive-border rounded text-xs text-archive-primary placeholder-archive-muted focus:border-archive-accent outline-none"
            />
          </div>

          {/* Memory List Count */}
          <div className="flex items-center justify-between text-xs font-mono text-archive-muted px-1">
            <span>{memories.length} item{memories.length === 1 ? "" : "s"} preserved</span>
            <span className="text-archive-emerald">Audit Verified</span>
          </div>

          {/* Memory Cards */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {memories.length === 0 ? (
              <div className="p-8 text-center rounded border border-archive-border bg-archive-card/40">
                <Archive className="w-8 h-8 text-archive-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-mono text-archive-secondary">No memories found</p>
                <p className="text-[11px] text-archive-muted mt-1">
                  Adjust filters or preserve a new technical decision.
                </p>
              </div>
            ) : (
              memories.map((m) => {
                const isSelected = m.id === selectedMemoryId;
                const project = projects.find((p) => p.id === m.projectScopeId);
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMemoryId(m.id)}
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
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-archive-card border border-archive-border text-archive-accent font-semibold">
                        v{m.currentVersion}
                      </span>
                    </div>

                    <h3 className="text-xs font-medium text-archive-primary line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-[11px] text-archive-secondary line-clamp-2 mt-1 leading-relaxed">
                      {m.summary || m.content}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-archive-border/40 text-[10px] font-mono text-archive-muted">
                      <span>{(m.confidence * 100).toFixed(0)}% conf.</span>
                      <div className="flex gap-1 overflow-hidden">
                        {m.tags.slice(0, 2).map((t) => (
                          <span key={t} className="px-1 py-0.5 rounded bg-archive-subtle border border-archive-border">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Memory Detail Inspector & Version History */}
        <main
          id="main-content"
          aria-label="Memory Detail Inspector"
          className="flex-1 flex flex-col border border-archive-border rounded-lg bg-archive-card overflow-hidden min-h-[500px]"
        >
          {isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <span className="text-xs font-mono text-archive-muted animate-pulse">
                Loading memory context...
              </span>
            </div>
          ) : !activeMemory ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="w-12 h-12 text-archive-muted/40 mb-3" />
              <h2 className="text-sm font-semibold text-archive-secondary font-mono">
                Select a Memory to Inspect
              </h2>
              <p className="text-xs text-archive-muted max-w-sm mt-1">
                View immutable version history, provenance citations, and linked project scope boundaries.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Header Inspector */}
              <div className="p-6 border-b border-archive-border bg-archive-subtle/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-archive-accent/10 border border-archive-accent/30 text-archive-accent font-semibold">
                      Version {activeMemory.currentVersion}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-archive-emerald/10 border border-archive-emerald/30 text-archive-emerald">
                      {(activeMemory.confidence * 100).toFixed(0)}% Confidence
                    </span>
                    <span className="text-xs font-mono text-archive-muted uppercase tracking-wider">
                      Status: {activeMemory.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReviseOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-archive-subtle hover:bg-archive-border border border-archive-border rounded text-xs font-mono text-archive-primary transition-colors cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-archive-accent" />
                    <span>Revise Memory (v{activeMemory.currentVersion + 1})</span>
                  </button>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-archive-primary tracking-tight font-mono">
                  {activeMemory.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-archive-muted mt-3">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {activeMemory.authorId}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {new Date(activeMemory.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Scope: {activeMemory.projectScopeId}
                  </span>
                </div>

                {activeMemory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-archive-border/40">
                    {activeMemory.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-archive-card border border-archive-border text-archive-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Memory Canonical Content */}
              <div className="p-6 border-b border-archive-border">
                <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted mb-3">
                  Preserved Technical Context
                </h2>
                <div className="p-4 rounded-lg bg-archive-bg border border-archive-border font-mono text-xs md:text-sm text-archive-primary leading-relaxed whitespace-pre-wrap">
                  {activeMemory.content}
                </div>
              </div>

              {/* Source Provenance Citations */}
              <div className="p-6 border-b border-archive-border">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-archive-accent" />
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted">
                    Source Provenance ({sourceRefs.length})
                  </h2>
                </div>

                {sourceRefs.length === 0 ? (
                  <p className="text-xs font-mono text-archive-muted italic">
                    No external source citations attached to this memory.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sourceRefs.map((ref) => (
                      <div
                        key={ref.id}
                        className="p-3 rounded bg-archive-subtle/50 border border-archive-border text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-archive-primary font-mono">
                            {ref.source?.title || "Referenced Source"}
                          </span>
                          {ref.source?.uri && (
                            <a
                              href={ref.source.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-archive-accent hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span>View Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {ref.locationReference && (
                          <span className="inline-block text-[11px] font-mono text-archive-muted mb-1">
                            Ref: {ref.locationReference}
                          </span>
                        )}
                        {ref.citationSnippet && (
                          <blockquote className="mt-1 pl-2.5 border-l-2 border-archive-accent/50 text-[11px] font-mono text-archive-secondary italic">
                            &quot;{ref.citationSnippet}&quot;
                          </blockquote>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Immutable Version History Timeline */}
              <div className="p-6 flex-1 bg-archive-card/50">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-archive-accent" />
                  <h2 className="text-xs font-mono uppercase tracking-wider text-archive-muted">
                    Immutable Version History ({versions.length})
                  </h2>
                </div>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-archive-border">
                  {versions.map((ver) => (
                    <div key={ver.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-archive-accent border-2 border-archive-card ring-2 ring-archive-border" />

                      <div className="p-3.5 rounded border border-archive-border bg-archive-subtle/40 hover:border-archive-borderHover transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-archive-primary">
                              Version {ver.versionNumber}
                            </span>
                            <span className="text-[11px] font-mono text-archive-muted">
                              by {ver.authorId}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-archive-muted">
                            {new Date(ver.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs font-mono text-archive-accent mb-2">
                          Reason: {ver.reasonForChange}
                        </div>

                        <div className="text-xs text-archive-secondary bg-archive-card p-2 rounded border border-archive-border/60 line-clamp-2 font-mono">
                          {ver.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Creation Modal */}
      <CreateMemoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshMemories}
        projectScopes={projects}
        initialProjectScopeId={selectedProjectId === "all" ? projects[0]?.id : selectedProjectId}
      />

      {/* Revision Modal */}
      <ReviseMemoryModal
        isOpen={isReviseOpen}
        onClose={() => setIsReviseOpen(false)}
        onSuccess={() => {
          refreshMemories();
          // Trigger reload of details for active memory
          if (selectedMemoryId) {
            const currentId = selectedMemoryId;
            setSelectedMemoryId(null);
            setTimeout(() => setSelectedMemoryId(currentId), 50);
          }
        }}
        memory={activeMemory}
      />

      {/* Global Hybrid Search Engine Modal */}
      <HybridSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMemory={(id) => setSelectedMemoryId(id)}
        projectScopes={projects}
      />
    </div>
  );
}

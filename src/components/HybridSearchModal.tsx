"use client";

import React, { useState, useEffect } from "react";
import { Memory, ProjectScope } from "@/domain/types";
import { SearchResult } from "@/domain/repository";
import {
  Search,
  X,
  Sparkles,
  Layers,
  BookOpen,
  ArrowRight,
  Loader2,
  Database,
  Sliders,
} from "lucide-react";

interface HybridSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMemory: (memoryId: string) => void;
  projectScopes: ProjectScope[];
}

export function HybridSearchModal({
  isOpen,
  onClose,
  onSelectMemory,
  projectScopes,
}: HybridSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedScopeId, setSelectedScopeId] = useState<string>("all");
  const [searchMode, setSearchMode] = useState<"hybrid" | "keyword" | "semantic">("hybrid");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("q", query.trim());
        params.set("mode", searchMode);
        if (selectedScopeId !== "all") {
          params.set("projectScopeId", selectedScopeId);
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedScopeId, searchMode, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Top Search Bar */}
        <div className="p-4 border-b border-archive-border flex items-center gap-3">
          <Search className="w-5 h-5 text-archive-accent flex-shrink-0" />
          <input
            id="modal-search-title"
            type="text"
            placeholder="Cari memori lintas proyek (contoh: 'Supabase RLS', 'state deterministik')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm md:text-base text-archive-primary placeholder-archive-muted outline-none font-mono"
          />
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-archive-accent animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-archive-muted hover:text-archive-primary p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <div className="h-5 w-px bg-archive-border mx-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pencarian"
            className="text-archive-muted hover:text-archive-primary p-1 rounded hover:bg-archive-subtle cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Mode Switcher & Scope Filter */}
        <div className="px-4 py-2.5 bg-archive-subtle/50 border-b border-archive-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-archive-muted mr-1">Mode Pencarian:</span>
            <button
              type="button"
              onClick={() => setSearchMode("hybrid")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                searchMode === "hybrid"
                  ? "bg-archive-accent text-archive-bg font-bold"
                  : "bg-archive-card border border-archive-border text-archive-secondary hover:text-archive-primary"
              }`}
            >
              Hybrid (Vektor + Kata Kunci)
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("semantic")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                searchMode === "semantic"
                  ? "bg-archive-accent text-archive-bg font-bold"
                  : "bg-archive-card border border-archive-border text-archive-secondary hover:text-archive-primary"
              }`}
            >
              Vektor Semantik
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("keyword")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                searchMode === "keyword"
                  ? "bg-archive-accent text-archive-bg font-bold"
                  : "bg-archive-card border border-archive-border text-archive-secondary hover:text-archive-primary"
              }`}
            >
              Kata Kunci Persis
            </button>
          </div>

          {/* Scope Dropdown */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-archive-muted" />
            <select
              value={selectedScopeId}
              onChange={(e) => setSelectedScopeId(e.target.value)}
              className="bg-archive-card border border-archive-border rounded px-2 py-0.5 text-archive-primary outline-none cursor-pointer"
            >
              <option value="all">Semua Scope Proyek</option>
              {projectScopes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-archive-muted">
              <Database className="w-10 h-10 mb-2 opacity-40 text-archive-accent" />
              <p className="text-xs font-mono">
                Pencarian Hybrid menggabungkan kesamaan kosinus pgvector dengan peringkat leksikal full-text.
              </p>
              <p className="text-[11px] text-archive-muted/70 mt-1">
                Ketik istilah pencarian di atas untuk memulai perangkingan.
              </p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-archive-muted font-mono text-xs">
              Tidak ada memori yang cocok ditemukan untuk &quot;{query}&quot; pada mode &apos;{searchMode}&apos;.
            </div>
          ) : (
            results.map((item) => {
              const mem = item.memory;
              const percent = Math.round(item.score * 100);
              return (
                <div
                  key={mem.id}
                  onClick={() => {
                    onSelectMemory(mem.id);
                    onClose();
                  }}
                  className="p-4 rounded border border-archive-border bg-archive-card hover:border-archive-accent hover:bg-archive-subtle/50 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-archive-accent/10 border border-archive-accent/30 text-archive-accent font-semibold">
                        {percent}% Relevansi
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-archive-subtle border border-archive-border text-archive-secondary uppercase">
                        {item.matchType}
                      </span>
                      <span className="text-[10px] font-mono text-archive-muted">
                        Scope: {mem.projectScopeId}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-archive-muted">
                      v{mem.currentVersion}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-archive-primary font-mono group-hover:text-archive-accent transition-colors">
                    {mem.title}
                  </h3>
                  <p className="text-xs text-archive-secondary line-clamp-2 mt-1 leading-relaxed">
                    {mem.summary || mem.content}
                  </p>

                  {/* Attached Citations preview */}
                  {item.sourceReferences && item.sourceReferences.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-archive-border/40 flex items-center gap-2 text-[11px] font-mono text-archive-muted">
                      <BookOpen className="w-3 h-3 text-archive-accent" />
                      <span className="truncate">
                        Sitasi: {item.sourceReferences[0].citationSnippet || item.sourceReferences[0].locationReference || "Sumber Eksternal"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-archive-border bg-archive-subtle/30 flex items-center justify-between text-[11px] font-mono text-archive-muted">
          <span>Mesin Vektor Turunan: Unit Hypersphere 128-dimensi</span>
          <span>Tekan ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Decision, Memory, ProjectScope } from "@/domain/types";
import { X, Layers, AlertCircle, Loader2, GitBranch, Archive } from "lucide-react";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectScopes: ProjectScope[];
  availableMemories: Memory[];
  availableDecisions: Decision[];
  initialProjectScopeId?: string;
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onSuccess,
  projectScopes,
  availableMemories,
  availableDecisions,
  initialProjectScopeId,
}: CreateCollectionModalProps) {
  const [projectScopeId, setProjectScopeId] = useState(
    initialProjectScopeId || (projectScopes[0]?.id ?? "")
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Judul koleksi wajib diisi.");
      return;
    }
    if (!projectScopeId) {
      setErrorMessage("Scope proyek wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectScopeId,
          title: title.trim(),
          description: description.trim() || undefined,
          memoryIds: selectedMemoryIds,
          decisionIds: selectedDecisionIds,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat koleksi");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diharapkan");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleMemory(id: string) {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  }

  function toggleDecision(id: string) {
    setSelectedDecisionIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-col-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-archive-accent" />
            <div>
              <h2 id="modal-col-title" className="text-base font-semibold text-archive-primary font-mono">
                Buat Koleksi Tematik
              </h2>
              <p className="text-xs text-archive-muted">
                Kelompokkan memori dan ADR untuk injeksi prompt AI yang terarah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal koleksi"
            className="text-archive-secondary hover:text-archive-primary p-1.5 rounded hover:bg-archive-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-archive-rose/10 border border-archive-rose/30 rounded text-xs text-archive-rose flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project Scope */}
          <div>
            <label htmlFor="col-project-scope" className="block text-xs font-mono text-archive-secondary mb-1">
              Scope Proyek *
            </label>
            <select
              id="col-project-scope"
              value={projectScopeId}
              onChange={(e) => setProjectScopeId(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              required
            >
              {projectScopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.name} ({scope.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="col-title" className="block text-xs font-mono text-archive-secondary mb-1">
              Judul Koleksi *
            </label>
            <input
              id="col-title"
              type="text"
              placeholder="contoh: Fondasi Invarian & Keamanan Agentic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="col-description" className="block text-xs font-mono text-archive-secondary mb-1">
              Deskripsi & Tujuan Koleksi
            </label>
            <textarea
              id="col-description"
              rows={2}
              placeholder="Jelaskan fokus koleksi ini (misal: aturan determinisme state, integrasi RLS)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
            />
          </div>

          {/* ADR Selection Checklist */}
          {availableDecisions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <GitBranch className="w-3.5 h-3.5 text-archive-accent" />
                <span className="text-xs font-mono text-archive-secondary">
                  Sertakan Keputusan ADR ({availableDecisions.length})
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto p-2 rounded bg-archive-subtle/50 border border-archive-border space-y-1.5">
                {availableDecisions.map((dec) => {
                  const isChecked = selectedDecisionIds.includes(dec.id);
                  return (
                    <label
                      key={dec.id}
                      className="flex items-center gap-2 text-xs text-archive-primary cursor-pointer hover:bg-archive-card p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDecision(dec.id)}
                        className="rounded border-archive-border text-archive-accent focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate font-mono">{dec.title}</span>
                      <span className="text-[10px] text-archive-emerald uppercase font-mono ml-auto">
                        {dec.status}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Memory Selection Checklist */}
          {availableMemories.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Archive className="w-3.5 h-3.5 text-archive-accent" />
                <span className="text-xs font-mono text-archive-secondary">
                  Sertakan Memori Teknis ({availableMemories.length})
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto p-2 rounded bg-archive-subtle/50 border border-archive-border space-y-1.5">
                {availableMemories.map((mem) => {
                  const isChecked = selectedMemoryIds.includes(mem.id);
                  return (
                    <label
                      key={mem.id}
                      className="flex items-center gap-2 text-xs text-archive-primary cursor-pointer hover:bg-archive-card p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMemory(mem.id)}
                        className="rounded border-archive-border text-archive-accent focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate font-mono">{mem.title}</span>
                      <span className="text-[10px] text-archive-muted font-mono ml-auto">
                        v{mem.currentVersion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-archive-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-archive-secondary hover:text-archive-primary rounded border border-archive-border hover:bg-archive-subtle transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-archive-bg bg-archive-accent hover:bg-archive-accentHover rounded font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? "Membuat..." : "Buat Koleksi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

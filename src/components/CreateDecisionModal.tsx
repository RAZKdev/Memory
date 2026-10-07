"use client";

import React, { useState } from "react";
import { Memory, ProjectScope, Source } from "@/domain/types";
import { X, GitBranch, AlertCircle, Loader2 } from "lucide-react";

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectScopes: ProjectScope[];
  availableMemories: Memory[];
  availableSources: Source[];
  initialProjectScopeId?: string;
  initialMemoryId?: string;
}

export function CreateDecisionModal({
  isOpen,
  onClose,
  onSuccess,
  projectScopes,
  availableMemories,
  availableSources,
  initialProjectScopeId,
  initialMemoryId,
}: CreateDecisionModalProps) {
  const [projectScopeId, setProjectScopeId] = useState(
    initialProjectScopeId || (projectScopes[0]?.id ?? "")
  );
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [consequences, setConsequences] = useState("");
  const [status, setStatus] = useState<"proposed" | "accepted" | "rejected" | "deprecated">("accepted");
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>(
    initialMemoryId ? [initialMemoryId] : []
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Judul keputusan wajib diisi.");
      return;
    }
    if (!context.trim()) {
      setErrorMessage("Konteks masalah wajib diisi.");
      return;
    }
    if (!decisionText.trim()) {
      setErrorMessage("Teks keputusan arsitektur wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectScopeId,
          title: title.trim(),
          context: context.trim(),
          decisionText: decisionText.trim(),
          consequences: consequences.trim() || undefined,
          status,
          relatedMemoryIds: selectedMemoryIds,
          sourceIds: selectedSourceIds,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat catatan keputusan");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diharapkan");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleMemorySelection(id: string) {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  }

  function toggleSourceSelection(id: string) {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-decision-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-archive-accent" />
            <div>
              <h2 id="modal-decision-title" className="text-base font-semibold text-archive-primary font-mono">
                Catat Keputusan Arsitektur (ADR)
              </h2>
              <p className="text-xs text-archive-muted">
                Dokumentasikan pilihan arsitektur beserta konteks, alasan, dan konsekuensinya.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal keputusan"
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

          {/* Project Scope & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="decision-project-scope" className="block text-xs font-mono text-archive-secondary mb-1">
                Scope Proyek *
              </label>
              <select
                id="decision-project-scope"
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

            <div>
              <label htmlFor="decision-status" className="block text-xs font-mono text-archive-secondary mb-1">
                Status Keputusan
              </label>
              <select
                id="decision-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              >
                <option value="accepted">Diterima (Accepted)</option>
                <option value="proposed">Diusulkan (Proposed)</option>
                <option value="rejected">Ditolak (Rejected)</option>
                <option value="deprecated">Usang (Deprecated)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="decision-title" className="block text-xs font-mono text-archive-secondary mb-1">
              Judul Keputusan *
            </label>
            <input
              id="decision-title"
              type="text"
              placeholder="contoh: ADR-002: Dual-Mode Persistence Strategy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              required
            />
          </div>

          {/* Context */}
          <div>
            <label htmlFor="decision-context" className="block text-xs font-mono text-archive-secondary mb-1">
              Konteks (Mengapa keputusan ini diperlukan?) *
            </label>
            <textarea
              id="decision-context"
              rows={3}
              placeholder="Jelaskan latar belakang, ketegangan teknis, dan masalah yang dihadapi..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
              required
            />
          </div>

          {/* Decision Text */}
          <div>
            <label htmlFor="decision-text" className="block text-xs font-mono text-archive-secondary mb-1">
              Keputusan Arsitektur (Apa yang diputuskan?) *
            </label>
            <textarea
              id="decision-text"
              rows={3}
              placeholder="Tuliskan keputusan yang disepakati secara eksplisit..."
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
              required
            />
          </div>

          {/* Consequences */}
          <div>
            <label htmlFor="decision-consequences" className="block text-xs font-mono text-archive-secondary mb-1">
              Konsekuensi & Trade-off
            </label>
            <textarea
              id="decision-consequences"
              rows={2}
              placeholder="Dampak positif, trade-off, dan batasan setelah keputusan diterapkan..."
              value={consequences}
              onChange={(e) => setConsequences(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
            />
          </div>

          {/* Memory Linking Checklist */}
          {availableMemories.length > 0 && (
            <div>
              <span className="block text-xs font-mono text-archive-secondary mb-1.5">
                Tautkan ke Memori Teknis (Opsional)
              </span>
              <div className="max-h-32 overflow-y-auto p-2 rounded bg-archive-subtle/50 border border-archive-border space-y-1.5">
                {availableMemories.map((m) => {
                  const isChecked = selectedMemoryIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 text-xs text-archive-primary cursor-pointer hover:bg-archive-card p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMemorySelection(m.id)}
                        className="rounded border-archive-border text-archive-accent focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate font-mono">{m.title}</span>
                      <span className="text-[10px] text-archive-muted font-mono ml-auto">
                        v{m.currentVersion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Source References Checklist */}
          {availableSources.length > 0 && (
            <div>
              <span className="block text-xs font-mono text-archive-secondary mb-1.5">
                Tautkan ke Sumber Sitasi (Opsional)
              </span>
              <div className="max-h-28 overflow-y-auto p-2 rounded bg-archive-subtle/50 border border-archive-border space-y-1.5">
                {availableSources.map((s) => {
                  const isChecked = selectedSourceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 text-xs text-archive-primary cursor-pointer hover:bg-archive-card p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSourceSelection(s.id)}
                        className="rounded border-archive-border text-archive-accent focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate font-mono">{s.title}</span>
                      <span className="text-[10px] text-archive-muted font-mono uppercase ml-auto">
                        {s.type}
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
              <span>{isLoading ? "Menyimpan..." : "Simpan Keputusan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

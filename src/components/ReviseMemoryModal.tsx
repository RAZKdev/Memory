"use client";

import React, { useState } from "react";
import { Memory } from "@/domain/types";
import { X, AlertCircle, Loader2, GitCommit } from "lucide-react";

interface ReviseMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memory: Memory | null;
}

export function ReviseMemoryModal({
  isOpen,
  onClose,
  onSuccess,
  memory,
}: ReviseMemoryModalProps) {
  const [title, setTitle] = useState(memory?.title || "");
  const [content, setContent] = useState(memory?.content || "");
  const [confidence, setConfidence] = useState(memory?.confidence ?? 1.0);
  const [tags, setTags] = useState(memory?.tags.join(", ") || "");
  const [authorId, setAuthorId] = useState("lead-architect");
  const [reasonForChange, setReasonForChange] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if memory changes
  React.useEffect(() => {
    if (memory) {
      setTitle(memory.title);
      setContent(memory.content);
      setConfidence(memory.confidence);
      setTags(memory.tags.join(", "));
      setReasonForChange("");
    }
  }, [memory]);

  if (!isOpen || !memory) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!reasonForChange.trim()) {
      setErrorMessage("Ketentuan Audit: alasan revisi tidak boleh kosong.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("Konten revisi tidak boleh kosong.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/memories/${memory?.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          confidence,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          authorId: authorId.trim() || "anonymous-engineer",
          reasonForChange: reasonForChange.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal merevisi memori");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diharapkan");
    } finally {
      setIsLoading(false);
    }
  }

  const nextVersion = memory.currentVersion + 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-revise-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-archive-accent" />
            <div>
              <h2 id="modal-revise-title" className="text-base font-semibold text-archive-primary font-mono">
                Revisi Memori (v{memory.currentVersion} → v{nextVersion})
              </h2>
              <p className="text-xs text-archive-muted">
                Mempertahankan versi sebelumnya dan membuat snapshot audit yang kekal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal revisi"
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

          {/* Mandatory Reason For Change */}
          <div className="p-3 bg-archive-accent/5 border border-archive-accent/30 rounded">
            <label htmlFor="revise-reason" className="block text-xs font-mono text-archive-accent mb-1 font-semibold">
              Alasan Revisi (Wajib untuk Audit) *
            </label>
            <input
              id="revise-reason"
              type="text"
              placeholder="contoh: Diperbarui dengan rekomendasi indeks pgvector HNSW setelah benchmark"
              value={reasonForChange}
              onChange={(e) => setReasonForChange(e.target.value)}
              className="w-full bg-archive-card border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="revise-title" className="block text-xs font-mono text-archive-secondary mb-1">
              Judul
            </label>
            <input
              id="revise-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="revise-content" className="block text-xs font-mono text-archive-secondary mb-1">
              Konten Revisi *
            </label>
            <textarea
              id="revise-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
              required
            />
          </div>

          {/* Confidence Slider & Author */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-archive-secondary mb-1">
                <label htmlFor="revise-confidence">Skor Keyakinan: {(confidence * 100).toFixed(0)}%</label>
              </div>
              <input
                id="revise-confidence"
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-archive-accent cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="revise-author" className="block text-xs font-mono text-archive-secondary mb-1">
                ID Penulis Revisi
              </label>
              <input
                id="revise-author"
                type="text"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="revise-tags" className="block text-xs font-mono text-archive-secondary mb-1">
              Tag
            </label>
            <input
              id="revise-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
            />
          </div>

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
              <span>{isLoading ? "Menyimpan Revisi..." : `Simpan Revisi v${nextVersion}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

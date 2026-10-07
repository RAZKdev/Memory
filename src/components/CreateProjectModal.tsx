"use client";

import React, { useState } from "react";
import { X, FolderPlus, AlertCircle, Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleNameChange(val: string) {
    setName(val);
    const derivedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(derivedSlug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Nama proyek wajib diisi.");
      return;
    }
    if (!slug.trim()) {
      setErrorMessage("Slug proyek wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat scope proyek");
      }

      setName("");
      setSlug("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diharapkan");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border bg-archive-subtle/40">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-archive-accent" />
            <div>
              <h2 id="modal-project-title" className="text-base font-semibold text-archive-primary font-mono">
                Buat Scope Proyek
              </h2>
              <p className="text-xs text-archive-muted">
                Menetapkan batasan domain privat untuk memori teknis dan ADR.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal proyek"
            className="text-archive-secondary hover:text-archive-primary p-1.5 rounded hover:bg-archive-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-archive-rose/10 border border-archive-rose/30 rounded text-xs text-archive-rose flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-xs font-mono text-archive-secondary mb-1">
              Nama Proyek *
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="contoh: Agentic Architecture Foundation"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="project-slug" className="block text-xs font-mono text-archive-secondary mb-1">
              Slug (Pengenal Kanonikal) *
            </label>
            <input
              id="project-slug"
              type="text"
              placeholder="agentic-architecture"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
              required
            />
            <span className="text-[10px] text-archive-muted font-mono mt-1 block">
              Format URL aman, hanya huruf kecil, angka, dan tanda hubung (-).
            </span>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="project-desc" className="block text-xs font-mono text-archive-secondary mb-1">
              Deskripsi Scope
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Fokus arsitektur, batasan domain, dan catatan scope ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
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
              <span>{isLoading ? "Membuat..." : "Buat Scope"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

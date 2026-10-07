"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, AlertCircle, Loader2, Lock, Users, Globe2 } from "lucide-react";
import { AccessPolicy, AccessPolicyLevel, ProjectScope } from "@/domain/types";

interface AccessPolicyModalProps {
  isOpen: boolean;
  project: ProjectScope | null;
  allProjects: ProjectScope[];
  currentPolicy: AccessPolicy | null;
  onClose: () => void;
  onSuccess: (updatedPolicy: AccessPolicy) => void;
}

export function AccessPolicyModal({
  isOpen,
  project,
  allProjects,
  currentPolicy,
  onClose,
  onSuccess,
}: AccessPolicyModalProps) {
  const [level, setLevel] = useState<AccessPolicyLevel>("private");
  const [allowedProjectIds, setAllowedProjectIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentPolicy) {
      setLevel(currentPolicy.level);
      setAllowedProjectIds(currentPolicy.allowedProjectIds || []);
      setDescription(currentPolicy.description || "");
    } else {
      setLevel("private");
      setAllowedProjectIds([]);
      setDescription("Kebijakan isolasi privat default");
    }
    setErrorMessage(null);
  }, [currentPolicy, isOpen]);

  if (!isOpen || !project) return null;

  const otherProjects = allProjects.filter((p) => p.id !== project.id);

  function handleToggleAllowedProject(id: string) {
    setAllowedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/projects/${project?.id}/policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          allowedProjectIds: level === "shared_read" ? allowedProjectIds : [],
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memperbarui kebijakan akses");
      }

      onSuccess(json.data);
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
      aria-labelledby="modal-policy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border bg-archive-subtle/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-archive-emerald" />
            <div>
              <h2 id="modal-policy-title" className="text-base font-semibold text-archive-primary font-mono">
                Tata Kelola Kebijakan Akses
              </h2>
              <p className="text-xs text-archive-muted">
                Konfigurasi batasan isolasi untuk &quot;{project.name}&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kebijakan"
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

          {/* Policy Level Options */}
          <div className="space-y-2.5">
            <label className="block text-xs font-mono text-archive-secondary">
              Tingkat Isolasi (Isolation Level)
            </label>

            {/* Private Option */}
            <label
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                level === "private"
                  ? "bg-archive-amber/5 border-archive-amber/40"
                  : "bg-archive-subtle/40 border-archive-border hover:bg-archive-subtle"
              }`}
            >
              <input
                type="radio"
                name="policy-level"
                value="private"
                checked={level === "private"}
                onChange={() => setLevel("private")}
                className="mt-1 accent-archive-amber cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-archive-primary">
                  <Lock className="w-3.5 h-3.5 text-archive-amber" />
                  <span>Privat (Isolasi Ketat)</span>
                </div>
                <p className="text-[11px] text-archive-muted mt-0.5">
                  Hanya kueri dan prompt dalam scope ini yang dapat mengakses memori & ADR.
                </p>
              </div>
            </label>

            {/* Project Internal Option */}
            <label
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                level === "project_internal"
                  ? "bg-archive-accent/5 border-archive-accent/40"
                  : "bg-archive-subtle/40 border-archive-border hover:bg-archive-subtle"
              }`}
            >
              <input
                type="radio"
                name="policy-level"
                value="project_internal"
                checked={level === "project_internal"}
                onChange={() => setLevel("project_internal")}
                className="mt-1 accent-archive-accent cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-archive-primary">
                  <Users className="w-3.5 h-3.5 text-archive-accent" />
                  <span>Internal Proyek</span>
                </div>
                <p className="text-[11px] text-archive-muted mt-0.5">
                  Dapat diakses oleh agen yang diotorisasi dalam grup proyek internal yang sama.
                </p>
              </div>
            </label>

            {/* Shared Read Option */}
            <label
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                level === "shared_read"
                  ? "bg-archive-emerald/5 border-archive-emerald/40"
                  : "bg-archive-subtle/40 border-archive-border hover:bg-archive-subtle"
              }`}
            >
              <input
                type="radio"
                name="policy-level"
                value="shared_read"
                checked={level === "shared_read"}
                onChange={() => setLevel("shared_read")}
                className="mt-1 accent-archive-emerald cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-archive-primary">
                  <Globe2 className="w-3.5 h-3.5 text-archive-emerald" />
                  <span>Berbagi Baca (Whitelist Rekan)</span>
                </div>
                <p className="text-[11px] text-archive-muted mt-0.5">
                  Izinkan scope proyek rekan yang terpilih secara eksplisit untuk membaca memori & ADR ini.
                </p>
              </div>
            </label>
          </div>

          {/* Whitelist Projects (Only if shared_read) */}
          {level === "shared_read" && (
            <div className="pt-2 border-t border-archive-border space-y-2">
              <label className="block text-xs font-mono text-archive-secondary">
                Proyek Rekan yang Diizinkan (Whitelist)
              </label>

              {otherProjects.length === 0 ? (
                <p className="text-xs text-archive-muted font-mono italic">
                  Tidak ada scope proyek lain yang tersedia untuk dimasukkan ke whitelist.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded bg-archive-subtle border border-archive-border">
                  {otherProjects.map((p) => {
                    const isChecked = allowedProjectIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-xs text-archive-primary cursor-pointer hover:bg-archive-card p-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAllowedProject(p.id)}
                          className="rounded border-archive-border text-archive-accent focus:ring-0 cursor-pointer"
                        />
                        <span className="font-mono">{p.name}</span>
                        <span className="text-[10px] text-archive-muted font-mono ml-auto">
                          {p.slug}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="policy-desc" className="block text-xs font-mono text-archive-secondary mb-1">
              Catatan Kebijakan / Deskripsi
            </label>
            <textarea
              id="policy-desc"
              rows={2}
              placeholder="Jelaskan alasan penetapan kebijakan isolasi ini..."
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
              <span>{isLoading ? "Menyimpan..." : "Simpan Kebijakan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

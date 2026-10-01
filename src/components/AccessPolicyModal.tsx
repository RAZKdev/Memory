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
      setDescription("Default private isolation policy");
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
        throw new Error(json.error || "Failed to update access policy");
      }

      onSuccess(json.data);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
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
                Access Policy Governance
              </h2>
              <p className="text-xs text-archive-muted">
                Configure isolation boundary for &quot;{project.name}&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
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

          <div>
            <label className="block text-xs font-mono text-archive-secondary mb-2">
              Isolation Level
            </label>
            <div className="space-y-2">
              {/* Private */}
              <label
                className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  level === "private"
                    ? "bg-archive-subtle border-archive-accent text-archive-primary"
                    : "bg-transparent border-archive-border text-archive-secondary hover:bg-archive-subtle/30"
                }`}
              >
                <input
                  type="radio"
                  name="policyLevel"
                  value="private"
                  checked={level === "private"}
                  onChange={() => setLevel("private")}
                  className="mt-0.5 text-archive-accent focus:ring-archive-accent"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-medium font-mono text-archive-primary">
                    <Lock className="w-3.5 h-3.5 text-archive-amber" />
                    <span>Private (Strict Isolation)</span>
                  </div>
                  <p className="text-archive-muted mt-0.5">
                    Memories and ADRs are strictly isolated. External retrieval is completely blocked.
                  </p>
                </div>
              </label>

              {/* Project Internal */}
              <label
                className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  level === "project_internal"
                    ? "bg-archive-subtle border-archive-accent text-archive-primary"
                    : "bg-transparent border-archive-border text-archive-secondary hover:bg-archive-subtle/30"
                }`}
              >
                <input
                  type="radio"
                  name="policyLevel"
                  value="project_internal"
                  checked={level === "project_internal"}
                  onChange={() => setLevel("project_internal")}
                  className="mt-0.5 text-archive-accent focus:ring-archive-accent"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-medium font-mono text-archive-primary">
                    <Users className="w-3.5 h-3.5 text-archive-accent" />
                    <span>Project Internal</span>
                  </div>
                  <p className="text-archive-muted mt-0.5">
                    Accessible to all authorized agents and components bound to this specific project scope.
                  </p>
                </div>
              </label>

              {/* Shared Read */}
              <label
                className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  level === "shared_read"
                    ? "bg-archive-subtle border-archive-accent text-archive-primary"
                    : "bg-transparent border-archive-border text-archive-secondary hover:bg-archive-subtle/30"
                }`}
              >
                <input
                  type="radio"
                  name="policyLevel"
                  value="shared_read"
                  checked={level === "shared_read"}
                  onChange={() => setLevel("shared_read")}
                  className="mt-0.5 text-archive-accent focus:ring-archive-accent"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-medium font-mono text-archive-primary">
                    <Globe2 className="w-3.5 h-3.5 text-archive-emerald" />
                    <span>Shared Read (Cross-Project Whitelist)</span>
                  </div>
                  <p className="text-archive-muted mt-0.5">
                    Allows read-only access and context injection to specific whitelisted peer projects.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Allowed Projects Selector if Shared Read */}
          {level === "shared_read" && (
            <div className="pt-2 border-t border-archive-border">
              <label className="block text-xs font-mono text-archive-secondary mb-1.5">
                Whitelisted Peer Projects
              </label>
              {otherProjects.length === 0 ? (
                <p className="text-xs text-archive-muted italic">
                  No other projects available to whitelist. Create additional scopes first.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {otherProjects.map((p) => {
                    const isChecked = allowedProjectIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded text-xs border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-archive-subtle border-archive-border text-archive-primary"
                            : "bg-transparent border-transparent hover:bg-archive-subtle/40 text-archive-secondary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAllowedProject(p.id)}
                          className="rounded text-archive-accent focus:ring-archive-accent"
                        />
                        <span className="font-mono">{p.name}</span>
                        <span className="text-[10px] text-archive-muted">({p.slug})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="policy-desc" className="block text-xs font-mono text-archive-secondary mb-1">
              Policy Notes / Justification
            </label>
            <textarea
              id="policy-desc"
              rows={2}
              placeholder="e.g. Approved for cross-service read access per RFC-012"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-archive-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-archive-secondary hover:text-archive-primary rounded border border-archive-border hover:bg-archive-subtle transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-archive-bg bg-archive-accent hover:bg-archive-accentHover rounded font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? "Saving..." : "Save Policy"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { ProjectScope } from "@/domain/types";
import { X, Plus, AlertCircle, Loader2 } from "lucide-react";

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectScopes: ProjectScope[];
  initialProjectScopeId?: string;
}

export function CreateMemoryModal({
  isOpen,
  onClose,
  onSuccess,
  projectScopes,
  initialProjectScopeId,
}: CreateMemoryModalProps) {
  const [projectScopeId, setProjectScopeId] = useState(
    initialProjectScopeId || (projectScopes[0]?.id ?? "")
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [confidence, setConfidence] = useState(1.0);
  const [tags, setTags] = useState("");
  const [authorId, setAuthorId] = useState("lead-architect");

  // Optional source citation fields
  const [withSource, setWithSource] = useState(false);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceType, setSourceType] = useState<"document" | "rfc" | "codebase" | "discussion">("rfc");
  const [sourceUri, setSourceUri] = useState("");
  const [citationSnippet, setCitationSnippet] = useState("");
  const [locationReference, setLocationReference] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("Content is required.");
      return;
    }
    if (!projectScopeId) {
      setErrorMessage("Please select a project scope.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        projectScopeId,
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        confidence,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        authorId: authorId.trim() || "anonymous-engineer",
      };

      if (withSource && sourceTitle.trim()) {
        payload.sourceTitle = sourceTitle.trim();
        payload.sourceType = sourceType;
        payload.sourceUri = sourceUri.trim() || undefined;
        payload.citationSnippet = citationSnippet.trim() || undefined;
        payload.locationReference = locationReference.trim() || undefined;
      }

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create memory");
      }

      // Reset & notify
      setTitle("");
      setContent("");
      setSummary("");
      setTags("");
      setWithSource(false);
      setSourceTitle("");
      setCitationSnippet("");
      onSuccess();
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
      aria-labelledby="modal-create-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border">
          <div>
            <h2 id="modal-create-title" className="text-base font-semibold text-archive-primary font-mono">
              Preserve Technical Memory
            </h2>
            <p className="text-xs text-archive-muted mt-0.5">
              Record a canonical context item with immutable Version 1 snapshot.
            </p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-archive-rose/10 border border-archive-rose/30 rounded text-xs text-archive-rose flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project Scope Selection */}
          <div>
            <label htmlFor="create-project-scope" className="block text-xs font-mono text-archive-secondary mb-1">
              Project Scope (Boundary) *
            </label>
            <select
              id="create-project-scope"
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
            <label htmlFor="create-title" className="block text-xs font-mono text-archive-secondary mb-1">
              Memory Title *
            </label>
            <input
              id="create-title"
              type="text"
              placeholder="e.g. Supabase Cookie Delegation Pattern"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="create-content" className="block text-xs font-mono text-archive-secondary mb-1">
              Technical Content & Context *
            </label>
            <textarea
              id="create-content"
              rows={5}
              placeholder="Describe the technical decision, pattern, or invariant in detail..."
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
                <label htmlFor="create-confidence">Confidence Score: {(confidence * 100).toFixed(0)}%</label>
              </div>
              <input
                id="create-confidence"
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
              <label htmlFor="create-author" className="block text-xs font-mono text-archive-secondary mb-1">
                Author / Engineer ID
              </label>
              <input
                id="create-author"
                type="text"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="create-tags" className="block text-xs font-mono text-archive-secondary mb-1">
              Tags (comma separated)
            </label>
            <input
              id="create-tags"
              type="text"
              placeholder="auth, supabase, security, ssr"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-archive-subtle border border-archive-border rounded px-3 py-2 text-xs text-archive-primary focus:border-archive-accent outline-none"
            />
          </div>

          {/* Source Provenance Toggle */}
          <div className="pt-2 border-t border-archive-border">
            <button
              type="button"
              onClick={() => setWithSource(!withSource)}
              className="inline-flex items-center gap-2 text-xs font-mono text-archive-accent hover:text-archive-accentHover transition-colors cursor-pointer"
            >
              <Plus className={`w-3.5 h-3.5 transition-transform ${withSource ? "rotate-45" : ""}`} />
              <span>{withSource ? "Remove source citation" : "Attach source provenance citation"}</span>
            </button>
          </div>

          {withSource && (
            <div className="p-3 bg-archive-subtle/60 border border-archive-border rounded space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-source-title" className="block text-xs font-mono text-archive-secondary mb-1">
                    Source Document / Title *
                  </label>
                  <input
                    id="create-source-title"
                    type="text"
                    placeholder="RFC-004: SSR Authentication"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    className="w-full bg-archive-card border border-archive-border rounded px-2.5 py-1.5 text-xs text-archive-primary focus:border-archive-accent outline-none"
                    required={withSource}
                  />
                </div>
                <div>
                  <label htmlFor="create-source-type" className="block text-xs font-mono text-archive-secondary mb-1">
                    Source Type
                  </label>
                  <select
                    id="create-source-type"
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full bg-archive-card border border-archive-border rounded px-2.5 py-1.5 text-xs text-archive-primary focus:border-archive-accent outline-none"
                  >
                    <option value="rfc">RFC</option>
                    <option value="document">Technical Document</option>
                    <option value="codebase">Codebase / PR</option>
                    <option value="discussion">Design Discussion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-source-uri" className="block text-xs font-mono text-archive-secondary mb-1">
                    URI / Document Link
                  </label>
                  <input
                    id="create-source-uri"
                    type="text"
                    placeholder="https://github.com/org/repo/pull/42"
                    value={sourceUri}
                    onChange={(e) => setSourceUri(e.target.value)}
                    className="w-full bg-archive-card border border-archive-border rounded px-2.5 py-1.5 text-xs text-archive-primary focus:border-archive-accent outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="create-source-loc" className="block text-xs font-mono text-archive-secondary mb-1">
                    Location / Section Reference
                  </label>
                  <input
                    id="create-source-loc"
                    type="text"
                    placeholder="Section 4.1 or Line 120"
                    value={locationReference}
                    onChange={(e) => setLocationReference(e.target.value)}
                    className="w-full bg-archive-card border border-archive-border rounded px-2.5 py-1.5 text-xs text-archive-primary focus:border-archive-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-citation-snippet" className="block text-xs font-mono text-archive-secondary mb-1">
                  Citation Snippet
                </label>
                <textarea
                  id="create-citation-snippet"
                  rows={2}
                  placeholder="Quoted excerpt directly grounding this context..."
                  value={citationSnippet}
                  onChange={(e) => setCitationSnippet(e.target.value)}
                  className="w-full bg-archive-card border border-archive-border rounded px-2.5 py-1.5 text-xs text-archive-primary focus:border-archive-accent outline-none font-mono"
                />
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-archive-bg bg-archive-accent hover:bg-archive-accentHover rounded font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? "Preserving..." : "Preserve Memory"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ContextExportBundle, ExportFormat } from "@/domain/types";
import {
  X,
  Copy,
  Check,
  Download,
  Loader2,
  Sparkles,
  Terminal,
  FileCode,
  Layers,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string | null;
  collectionTitle?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  collectionId,
  collectionTitle,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [bundle, setBundle] = useState<ContextExportBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !collectionId) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    fetch(`/api/collections/${collectionId}/export?format=${format}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.data) {
          setBundle(json.data);
        } else {
          setErrorMessage(json.error || "Failed to generate context export.");
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, collectionId, format]);

  if (!isOpen) return null;

  async function handleCopy() {
    if (!bundle?.formattedOutput) return;
    try {
      await navigator.clipboard.writeText(bundle.formattedOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  }

  function handleDownload() {
    if (!bundle?.formattedOutput) return;
    const ext = format === "json" ? "json" : "md";
    const filename = `context-export-${collectionTitle ? collectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "bundle"}.${ext}`;
    const blob = new Blob([bundle.formattedOutput], {
      type: format === "json" ? "application/json" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-export-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-archive-card border border-archive-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-archive-border bg-archive-subtle/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-archive-accent/30 bg-archive-subtle flex items-center justify-center text-archive-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-export-title" className="text-base font-semibold text-archive-primary font-mono">
                AI Context Injection Bundle
              </h2>
              <p className="text-xs text-archive-muted">
                Authoritative technical context ready to inject into System Prompts or Context Windows.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="text-archive-secondary hover:text-archive-primary p-1.5 rounded hover:bg-archive-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Format Selector & Token Counter */}
        <div className="px-6 py-3 border-b border-archive-border bg-archive-card flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Format Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-archive-muted mr-1">Target Prompt Format:</span>
            <button
              type="button"
              onClick={() => setFormat("markdown")}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                format === "markdown"
                  ? "bg-archive-accent text-archive-bg font-bold"
                  : "bg-archive-subtle text-archive-secondary hover:text-archive-primary border border-archive-border"
              }`}
            >
              Markdown (Standard)
            </button>
            <button
              type="button"
              onClick={() => setFormat("xml")}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                format === "xml"
                  ? "bg-archive-accent text-archive-bg font-bold"
                  : "bg-archive-subtle text-archive-secondary hover:text-archive-primary border border-archive-border"
              }`}
            >
              XML (Claude / Gemini)
            </button>
            <button
              type="button"
              onClick={() => setFormat("json")}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                format === "json"
                  ? "bg-archive-accent text-archive-bg font-bold"
                  : "bg-archive-subtle text-archive-secondary hover:text-archive-primary border border-archive-border"
              }`}
            >
              JSON (Tool / API)
            </button>
          </div>

          {/* Token Estimate Badge */}
          {bundle && (
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded bg-archive-subtle border border-archive-border text-archive-emerald font-semibold">
                ~{bundle.tokenEstimate.toLocaleString()} Tokens
              </span>
              <span className="text-archive-muted">
                {bundle.memories.length} Memories • {bundle.decisions.length} ADRs
              </span>
            </div>
          )}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-archive-bg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-archive-muted">
              <Loader2 className="w-8 h-8 animate-spin text-archive-accent mb-2" />
              <span className="text-xs font-mono">Generating verified context bundle...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded border border-archive-rose/30 bg-archive-rose/10 text-xs text-archive-rose font-mono">
              {errorMessage}
            </div>
          ) : (
            <pre className="p-4 rounded bg-archive-card border border-archive-border text-xs md:text-sm text-archive-primary font-mono whitespace-pre-wrap leading-relaxed selection:bg-archive-accent selection:text-archive-bg">
              {bundle?.formattedOutput}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-archive-border bg-archive-subtle/30 flex items-center justify-between">
          <span className="text-xs font-mono text-archive-muted">
            Zero Hallucinations Guarantee: Only verified repository decisions and memories are included.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isLoading || !bundle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-archive-border bg-archive-subtle hover:bg-archive-border text-archive-secondary hover:text-archive-primary text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={isLoading || !bundle}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-archive-accent hover:bg-archive-accentHover text-archive-bg text-xs font-mono font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-archive-bg" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

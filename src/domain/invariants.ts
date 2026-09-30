/**
 * Domain Invariants & Pure Business Rules
 * Deterministic, framework-agnostic, and unit-testable.
 */

import {
  AccessPolicy,
  DerivedEmbedding,
  Memory,
  MemoryVersion,
  ProjectScope,
} from "./types";

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Validates confidence score is strictly bounded [0.0, 1.0].
 */
export function validateConfidence(confidence: number): void {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    throw new DomainValidationError("Confidence must be a valid number");
  }
  if (confidence < 0.0 || confidence > 1.0) {
    throw new DomainValidationError(
      `Confidence score must be between 0.0 and 1.0, received: ${confidence}`
    );
  }
}

/**
 * Validates project scope slug format (kebab-case alphanumeric).
 */
export function validateProjectSlug(slug: string): void {
  if (!slug || slug.trim().length === 0) {
    throw new DomainValidationError("Project slug cannot be empty");
  }
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    throw new DomainValidationError(
      `Project slug must be lowercase alphanumeric with hyphens, received: '${slug}'`
    );
  }
}

/**
 * Creates a new Memory entity and its initial Version 1 snapshot.
 */
export function createMemoryWithVersion(params: {
  id: string;
  projectScopeId: string;
  title: string;
  content: string;
  authorId: string;
  summary?: string;
  confidence?: number;
  tags?: string[];
  initialReason?: string;
  timestamp?: string;
}): { memory: Memory; initialVersion: MemoryVersion } {
  const {
    id,
    projectScopeId,
    title,
    content,
    authorId,
    summary,
    confidence = 1.0,
    tags = [],
    initialReason = "Initial memory creation",
    timestamp = new Date().toISOString(),
  } = params;

  if (!title || title.trim().length === 0) {
    throw new DomainValidationError("Memory title cannot be empty");
  }
  if (!content || content.trim().length === 0) {
    throw new DomainValidationError("Memory content cannot be empty");
  }
  if (!projectScopeId) {
    throw new DomainValidationError("Memory must belong to an explicit ProjectScope");
  }
  validateConfidence(confidence);

  const memory: Memory = {
    id,
    projectScopeId,
    title: title.trim(),
    content: content.trim(),
    summary: summary?.trim(),
    status: "active",
    confidence,
    tags: Array.from(new Set(tags.map((t) => t.trim().toLowerCase()))),
    currentVersion: 1,
    authorId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const initialVersion: MemoryVersion = {
    id: `${id}-v1`,
    memoryId: id,
    versionNumber: 1,
    title: memory.title,
    content: memory.content,
    confidence: memory.confidence,
    tags: [...memory.tags],
    authorId,
    reasonForChange: initialReason,
    createdAt: timestamp,
  };

  return { memory, initialVersion };
}

/**
 * Updates a Memory and produces an immutable new MemoryVersion.
 * Invariant: Current version is incremented, updatedAt refreshed, previous versions preserved.
 */
export function reviseMemory(params: {
  currentMemory: Memory;
  title?: string;
  content?: string;
  summary?: string;
  confidence?: number;
  tags?: string[];
  authorId: string;
  reasonForChange: string;
  timestamp?: string;
}): { updatedMemory: Memory; newVersion: MemoryVersion } {
  const {
    currentMemory,
    title,
    content,
    summary,
    confidence,
    tags,
    authorId,
    reasonForChange,
    timestamp = new Date().toISOString(),
  } = params;

  if (!reasonForChange || reasonForChange.trim().length === 0) {
    throw new DomainValidationError("Revision requires an explicit reasonForChange for auditability");
  }

  const nextVersionNumber = currentMemory.currentVersion + 1;
  const newTitle = title !== undefined ? title.trim() : currentMemory.title;
  const newContent = content !== undefined ? content.trim() : currentMemory.content;
  const newConfidence = confidence !== undefined ? confidence : currentMemory.confidence;
  const newTags = tags !== undefined
    ? Array.from(new Set(tags.map((t) => t.trim().toLowerCase())))
    : [...currentMemory.tags];

  if (newTitle.length === 0) {
    throw new DomainValidationError("Memory title cannot be empty");
  }
  if (newContent.length === 0) {
    throw new DomainValidationError("Memory content cannot be empty");
  }
  validateConfidence(newConfidence);

  const updatedMemory: Memory = {
    ...currentMemory,
    title: newTitle,
    content: newContent,
    summary: summary !== undefined ? summary.trim() : currentMemory.summary,
    confidence: newConfidence,
    tags: newTags,
    currentVersion: nextVersionNumber,
    updatedAt: timestamp,
  };

  const newVersion: MemoryVersion = {
    id: `${currentMemory.id}-v${nextVersionNumber}`,
    memoryId: currentMemory.id,
    versionNumber: nextVersionNumber,
    title: newTitle,
    content: newContent,
    confidence: newConfidence,
    tags: newTags,
    authorId,
    reasonForChange: reasonForChange.trim(),
    createdAt: timestamp,
  };

  return { updatedMemory, newVersion };
}

/**
 * Evaluates whether a requesting project scope can access a target memory's project scope.
 * Invariant: Default is private. Cross-project reading requires explicit shared policy.
 */
export function isAccessPermitted(params: {
  requestingProjectScopeId: string;
  targetProjectScopeId: string;
  policy?: AccessPolicy;
}): boolean {
  const { requestingProjectScopeId, targetProjectScopeId, policy } = params;

  // Same project scope always has internal access
  if (requestingProjectScopeId === targetProjectScopeId) {
    return true;
  }

  // Cross-project scope: default is private unless policy permits
  if (!policy) {
    return false;
  }

  if (policy.level === "private") {
    return false;
  }

  if (policy.level === "shared_read") {
    // If specific allowed projects are designated, check list; otherwise open to shared read
    if (policy.allowedProjectIds && policy.allowedProjectIds.length > 0) {
      return policy.allowedProjectIds.includes(requestingProjectScopeId);
    }
    return true;
  }

  return false;
}

/**
 * Checks that an embedding matches the memory version it was derived from.
 * Invariant: Embeddings are derived, never canonical. An outdated embedding must be re-derived.
 */
export function isEmbeddingFresh(
  embedding: DerivedEmbedding,
  currentMemory: Memory
): boolean {
  return (
    embedding.memoryId === currentMemory.id &&
    embedding.memoryVersion === currentMemory.currentVersion
  );
}

/**
 * MemoryVault Pure Domain Model Definitions
 * Strictly framework-agnostic and fully typed.
 * 
 * Sources of truth: SKILL.md, DATA_MODEL.md, ARCHITECTURE.md
 */

export type ISO8601String = string;

export type MemoryStatus = "active" | "archived" | "superseded" | "draft";

export type AccessPolicyLevel = "private" | "project_internal" | "shared_read";

export type RelationshipType = 
  | "relates_to" 
  | "supersedes" 
  | "derived_from" 
  | "contradicts";

export type DecisionStatus = "proposed" | "accepted" | "rejected" | "deprecated";

export interface ProjectScope {
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
  isArchived: boolean;
}

export interface AccessPolicy {
  id: string;
  projectScopeId: string;
  level: AccessPolicyLevel;
  allowedProjectIds?: string[];
  description?: string;
  createdAt: ISO8601String;
}

export interface Source {
  id: string;
  projectScopeId: string;
  title: string;
  type: "document" | "codebase" | "discussion" | "rfc" | "external_url";
  uri?: string;
  externalRef?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export interface SourceReference {
  id: string;
  memoryId: string;
  sourceId: string;
  citationSnippet?: string;
  locationReference?: string; // line numbers, section heading, or hash
  createdAt: ISO8601String;
}

export interface MemoryVersion {
  id: string;
  memoryId: string;
  versionNumber: number;
  title: string;
  content: string;
  confidence: number; // 0.0 to 1.0
  tags: string[];
  authorId: string;
  reasonForChange: string;
  createdAt: ISO8601String;
}

export interface Memory {
  id: string;
  projectScopeId: string;
  title: string;
  content: string;
  summary?: string;
  status: MemoryStatus;
  confidence: number; // 0.0 to 1.0 (deterministic confidence level)
  tags: string[];
  currentVersion: number;
  authorId: string;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

/**
 * Derived vector representation.
 * Invariant: Embeddings are strictly derived and must never be treated as canonical data.
 */
export interface DerivedEmbedding {
  id: string;
  memoryId: string;
  memoryVersion: number;
  model: string; // e.g. 'text-embedding-3-small' or 'gemini-embedding-exp'
  vector: number[];
  dimensions: number;
  derivedAt: ISO8601String;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  projectScopeId?: string; // Optional: tag can be project-scoped or global
  createdAt: ISO8601String;
}

export interface Collection {
  id: string;
  projectScopeId: string;
  title: string;
  description?: string;
  memoryIds: string[];
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export interface Decision {
  id: string;
  projectScopeId: string;
  title: string;
  context: string;
  decisionText: string;
  consequences?: string;
  status: DecisionStatus;
  relatedMemoryIds: string[];
  sourceIds: string[];
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export interface Relationship {
  id: string;
  sourceMemoryId: string;
  targetMemoryId: string;
  relationshipType: RelationshipType;
  rationale?: string;
  createdAt: ISO8601String;
}

export interface RetrievalEvent {
  id: string;
  query: string;
  projectScopeId: string;
  matchedMemoryIds: string[];
  scores: number[];
  retrievedAt: ISO8601String;
  clientContext?: string;
}

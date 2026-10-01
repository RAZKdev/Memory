/**
 * MemoryRepository Interface
 * Pure port/adapter abstraction for persistence.
 * Source of truth: SKILL.md, ARCHITECTURE.md, DATA_MODEL.md
 */

import {
  AccessPolicy,
  Collection,
  Decision,
  DecisionStatus,
  DerivedEmbedding,
  Memory,
  MemoryStatus,
  MemoryVersion,
  ProjectScope,
  RetrievalEvent,
  Source,
  SourceReference,
} from "./types";

export interface CreateMemoryParams {
  memory: Memory;
  initialVersion: MemoryVersion;
  sourceReferences?: Array<{
    sourceId: string;
    citationSnippet?: string;
    locationReference?: string;
  }>;
}

export interface ReviseMemoryParams {
  updatedMemory: Memory;
  newVersion: MemoryVersion;
}

export interface MemoryFilter {
  projectScopeId?: string;
  tag?: string;
  status?: MemoryStatus;
  searchQuery?: string;
}

export interface SearchParams {
  query: string;
  projectScopeId?: string;
  mode?: "hybrid" | "keyword" | "semantic";
  limit?: number;
}

export interface SearchResult {
  memory: Memory;
  score: number; // 0.0 to 1.0 relevance score
  matchType: "hybrid" | "keyword" | "semantic";
  sourceReferences?: SourceReference[];
}

export interface MemoryRepository {
  // Project Scopes
  getProjectScopes(): Promise<ProjectScope[]>;
  getProjectScopeById(id: string): Promise<ProjectScope | null>;
  createProjectScope(
    scope: Omit<ProjectScope, "createdAt" | "updatedAt">
  ): Promise<ProjectScope>;

  // Sources
  getSources(projectScopeId?: string): Promise<Source[]>;
  getSourceById(id: string): Promise<Source | null>;
  createSource(
    source: Omit<Source, "createdAt" | "updatedAt">
  ): Promise<Source>;

  // Memories
  getMemories(filter?: MemoryFilter): Promise<Memory[]>;
  getMemoryById(id: string): Promise<Memory | null>;
  createMemory(params: CreateMemoryParams): Promise<Memory>;
  reviseMemory(params: ReviseMemoryParams): Promise<Memory>;
  
  // Versions & History
  getMemoryVersions(memoryId: string): Promise<MemoryVersion[]>;
  
  // Provenance / Sources
  getSourceReferences(memoryId: string): Promise<SourceReference[]>;

  // Decisions (ADRs)
  getDecisions(filter?: {
    projectScopeId?: string;
    status?: DecisionStatus;
  }): Promise<Decision[]>;
  getDecisionById(id: string): Promise<Decision | null>;
  createDecision(
    decision: Omit<Decision, "createdAt" | "updatedAt">
  ): Promise<Decision>;
  updateDecision(
    id: string,
    updates: Partial<
      Pick<
        Decision,
        | "title"
        | "context"
        | "decisionText"
        | "consequences"
        | "status"
        | "relatedMemoryIds"
        | "sourceIds"
      >
    >
  ): Promise<Decision>;

  // Derived Embeddings & Hybrid Search (pgvector integration)
  storeEmbedding(embedding: DerivedEmbedding): Promise<void>;
  getEmbedding(memoryId: string): Promise<DerivedEmbedding | null>;
  searchMemories(params: SearchParams): Promise<SearchResult[]>;
  recordRetrievalEvent(
    event: Omit<RetrievalEvent, "retrievedAt">
  ): Promise<RetrievalEvent>;

  // Collections (Thematic Groups of Memories & Decisions)
  getCollections(filter?: { projectScopeId?: string }): Promise<Collection[]>;
  getCollectionById(id: string): Promise<Collection | null>;
  createCollection(
    collection: Omit<Collection, "createdAt" | "updatedAt">
  ): Promise<Collection>;
  updateCollection(
    id: string,
    updates: Partial<
      Pick<Collection, "title" | "description" | "memoryIds" | "decisionIds">
    >
  ): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;

  // Access Policies
  getAccessPolicy(projectScopeId: string): Promise<AccessPolicy | null>;
  setAccessPolicy(policy: AccessPolicy): Promise<AccessPolicy>;
}

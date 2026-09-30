/**
 * MemoryRepository Interface
 * Pure port/adapter abstraction for persistence.
 * Source of truth: SKILL.md, ARCHITECTURE.md, DATA_MODEL.md
 */

import {
  AccessPolicy,
  Memory,
  MemoryStatus,
  MemoryVersion,
  ProjectScope,
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

  // Access Policies
  getAccessPolicy(projectScopeId: string): Promise<AccessPolicy | null>;
  setAccessPolicy(policy: AccessPolicy): Promise<AccessPolicy>;
}

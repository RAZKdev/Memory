/**
 * InMemoryMemoryRepository Adapter
 * Fast, deterministic in-memory persistence adapter for unit/integration testing and standalone runtime.
 */

import {
  CreateMemoryParams,
  MemoryFilter,
  MemoryRepository,
  ReviseMemoryParams,
} from "@/domain/repository";
import {
  AccessPolicy,
  Memory,
  MemoryVersion,
  ProjectScope,
  Source,
  SourceReference,
} from "@/domain/types";

export class InMemoryMemoryRepository implements MemoryRepository {
  private projectScopes = new Map<string, ProjectScope>();
  private sources = new Map<string, Source>();
  private memories = new Map<string, Memory>();
  private versions = new Map<string, MemoryVersion[]>(); // memoryId -> MemoryVersion[]
  private sourceReferences = new Map<string, SourceReference[]>(); // memoryId -> SourceReference[]
  private accessPolicies = new Map<string, AccessPolicy>(); // projectScopeId -> AccessPolicy

  constructor(initialData?: {
    projectScopes?: ProjectScope[];
    sources?: Source[];
    memories?: Memory[];
    versions?: MemoryVersion[];
    sourceReferences?: SourceReference[];
    accessPolicies?: AccessPolicy[];
  }) {
    if (initialData?.projectScopes) {
      for (const p of initialData.projectScopes) {
        this.projectScopes.set(p.id, p);
      }
    }
    if (initialData?.sources) {
      for (const s of initialData.sources) {
        this.sources.set(s.id, s);
      }
    }
    if (initialData?.memories) {
      for (const m of initialData.memories) {
        this.memories.set(m.id, m);
      }
    }
    if (initialData?.versions) {
      for (const v of initialData.versions) {
        const list = this.versions.get(v.memoryId) || [];
        list.push(v);
        this.versions.set(v.memoryId, list);
      }
    }
    if (initialData?.sourceReferences) {
      for (const ref of initialData.sourceReferences) {
        const list = this.sourceReferences.get(ref.memoryId) || [];
        list.push(ref);
        this.sourceReferences.set(ref.memoryId, list);
      }
    }
    if (initialData?.accessPolicies) {
      for (const pol of initialData.accessPolicies) {
        this.accessPolicies.set(pol.projectScopeId, pol);
      }
    }
  }

  async getProjectScopes(): Promise<ProjectScope[]> {
    return Array.from(this.projectScopes.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async getProjectScopeById(id: string): Promise<ProjectScope | null> {
    return this.projectScopes.get(id) || null;
  }

  async createProjectScope(
    scope: Omit<ProjectScope, "createdAt" | "updatedAt">
  ): Promise<ProjectScope> {
    const timestamp = new Date().toISOString();
    const created: ProjectScope = {
      ...scope,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.projectScopes.set(created.id, created);
    return created;
  }

  async getSources(projectScopeId?: string): Promise<Source[]> {
    const all = Array.from(this.sources.values());
    if (projectScopeId) {
      return all.filter((s) => s.projectScopeId === projectScopeId);
    }
    return all;
  }

  async getSourceById(id: string): Promise<Source | null> {
    return this.sources.get(id) || null;
  }

  async createSource(
    source: Omit<Source, "createdAt" | "updatedAt">
  ): Promise<Source> {
    const timestamp = new Date().toISOString();
    const created: Source = {
      ...source,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.sources.set(created.id, created);
    return created;
  }

  async getMemories(filter?: MemoryFilter): Promise<Memory[]> {
    let list = Array.from(this.memories.values());

    if (filter?.projectScopeId) {
      list = list.filter((m) => m.projectScopeId === filter.projectScopeId);
    }
    if (filter?.status) {
      list = list.filter((m) => m.status === filter.status);
    }
    if (filter?.tag) {
      const lowerTag = filter.tag.toLowerCase();
      list = list.filter((m) =>
        m.tags.some((t) => t.toLowerCase() === lowerTag)
      );
    }
    if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          (m.summary && m.summary.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    return this.memories.get(id) || null;
  }

  async createMemory(params: CreateMemoryParams): Promise<Memory> {
    const { memory, initialVersion, sourceReferences } = params;
    this.memories.set(memory.id, memory);

    // Store version
    this.versions.set(memory.id, [initialVersion]);

    // Store source references
    if (sourceReferences && sourceReferences.length > 0) {
      const refs: SourceReference[] = sourceReferences.map((ref, idx) => ({
        id: `ref-${memory.id}-${idx + 1}`,
        memoryId: memory.id,
        sourceId: ref.sourceId,
        citationSnippet: ref.citationSnippet,
        locationReference: ref.locationReference,
        createdAt: memory.createdAt,
      }));
      this.sourceReferences.set(memory.id, refs);
    } else {
      this.sourceReferences.set(memory.id, []);
    }

    return memory;
  }

  async reviseMemory(params: ReviseMemoryParams): Promise<Memory> {
    const { updatedMemory, newVersion } = params;
    this.memories.set(updatedMemory.id, updatedMemory);

    const history = this.versions.get(updatedMemory.id) || [];
    history.push(newVersion);
    this.versions.set(updatedMemory.id, history);

    return updatedMemory;
  }

  async getMemoryVersions(memoryId: string): Promise<MemoryVersion[]> {
    const list = this.versions.get(memoryId) || [];
    // Return sorted in descending order of version number
    return [...list].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getSourceReferences(memoryId: string): Promise<SourceReference[]> {
    return this.sourceReferences.get(memoryId) || [];
  }

  async getAccessPolicy(projectScopeId: string): Promise<AccessPolicy | null> {
    return this.accessPolicies.get(projectScopeId) || null;
  }

  async setAccessPolicy(policy: AccessPolicy): Promise<AccessPolicy> {
    this.accessPolicies.set(policy.projectScopeId, policy);
    return policy;
  }
}

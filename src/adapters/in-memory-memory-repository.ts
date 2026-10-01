/**
 * InMemoryMemoryRepository Adapter
 * Fast, deterministic in-memory persistence adapter for unit/integration testing and standalone runtime.
 * Extended with ADR (Decision) records and Hybrid Vector Search.
 */

import {
  CreateMemoryParams,
  MemoryFilter,
  MemoryRepository,
  ReviseMemoryParams,
  SearchParams,
  SearchResult,
} from "@/domain/repository";
import {
  AccessPolicy,
  Collection,
  Decision,
  DecisionStatus,
  DerivedEmbedding,
  Memory,
  MemoryVersion,
  ProjectScope,
  RetrievalEvent,
  Source,
  SourceReference,
} from "@/domain/types";
import {
  calculateKeywordScore,
  cosineSimilarity,
  generateLocalEmbedding,
  hybridScoreFusion,
} from "@/domain/vector";

export class InMemoryMemoryRepository implements MemoryRepository {
  private projectScopes = new Map<string, ProjectScope>();
  private sources = new Map<string, Source>();
  private memories = new Map<string, Memory>();
  private versions = new Map<string, MemoryVersion[]>(); // memoryId -> MemoryVersion[]
  private sourceReferences = new Map<string, SourceReference[]>(); // memoryId -> SourceReference[]
  private accessPolicies = new Map<string, AccessPolicy>(); // projectScopeId -> AccessPolicy
  private decisions = new Map<string, Decision>(); // decisionId -> Decision
  private collections = new Map<string, Collection>(); // collectionId -> Collection
  private embeddings = new Map<string, DerivedEmbedding>(); // memoryId -> DerivedEmbedding
  private retrievalEvents: RetrievalEvent[] = [];

  constructor(initialData?: {
    projectScopes?: ProjectScope[];
    sources?: Source[];
    memories?: Memory[];
    versions?: MemoryVersion[];
    sourceReferences?: SourceReference[];
    accessPolicies?: AccessPolicy[];
    decisions?: Decision[];
    collections?: Collection[];
  }) {
    if (initialData?.projectScopes) {
      for (const p of initialData.projectScopes) {
        this.projectScopes.set(p.id, p);
      }
    }
    if (initialData?.collections) {
      for (const c of initialData.collections) {
        this.collections.set(c.id, c);
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
        // Automatically derive initial embedding
        const vector = generateLocalEmbedding(`${m.title} ${m.content} ${m.tags.join(" ")}`);
        this.embeddings.set(m.id, {
          id: `emb-${m.id}`,
          memoryId: m.id,
          memoryVersion: m.currentVersion,
          model: "local-deterministic-v1",
          vector,
          dimensions: vector.length,
          derivedAt: m.createdAt,
        });
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
    if (initialData?.decisions) {
      for (const d of initialData.decisions) {
        this.decisions.set(d.id, d);
      }
    }
  }

  // --- Project Scopes ---
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

  // --- Sources ---
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

  // --- Memories ---
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

    // Automatically derive and store embedding
    const vector = generateLocalEmbedding(
      `${memory.title} ${memory.content} ${memory.tags.join(" ")}`
    );
    this.embeddings.set(memory.id, {
      id: `emb-${memory.id}`,
      memoryId: memory.id,
      memoryVersion: memory.currentVersion,
      model: "local-deterministic-v1",
      vector,
      dimensions: vector.length,
      derivedAt: memory.createdAt,
    });

    return memory;
  }

  async reviseMemory(params: ReviseMemoryParams): Promise<Memory> {
    const { updatedMemory, newVersion } = params;
    this.memories.set(updatedMemory.id, updatedMemory);

    const history = this.versions.get(updatedMemory.id) || [];
    history.push(newVersion);
    this.versions.set(updatedMemory.id, history);

    // Re-derive updated embedding
    const vector = generateLocalEmbedding(
      `${updatedMemory.title} ${updatedMemory.content} ${updatedMemory.tags.join(" ")}`
    );
    this.embeddings.set(updatedMemory.id, {
      id: `emb-${updatedMemory.id}-v${updatedMemory.currentVersion}`,
      memoryId: updatedMemory.id,
      memoryVersion: updatedMemory.currentVersion,
      model: "local-deterministic-v1",
      vector,
      dimensions: vector.length,
      derivedAt: updatedMemory.updatedAt,
    });

    return updatedMemory;
  }

  async getMemoryVersions(memoryId: string): Promise<MemoryVersion[]> {
    const list = this.versions.get(memoryId) || [];
    return [...list].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getSourceReferences(memoryId: string): Promise<SourceReference[]> {
    return this.sourceReferences.get(memoryId) || [];
  }

  // --- Decisions (ADRs) ---
  async getDecisions(filter?: {
    projectScopeId?: string;
    status?: DecisionStatus;
  }): Promise<Decision[]> {
    let list = Array.from(this.decisions.values());
    if (filter?.projectScopeId) {
      list = list.filter((d) => d.projectScopeId === filter.projectScopeId);
    }
    if (filter?.status) {
      list = list.filter((d) => d.status === filter.status);
    }
    return list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDecisionById(id: string): Promise<Decision | null> {
    return this.decisions.get(id) || null;
  }

  async createDecision(
    decision: Omit<Decision, "createdAt" | "updatedAt">
  ): Promise<Decision> {
    const timestamp = new Date().toISOString();
    const created: Decision = {
      ...decision,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.decisions.set(created.id, created);
    return created;
  }

  async updateDecision(
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
  ): Promise<Decision> {
    const existing = this.decisions.get(id);
    if (!existing) {
      throw new Error(`Decision with ID '${id}' not found.`);
    }

    const updated: Decision = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.decisions.set(id, updated);
    return updated;
  }

  // --- Derived Embeddings & Hybrid Search Engine ---
  async storeEmbedding(embedding: DerivedEmbedding): Promise<void> {
    this.embeddings.set(embedding.memoryId, embedding);
  }

  async getEmbedding(memoryId: string): Promise<DerivedEmbedding | null> {
    return this.embeddings.get(memoryId) || null;
  }

  async searchMemories(params: SearchParams): Promise<SearchResult[]> {
    const { query, projectScopeId, mode = "hybrid", limit = 10 } = params;
    if (!query || query.trim().length === 0) {
      return [];
    }

    let candidateMemories = Array.from(this.memories.values());
    if (projectScopeId) {
      candidateMemories = candidateMemories.filter(
        (m) => m.projectScopeId === projectScopeId
      );
    }

    const queryVector = generateLocalEmbedding(query);
    const results: SearchResult[] = [];

    for (const mem of candidateMemories) {
      const fullText = `${mem.title} ${mem.content} ${mem.tags.join(" ")}`;
      const keywordScore = calculateKeywordScore(query, fullText);

      let semanticScore = 0;
      const embedding = this.embeddings.get(mem.id);
      if (embedding) {
        semanticScore = cosineSimilarity(queryVector, embedding.vector);
      }

      let finalScore = 0;
      let matchType: "keyword" | "semantic" | "hybrid" = "hybrid";

      if (mode === "keyword") {
        finalScore = keywordScore;
        matchType = "keyword";
      } else if (mode === "semantic") {
        finalScore = semanticScore;
        matchType = "semantic";
      } else {
        // Hybrid mode (Reciprocal / weighted fusion)
        finalScore = hybridScoreFusion(keywordScore, semanticScore, 0.4);
        matchType = "hybrid";
      }

      // Filter threshold
      if (finalScore > 0.05) {
        const refs = this.sourceReferences.get(mem.id) || [];
        results.push({
          memory: mem,
          score: Math.round(finalScore * 100) / 100,
          matchType,
          sourceReferences: refs,
        });
      }
    }

    // Rank results descending
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

    // Record retrieval event for audit log
    if (projectScopeId && topResults.length > 0) {
      await this.recordRetrievalEvent({
        id: `ret-${Date.now()}`,
        query,
        projectScopeId,
        matchedMemoryIds: topResults.map((r) => r.memory.id),
        scores: topResults.map((r) => r.score),
        clientContext: `mode:${mode}`,
      });
    }

    return topResults;
  }

  async recordRetrievalEvent(
    event: Omit<RetrievalEvent, "retrievedAt">
  ): Promise<RetrievalEvent> {
    const fullEvent: RetrievalEvent = {
      ...event,
      retrievedAt: new Date().toISOString(),
    };
    this.retrievalEvents.push(fullEvent);
    return fullEvent;
  }

  // --- Collections (Thematic Groups of Memories & Decisions) ---
  async getCollections(filter?: { projectScopeId?: string }): Promise<Collection[]> {
    let list = Array.from(this.collections.values());
    if (filter?.projectScopeId) {
      list = list.filter((c) => c.projectScopeId === filter.projectScopeId);
    }
    return list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    return this.collections.get(id) || null;
  }

  async createCollection(
    collection: Omit<Collection, "createdAt" | "updatedAt">
  ): Promise<Collection> {
    const timestamp = new Date().toISOString();
    const created: Collection = {
      ...collection,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.collections.set(created.id, created);
    return created;
  }

  async updateCollection(
    id: string,
    updates: Partial<
      Pick<Collection, "title" | "description" | "memoryIds" | "decisionIds">
    >
  ): Promise<Collection> {
    const existing = this.collections.get(id);
    if (!existing) {
      throw new Error(`Collection with ID '${id}' not found.`);
    }

    const updated: Collection = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<void> {
    this.collections.delete(id);
  }

  // --- Access Policies ---
  async getAccessPolicy(projectScopeId: string): Promise<AccessPolicy | null> {
    return this.accessPolicies.get(projectScopeId) || null;
  }

  async setAccessPolicy(policy: AccessPolicy): Promise<AccessPolicy> {
    this.accessPolicies.set(policy.projectScopeId, policy);
    return policy;
  }
}

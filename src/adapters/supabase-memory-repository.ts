/**
 * SupabaseMemoryRepository Adapter
 * Production-ready PostgreSQL/Supabase persistence adapter.
 * Integrations stay strictly behind this adapter boundary.
 */

import { SupabaseClient } from "@supabase/supabase-js";
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

export class SupabaseMemoryRepository implements MemoryRepository {
  constructor(private client: SupabaseClient) {}

  // --- Project Scopes ---
  async getProjectScopes(): Promise<ProjectScope[]> {
    const { data, error } = await this.client
      .from("project_scopes")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(`Supabase error fetching project scopes: ${error.message}`);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getProjectScopeById(id: string): Promise<ProjectScope | null> {
    const { data, error } = await this.client
      .from("project_scopes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Supabase error fetching project scope: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createProjectScope(
    scope: Omit<ProjectScope, "createdAt" | "updatedAt">
  ): Promise<ProjectScope> {
    const { data, error } = await this.client
      .from("project_scopes")
      .insert({
        id: scope.id,
        slug: scope.slug,
        name: scope.name,
        description: scope.description,
        is_archived: scope.isArchived,
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase error creating project scope: ${error.message}`);

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // --- Sources ---
  async getSources(projectScopeId?: string): Promise<Source[]> {
    let query = this.client.from("sources").select("*");
    if (projectScopeId) {
      query = query.eq("project_scope_id", projectScopeId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase error fetching sources: ${error.message}`);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      projectScopeId: row.project_scope_id,
      title: row.title,
      type: row.type,
      uri: row.uri,
      externalRef: row.external_ref,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getSourceById(id: string): Promise<Source | null> {
    const { data, error } = await this.client
      .from("sources")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Supabase error fetching source: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      title: data.title,
      type: data.type,
      uri: data.uri,
      externalRef: data.external_ref,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createSource(
    source: Omit<Source, "createdAt" | "updatedAt">
  ): Promise<Source> {
    const { data, error } = await this.client
      .from("sources")
      .insert({
        id: source.id,
        project_scope_id: source.projectScopeId,
        title: source.title,
        type: source.type,
        uri: source.uri,
        external_ref: source.externalRef,
        metadata: source.metadata || {},
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase error creating source: ${error.message}`);

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      title: data.title,
      type: data.type,
      uri: data.uri,
      externalRef: data.external_ref,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // --- Memories ---
  async getMemories(filter?: MemoryFilter): Promise<Memory[]> {
    let query = this.client.from("memories").select("*");

    if (filter?.projectScopeId) {
      query = query.eq("project_scope_id", filter.projectScopeId);
    }
    if (filter?.status) {
      query = query.eq("status", filter.status);
    }
    if (filter?.tag) {
      query = query.contains("tags", [filter.tag.toLowerCase()]);
    }
    if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
      query = query.ilike("title", `%${filter.searchQuery.trim()}%`);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw new Error(`Supabase error fetching memories: ${error.message}`);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      projectScopeId: row.project_scope_id,
      title: row.title,
      content: row.content,
      summary: row.summary,
      status: row.status,
      confidence: Number(row.confidence),
      tags: row.tags || [],
      currentVersion: row.current_version,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    const { data, error } = await this.client
      .from("memories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Supabase error fetching memory: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      title: data.title,
      content: data.content,
      summary: data.summary,
      status: data.status,
      confidence: Number(data.confidence),
      tags: data.tags || [],
      currentVersion: data.current_version,
      authorId: data.author_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createMemory(params: CreateMemoryParams): Promise<Memory> {
    const { memory, initialVersion, sourceReferences } = params;

    // 1. Insert Memory
    const { error: memError } = await this.client.from("memories").insert({
      id: memory.id,
      project_scope_id: memory.projectScopeId,
      title: memory.title,
      content: memory.content,
      summary: memory.summary,
      status: memory.status,
      confidence: memory.confidence,
      tags: memory.tags,
      current_version: memory.currentVersion,
      author_id: memory.authorId,
    });
    if (memError) throw new Error(`Failed to insert memory: ${memError.message}`);

    // 2. Insert Initial Version Snapshot
    const { error: verError } = await this.client.from("memory_versions").insert({
      id: initialVersion.id,
      memory_id: initialVersion.memoryId,
      version_number: initialVersion.versionNumber,
      title: initialVersion.title,
      content: initialVersion.content,
      confidence: initialVersion.confidence,
      tags: initialVersion.tags,
      author_id: initialVersion.authorId,
      reason_for_change: initialVersion.reasonForChange,
    });
    if (verError) throw new Error(`Failed to insert initial version: ${verError.message}`);

    // 3. Insert Source References if provided
    if (sourceReferences && sourceReferences.length > 0) {
      const rows = sourceReferences.map((ref) => ({
        memory_id: memory.id,
        source_id: ref.sourceId,
        citation_snippet: ref.citationSnippet,
        location_reference: ref.locationReference,
      }));
      const { error: refError } = await this.client.from("source_references").insert(rows);
      if (refError) throw new Error(`Failed to insert source references: ${refError.message}`);
    }

    // 4. Derive and store embedding
    const vector = generateLocalEmbedding(
      `${memory.title} ${memory.content} ${memory.tags.join(" ")}`
    );
    await this.storeEmbedding({
      id: `emb-${memory.id}`,
      memoryId: memory.id,
      memoryVersion: memory.currentVersion,
      model: "local-deterministic-v1",
      vector,
      dimensions: vector.length,
      derivedAt: memory.createdAt,
    }).catch(() => {
      // Non-fatal if derived_embeddings table does not yet have vector extension enabled
    });

    return memory;
  }

  async reviseMemory(params: ReviseMemoryParams): Promise<Memory> {
    const { updatedMemory, newVersion } = params;

    // 1. Update memory
    const { error: memError } = await this.client
      .from("memories")
      .update({
        title: updatedMemory.title,
        content: updatedMemory.content,
        summary: updatedMemory.summary,
        confidence: updatedMemory.confidence,
        tags: updatedMemory.tags,
        current_version: updatedMemory.currentVersion,
        updated_at: updatedMemory.updatedAt,
      })
      .eq("id", updatedMemory.id);
    if (memError) throw new Error(`Failed to update memory: ${memError.message}`);

    // 2. Insert new immutable version
    const { error: verError } = await this.client.from("memory_versions").insert({
      id: newVersion.id,
      memory_id: newVersion.memoryId,
      version_number: newVersion.versionNumber,
      title: newVersion.title,
      content: newVersion.content,
      confidence: newVersion.confidence,
      tags: newVersion.tags,
      author_id: newVersion.authorId,
      reason_for_change: newVersion.reasonForChange,
    });
    if (verError) throw new Error(`Failed to insert memory version: ${verError.message}`);

    // 3. Update derived embedding
    const vector = generateLocalEmbedding(
      `${updatedMemory.title} ${updatedMemory.content} ${updatedMemory.tags.join(" ")}`
    );
    await this.storeEmbedding({
      id: `emb-${updatedMemory.id}-v${updatedMemory.currentVersion}`,
      memoryId: updatedMemory.id,
      memoryVersion: updatedMemory.currentVersion,
      model: "local-deterministic-v1",
      vector,
      dimensions: vector.length,
      derivedAt: updatedMemory.updatedAt,
    }).catch(() => {});

    return updatedMemory;
  }

  async getMemoryVersions(memoryId: string): Promise<MemoryVersion[]> {
    const { data, error } = await this.client
      .from("memory_versions")
      .select("*")
      .eq("memory_id", memoryId)
      .order("version_number", { ascending: false });

    if (error) throw new Error(`Supabase error fetching memory versions: ${error.message}`);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      memoryId: row.memory_id,
      versionNumber: row.version_number,
      title: row.title,
      content: row.content,
      confidence: Number(row.confidence),
      tags: row.tags || [],
      authorId: row.author_id,
      reasonForChange: row.reason_for_change,
      createdAt: row.created_at,
    }));
  }

  async getSourceReferences(memoryId: string): Promise<SourceReference[]> {
    const { data, error } = await this.client
      .from("source_references")
      .select("*")
      .eq("memory_id", memoryId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Supabase error fetching source references: ${error.message}`);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      memoryId: row.memory_id,
      sourceId: row.source_id,
      citationSnippet: row.citation_snippet,
      locationReference: row.location_reference,
      createdAt: row.created_at,
    }));
  }

  // --- Decisions (ADRs) ---
  async getDecisions(filter?: {
    projectScopeId?: string;
    status?: DecisionStatus;
  }): Promise<Decision[]> {
    let query = this.client.from("decisions").select("*");
    if (filter?.projectScopeId) {
      query = query.eq("project_scope_id", filter.projectScopeId);
    }
    if (filter?.status) {
      query = query.eq("status", filter.status);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw new Error(`Supabase error fetching decisions: ${error.message}`);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      projectScopeId: row.project_scope_id,
      title: row.title,
      context: row.context,
      decisionText: row.decision_text,
      consequences: row.consequences,
      status: row.status,
      relatedMemoryIds: row.related_memory_ids || [],
      sourceIds: row.source_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getDecisionById(id: string): Promise<Decision | null> {
    const { data, error } = await this.client
      .from("decisions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Supabase error fetching decision: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      title: data.title,
      context: data.context,
      decisionText: data.decision_text,
      consequences: data.consequences,
      status: data.status,
      relatedMemoryIds: data.related_memory_ids || [],
      sourceIds: data.source_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createDecision(
    decision: Omit<Decision, "createdAt" | "updatedAt">
  ): Promise<Decision> {
    const { data, error } = await this.client
      .from("decisions")
      .insert({
        id: decision.id,
        project_scope_id: decision.projectScopeId,
        title: decision.title,
        context: decision.context,
        decision_text: decision.decisionText,
        consequences: decision.consequences,
        status: decision.status,
        related_memory_ids: decision.relatedMemoryIds,
        source_ids: decision.sourceIds,
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase error creating decision: ${error.message}`);

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      title: data.title,
      context: data.context,
      decisionText: data.decision_text,
      consequences: data.consequences,
      status: data.status,
      relatedMemoryIds: data.related_memory_ids || [],
      sourceIds: data.source_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
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
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.context !== undefined) payload.context = updates.context;
    if (updates.decisionText !== undefined) payload.decision_text = updates.decisionText;
    if (updates.consequences !== undefined) payload.consequences = updates.consequences;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.relatedMemoryIds !== undefined) payload.related_memory_ids = updates.relatedMemoryIds;
    if (updates.sourceIds !== undefined) payload.source_ids = updates.sourceIds;

    const { data, error } = await this.client
      .from("decisions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Supabase error updating decision: ${error.message}`);

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      title: data.title,
      context: data.context,
      decisionText: data.decision_text,
      consequences: data.consequences,
      status: data.status,
      relatedMemoryIds: data.related_memory_ids || [],
      sourceIds: data.source_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // --- Derived Embeddings & Hybrid Search Engine ---
  async storeEmbedding(embedding: DerivedEmbedding): Promise<void> {
    const { error } = await this.client.from("derived_embeddings").upsert({
      id: embedding.id,
      memory_id: embedding.memoryId,
      memory_version: embedding.memoryVersion,
      model: embedding.model,
      vector: embedding.vector,
      dimensions: embedding.dimensions,
    });

    if (error) {
      console.warn("Could not upsert embedding into Supabase:", error.message);
    }
  }

  async getEmbedding(memoryId: string): Promise<DerivedEmbedding | null> {
    const { data, error } = await this.client
      .from("derived_embeddings")
      .select("*")
      .eq("memory_id", memoryId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      memoryId: data.memory_id,
      memoryVersion: data.memory_version,
      model: data.model,
      vector: data.vector,
      dimensions: data.dimensions,
      derivedAt: data.derived_at,
    };
  }

  async searchMemories(params: SearchParams): Promise<SearchResult[]> {
    const { query, projectScopeId, mode = "hybrid", limit = 10 } = params;
    if (!query || query.trim().length === 0) return [];

    // Fetch candidate memories
    const memories = await this.getMemories({ projectScopeId });
    const queryVector = generateLocalEmbedding(query);
    const results: SearchResult[] = [];

    for (const mem of memories) {
      const fullText = `${mem.title} ${mem.content} ${mem.tags.join(" ")}`;
      const keywordScore = calculateKeywordScore(query, fullText);

      let semanticScore = 0;
      const embedding = await this.getEmbedding(mem.id);
      if (embedding && embedding.vector) {
        semanticScore = cosineSimilarity(queryVector, embedding.vector);
      } else {
        const memVector = generateLocalEmbedding(fullText);
        semanticScore = cosineSimilarity(queryVector, memVector);
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
        finalScore = hybridScoreFusion(keywordScore, semanticScore, 0.4);
        matchType = "hybrid";
      }

      if (finalScore > 0.05) {
        const refs = await this.getSourceReferences(mem.id);
        results.push({
          memory: mem,
          score: Math.round(finalScore * 100) / 100,
          matchType,
          sourceReferences: refs,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

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

    await this.client.from("retrieval_events").insert({
      id: fullEvent.id,
      query: fullEvent.query,
      project_scope_id: fullEvent.projectScopeId,
      matched_memory_ids: fullEvent.matchedMemoryIds,
      scores: fullEvent.scores,
      client_context: fullEvent.clientContext,
    });

    return fullEvent;
  }

  // --- Access Policies ---
  async getAccessPolicy(projectScopeId: string): Promise<AccessPolicy | null> {
    const { data, error } = await this.client
      .from("access_policies")
      .select("*")
      .eq("project_scope_id", projectScopeId)
      .maybeSingle();

    if (error) throw new Error(`Supabase error fetching access policy: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      level: data.level,
      allowedProjectIds: data.allowed_project_ids,
      description: data.description,
      createdAt: data.created_at,
    };
  }

  async setAccessPolicy(policy: AccessPolicy): Promise<AccessPolicy> {
    const { data, error } = await this.client
      .from("access_policies")
      .upsert({
        id: policy.id,
        project_scope_id: policy.projectScopeId,
        level: policy.level,
        allowed_project_ids: policy.allowedProjectIds || [],
        description: policy.description,
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase error upserting access policy: ${error.message}`);

    return {
      id: data.id,
      projectScopeId: data.project_scope_id,
      level: data.level,
      allowedProjectIds: data.allowed_project_ids,
      description: data.description,
      createdAt: data.created_at,
    };
  }
}

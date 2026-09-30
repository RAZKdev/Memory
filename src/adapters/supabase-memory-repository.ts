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
} from "@/domain/repository";
import {
  AccessPolicy,
  Memory,
  MemoryVersion,
  ProjectScope,
  Source,
  SourceReference,
} from "@/domain/types";

export class SupabaseMemoryRepository implements MemoryRepository {
  constructor(private client: SupabaseClient) {}

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

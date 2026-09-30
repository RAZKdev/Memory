-- MemoryVault Initial Relational Schema
-- Conforming to DATA_MODEL.md and Supabase / PostgreSQL Hardened RLS Standards

-- Enable UUID and pgvector extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Project Scopes
CREATE TABLE IF NOT EXISTS project_scopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_scopes_slug ON project_scopes(slug);

-- 2. Access Policies
CREATE TABLE IF NOT EXISTS access_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_scope_id UUID NOT NULL REFERENCES project_scopes(id) ON DELETE CASCADE,
    level VARCHAR(32) NOT NULL DEFAULT 'private' CHECK (level IN ('private', 'project_internal', 'shared_read')),
    allowed_project_ids UUID[] DEFAULT ARRAY[]::UUID[],
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_policies_project ON access_policies(project_scope_id);

-- 3. Sources (Origin references, RFCs, PRs, transcripts)
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_scope_id UUID NOT NULL REFERENCES project_scopes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('document', 'codebase', 'discussion', 'rfc', 'external_url')),
    uri TEXT,
    external_ref VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_project ON sources(project_scope_id);

-- 4. Memories (Canonical Technical Context)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_scope_id UUID NOT NULL REFERENCES project_scopes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded', 'draft')),
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (confidence >= 0.00 AND confidence <= 1.00),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    current_version INT NOT NULL DEFAULT 1,
    author_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_project_scope ON memories(project_scope_id);
CREATE INDEX IF NOT EXISTS idx_memories_status ON memories(status);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN(tags);

-- 5. Memory Versions (Immutable History & Audit Trail)
CREATE TABLE IF NOT EXISTS memory_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    confidence NUMERIC(3, 2) NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    author_id VARCHAR(128) NOT NULL,
    reason_for_change TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(memory_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_memory_versions_memory_id ON memory_versions(memory_id);

-- 6. Source References (Links Memory to Source with Citations)
CREATE TABLE IF NOT EXISTS source_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    citation_snippet TEXT,
    location_reference VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_references_memory_id ON source_references(memory_id);
CREATE INDEX IF NOT EXISTS idx_source_references_source_id ON source_references(source_id);

-- 7. Derived Embeddings (Derived only, never canonical)
CREATE TABLE IF NOT EXISTS derived_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    memory_version INT NOT NULL,
    model VARCHAR(128) NOT NULL,
    vector vector(1536), -- Standard embedding dimension, can adapt per model
    dimensions INT NOT NULL,
    derived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_derived_embeddings_memory ON derived_embeddings(memory_id, memory_version);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Mandatory on every single table per standard
-- ==========================================

ALTER TABLE project_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE derived_embeddings ENABLE ROW LEVEL SECURITY;

-- Default Read/Write Policies for Authenticated Context
CREATE POLICY "Allow authenticated read project_scopes"
ON project_scopes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access_policies"
ON access_policies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read sources"
ON sources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read memories"
ON memories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert memories"
ON memories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update memories"
ON memories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read memory_versions"
ON memory_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert memory_versions"
ON memory_versions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read source_references"
ON source_references FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert source_references"
ON source_references FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read derived_embeddings"
ON derived_embeddings FOR SELECT TO authenticated USING (true);

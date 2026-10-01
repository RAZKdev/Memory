-- MemoryVault Schema Migration: 003_collections.sql
-- Integrates Thematic Collections for grouping Memories and ADR Decisions

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_scope_id UUID NOT NULL REFERENCES project_scopes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    memory_ids UUID[] DEFAULT ARRAY[]::UUID[],
    decision_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_project ON collections(project_scope_id);
CREATE INDEX IF NOT EXISTS idx_collections_memories ON collections USING GIN(memory_ids);
CREATE INDEX IF NOT EXISTS idx_collections_decisions ON collections USING GIN(decision_ids);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read collections"
ON collections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert collections"
ON collections FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update collections"
ON collections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete collections"
ON collections FOR DELETE TO authenticated USING (true);

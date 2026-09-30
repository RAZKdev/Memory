-- MemoryVault Schema Migration: 002_decisions_and_retrieval.sql
-- Integrates Architectural Decision Records (ADRs) and Retrieval Events

-- 1. Decisions Table
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_scope_id UUID NOT NULL REFERENCES project_scopes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    context TEXT NOT NULL,
    decision_text TEXT NOT NULL,
    consequences TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'accepted' CHECK (status IN ('proposed', 'accepted', 'rejected', 'deprecated')),
    related_memory_ids UUID[] DEFAULT ARRAY[]::UUID[],
    source_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_scope_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_memories ON decisions USING GIN(related_memory_ids);

-- 2. Retrieval Events (Audit log of hybrid and semantic searches)
CREATE TABLE IF NOT EXISTS retrieval_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    project_scope_id UUID NOT NULL REFERENCES project_scopes(id) ON DELETE CASCADE,
    matched_memory_ids UUID[] NOT NULL,
    scores NUMERIC(5, 4)[] NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_context TEXT
);

CREATE INDEX IF NOT EXISTS idx_retrieval_events_project ON retrieval_events(project_scope_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_events_time ON retrieval_events(retrieved_at);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read decisions"
ON decisions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert decisions"
ON decisions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update decisions"
ON decisions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read retrieval_events"
ON retrieval_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert retrieval_events"
ON retrieval_events FOR INSERT TO authenticated WITH CHECK (true);

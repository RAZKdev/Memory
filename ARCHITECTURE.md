# MemoryVault Architecture & System Design

Technical architecture document for **MemoryVault**: an authoritative, deterministic cross-project technical context and memory system engineered for AI-assisted software delivery with zero hallucinations.

---

## 1. Architectural Style: Hexagonal (Ports & Adapters)

MemoryVault strictly enforces a **Ports-and-Adapters** architectural boundary. The business rules, domain entities, and data validation invariants remain 100% pure TypeScript, decoupled from Next.js, React, databases, or vector stores.

```
                           +------------------------------------------+
                           |           Presentation Layer             |
                           |   Next.js App Router (RSC + Leaf UI)     |
                           +--------------------+---------------------+
                                                |
                                                v
                           +--------------------+---------------------+
                           |            API Layer                     |
                           |   REST Route Handlers (/api/*)           |
                           +--------------------+---------------------+
                                                |
                                                v
                           +--------------------+---------------------+
                           |         Domain Port (Contract)           |
                           |          MemoryRepository                |
                           +---------+----------------------+---------+
                                     |                      |
            +------------------------+                      +------------------------+
            |                                                                        |
            v                                                                        v
+-------------------------------+                                  +-------------------------------+
|     Secondary Adapter:        |                                  |     Secondary Adapter:        |
|  InMemoryMemoryRepository     |                                  |   SupabaseMemoryRepository    |
| (Zero-config offline testing) |                                  | (PostgreSQL + RLS + pgvector) |
+-------------------------------+                                  +-------------------------------+
```

### Layer Responsibilities

1. **Domain Model (`src/domain/types.ts`)**:
   - Pure TypeScript definitions for core entities: `ProjectScope`, `AccessPolicy`, `Memory`, `MemoryVersion`, `Source`, `SourceReference`, `Decision`, `DerivedEmbedding`, `Collection`, `RetrievalEvent`.
2. **Domain Invariants (`src/domain/invariants.ts`)**:
   - Deterministic invariants: confidence score bounds ($[0.0, 1.0]$), immutable snapshot versioning, project slug validation, access control authorization rules, and embedding freshness verification.
3. **Repository Port (`src/domain/repository.ts`)**:
   - Abstract contract defining persistence capabilities without leaking database or framework specifics.
4. **Persistence Adapters (`src/adapters/`)**:
   - `InMemoryMemoryRepository`: In-memory storage for rapid deterministic testing and zero-config local development.
   - `SupabaseMemoryRepository`: PostgreSQL storage leveraging Supabase client, Row-Level Security, and pgvector extension.
5. **Retrieval & Export Adapters (`src/domain/vector.ts`, `src/domain/export-adapter.ts`)**:
   - Cosine similarity vector math, lexical search ranking, hybrid fusion scoring, and prompt serialization into Markdown, XML, and JSON.
6. **Application & API Layer (`src/app/api/`)**:
   - Input validation, error masking, HTTP status mapping, and repository orchestration.
7. **Presentation Layer (`src/app/`, `src/components/`)**:
   - Server Component data loaders and accessible client workspaces adhering to the Technical Archive design tokens.

---

## 2. Core Entities & Domain Invariants

### A. Memory & MemoryVersion (Immutable Snapshotting)
- **Problem**: In AI-assisted software workflows, technical decisions and memories are vulnerable to silent overwrite or hallucinated drift.
- **Invariant**:
  - A `Memory` is a mutable pointer pointing to the current state (`currentVersion`).
  - Every modification **must** create an immutable `MemoryVersion` record with an incremented monotonic version number (`versionNumber = currentVersion + 1`) and a mandatory `reasonForChange`.
  - Creating a new `Memory` automatically generates an immutable **Version 1** snapshot with reason `"Initial memory creation"`.

### B. ProjectScope & AccessPolicy (Boundary Isolation)
- **Problem**: Multi-agent pipelines risk leaking proprietary context across distinct project boundaries.
- **Invariant**:
  - Every memory, decision, collection, and source belongs strictly to a `ProjectScope`.
  - **Default-Private Policy**: If no explicit policy exists, cross-project retrieval is unconditionally denied.
  - Three isolation levels:
    1. `private`: Strict isolation. Memories are completely inaccessible to peer projects.
    2. `project_internal`: Accessible only to authorized components/agents within the scope.
    3. `shared_read`: Read-only access granted explicitly to whitelisted project scopes (`allowedProjectIds`).

### C. Source & Provenance (Citation Rigor)
- Memories may reference primary sources (RFCs, pull requests, architectural notes, design docs).
- A `SourceReference` preserves exact line numbers, commit hashes, or section citations (`locationReference`) and verified excerpt snippets (`citationSnippet`).

### D. Architectural Decision Records (ADRs)
- Formally records technical choices using Michael Nygard's ADR format: Title, Status (`proposed`, `accepted`, `rejected`, `deprecated`), Context, Decision, and Consequences.
- Directly linked via foreign keys to underlying `Memory` items and `Source` citations.

### E. Derived Embeddings & Freshness Invariant
- **Rule**: Vector embeddings are strictly **derived data**, never canonical source-of-truth.
- **Invariant**:
  $$\text{isEmbeddingFresh}(E, M) \iff E.\text{memoryVersion} = M.\text{currentVersion}$$
  If a memory is revised, its previously derived embedding is marked stale and scheduled for regeneration.

---

## 3. Database Schema & Migrations

All migrations reside in `supabase/migrations/` and apply strict PostgreSQL standards with full Row-Level Security (RLS).

### Migration `001_initial_schema.sql`
- Tables: `project_scopes`, `access_policies`, `sources`, `memories`, `memory_versions`, `source_references`, `memory_relationships`.
- Check constraints:
  - `confidence >= 0.0 AND confidence <= 1.0`
  - `status IN ('active', 'archived', 'superseded', 'draft')`
  - `level IN ('private', 'project_internal', 'shared_read')`
- Foreign keys with `ON DELETE CASCADE` or `RESTRICT`.
- Row-Level Security enabled on **every table** with authenticated tenant policies.

### Migration `002_decisions_and_retrieval.sql`
- Enables PostgreSQL `pgvector` extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- Tables:
  - `decisions`: ADR records with check constraints on status (`proposed`, `accepted`, `rejected`, `deprecated`).
  - `derived_embeddings`: Stores vector embeddings (`vector(1536)` or arbitrary dimensions) with an **HNSW cosine index**:
    ```sql
    CREATE INDEX idx_embeddings_hnsw ON derived_embeddings 
    USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);
    ```
  - `retrieval_events`: Telemetry log recording query text, mode (`hybrid`, `keyword`, `semantic`), and retrieved memory IDs for audit tracking.

### Migration `003_collections.sql`
- Table: `collections`:
  - Stores thematic groupings of memories and ADRs (`memory_ids UUID[]`, `decision_ids UUID[]`).
  - Foreign key to `project_scopes` with cascade delete.

---

## 4. Hybrid Vector Retrieval Engine

MemoryVault implements a hybrid vector retrieval pipeline combining pgvector cosine distance with lexical keyword matching:

$$\text{FinalScore} = \alpha \cdot \text{LexicalScore} + (1 - \alpha) \cdot \text{CosineSimilarity}$$

Where:
- $\alpha = 0.5$ (balanced hybrid mode)
- $\text{CosineSimilarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$
- $\text{LexicalScore} = \text{Term frequency and keyword density across Title, Content, and Tags}$
- Scope boundary filtering: Search automatically restricts results to authorized scopes based on the requesting context's `AccessPolicy`.

---

## 5. Thematic Collections & AI Prompt Export Adapter

MemoryVault includes a dedicated Context Export Adapter (`src/domain/export-adapter.ts`) that bundles memories and ADRs into structured prompts ready for injection into AI context windows:

1. **Markdown Format (`formatAsMarkdown`)**:
   - Structured document with metadata headers, ADR summaries, technical notes, and provenance citations.
2. **XML Format (`formatAsXml`)**:
   - Semantic XML blocks (`<project_context>`, `<thematic_collection>`, `<architectural_decisions>`, `<technical_memories>`, `<provenance>`) optimized for Claude and Gemini reasoning models.
3. **JSON Schema Format (`formatAsJson`)**:
   - Machine-parseable JSON object for programmatic agent tools and multi-agent coordination.
4. **Token Estimation (`estimateTokenCount`)**:
   - Heuristic token counter ($1 \text{ token} \approx 4 \text{ chars}$) displaying real-time budget usage before prompt injection.

---

## 6. Security & ASVS 5.0.0 Compliance

MemoryVault is built in compliance with **OWASP ASVS 5.0.0**:

- **No Client Secrets**: Supabase service role keys and database connection strings are strictly kept server-side.
- **Server-Side Authorization**: Access policies and project boundaries are validated server-side in route handlers; UI hiding is never used as a security control.
- **SQL Injection Prevention**: All queries use parameterized queries (via Supabase / PostgREST query builders).
- **Accidental Data Loss Prevention**: Immutable audit version snapshots prevent destructive overwriting; hard deletions are forbidden on canonical memories.
- **Row-Level Security (RLS)**: Enforced across all 10 PostgreSQL tables.

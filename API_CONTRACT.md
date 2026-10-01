# MemoryVault API Contract & Specification

Authoritative API specification for MemoryVault endpoints. All endpoints enforce domain invariants, boundary isolation policies, strict error handling, and structured JSON responses.

---

## 1. Global Conventions

- **Base URL**: `http://localhost:3000/api` (or environment-configured domain)
- **Content-Type**: `application/json` (requests and responses)
- **Standard Success Response**:
  ```json
  {
    "data": { ... }
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "error": "Descriptive human-readable error message"
  }
  ```
- **HTTP Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource created successfully.
  - `400 Bad Request`: Validation failure (empty field, confidence out of bounds, invalid enum).
  - `404 Not Found`: Resource scope, memory, decision, or collection does not exist.
  - `500 Internal Server Error`: Unexpected server or database exception.

---

## 2. Project Scopes & Access Governance

### `GET /api/projects`
Retrieves all registered project scopes.

- **Query Parameters**: None
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "proj-agentic-arch",
        "slug": "agentic-arch",
        "name": "Agentic Architecture",
        "description": "Core AI agent protocols, tool schemas, and multi-agent coordination.",
        "isArchived": false,
        "createdAt": "2026-10-01T10:00:00.000Z",
        "updatedAt": "2026-10-01T10:00:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/projects`
Registers a new project scope boundary.

- **Request Body**:
  ```json
  {
    "name": "Data Platform",
    "slug": "data-platform",
    "description": "Postgres schema and pgvector retrieval pipelines."
  }
  ```
- **Invariants**:
  - `name`: Non-empty string.
  - `slug`: Valid kebab-case slug (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Response `201 Created`**: Returns created `ProjectScope` object.

---

### `GET /api/projects/[id]/policy`
Retrieves the access policy and isolation boundary configuration for a project scope.

- **Path Parameters**: `id` — Project scope ID.
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "pol-proj-agentic-arch",
      "projectScopeId": "proj-agentic-arch",
      "level": "private",
      "allowedProjectIds": [],
      "description": "Default private isolation policy",
      "createdAt": "2026-10-01T10:00:00.000Z"
    }
  }
  ```
- *Note*: If no policy has been explicitly created, returns the default `private` policy.

---

### `PUT /api/projects/[id]/policy`
Updates or establishes access governance and cross-project sharing policies.

- **Path Parameters**: `id` — Project scope ID.
- **Request Body**:
  ```json
  {
    "level": "shared_read",
    "allowedProjectIds": ["proj-data-platform"],
    "description": "Allowed for cross-project analytics review per RFC-012"
  }
  ```
- **Invariants**:
  - `level`: Must be one of `"private"`, `"project_internal"`, `"shared_read"`.
  - `allowedProjectIds`: Array of whitelisted project scope IDs. Required if `level === "shared_read"`.
- **Response `200 OK`**: Returns updated `AccessPolicy` object.

---

## 3. Technical Memories & Audit Versions

### `GET /api/memories`
Lists technical memories matching optional filters.

- **Query Parameters**:
  - `projectScopeId` (optional): Filter memories belonging to a specific scope.
  - `tag` (optional): Filter by exact tag.
  - `status` (optional): Filter by status (`active`, `archived`, `superseded`, `draft`).
  - `q` (optional): Keyword search substring in title, content, or summary.
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "mem-seed-01",
        "projectScopeId": "proj-agentic-arch",
        "title": "Deterministic State Transition Rule",
        "content": "All state transitions across agent steps must be deterministic...",
        "summary": "Deterministic transitions and adapter isolation rule.",
        "status": "active",
        "confidence": 1.0,
        "tags": ["architecture", "determinism", "adapters"],
        "currentVersion": 1,
        "authorId": "eng-system-lead",
        "createdAt": "2026-10-01T10:00:00.000Z",
        "updatedAt": "2026-10-01T10:00:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/memories`
Creates a canonical technical memory. Automatically initializes an immutable **Version 1** audit snapshot and optional source citation provenance.

- **Request Body**:
  ```json
  {
    "projectScopeId": "proj-agentic-arch",
    "title": "Supabase SSR Session Delegation",
    "content": "Use official @supabase/ssr cookie delegation exclusively on server-side routes.",
    "summary": "Server-side SSR auth cookie pattern.",
    "confidence": 0.95,
    "tags": ["auth", "security", "ssr"],
    "authorId": "eng-lead",
    "source": {
      "title": "Supabase SSR Auth Documentation",
      "type": "document",
      "uri": "https://supabase.com/docs/guides/auth/server-side",
      "citationSnippet": "Use createServerClient with cookie store bindings",
      "locationReference": "Section 3.2"
    }
  }
  ```
- **Invariants**:
  - `title`: Non-empty string.
  - `content`: Non-empty string.
  - `confidence`: Floating point strictly bounded between `0.0` and `1.0`.
  - Initial snapshot: Version 1 is created immutably with reason `"Initial memory creation"`.
- **Response `201 Created`**: Returns created `Memory` object.

---

### `GET /api/memories/[id]`
Retrieves full details for a memory, including its active state, version snapshot history, and attached citations.

- **Path Parameters**: `id` — Memory ID.
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "memory": { ... },
      "versions": [
        {
          "id": "mem-seed-01-v1",
          "memoryId": "mem-seed-01",
          "versionNumber": 1,
          "title": "Deterministic State Transition Rule",
          "content": "...",
          "confidence": 1.0,
          "tags": ["architecture", "determinism"],
          "authorId": "eng-system-lead",
          "reasonForChange": "Foundational architectural baseline memory",
          "createdAt": "2026-10-01T10:00:00.000Z"
        }
      ],
      "sources": [
        {
          "id": "ref-seed-01",
          "memoryId": "mem-seed-01",
          "sourceId": "src-rfc-001",
          "citationSnippet": "Section 2.1: Determinism Invariant Guarantee",
          "locationReference": "RFC-001#L14-L28",
          "createdAt": "2026-10-01T10:00:00.000Z"
        }
      ]
    }
  }
  ```

---

### `PUT /api/memories/[id]/revisions`
Creates an immutable new revision of an existing memory. Updates the canonical memory pointer and appends a new monotonic `MemoryVersion` snapshot.

- **Path Parameters**: `id` — Memory ID to revise.
- **Request Body**:
  ```json
  {
    "content": "Updated content with pgvector HNSW index configurations.",
    "title": "Supabase SSR Session Delegation (Revised)",
    "confidence": 0.98,
    "tags": ["auth", "security", "ssr", "pgvector"],
    "authorId": "eng-senior",
    "reasonForChange": "Added pgvector indexing specifications"
  }
  ```
- **Invariants**:
  - `reasonForChange`: Mandatory non-empty string explaining the revision rationale.
  - `versionNumber`: Incremented monotonically (`currentVersion + 1`).
- **Response `200 OK`**: Returns updated `Memory` object.

---

## 4. Architectural Decision Records (ADRs)

### `GET /api/decisions`
Lists ADRs matching optional project scope or status filters.

- **Query Parameters**:
  - `projectScopeId` (optional): Filter by project scope ID.
  - `status` (optional): Filter by status (`proposed`, `accepted`, `rejected`, `deprecated`).
- **Response `200 OK`**: Returns array of `Decision` objects.

---

### `POST /api/decisions`
Records a new architectural decision linked directly to memories and sources.

- **Request Body**:
  ```json
  {
    "projectScopeId": "proj-agentic-arch",
    "title": "ADR-002: Dual-Mode Persistence Strategy",
    "context": "Need seamless offline testing without requiring Supabase credentials.",
    "decisionText": "Maintain zero-config in-memory adapter as primary dev fallback.",
    "consequences": "Faster developer feedback loop with identical domain port.",
    "status": "accepted",
    "relatedMemoryIds": ["mem-seed-01"],
    "sourceIds": ["src-rfc-001"]
  }
  ```
- **Response `201 Created`**: Returns created `Decision` object.

---

### `PATCH /api/decisions/[id]`
Updates an ADR's status, decision text, consequences, or linked memories.

- **Path Parameters**: `id` — Decision ID.
- **Request Body**: Partial fields of `Decision` (`status`, `title`, `context`, `decisionText`, `consequences`, `relatedMemoryIds`, `sourceIds`).
- **Response `200 OK`**: Returns updated `Decision` object.

---

## 5. Hybrid Vector Search Engine

### `POST /api/search`
Executes hybrid vector retrieval combining pgvector cosine similarity with lexical full-text ranking.

- **Request Body**:
  ```json
  {
    "query": "deterministic transitions",
    "projectScopeId": "proj-agentic-arch",
    "mode": "hybrid",
    "limit": 10
  }
  ```
- **Parameters**:
  - `query`: Search string (required).
  - `projectScopeId`: Optional project scope filter to enforce boundary isolation.
  - `mode`: `"hybrid"` (default), `"keyword"`, or `"semantic"`.
  - `limit`: Maximum results to return (default: `10`).
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "memory": { ... },
        "score": 0.942,
        "matchType": "hybrid",
        "sourceReferences": [ ... ]
      }
    ]
  }
  ```

---

## 6. Thematic Collections & AI Prompt Export

### `GET /api/collections`
Lists thematic collections for organizing memories and decisions.

- **Query Parameters**:
  - `projectScopeId` (optional): Filter collections by project scope ID.
- **Response `200 OK`**: Returns array of `Collection` objects.

---

### `POST /api/collections`
Creates a new thematic collection bundle.

- **Request Body**:
  ```json
  {
    "projectScopeId": "proj-agentic-arch",
    "title": "Agentic Determinism & Boundary Invariants",
    "description": "Core state transitions and port-adapter persistence rules.",
    "memoryIds": ["mem-seed-01"],
    "decisionIds": ["dec-adr-001"]
  }
  ```
- **Response `201 Created`**: Returns created `Collection` object.

---

### `GET /api/collections/[id]/export`
Generates an authoritative, prompt-ready context injection text formatted for AI System Prompts or Context Windows.

- **Path Parameters**: `id` — Collection ID.
- **Query Parameters**:
  - `format`: Target output format:
    - `markdown` (default): Standard Markdown document with YAML-like frontmatter.
    - `xml`: XML-tagged blocks (`<project_context>`, `<architectural_decisions>`, `<technical_memories>`) preferred by Claude / Gemini.
    - `json`: Structured JSON schema suitable for programmatic tool invocation.
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "exportId": "exp-1727788400000",
      "exportedAt": "2026-10-01T12:00:00.000Z",
      "collectionId": "col-agentic-core",
      "collectionTitle": "Agentic Determinism & Boundary Invariants",
      "projectScopeId": "proj-agentic-arch",
      "projectScopeName": "Agentic Architecture",
      "tokenEstimate": 384,
      "format": "markdown",
      "memories": [ ... ],
      "decisions": [ ... ],
      "formattedOutput": "# SYSTEM PROMPT CONTEXT: AGENTIC ARCHITECTURE\n..."
    }
  }
  ```

# MemoryVault

> **Deterministic Cross-Project Memory and Technical Context System**  
> *Preserving project decisions, technical notes, and verified source provenance for AI-assisted engineering with zero hallucinations.*

---

## 1. Overview & Problem Statement

Modern AI-assisted engineering environments suffer from **context drift**, **silent memory overwrites**, and **hallucinated architectural decisions**. When engineering agents operate across multiple repositories without a structured archive, past decisions, RFC rationales, and boundary constraints are easily forgotten or distorted.

**MemoryVault** solves this by providing a deterministic, auditable context archive built on a **Hexagonal (Ports and Adapters)** architecture:

- **Immutable Audit Versions**: Every memory modification creates an immutable snapshot with monotonic version numbers and mandatory rationale.
- **Source Citation Provenance**: Every context item can link to primary documents, RFCs, and pull requests with exact line references.
- **Architectural Decision Records (ADRs)**: Formalizes technical trade-offs (Context, Decision, Consequences) linked to memories.
- **Thematic Collections & AI Prompt Exporter**: Bundles technical context into prompt-ready injection text in Markdown, XML (Claude / Gemini), or JSON formats.
- **Hybrid Vector Retrieval**: Combines pgvector cosine similarity with lexical full-text ranking under explicit project isolation boundaries.
- **Project Scope Governance**: Default-private isolation preventing accidental cross-project data leakage.

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router Architecture with React Server Components)
- **Language**: TypeScript 5.7+ (Strict Mode, zero implicit `any`)
- **Styling**: Tailwind CSS (Custom *Technical Archive* design token system, dark mode native)
- **Database & Persistence**:
  - **In-Memory Adapter**: Zero-configuration, deterministic persistence for local development and CI testing.
  - **PostgreSQL / Supabase Adapter**: Production database with Row-Level Security (RLS) and `pgvector` HNSW indexing.
- **Testing**:
  - **Vitest**: Unit testing for domain invariants, vector math, and repository adapters (30 tests passing).
  - **Playwright**: End-to-end browser automation & visual QA across Desktop (1280x800) and Android-class Mobile (375x667) viewports (14 tests passing).
- **Icons**: Lucide React

---

## 3. System Architecture & Boundaries

MemoryVault strictly decouples business rules and domain invariants from external frameworks:

```
src/
├── app/                              # Next.js App Router (Presentation & API)
│   ├── api/                          # REST Route Handlers
│   │   ├── collections/              # Thematic collections & prompt export
│   │   ├── decisions/                # ADR lifecycle endpoints
│   │   ├── memories/                 # Memory CRUD & versioning
│   │   ├── projects/                 # Project scopes & access policy governance
│   │   └── search/                   # Hybrid vector search engine
│   ├── collections/                  # Thematic collections workspace page
│   ├── decisions/                    # ADR decision workspace page
│   ├── memories/                     # Technical memory workspace page
│   ├── projects/                     # Project scope governance page
│   ├── globals.css                   # Technical archive theme tokens & WCAG AA focus rings
│   └── page.tsx                      # System landing page & domain model reference
├── components/                       # Accessible UI leaf components
│   ├── AccessPolicyModal.tsx         # Isolation level & peer whitelist governance modal
│   ├── CollectionsWorkspace.tsx      # Interactive collections manager
│   ├── CreateCollectionModal.tsx     # Thematic collection bundling modal
│   ├── CreateDecisionModal.tsx       # Architectural decision (ADR) creation modal
│   ├── CreateMemoryModal.tsx         # Memory preservation modal with citation inputs
│   ├── CreateProjectModal.tsx        # Project scope registration modal
│   ├── DecisionsWorkspace.tsx        # Architectural decision records workspace
│   ├── ExportModal.tsx               # Multi-format AI system prompt exporter
│   ├── HybridSearchModal.tsx         # Global hybrid vector search modal (⌘K)
│   ├── MemoryWorkspace.tsx           # Canonical memory workspace & history inspector
│   ├── ProjectsWorkspace.tsx         # Project scopes & isolation governance workspace
│   └── RevisionModal.tsx             # Immutable version snapshot authoring modal
├── domain/                           # Pure Framework-Agnostic Domain Core
│   ├── export-adapter.ts             # Prompt serialization (Markdown, XML, JSON)
│   ├── invariants.ts                 # Domain validation invariants & security rules
│   ├── repository.ts                 # MemoryRepository port interface
│   ├── types.ts                      # Authoritative TypeScript domain models
│   └── vector.ts                     # Cosine math, text embeddings, and hybrid fusion
├── adapters/                         # Secondary Persistence Adapters
│   ├── in-memory-memory-repository.ts # In-memory adapter with seeded initial data
│   └── supabase-memory-repository.ts  # PostgreSQL + RLS + pgvector adapter
└── lib/
    └── repository.ts                 # Repository factory & singleton provider
```

---

## 4. Getting Started

### Prerequisites

- **Node.js**: v18.17.0 or higher (v24 LTS recommended)
- **npm**: v9 or higher

### Installation

```bash
git clone <repository-url> MemoryVault
cd MemoryVault
npm install
```

### Running Locally (Zero Configuration)

By default, MemoryVault runs out-of-the-box using the built-in **In-Memory Repository**. No external database or credentials are required:

- **Windows 1-Click Launcher**: Double-click `start.bat` to verify Node.js, install dependencies (if missing), boot the Next.js server, and automatically launch your browser.
- **Manual CLI**:
  ```bash
  npm run dev
  ```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **Memories Workspace**: [http://localhost:3000/memories](http://localhost:3000/memories)
- **Decisions (ADRs)**: [http://localhost:3000/decisions](http://localhost:3000/decisions)
- **Collections & AI Export**: [http://localhost:3000/collections](http://localhost:3000/collections)
- **Project Scopes & Governance**: [http://localhost:3000/projects](http://localhost:3000/projects)

---

## 5. Testing & Quality Assurance

MemoryVault enforces rigorous automated testing covering domain logic, persistence, and visual rendering.

### Run Unit & Integration Tests (Vitest)

```bash
npm run test
```

*Results*: **30/30 tests passing** across 8 test suites:
- Confidence score bounding ($[0.0, 1.0]$)
- Kebab-case project slug validation
- Immutable snapshot versioning upon revision
- Access policy cross-project authorization
- Embedding freshness invariant validation
- Hybrid vector retrieval and reciprocal rank fusion
- AI prompt export serialization (Markdown, XML, JSON)
- Access policy update API routes

### Run End-to-End & Responsive Visual QA (Playwright)

```bash
npm run test:e2e
```

*Results*: **14/14 tests passing** across both desktop and mobile viewports:
- Desktop Chrome (1280x800)
- Mobile Chrome Android-class viewport (375x667)
- Verifies: navigation, memory preservation, ADR creation, collections prompt export, access policy changes, hybrid search modal, and zero horizontal document overflow.

### Continuous Integration (GitHub Actions)

MemoryVault includes an automated multi-stage CI pipeline defined in [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) that executes on every push and pull request:
1. **`unit-and-integration`**: Runs Vitest suite (30 tests) and verifies Next.js production compilation.
2. **`e2e-and-visual-qa`**: Installs Playwright Chromium with system dependencies, builds the production app, and executes all 14 E2E/responsive tests across desktop and mobile viewports.

---

## 6. Supabase & PostgreSQL Configuration (Production)

To connect MemoryVault to a real PostgreSQL instance:

1. Create a Supabase project (or standard PostgreSQL instance with `pgvector` enabled).
2. Configure `.env.local` by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres.your-project-id:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
   ```
3. Run database migrations:
   - **Automated CLI Runner** (Recommended):
     ```bash
     npm run db:migrate
     ```
     *Applies `001_initial_schema.sql`, `002_decisions_and_retrieval.sql`, and `003_collections.sql` in sequence and tracks them in `_schema_migrations`.*
   - **Manual Supabase SQL Editor**:
     Execute the migration scripts in numerical sequence directly in the Supabase Dashboard.
4. Restart the development server. MemoryVault automatically detects the credentials and activates `SupabaseMemoryRepository`.

---

## 7. Build for Production

```bash
npm run build
npm run start
```

---

## 8. Documentation Index

- [ARCHITECTURE.md](file:///d:/PROJECT%20SAYA/MemoryVault/ARCHITECTURE.md): Detailed system design, layer boundaries, and database schemas.
- [API_CONTRACT.md](file:///d:/PROJECT%20SAYA/MemoryVault/API_CONTRACT.md): Comprehensive REST API contract with request/response schemas.
- [DATA_MODEL.md](file:///d:/PROJECT%20SAYA/MemoryVault/DATA_MODEL.md): Pure domain entity attributes and relationships.
- [supabase/migrations/](file:///d:/PROJECT%20SAYA/MemoryVault/supabase/migrations/): Complete SQL migration scripts with RLS policies.

# ARCHITECTURE.md — MemoryVault

Next.js → capture/normalization/scope/versioning/retrieval/provenance → Postgres/Supabase + optional pgvector.

Keep UI, domain/application services, persistence, external adapters, security and tests separated. Integrations stay behind adapters.

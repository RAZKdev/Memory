# SKILL.md — MemoryVault

## Purpose
Private cross-project context/memory system for preserving project decisions, notes, useful context and source references for AI-assisted work.

## Goals
Build an auditable, production-minded system with clear domain boundaries, deterministic rules, real persistence where required, and explicit states.

## Non-goals
Memory is not automatically true; no uncontrolled global copying or silent scope expansion.

## Domain
Memory, MemoryVersion, ProjectScope, Source, SourceReference, Embedding, Tag, Collection, Decision, Relationship, AccessPolicy, optional RetrievalEvent.

## API
Memory CRUD/version/delete; sources; search; collections; decisions.

## Architecture
Next.js → capture/normalization/scope/versioning/retrieval/provenance → Postgres/Supabase + optional pgvector.

## Rules
Store content, source, date, project scope, confidence/status, tags, history. Embeddings are derived, never canonical. Default private with explicit project boundaries.

## Workflow
Audit → domain model → smallest vertical slice → persistence → tests → security/privacy review → visual QA → delivery report.

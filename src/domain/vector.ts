/**
 * Vector Mathematics & Embedding Utilities
 * Pure deterministic vector operations.
 * Source of truth: DATA_MODEL.md ("Embeddings are derived, never canonical")
 */

/**
 * Calculates cosine similarity between two normalized or unnormalized vectors.
 * Returns a value bounded between -1.0 and 1.0 (clamped to [0.0, 1.0] for similarity).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, (sim + 1) / 2)); // Normalize to [0, 1] range
}

/**
 * Generates a deterministic unit-normalized pseudo-semantic embedding vector.
 * Maps n-grams and token frequencies to a high-dimensional unit hypersphere.
 * Used for local testing, fallback, and zero-dependency vector operations.
 */
export function generateLocalEmbedding(
  text: string,
  dimensions = 128
): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return vector;
  }

  // Token hash distribution
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1;

    // Subword bi-grams
    if (token.length > 2) {
      for (let j = 0; j < token.length - 1; j++) {
        const sub = token.substring(j, j + 2);
        const subHash = (sub.charCodeAt(0) * 31 + sub.charCodeAt(1)) % dimensions;
        vector[Math.abs(subHash)] += 0.5;
      }
    }
  }

  // Normalize vector to unit length (L2 norm)
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSq);

  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }

  return vector;
}

/**
 * Calculates keyword relevance score using term frequency and exact matching.
 */
export function calculateKeywordScore(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return 0;

  const target = text.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    if (target.includes(term)) {
      matches += 1;
    }
  }

  return matches / queryTerms.length;
}

/**
 * Combines keyword score and vector similarity with hybrid fusion weighting.
 */
export function hybridScoreFusion(
  keywordScore: number,
  semanticScore: number,
  alpha = 0.5 // Weight for keyword vs semantic
): number {
  return alpha * keywordScore + (1 - alpha) * semanticScore;
}

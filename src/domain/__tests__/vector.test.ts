import { describe, expect, it } from "vitest";
import {
  calculateKeywordScore,
  cosineSimilarity,
  generateLocalEmbedding,
  hybridScoreFusion,
} from "../vector";

describe("Vector Math & Embedding Generation", () => {
  it("computes cosine similarity accurately", () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];

    // Identical vectors normalized to [0, 1] range
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);

    // Orthogonal vectors
    expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.5, 5);
  });

  it("generates deterministic unit-length embeddings", () => {
    const text = "PostgreSQL pgvector index optimization";
    const emb1 = generateLocalEmbedding(text, 128);
    const emb2 = generateLocalEmbedding(text, 128);

    expect(emb1).toHaveLength(128);
    expect(emb2).toHaveLength(128);
    expect(emb1).toEqual(emb2); // Deterministic guarantee

    // Verify unit length (magnitude = 1)
    let sumSq = 0;
    for (const val of emb1) {
      sumSq += val * val;
    }
    expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 4);
  });

  it("yields higher similarity for semantically related texts than unrelated texts", () => {
    const query = "postgres database indexes";
    const related = "postgresql relational schema with pgvector btree indexing";
    const unrelated = "ancient roman architecture and marble arches";

    const qVec = generateLocalEmbedding(query, 128);
    const relVec = generateLocalEmbedding(related, 128);
    const unrelVec = generateLocalEmbedding(unrelated, 128);

    const simRelated = cosineSimilarity(qVec, relVec);
    const simUnrelated = cosineSimilarity(qVec, unrelVec);

    expect(simRelated).toBeGreaterThan(simUnrelated);
  });

  it("fuses keyword score and semantic score deterministically", () => {
    const keyword = 1.0;
    const semantic = 0.5;
    const fused = hybridScoreFusion(keyword, semantic, 0.5);

    expect(fused).toBe(0.75);
  });

  it("calculates keyword scores based on query terms presence", () => {
    const score = calculateKeywordScore("state machine", "a deterministic state machine pattern");
    expect(score).toBe(1.0);

    const partialScore = calculateKeywordScore("state machine", "only state here");
    expect(partialScore).toBe(0.5);
  });
});

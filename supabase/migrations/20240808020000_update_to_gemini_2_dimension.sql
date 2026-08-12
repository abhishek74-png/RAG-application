-- Delete all existing incompatible embeddings
DELETE FROM documents_embeddings;

-- Drop the old HNSW index if it exists
DROP INDEX IF EXISTS documents_embeddings_embedding_idx;

-- Alter the column type safely to Gemini 2 dimension (3072)
ALTER TABLE documents_embeddings ALTER COLUMN embedding TYPE vector(3072);

-- Recreate the index for the new dimension (Skipped because HNSW max is 2000)
-- Exact nearest neighbor search will be used instead.

-- Update the RPC to use the correct input dimension
CREATE OR REPLACE FUNCTION match_documents_embeddings_hybrid (
  query_embedding vector(3072), -- Match new gemini-embedding-2 size
  query_text text,
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float,
  keyword_score float,
  hybrid_score float
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH semantic_matches AS (
    SELECT
      documents_embeddings.id,
      documents_embeddings.content,
      documents_embeddings.metadata,
      1 - (documents_embeddings.embedding <=> query_embedding) AS similarity
    FROM documents_embeddings
    WHERE metadata @> filter
  ),
  keyword_matches AS (
    SELECT
      documents_embeddings.id,
      ts_rank_cd(to_tsvector('english', documents_embeddings.content), plainto_tsquery('english', query_text)) AS keyword_score
    FROM documents_embeddings
    WHERE metadata @> filter
  )
  SELECT
    sm.id,
    sm.content,
    sm.metadata,
    sm.similarity::float,
    COALESCE(km.keyword_score, 0)::float AS keyword_score,
    -- Hybrid scoring: 70% semantic, 30% keyword (normalized)
    ((sm.similarity * 0.7) + (COALESCE(km.keyword_score, 0) * 0.3))::float AS hybrid_score
  FROM semantic_matches sm
  LEFT JOIN keyword_matches km ON sm.id = km.id
  ORDER BY hybrid_score DESC
  LIMIT match_count;
END;
$$;

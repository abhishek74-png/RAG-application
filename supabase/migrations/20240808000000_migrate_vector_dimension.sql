-- Delete all existing embeddings as they are incompatible with the new dimension size
DELETE FROM documents_embeddings;

-- Drop the old HNSW index if it exists
DROP INDEX IF EXISTS documents_embeddings_embedding_idx;

-- Alter the column type safely
ALTER TABLE documents_embeddings ALTER COLUMN embedding TYPE vector(768);

-- Recreate the index
CREATE INDEX ON documents_embeddings USING hnsw (embedding vector_cosine_ops);

-- Ensure RLS is enabled to prevent cross-tenant leakage
ALTER TABLE documents_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own organization's embeddings
CREATE POLICY "Users can view org embeddings"
ON documents_embeddings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_members.organization_id = (documents_embeddings.metadata->>'organization_id')::uuid 
        AND organization_members.user_id = auth.uid()
    ) OR 
    (metadata->>'organization_id' IS NULL) -- Fallback for personal documents if org system isn't strictly enforced
);

-- Policy to allow inserts for users in the org
CREATE POLICY "Users can insert org embeddings"
ON documents_embeddings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_members.organization_id = (metadata->>'organization_id')::uuid 
        AND organization_members.user_id = auth.uid()
    ) OR 
    (metadata->>'organization_id' IS NULL)
);

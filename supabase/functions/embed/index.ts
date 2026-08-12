// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { RecursiveCharacterTextSplitter } from 'npm:@langchain/textsplitters@0.0.1'
// @ts-ignore
import { GoogleGenerativeAIEmbeddings } from 'npm:@langchain/google-genai@2.2.0'

declare const Deno: any;

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY")

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const prodOrigin = Deno.env.get("ALLOWED_ORIGIN");
  
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    ...(prodOrigin ? [prodOrigin] : [])
  ];

  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { text, fileName, fileId, orgId } = body

    if (!text || !fileName || !fileId) {
      throw new Error('Missing required fields (text, fileName, fileId)')
    }

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not set in environment')
    }

    // 1. Split Text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    // We pass simple text instead of Full Langchain Document class to avoid peer dep issues in Deno
    const chunks = await splitter.createDocuments([text], [{ source_name: fileName }]);

    // 2. Generate Embeddings
    console.log("[EMBEDDING] model: gemini-embedding-2");
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-2",
        apiKey: GOOGLE_API_KEY,
    });

    const chunkTexts = chunks.map((c: any) => c.pageContent);
    const chunkEmbeddings = await embeddings.embedDocuments(chunkTexts);

    if (!chunkEmbeddings || chunkEmbeddings.length === 0 || !chunkEmbeddings[0]) {
        throw new Error("Generated embeddings are empty");
    }
    console.log(`[EMBEDDING] dimension: ${chunkEmbeddings[0].length}`);

    // 3. Insert into Supabase Vector Store
    const documentsToInsert = chunks.map((chunk: any, index: number) => ({
      content: chunk.pageContent,
      metadata: {
        source_name: fileName,
        chunk_id: `${fileId}_${index}`,
        document_id: fileId,
        chunk_index: index,
        organization_id: orgId || null
      },
      embedding: chunkEmbeddings[index]
    }));

    const { error: insertError } = await supabase
      .from('documents_embeddings')
      .insert(documentsToInsert);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Embed error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

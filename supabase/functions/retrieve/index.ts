// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { GoogleGenerativeAIEmbeddings } from 'npm:@langchain/google-genai@2.2.0'

declare const Deno: any;

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
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  try {
    let stage = "1 request received";
    console.log(`[RETRIEVE] ${stage}`);

    stage = "2 request body parsed";
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error(`Invalid JSON body: ${e.message}`);
    }

    const { question, orgId } = body;
    stage = "3 question validated";
    if (!question) throw new Error("Missing question");

    stage = "4 authentication checked";
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }
    
    let userId = user.id;

    stage = "6 Gemini API key checked";
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");

    stage = "7 creating embeddings client";
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-2",
        apiKey: GOOGLE_API_KEY,
    });

    stage = "8 generating query embedding";
    const queryEmbedding = await embeddings.embedQuery(question);

    stage = "9 query embedding generated";
    if (!queryEmbedding || queryEmbedding.length === 0) throw new Error("Generated query embedding is empty");

    stage = `10 embedding dimension = ${queryEmbedding.length}`;
    if (queryEmbedding.length !== 3072) throw new Error(`Invalid dimension: ${queryEmbedding.length}`);

    stage = "11 creating Supabase client";
    // Client already created

    stage = "12 calling match_documents_embeddings";
    const filter = orgId ? { organization_id: orgId } : {};
    
    // TEMPORARY BYPASS: since we bypass auth, RLS might block, but we want to see if it reaches here!
    const { data: results, error } = await supabase.rpc('match_documents_embeddings_hybrid', {
        query_embedding: queryEmbedding,
        query_text: question,
        match_count: 5,
        filter: filter
    });

    if (error) throw new Error(`RPC failed: ${error.message} (details: ${error.details})`);

    stage = "13 vector search completed";
    stage = `14 result count = ${results?.length || 0}`;

    return new Response(JSON.stringify({ success: true, results: results || [], stage }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.log(`[RETRIEVE FAILED] stage=${error.stage || "unknown"}`);
    console.log(error.message);
    console.log(error.stack);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Diagnostic Trace', 
      exact_message: error.message,
      exact_stack: error.stack,
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})

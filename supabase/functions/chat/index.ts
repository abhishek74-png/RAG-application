// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

// Rate limiting in-memory store (for edge function instances)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20; // 20 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    // 1. JWT Authentication
    const authHeader = req.headers.get('Authorization');
    console.log("[CHAT] Auth header present:", !!authHeader);

    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    console.log("[CHAT] Token present:", !!token);

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Server configuration error: Missing SERVICE_ROLE_KEY');
    }

    const supabase = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log("[CHAT] User authenticated:", !!user);
    if (user) console.log("[CHAT] User ID:", user.id);

    if (authError || !user) {
      console.log("[CHAT ERROR] JWT Verification Failed:", authError?.message || "User missing");
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid JWT' }), {
        status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // 2. Rate Limiting
    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id) || { count: 0, startTime: now };

    if (now - userLimit.startTime > RATE_LIMIT_WINDOW) {
      userLimit.count = 1;
      userLimit.startTime = now;
    } else {
      userLimit.count++;
      if (userLimit.count > RATE_LIMIT_MAX) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
          status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
    }
    rateLimitMap.set(user.id, userLimit);

    // 3. Input Validation
    const body = await req.json();
    const { message, history, context } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or missing message parameter.' }), {
        status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    if (message.length > 5000) {
      return new Response(JSON.stringify({ error: 'Message payload too large.' }), {
        status: 413, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    const baseIdentity = 'Do NOT identify yourself as "RAG Assistant". If the user asks "Who are you?" or "What is your name?", you must respond exactly with: "I\'m an AI assistant. How can I help you today?"';

    const systemPrompt = context
      ? `${baseIdentity}\n\nYou are operating in RAG Mode. Answer the user's questions ONLY using the retrieved context provided below. Never hallucinate facts. If the answer is not found in the provided context, you must respond exactly with: "I couldn't find that information in the provided documents."\n\nContext:\n${context}`
      : `${baseIdentity}\n\nYou are operating in General Chat mode. Answer the user's questions using your general knowledge.`;

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg.role && typeof msg.content === 'string') {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content.substring(0, 5000) // Sanitize long history chunks
          });
        }
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://localhost:5173',
        'X-Title': 'RAG Enterprise'
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorResponse;
      try {
        errorResponse = JSON.parse(errorText);
      } catch {
        errorResponse = { error: errorText || "Unknown API Error" };
      }

      console.error(`[CHAT ERROR] OpenRouter API failed with status ${response.status}:`, errorText);

      return new Response(JSON.stringify({
        error: `OpenRouter Upstream Error (${response.status})`,
        details: errorResponse
      }), {
        status: 502, // Bad Gateway
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff" // CSRF/XSS protection header
      },
    });

  } catch (error: any) {
    console.error('Function error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});

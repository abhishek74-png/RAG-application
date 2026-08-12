import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeKey 
  ? new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() })
  : null;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { returnUrl } = await req.json()
    if (!returnUrl) throw new Error('Missing returnUrl')
    
    // Open Redirect Protection
    let safeReturnUrl = 'http://localhost:5173/dashboard/billing'; // Default fallback
    try {
      const parsedUrl = new URL(returnUrl);
      const prodOrigin = Deno.env.get("ALLOWED_ORIGIN");
      const allowedOrigins = [
        'http://localhost:5173', 
        'http://localhost:5174',
        ...(prodOrigin ? [prodOrigin] : [])
      ];
      if (allowedOrigins.includes(parsedUrl.origin)) {
        safeReturnUrl = returnUrl;
      } else {
        throw new Error(`Disallowed returnUrl origin: ${parsedUrl.origin}`);
      }
    } catch (e: any) {
      throw new Error(e.message || 'Invalid returnUrl format');
    }

    // Find customer
    const { data: customerData } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!customerData?.stripe_customer_id) {
      throw new Error('No Stripe customer found for this user.')
    }

    if (!stripe) {
      throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your Supabase project secrets.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerData.stripe_customer_id,
      return_url: safeReturnUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

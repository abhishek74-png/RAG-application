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
    "X-Content-Type-Options": "nosniff"
  };
}

// Basic Rate Limiting
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5; // 5 checkouts per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Rate Limiting
    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id) || { count: 0, startTime: now };
    if (now - userLimit.startTime > RATE_LIMIT_WINDOW) {
      userLimit.count = 1;
      userLimit.startTime = now;
    } else {
      userLimit.count++;
      if (userLimit.count > RATE_LIMIT_MAX) {
        return new Response(JSON.stringify({ error: 'Too many checkout attempts. Please wait.' }), {
          status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
    }
    rateLimitMap.set(user.id, userLimit);

    const body = await req.json()
    const { priceId, returnUrl } = body

    if (!priceId || typeof priceId !== 'string') {
      throw new Error('Invalid priceId')
    }

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

    let customerId: string | undefined = undefined;
    
    const { data: customerData } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customerData?.stripe_customer_id) {
      customerId = customerData.stripe_customer_id;
    }

    if (!stripe) {
      throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your Supabase project secrets.");
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabaseUUID: user.id }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${safeReturnUrl}?success=true`,
      cancel_url: `${safeReturnUrl}?canceled=true`,
      subscription_data: {
        metadata: { supabaseUUID: user.id }
      }
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

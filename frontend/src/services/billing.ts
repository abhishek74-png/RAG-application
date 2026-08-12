import { supabase } from '../lib/supabase';

export const billingService = {
  async createCheckoutSession(priceId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        priceId,
        returnUrl: `${window.location.origin}/dashboard/billing`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    window.location.href = url;
  },

  async createPortalSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/dashboard/billing`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  },

  async getSubscriptionStatus() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .maybeSingle();
      
    if (error) throw error;
    return data;
  }
};

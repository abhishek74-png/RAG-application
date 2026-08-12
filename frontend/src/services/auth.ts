import { supabase } from "../lib/supabase";
import type { User, Session, Provider } from "@supabase/supabase-js";

export const authService = {
  async signUp(
    email: string,
    password: string,
    name?: string
  ): Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }> {
    let first_name = '';
    let last_name = '';
    
    if (name) {
      const nameParts = name.trim().split(' ');
      first_name = nameParts[0];
      last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name,
          last_name,
          full_name: name?.trim() || ''
        }
      }
    });
    return {
      user: data.user,
      session: data.session,
      error,
    };
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return {
      user: data.user,
      session: data.session,
      error,
    };
  },
  
  async signInWithOAuth(provider: Provider): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  },

  async signInWithOtp(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    return { error };
  },

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async forgotPassword(
    email: string
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/dashboard/settings`
      }
    );
    return { error };
  },

  async getCurrentUser(): Promise<{
    user: User | null;
    error: Error | null;
  }> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return { user, error };
  },

  async getSession(): Promise<{
    session: Session | null;
    error: Error | null;
  }> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    return { session, error };
  },

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  },
};
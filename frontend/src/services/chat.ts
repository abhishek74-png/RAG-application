import { supabase } from "../lib/supabase";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: any[];
  updated_at: string;
}

function normalizeApiError(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.message === "string") return obj.message;
    try {
      return JSON.stringify(obj);
    } catch {
      return "Unknown API error";
    }
  }
  return String(value);
}

export const chatService = {
  // ... (keep getSessions, createSession, updateSession, deleteSession intact)
  async getSessions(): Promise<ChatSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from("chats").select("id,user_id,title,messages,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
    if (error) { console.error("Error fetching chats:", error); return []; }
    return data || [];
  },
  async createSession(title: string, messages: any[]): Promise<ChatSession | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("chats").insert({ user_id: user.id, title, messages, updated_at: new Date().toISOString() }).select().single();
    if (error) { console.error("Error creating chat:", error); return null; }
    return data;
  },
  async updateSession(id: string, messages: any[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("chats").update({ messages, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    if (error) { console.error("Error updating chat:", error); }
  },
  async deleteSession(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("chats").delete().eq("id", id).eq("user_id", user.id);
    if (error) { console.error("Error deleting chat:", error); }
  },

  async streamChat(
    message: string,
    history: any[],
    context: string | null,
    onMessage: (chunk: string) => void
  ) {
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("Supabase session exists:", !!session);
    console.log("User exists:", !!session?.user);
    if (session?.user) console.log("User ID:", session.user.id);
    console.log("Token exists:", !!session?.access_token);
    console.log("Token expires at:", session?.expires_at);

    if (!session) {
      throw new Error("Authentication error: Please log in to continue.");
    }

    const isExpired = session.expires_at ? (session.expires_at * 1000) < (Date.now() + 60000) : false; // Check if expired or within 1 minute of expiring
    if (isExpired) {
       const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
       if (refreshError || !refreshed.session) {
          throw new Error("Your session has expired. Please log in again.");
       }
       session = refreshed.session;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ message, history, context }),
          }
        );

        if (response.status === 404) {
           throw new Error("Chat service is unavailable. Please try again later.");
        }

        if (response.status === 401) {
           if (attempts === 0) {
               const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
               if (!refreshError && refreshed.session) {
                   session = refreshed.session;
                   attempts++;
                   continue;
               }
           }
           throw new Error("Your session has expired. Please log in again.");
        }

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError = errorText;
          try { parsedError = JSON.parse(errorText); } catch {}
          const errorMessage = normalizeApiError(parsedError);
          
          if (
            response.status === 403 ||
            errorMessage.toLowerCase().includes("unauthorized") ||
            errorMessage.toLowerCase().includes("invalid jwt")
          ) {
             throw new Error("Your session has expired. Please log in again.");
          }
          
          const err = new Error(errorMessage);
          (err as any).status = response.status;
          throw err;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let answer = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                answer += token;
                onMessage(answer);
              }
            } catch {
              // Ignore incomplete JSON
            }
          }
        }
        return { answer };
      } catch (error: any) {
        attempts++;
        console.warn(`Chat Stream failed (attempt ${attempts})`, error);
        
        const isAuthError = error.message === "Your session has expired. Please log in again." || error.message === "Chat service is unavailable. Please try again later.";
        const transientStatuses = [408, 429, 500, 502, 503, 504];
        
        if (isAuthError || (error.status && !transientStatuses.includes(error.status)) || attempts >= maxRetries) {
          throw error;
        }

        await new Promise((r) => setTimeout(r, attempts * 1000));
      }
    }
    throw new Error("Chat failed.");
  },
};
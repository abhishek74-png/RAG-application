import { supabase } from '../lib/supabase';

export const dashboardService = {
  async getDashboardStats(userId: string) {
    if (!userId) throw new Error('Not authenticated');

    // Fetch documents stats
    const { data: docs, count: docsCount, error: docsError } = await supabase
      .from('documents')
      .select('file_size', { count: 'exact' })
      .eq('user_id', userId);

    if (docsError) throw docsError;

    const totalStorage = docs?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0;

    // Fetch chats count
    const { count: chatsCount, error: chatsError } = await supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (chatsError) throw chatsError;

    // Fetch recent documents
    const { data: recentDocs, error: recentDocsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(4);

    if (recentDocsError) throw recentDocsError;

    return {
      totalDocuments: docsCount || 0,
      totalStorage,
      totalChats: chatsCount || 0,
      activeUsers: 1, // Currently a single-tenant view, user is active
      recentDocuments: recentDocs || [],
      avgResponseTime: '1.2s' // Mocked as we don't store response times in DB yet
    };
  }
};

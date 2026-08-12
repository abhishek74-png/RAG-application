import { supabase } from '../lib/supabase';
import { ragService } from './rag';

export interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export const documentService = {
  async fetchDocuments({ search = '', sortBy = 'uploaded_at', sortOrder = 'desc', page = 1, limit = 10 }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .ilike('file_name', `%${search}%`)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return { data, count: count || 0 };
  },

  async uploadDocument(file: File, onProgress?: (progress: number) => void) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File size exceeds 20MB limit.');
    }

    // 2. Validate format
    const allowedFormats = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    if (!allowedFormats.includes(file.type)) {
      throw new Error('Only PDF, DOCX, and TXT files are supported.');
    }

    onProgress?.(10);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    // 3. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    onProgress?.(60);

    // 4. Store metadata in DB
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    
    onProgress?.(80);
    // 5. Trigger Frontend RAG Processing directly
    try {
      // Avoid awaiting if we don't want to block the UI, but awaiting ensures the progress bar completes properly
      await ragService.processDocument(filePath, file.name, dbData.id);
    } catch(err) {
      console.error("Embedding processing failed in frontend", err);
    }
    
    onProgress?.(100);
    return dbData;
  },

  async deleteDocument(id: string, filePath: string) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);
      
    if (storageError) throw storageError;

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
  },

  async renameDocument(id: string, newName: string) {
    const { data, error } = await supabase
      .from('documents')
      .update({ file_name: newName })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getDownloadUrl(filePath: string, download: boolean = false) {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600, { download });
      
    if (error) throw error;
    return data.signedUrl;
  }
};

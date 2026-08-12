import { supabase } from '../lib/supabase';

export const profileService = {
  async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `profile.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Cache busting by adding timestamp
    const urlWithCacheBuster = `${publicUrl}?updated=${new Date().getTime()}`;

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: urlWithCacheBuster }
    });

    if (updateError) {
      throw updateError;
    }

    return urlWithCacheBuster;
  },

  async deleteAvatar(userId: string): Promise<void> {
    // We should list files in the user's directory to delete the correct one (could be .jpg, .png, etc.)
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId);
      
    if (listError) throw listError;

    if (files && files.length > 0) {
      const pathsToDelete = files.map(f => `${userId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(pathsToDelete);
        
      if (deleteError) throw deleteError;
    }

    // Update user metadata to clear avatar
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: null }
    });

    if (updateError) {
      throw updateError;
    }
  }
};

import { supabase } from './supabase';

const BUCKET = 'imagenes';

/**
 * Uploads a File to Supabase Storage and returns the public URL.
 * The file is placed in the given folder inside the `imagenes` bucket.
 */
export const uploadImage = async (file: File, folder: string): Promise<string> => {
    // Generate a unique filename to avoid collisions
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });

    if (error) {
        console.error('Error uploading image:', error);
        throw error;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
};

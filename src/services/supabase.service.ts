import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. Image uploads will not work.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image to Supabase Storage
 * @param file - File buffer or base64 string
 * @param fileName - Name for the file (will be prefixed with timestamp)
 * @param folder - Folder path in storage bucket (default: 'products')
 * @returns Upload result with URL or error
 */
export const uploadImage = async (
  file: Buffer | string,
  fileName: string,
  folder: string = 'products'
): Promise<UploadImageResult> => {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${timestamp}_${sanitizedFileName}`;

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    if (typeof file === 'string') {
      // Remove data URL prefix if present
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = file;
    }

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
};

/**
 * Delete image from Supabase Storage
 * @param filePath - Path to the file in storage
 * @returns Success status
 */
export const deleteImage = async (filePath: string): Promise<boolean> => {
  if (!supabase) {
    return false;
  }

  try {
    // Extract path from full URL if needed
    const path = filePath.includes('/storage/v1/object/public/product-images/')
      ? filePath.split('/storage/v1/object/public/product-images/')[1]
      : filePath;

    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
};


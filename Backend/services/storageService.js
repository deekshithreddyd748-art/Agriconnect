import crypto from 'crypto';
import path from 'path';
import { AppError } from '../middleware/errorHandler.js';
import { getSupabaseClient } from './supabaseClient.js';

export const ALLOWED_STORAGE_BUCKETS = new Set([
  'equipment-images',
  'facility-images',
  'profile-images',
]);

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Upload validated memory buffers to a Supabase Storage bucket and return public URLs.
 */
export async function uploadFilesToSupabaseStorage({
  files = [],
  bucket,
  ownerId,
  supabase = getSupabaseClient(),
}) {
  if (!Array.isArray(files) || files.length === 0) return [];
  if (!ALLOWED_STORAGE_BUCKETS.has(bucket)) {
    throw new AppError('Unsupported storage bucket.', 400, 'INVALID_BUCKET');
  }

  const safeOwner = String(ownerId || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '');
  const uploadedUrls = [];

  for (const file of files) {
    if (!file || !file.buffer) continue;
    const ext =
      MIME_TO_EXT[file.mimetype] ||
      path.extname(file.originalname || '').replace('.', '').toLowerCase() ||
      'jpg';
    const filePath = `${safeOwner}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(
        `Unable to store uploaded image in ${bucket}: ${uploadError.message}`,
        502,
        'STORAGE_UPLOAD_FAILED'
      );
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
    if (pub?.publicUrl) {
      uploadedUrls.push(pub.publicUrl);
    }
  }

  return uploadedUrls;
}

/**
 * Extract Supabase Storage object keys belonging to a bucket from stored public URLs
 * and remove only objects under the verified owner's prefix.
 */
export async function deleteOwnedStorageImages({
  urls = [],
  bucket,
  ownerId,
  supabase = getSupabaseClient(),
}) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  if (!ALLOWED_STORAGE_BUCKETS.has(bucket) || !ownerId) return;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const safeOwnerPrefix = `${String(ownerId).replace(/[^a-zA-Z0-9_-]/g, '')}/`;

  const keysToDelete = urls
    .filter((u) => typeof u === 'string' && u.includes(marker))
    .map((u) => decodeURIComponent(u.split(marker)[1] || ''))
    .filter((key) => key.startsWith(safeOwnerPrefix));

  if (keysToDelete.length === 0) return;

  await supabase.storage.from(bucket).remove(keysToDelete).catch(() => {});
}

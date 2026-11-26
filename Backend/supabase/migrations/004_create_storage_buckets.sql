-- Migration 004: Supabase Storage Buckets & Policies
-- Execution Order: 4 of 4
-- Creates dedicated buckets for equipment images, facility images, and profile avatars.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('equipment-images', 'equipment-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('facility-images', 'facility-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for showcase images (uploads/deletes go via backend service_role or owner-scoped auth)
DROP POLICY IF EXISTS "Public read AgriConnect images" ON storage.objects;
CREATE POLICY "Public read AgriConnect images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('equipment-images', 'facility-images', 'profile-images'));

DROP POLICY IF EXISTS "Deny direct anon storage writes" ON storage.objects;
CREATE POLICY "Deny direct anon storage writes"
  ON storage.objects
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

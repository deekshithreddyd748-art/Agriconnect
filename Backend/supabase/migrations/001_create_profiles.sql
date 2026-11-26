-- AgriConnect Simplified Profile Identification Schema (Supabase PostgreSQL)
-- Run this migration in Supabase SQL Editor or via Supabase CLI before deploying.
-- Note: This stores non-verified demo profile identification records (NOT verified authentication).

-- 1. Create profiles table (idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2 AND char_length(trim(full_name)) <= 100),
  mobile_number TEXT NOT NULL UNIQUE CHECK (mobile_number ~ '^[6-9][0-9]{9}$'),
  email TEXT NULL,
  role TEXT NULL CHECK (role IS NULL OR role IN ('farmer', 'equipment_owner', 'labour_provider', 'facility_operator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Explicit indexes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_mobile_number ON public.profiles (mobile_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- 3. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

-- 4. Enable Row Level Security (strict non-permissive policies)
-- All public profile identification reads/writes must flow through the Node.js backend
-- using SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS safely on the server side).
-- Direct anon/public client access via Supabase PostgREST is intentionally denied so
-- user mobile numbers and emails cannot be enumerated publicly.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct anon access to profiles" ON public.profiles;
CREATE POLICY "Deny direct anon access to profiles"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Authenticated users can read own profile only" ON public.profiles;
CREATE POLICY "Authenticated users can read own profile only"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can update own profile without admin escalation" ON public.profiles;
CREATE POLICY "Authenticated users can update own profile without admin escalation"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role IS NULL OR role IN ('farmer', 'equipment_owner', 'labour_provider', 'facility_operator'))
  );

-- Rollback instructions (manual):
-- DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
-- DROP FUNCTION IF EXISTS public.set_profiles_updated_at();
-- DROP TABLE IF EXISTS public.profiles;

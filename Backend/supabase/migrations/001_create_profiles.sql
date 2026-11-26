-- Migration 001: Profiles Table, Constraints, Indexes, Triggers & RLS
-- Execution Order: 1 of 4
-- Safe & Idempotent: Can be re-run cleanly without dropping existing data.
-- Security Note: Mobile profile identification is demo-only profile lookup (NOT verified MFA).
-- Direct anon PostgREST access is disabled so mobile numbers/emails cannot be enumerated publicly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2 AND char_length(trim(full_name)) <= 100),
  mobile_number TEXT NOT NULL UNIQUE CHECK (mobile_number ~ '^[6-9][0-9]{9}$'),
  email TEXT NULL,
  role TEXT NULL CHECK (role IS NULL OR role IN ('farmer', 'equipment_owner', 'labour_provider', 'facility_operator', 'admin')),
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'kn', 'hi', 'te', 'ta', 'mr', 'English', 'Kannada', 'Hindi')),
  village TEXT NOT NULL DEFAULT '',
  taluk TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NULL CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION NULL CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  primary_crop TEXT NOT NULL DEFAULT '',
  farm_size NUMERIC(10, 2) NULL CHECK (farm_size IS NULL OR farm_size >= 0),
  farm_size_unit TEXT NOT NULL DEFAULT 'acres' CHECK (farm_size_unit IN ('acres', 'hectares')),
  profile_image TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade path if v1 profiles table already existed with minimal columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS village TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS taluk TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_crop TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_size NUMERIC(10, 2) NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_size_unit TEXT NOT NULL DEFAULT 'acres';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('farmer', 'equipment_owner', 'labour_provider', 'facility_operator', 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_mobile_number ON public.profiles (mobile_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_district_village ON public.profiles (district, village);

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
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
  EXECUTE FUNCTION public.set_row_updated_at();

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

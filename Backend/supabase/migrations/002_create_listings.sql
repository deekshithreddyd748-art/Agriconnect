-- Migration 002: Equipment Listings, Labour Profiles & Facility Listings
-- Execution Order: 2 of 4 (Requires 001_create_profiles.sql)
-- Safe & Idempotent: Preserves existing rows cleanly.

-- 1. Equipment Listings
CREATE TABLE IF NOT EXISTS public.equipment_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL CHECK (char_length(trim(equipment_name)) >= 2),
  equipment_category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  horsepower TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  hourly_price NUMERIC(12, 2) NULL CHECK (hourly_price IS NULL OR hourly_price >= 0),
  daily_price NUMERIC(12, 2) NULL CHECK (daily_price IS NULL OR daily_price >= 0),
  per_acre_price NUMERIC(12, 2) NULL CHECK (per_acre_price IS NULL OR per_acre_price >= 0),
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_unit TEXT NOT NULL DEFAULT 'hour' CHECK (price_unit IN ('hour', 'day', 'acre')),
  service_radius INTEGER NOT NULL DEFAULT 15 CHECK (service_radius >= 1),
  location TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  taluk TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NULL CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION NULL CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  availability_status BOOLEAN NOT NULL DEFAULT TRUE,
  equipment_images TEXT[] NOT NULL DEFAULT '{}',
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT NOT NULL DEFAULT '',
  reported_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_owner_id ON public.equipment_listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment_listings (equipment_category);
CREATE INDEX IF NOT EXISTS idx_equipment_availability ON public.equipment_listings (availability_status);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON public.equipment_listings (district, village);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON public.equipment_listings (created_at DESC);

DROP TRIGGER IF EXISTS trg_equipment_updated_at ON public.equipment_listings;
CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON public.equipment_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.equipment_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read equipment listings" ON public.equipment_listings;
CREATE POLICY "Public read equipment listings"
  ON public.equipment_listings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners manage own equipment" ON public.equipment_listings;
CREATE POLICY "Owners manage own equipment"
  ON public.equipment_listings
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 2. Labour Profiles
CREATE TABLE IF NOT EXISTS public.labour_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General Farm Help',
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT NOT NULL DEFAULT '',
  workers_available INTEGER NOT NULL DEFAULT 1 CHECK (workers_available >= 1),
  daily_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (daily_rate >= 0),
  hourly_rate NUMERIC(12, 2) NULL CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  price_unit TEXT NOT NULL DEFAULT 'day' CHECK (price_unit IN ('day', 'hour')),
  service_radius INTEGER NOT NULL DEFAULT 15 CHECK (service_radius >= 1),
  available_dates TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  taluk TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NULL CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION NULL CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  availability_status BOOLEAN NOT NULL DEFAULT TRUE,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT NOT NULL DEFAULT '',
  reported_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labour_provider_id ON public.labour_profiles (provider_id);
CREATE INDEX IF NOT EXISTS idx_labour_category ON public.labour_profiles (category);
CREATE INDEX IF NOT EXISTS idx_labour_availability ON public.labour_profiles (availability_status);
CREATE INDEX IF NOT EXISTS idx_labour_location ON public.labour_profiles (district, village);
CREATE INDEX IF NOT EXISTS idx_labour_created_at ON public.labour_profiles (created_at DESC);

DROP TRIGGER IF EXISTS trg_labour_updated_at ON public.labour_profiles;
CREATE TRIGGER trg_labour_updated_at
  BEFORE UPDATE ON public.labour_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.labour_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read labour profiles" ON public.labour_profiles;
CREATE POLICY "Public read labour profiles"
  ON public.labour_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Providers manage own labour profile" ON public.labour_profiles;
CREATE POLICY "Providers manage own labour profile"
  ON public.labour_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- 3. Facility Listings
CREATE TABLE IF NOT EXISTS public.facility_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_name TEXT NOT NULL CHECK (char_length(trim(facility_name)) >= 2),
  facility_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  capacity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  available_capacity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (available_capacity >= 0),
  capacity_unit TEXT NOT NULL DEFAULT 'tonnes',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_unit TEXT NOT NULL DEFAULT 'per tonne/day',
  operating_hours TEXT NOT NULL DEFAULT '6:00 AM - 8:00 PM',
  services_offered TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  taluk TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NULL CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION NULL CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  contact_information TEXT NOT NULL DEFAULT '',
  availability_status BOOLEAN NOT NULL DEFAULT TRUE,
  facility_images TEXT[] NOT NULL DEFAULT '{}',
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT NOT NULL DEFAULT '',
  reported_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facility_owner_id ON public.facility_listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_facility_type ON public.facility_listings (facility_type);
CREATE INDEX IF NOT EXISTS idx_facility_availability ON public.facility_listings (availability_status);
CREATE INDEX IF NOT EXISTS idx_facility_location ON public.facility_listings (district, village);
CREATE INDEX IF NOT EXISTS idx_facility_created_at ON public.facility_listings (created_at DESC);

DROP TRIGGER IF EXISTS trg_facility_updated_at ON public.facility_listings;
CREATE TRIGGER trg_facility_updated_at
  BEFORE UPDATE ON public.facility_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.facility_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read facility listings" ON public.facility_listings;
CREATE POLICY "Public read facility listings"
  ON public.facility_listings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners manage own facilities" ON public.facility_listings;
CREATE POLICY "Owners manage own facilities"
  ON public.facility_listings
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

# AgriConnect Supabase SQL Migrations

Execute these scripts **in order** inside your Supabase Dashboard **SQL Editor** (or via Supabase CLI).  
All migrations are idempotent and preserve existing data.

## Execution Order

1. `migrations/001_create_profiles.sql` — Creates/upgrades `public.profiles`, role & mobile constraints, `set_row_updated_at()` trigger function, and strict RLS.
2. `migrations/002_create_listings.sql` — Creates `public.equipment_listings`, `public.labour_profiles`, `public.facility_listings`, indexes, and RLS policies.
3. `migrations/003_create_bookings_reviews_notifications_favourites.sql` — Creates `public.bookings`, `public.reviews`, `public.notifications`, `public.favourites`, `public.labour_requests`, `public.labour_bookings`, `public.labour_applications`, and atomic RPC function `public.transition_booking_atomic`.
4. `migrations/004_create_storage_buckets.sql` — Configures `equipment-images`, `facility-images`, and `profile-images` Supabase Storage buckets and read/write policies.

## Optional Sample Data (Development Only)

- `seed_sample_data.sql` — Separate optional development seed script (`ON CONFLICT DO NOTHING`). Do **not** present sample seed records as real user-generated data in production.

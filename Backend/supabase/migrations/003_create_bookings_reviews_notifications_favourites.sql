-- Migration 003: Bookings, Reviews, Notifications, Favourites & Open Labour Requests
-- Execution Order: 3 of 4 (Requires 001 & 002)

-- 1. Unified Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('equipment', 'labour', 'facility')),
  service_name TEXT NOT NULL DEFAULT '',
  equipment_id UUID NULL REFERENCES public.equipment_listings(id) ON DELETE SET NULL,
  labour_id UUID NULL REFERENCES public.labour_profiles(id) ON DELETE SET NULL,
  facility_id UUID NULL REFERENCES public.facility_listings(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NULL,
  end_time TEXT NULL,
  duration NUMERIC(8, 2) NOT NULL DEFAULT 1 CHECK (duration > 0),
  duration_unit TEXT NOT NULL DEFAULT 'day',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  workers_requested INTEGER NOT NULL DEFAULT 1 CHECK (workers_requested >= 1),
  selected_service TEXT NOT NULL DEFAULT '',
  farm_location JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  farmer_notes TEXT NOT NULL DEFAULT '',
  provider_notes TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'Pay directly to provider upon service delivery (Cash / UPI)',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_no_self_booking CHECK (farmer_id <> provider_id),
  CONSTRAINT bookings_service_fk_match CHECK (
    (service_type = 'equipment' AND equipment_id IS NOT NULL AND labour_id IS NULL AND facility_id IS NULL) OR
    (service_type = 'labour' AND labour_id IS NOT NULL AND equipment_id IS NULL AND facility_id IS NULL) OR
    (service_type = 'facility' AND facility_id IS NOT NULL AND equipment_id IS NULL AND labour_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON public.bookings (farmer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings (provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON public.bookings (status, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON public.bookings (equipment_id) WHERE equipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_labour ON public.bookings (labour_id) WHERE labour_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_facility ON public.bookings (facility_id) WHERE facility_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct anon bookings access" ON public.bookings;
CREATE POLICY "Deny direct anon bookings access"
  ON public.bookings FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Booking participants read own bookings" ON public.bookings;
CREATE POLICY "Booking participants read own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = farmer_id OR auth.uid() = provider_id);

-- 2. Reviews and Ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL DEFAULT '' CHECK (char_length(review_text) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_unique_per_booking_reviewer UNIQUE (booking_id, reviewer_id),
  CONSTRAINT reviews_no_self_review CHECK (reviewer_id <> reviewed_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON public.reviews (reviewed_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews (booking_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews"
  ON public.reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users write own reviews" ON public.reviews;
CREATE POLICY "Authenticated users write own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'booking_created',
      'booking_accepted',
      'booking_rejected',
      'booking_cancelled',
      'booking_completed',
      'labour_request_accepted',
      'system'
    )
  ),
  related_booking_id UUID NULL REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct anon notifications" ON public.notifications;
CREATE POLICY "Deny direct anon notifications"
  ON public.notifications FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
CREATE POLICY "Users access own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Saved Listings / Favourites
CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('equipment', 'labour', 'facility')),
  listing_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favourites_unique_user_listing UNIQUE (user_id, listing_type, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favourites_user ON public.favourites (user_id, created_at DESC);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct anon favourites" ON public.favourites;
CREATE POLICY "Deny direct anon favourites"
  ON public.favourites FOR ALL TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Users manage own favourites" ON public.favourites;
CREATE POLICY "Users manage own favourites"
  ON public.favourites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Farmer Open Labour Requests & Atomic Worker Acceptance
CREATE TABLE IF NOT EXISTS public.labour_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT NOT NULL UNIQUE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  workers_required INTEGER NOT NULL CHECK (workers_required >= 1),
  workers_accepted INTEGER NOT NULL DEFAULT 0 CHECK (workers_accepted >= 0),
  remaining_vacancies INTEGER NOT NULL DEFAULT 1 CHECK (remaining_vacancies >= 0),
  start_date DATE NOT NULL,
  duration_days NUMERIC(6, 2) NOT NULL DEFAULT 1 CHECK (duration_days > 0),
  daily_wage NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (daily_wage >= 0),
  budget NUMERIC(12, 2) NULL CHECK (budget IS NULL OR budget >= 0),
  farm_size NUMERIC(10, 2) NULL CHECK (farm_size IS NULL OR farm_size >= 0),
  farm_size_unit TEXT NOT NULL DEFAULT 'acres' CHECK (farm_size_unit IN ('acres', 'hectares')),
  estimated_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (estimated_total >= 0),
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  instructions TEXT NOT NULL DEFAULT '',
  preferred_hours TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (
    status IN ('Open', 'Applications Received', 'Pending', 'Worker Accepted', 'Partially Filled', 'Filled', 'In Progress', 'Completed', 'Cancelled')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.labour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  request_id UUID NOT NULL REFERENCES public.labour_requests(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_wage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  duration_days NUMERIC(6, 2) NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Accepted' CHECK (status IN ('Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT labour_bookings_unique_worker_request UNIQUE (request_id, worker_id)
);

CREATE TABLE IF NOT EXISTS public.labour_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.labour_requests(id) ON DELETE CASCADE,
  labour_provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workers_offered INTEGER NOT NULL DEFAULT 1 CHECK (workers_offered >= 1),
  proposed_wage NUMERIC(12, 2) NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT labour_applications_unique UNIQUE (request_id, labour_provider_id)
);

CREATE INDEX IF NOT EXISTS idx_labour_requests_farmer ON public.labour_requests (farmer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_labour_requests_status ON public.labour_requests (status, start_date);
CREATE INDEX IF NOT EXISTS idx_labour_bookings_worker ON public.labour_bookings (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_labour_apps_request ON public.labour_applications (request_id, status);

DROP TRIGGER IF EXISTS trg_labour_requests_updated_at ON public.labour_requests;
CREATE TRIGGER trg_labour_requests_updated_at
  BEFORE UPDATE ON public.labour_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_labour_bookings_updated_at ON public.labour_bookings;
CREATE TRIGGER trg_labour_bookings_updated_at
  BEFORE UPDATE ON public.labour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_labour_applications_updated_at ON public.labour_applications;
CREATE TRIGGER trg_labour_applications_updated_at
  BEFORE UPDATE ON public.labour_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.labour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct anon labour requests" ON public.labour_requests;
CREATE POLICY "Deny direct anon labour requests" ON public.labour_requests FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "Deny direct anon labour bookings" ON public.labour_bookings;
CREATE POLICY "Deny direct anon labour bookings" ON public.labour_bookings FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "Deny direct anon labour applications" ON public.labour_applications;
CREATE POLICY "Deny direct anon labour applications" ON public.labour_applications FOR ALL TO anon USING (false) WITH CHECK (false);

-- 6. Atomic Transactional PostgreSQL Function: Transition Booking + Facility Capacity + Notification
CREATE OR REPLACE FUNCTION public.transition_booking_atomic(
  p_booking_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_new_status TEXT,
  p_provider_notes TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_updated public.bookings%ROWTYPE;
  v_facility public.facility_listings%ROWTYPE;
  v_recipient UUID;
  v_notif_type TEXT;
  v_notif_title TEXT;
  v_notif_msg TEXT;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  IF p_actor_role <> 'admin' AND p_actor_id <> v_booking.farmer_id AND p_actor_id <> v_booking.provider_id THEN
    RAISE EXCEPTION 'BOOKING_FORBIDDEN';
  END IF;

  IF p_actor_role <> 'admin' AND p_actor_id = v_booking.farmer_id THEN
    IF p_new_status <> 'Cancelled' THEN
      RAISE EXCEPTION 'FARMER_CAN_ONLY_CANCEL';
    END IF;
    IF v_booking.status <> 'Pending' THEN
      RAISE EXCEPTION 'INVALID_TRANSITION_CANCEL';
    END IF;
  ELSIF p_actor_role <> 'admin' AND p_actor_id = v_booking.provider_id THEN
    IF NOT (
      (v_booking.status = 'Pending' AND p_new_status IN ('Accepted', 'Rejected')) OR
      (v_booking.status = 'Accepted' AND p_new_status = 'Completed')
    ) THEN
      RAISE EXCEPTION 'INVALID_TRANSITION';
    END IF;
  END IF;

  IF v_booking.service_type = 'facility' AND v_booking.status = 'Pending' AND p_new_status = 'Accepted' AND v_booking.facility_id IS NOT NULL THEN
    SELECT * INTO v_facility FROM public.facility_listings WHERE id = v_booking.facility_id FOR UPDATE;
    IF FOUND THEN
      IF v_facility.available_capacity < v_booking.quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_CAPACITY';
      END IF;
      UPDATE public.facility_listings
      SET
        available_capacity = available_capacity - v_booking.quantity,
        availability_status = ((available_capacity - v_booking.quantity) > 0)
      WHERE id = v_facility.id;
    END IF;
  END IF;

  UPDATE public.bookings
  SET
    status = p_new_status,
    provider_notes = COALESCE(p_provider_notes, provider_notes)
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  v_recipient := CASE WHEN p_actor_id = v_booking.farmer_id THEN v_booking.provider_id ELSE v_booking.farmer_id END;
  v_notif_type := CASE p_new_status
    WHEN 'Accepted' THEN 'booking_accepted'
    WHEN 'Rejected' THEN 'booking_rejected'
    WHEN 'Cancelled' THEN 'booking_cancelled'
    WHEN 'Completed' THEN 'booking_completed'
    ELSE 'system'
  END;
  v_notif_title := 'Booking ' || p_new_status;
  v_notif_msg := 'Your booking for ' || v_booking.service_name || ' (' || v_booking.booking_code || ') is now ' || p_new_status || '.';

  INSERT INTO public.notifications (user_id, title, message, notification_type, related_booking_id)
  VALUES (v_recipient, v_notif_title, v_notif_msg, v_notif_type, v_booking.id);

  RETURN v_updated;
END;
$$;

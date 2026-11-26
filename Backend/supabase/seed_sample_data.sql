-- Optional Development Sample Data Script (Separate from Schema Migrations)
-- Run manually ONLY if you want initial demo listings in a development Supabase project.
-- Idempotent: Safe to re-run without overwriting existing records.

INSERT INTO public.profiles (id, full_name, mobile_number, email, role, preferred_language, village, district, state, address, latitude, longitude)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Ramesh Gowda', '9876543210', NULL, 'farmer', 'kn', 'Mandya', 'Mandya', 'Karnataka', 'Mandya Taluk, Mandya, Karnataka', 12.5218, 76.8951),
  ('11111111-1111-4111-8111-111111111102', 'Suresh Patil', '9822011223', NULL, 'equipment_owner', 'en', 'Malegaon Bk', 'Pune', 'Maharashtra', 'Malegaon Bk Farm Hub, Baramati', 18.1742, 74.5390),
  ('11111111-1111-4111-8111-111111111103', 'Mahesh Deshmukh', '9765400112', NULL, 'labour_provider', 'hi', 'Pandare', 'Pune', 'Maharashtra', 'Pandare Gram Panchayat, Baramati', 18.1180, 74.5440),
  ('11111111-1111-4111-8111-111111111104', 'Vikram Kulkarni', '9422055667', NULL, 'facility_operator', 'en', 'MIDC Baramati', 'Pune', 'Maharashtra', 'Plot C-14, Agro Industrial Zone, Baramati', 18.1865, 74.6115)
ON CONFLICT (mobile_number) DO NOTHING;

INSERT INTO public.equipment_listings (
  id, owner_id, equipment_name, equipment_category, description, brand, model, horsepower, year,
  hourly_price, daily_price, price, price_unit, service_radius,
  location, village, district, state, latitude, longitude, availability_status, equipment_images
)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111102',
    'Mahindra Arjun Novo 605 DI Tractor',
    'Tractors',
    '57 HP heavy-duty 4WD tractor ideal for deep ploughing, haulage, and multi-crop land preparation.',
    'Mahindra', 'Arjun Novo 605 DI', '57 HP', '2024',
    750, 5200, 750, 'hour', 20,
    'Malegaon Bk Farm Hub, Baramati', 'Malegaon Bk', 'Pune', 'Maharashtra', 18.1742, 74.5390,
    true, ARRAY['/images/tractor.svg']
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111102',
    'Shaktiman 7-Feet Heavy Rotavator',
    'Rotavators',
    'High-speed 48-blade rotary tiller for fine seedbed preparation in sugarcane and wheat plots.',
    'Shaktiman', ' Champion 7ft', '45+ HP', '2023',
    NULL, 2800, 1100, 'acre', 15,
    'Katphal Link Road, Baramati', 'Katphal', 'Pune', 'Maharashtra', 18.1650, 74.5610,
    true, ARRAY['/images/rotavator.svg']
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.labour_profiles (
  id, provider_id, title, category, skills, experience, workers_available, daily_rate, hourly_rate, price_unit,
  location, village, district, state, latitude, longitude, availability_status, description
)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111103',
    'Sahyadri Skilled Harvest & Sowing Crew',
    'Harvesting',
    ARRAY['Harvesting', 'Sowing', 'Weeding'],
    '8+ years farm supervision',
    8, 450, 75, 'day',
    'Pandare Gram Panchayat, Baramati', 'Pandare', 'Pune', 'Maharashtra', 18.1180, 74.5440,
    true, 'Experienced local agricultural crew available for seasonal harvesting, sowing, and weeding.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.facility_listings (
  id, owner_id, facility_name, facility_type, description, capacity, available_capacity, capacity_unit,
  price, price_unit, location, village, district, state, latitude, longitude, contact_information, availability_status, facility_images
)
VALUES
  (
    '44444444-4444-4444-8444-444444444401',
    '11111111-1111-4111-8111-111111111104',
    'Baramati Multi-Chamber Cold Storage',
    'Cold Storage',
    'Temperature-controlled cold storage facility for onions, potatoes, fruits, and horticulture produce.',
    500, 320, 'tonnes',
    35, 'per tonne/day',
    'Plot C-14, Agro Industrial Zone, Baramati', 'MIDC Baramati', 'Pune', 'Maharashtra', 18.1865, 74.6115,
    '+91 94220 55667', true, ARRAY['/images/cold-storage.svg']
  )
ON CONFLICT (id) DO NOTHING;

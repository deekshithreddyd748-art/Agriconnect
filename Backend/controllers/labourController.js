import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatLabourRow,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';
import { hasValidCoords } from '../utils/haversine.js';
import {
  extractQueryCoords,
  normalizeLocation,
  parseMaybeJson,
} from '../utils/listingHelpers.js';

const LABOUR_SELECT =
  '*, provider:profiles!labour_profiles_provider_id_fkey(id, full_name, mobile_number, village, district, state, role)';

function normalizeSkills(raw) {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const parsed = parseMaybeJson(raw, null);
    if (Array.isArray(parsed)) {
      return parsed.map((s) => String(s).trim()).filter(Boolean);
    }
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export const getLabours = asyncHandler(async (req, res) => {
  const {
    category,
    maxPrice,
    minWorkers,
    availability,
    search,
    providerId,
    district,
    village,
  } = req.query;
  const supabase = getSupabaseClient();
  const { page, limit } = parsePagination(req.query, 24, 50);

  let query = supabase
    .from('labour_profiles')
    .select(LABOUR_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  if (providerId) {
    assertValidUuid(providerId, 'providerId');
    query = query.eq('provider_id', providerId);
  }
  if (district && district.trim()) {
    query = query.ilike('district', `%${district.trim()}%`);
  }
  if (village && village.trim()) {
    query = query.ilike('village', `%${village.trim()}%`);
  }
  if (availability === 'true' || availability === 'false') {
    query = query.eq('availability_status', availability === 'true');
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (Number.isFinite(max) && max >= 0) {
      query = query.lte('daily_rate', max);
    }
  }
  if (minWorkers !== undefined && minWorkers !== '') {
    const min = Number(minWorkers);
    if (Number.isFinite(min) && min >= 1) {
      query = query.gte('workers_available', min);
    }
  }
  if (search && search.trim()) {
    const q = search.trim().replace(/,/g, ' ');
    query = query.or(
      `title.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%,village.ilike.%${q}%,district.ilike.%${q}%`
    );
  }

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const userHasCoords = hasValidCoords(userCoords);

  if (!userHasCoords) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data: rows, count, error } = await query;
  if (error) throw mapSupabaseError(error, 'Could not load labour profiles.');

  let results = (rows || []).map((r) => formatLabourRow(r, userCoords));

  if (userHasCoords) {
    const parsedRadius = Number(radiusKm);
    if (Number.isFinite(parsedRadius) && parsedRadius > 0) {
      results = results.filter(
        (item) => item.distanceKm !== null && item.distanceKm <= parsedRadius
      );
    }
    results.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    const total = results.length;
    const sliced = results.slice((page - 1) * limit, page * limit);
    return res.json({
      success: true,
      count: sliced.length,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      data: sliced,
    });
  }

  const total = count ?? results.length;
  return res.json({
    success: true,
    count: results.length,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    data: results,
  });
});

export const getLabourById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour profile id');
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from('labour_profiles')
    .select(LABOUR_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Failed to fetch labour profile.');
  if (!row) throw new AppError('Labour listing not found.', 404);

  const { userCoords } = extractQueryCoords(req.query);
  res.json({
    success: true,
    data: formatLabourRow(row, userCoords),
  });
});

export const createLabour = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    skills,
    experience = '',
    workersAvailable = 1,
    pricePerWorker,
    daily_rate,
    hourly_rate,
    priceUnit,
    price_unit,
    availability,
    availability_status,
    availableDates = [],
    serviceRadius = 15,
    description = '',
    location,
    village,
    taluk,
    district,
    state,
    latitude,
    longitude,
  } = req.body;

  const finalCategory = String(category || 'General Farm Labour').trim();
  const dailyRateNum = Number(daily_rate ?? pricePerWorker ?? 0);
  if (!Number.isFinite(dailyRateNum) || dailyRateNum < 0) {
    throw new AppError('Please provide a valid daily or hourly rate.', 400);
  }

  const supabase = getSupabaseClient();
  const normalizedLoc = normalizeLocation(
    location || { lat: latitude, lng: longitude, village, district, state },
    req.user
  );

  const payload = {
    provider_id: req.user.id,
    title: String(title || `${finalCategory} Service`).trim(),
    category: finalCategory,
    skills: normalizeSkills(skills),
    experience: String(experience).trim(),
    workers_available: Math.max(1, Number(workersAvailable) || 1),
    daily_rate: dailyRateNum,
    hourly_rate:
      hourly_rate !== undefined && hourly_rate !== ''
        ? Number(hourly_rate)
        : (price_unit || priceUnit) === 'hour'
          ? dailyRateNum
          : null,
    price_unit: ['day', 'hour'].includes(price_unit || priceUnit) ? price_unit || priceUnit : 'day',
    service_radius: Number(serviceRadius) || 15,
    available_dates: normalizeSkills(availableDates),
    description: String(description).trim(),
    location:
      normalizedLoc.address ||
      [normalizedLoc.village, normalizedLoc.district].filter(Boolean).join(', '),
    village: normalizedLoc.village || '',
    taluk: String(taluk || '').trim(),
    district: normalizedLoc.district || '',
    state: normalizedLoc.state || '',
    latitude: normalizedLoc.lat,
    longitude: normalizedLoc.lng,
    availability_status:
      availability_status !== undefined
        ? Boolean(availability_status)
        : availability === undefined
          ? true
          : availability === true || availability === 'true',
  };

  const { data: created, error } = await supabase
    .from('labour_profiles')
    .insert(payload)
    .select(LABOUR_SELECT)
    .single();

  if (error) throw mapSupabaseError(error, 'Could not save labour profile.');

  res.status(201).json({
    success: true,
    data: formatLabourRow(created),
  });
});

export const updateLabour = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour profile id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('labour_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read labour profile.');
  if (!existing) throw new AppError('Labour listing not found.', 404);

  if (req.user.role !== 'admin' && existing.provider_id !== req.user.id) {
    throw new AppError('You can only modify your own labour profile.', 403);
  }

  const updates = {};
  if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
  if (req.body.category !== undefined) updates.category = String(req.body.category).trim();
  if (req.body.skills !== undefined) updates.skills = normalizeSkills(req.body.skills);
  if (req.body.experience !== undefined) updates.experience = String(req.body.experience).trim();
  if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
  if (req.body.workersAvailable !== undefined || req.body.workers_available !== undefined) {
    updates.workers_available = Math.max(
      1,
      Number(req.body.workers_available ?? req.body.workersAvailable) || 1
    );
  }
  if (req.body.daily_rate !== undefined || req.body.pricePerWorker !== undefined) {
    const rate = Number(req.body.daily_rate ?? req.body.pricePerWorker);
    if (!Number.isFinite(rate) || rate < 0) throw new AppError('Invalid rate.', 400);
    updates.daily_rate = rate;
  }
  if (req.body.hourly_rate !== undefined) {
    updates.hourly_rate = req.body.hourly_rate === '' ? null : Number(req.body.hourly_rate);
  }
  const unit = req.body.price_unit ?? req.body.priceUnit;
  if (unit && ['day', 'hour'].includes(unit)) updates.price_unit = unit;
  if (req.body.serviceRadius !== undefined) {
    updates.service_radius = Number(req.body.serviceRadius) || 15;
  }
  if (req.body.availableDates !== undefined) {
    updates.available_dates = normalizeSkills(req.body.availableDates);
  }
  if (req.body.availability !== undefined || req.body.availability_status !== undefined) {
    const rawAvail = req.body.availability_status ?? req.body.availability;
    updates.availability_status = rawAvail === true || rawAvail === 'true';
  }
  if (req.body.location || req.body.village !== undefined || req.body.district !== undefined) {
    const loc = normalizeLocation(
      req.body.location || {
        lat: req.body.latitude,
        lng: req.body.longitude,
        village: req.body.village,
        district: req.body.district,
        state: req.body.state,
      },
      {
        village: existing.village,
        district: existing.district,
        state: existing.state,
        location: { address: existing.location, lat: existing.latitude, lng: existing.longitude },
      }
    );
    updates.latitude = loc.lat;
    updates.longitude = loc.lng;
    updates.location = loc.address;
    updates.village = loc.village || existing.village;
    updates.district = loc.district || existing.district;
    updates.state = loc.state || existing.state;
  }

  const { data: updated, error: updErr } = await supabase
    .from('labour_profiles')
    .update(updates)
    .eq('id', id)
    .select(LABOUR_SELECT)
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not update labour profile.');

  res.json({
    success: true,
    data: formatLabourRow(updated),
  });
});

export const deleteLabour = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour profile id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('labour_profiles')
    .select('id, provider_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read labour profile.');
  if (!existing) throw new AppError('Labour listing not found.', 404);

  if (req.user.role !== 'admin' && existing.provider_id !== req.user.id) {
    throw new AppError('You can only delete your own labour listings.', 403);
  }

  const { error: delErr } = await supabase
    .from('labour_profiles')
    .delete()
    .eq('id', id);

  if (delErr) throw mapSupabaseError(delErr, 'Could not delete labour profile.');

  res.json({
    success: true,
    message: 'Labour listing deleted.',
  });
});

import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatEquipmentRow,
  isValidUuid,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';
import {
  deleteOwnedStorageImages,
  uploadFilesToSupabaseStorage,
} from '../services/storageService.js';
import { calculateDistanceKm, hasValidCoords } from '../utils/haversine.js';
import {
  extractQueryCoords,
  normalizeLocation,
  parseMaybeJson,
} from '../utils/listingHelpers.js';

const EQUIPMENT_SELECT =
  '*, owner:profiles!equipment_listings_owner_id_fkey(id, full_name, mobile_number, village, district, state, role)';

export const getEquipments = asyncHandler(async (req, res) => {
  const { category, maxPrice, availability, search, ownerId, district, village } = req.query;
  const supabase = getSupabaseClient();
  const { page, limit } = parsePagination(req.query, 24, 50);

  let query = supabase
    .from('equipment_listings')
    .select(EQUIPMENT_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('equipment_category', category);
  }
  if (ownerId) {
    assertValidUuid(ownerId, 'ownerId');
    query = query.eq('owner_id', ownerId);
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
      query = query.lte('price', max);
    }
  }
  if (search && search.trim()) {
    const q = search.trim().replace(/,/g, ' ');
    query = query.or(
      `equipment_name.ilike.%${q}%,equipment_category.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,village.ilike.%${q}%,district.ilike.%${q}%`
    );
  }

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const userHasCoords = hasValidCoords(userCoords);

  // If no GPS radius sort is active, paginate directly in PostgreSQL
  if (!userHasCoords) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data: rows, count, error } = await query;
  if (error) throw mapSupabaseError(error, 'Could not load equipment listings.');

  let results = (rows || []).map((r) => formatEquipmentRow(r, userCoords));

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

export const getEquipmentById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'equipment id');
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from('equipment_listings')
    .select(EQUIPMENT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Failed to fetch equipment details.');
  if (!row) throw new AppError('Equipment listing not found.', 404);

  const { userCoords } = extractQueryCoords(req.query);
  const formatted = formatEquipmentRow(row, userCoords);
  if (hasValidCoords(userCoords) && formatted.locationAvailable) {
    formatted.distanceKm = calculateDistanceKm(userCoords, formatted.location);
  }

  res.json({
    success: true,
    data: formatted,
  });
});

export const createEquipment = asyncHandler(async (req, res) => {
  const {
    name,
    equipment_name,
    category,
    equipment_category,
    description = '',
    brand,
    model,
    price,
    hourly_price,
    daily_price,
    per_acre_price,
    priceUnit,
    price_unit,
    availability,
    availability_status,
    serviceRadius,
    service_radius,
    location,
    village,
    taluk,
    district,
    state,
    latitude,
    longitude,
    specifications,
  } = req.body;

  const finalName = String(equipment_name ?? name ?? '').trim();
  const finalCategory = String(equipment_category ?? category ?? '').trim();
  if (!finalName || !finalCategory) {
    throw new AppError('Equipment name and category are required.', 400);
  }

  const resolvedUnit = ['hour', 'day', 'acre'].includes(price_unit || priceUnit)
    ? price_unit || priceUnit
    : 'hour';
  const basePrice = Number(price ?? hourly_price ?? daily_price ?? per_acre_price);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new AppError('Please provide a valid non-negative price.', 400);
  }

  const supabase = getSupabaseClient();
  const specs = parseMaybeJson(specifications, {});
  const normalizedLoc = normalizeLocation(
    location || {
      lat: latitude,
      lng: longitude,
      village,
      district,
      state,
    },
    req.user
  );

  const uploadedUrls = await uploadFilesToSupabaseStorage({
    files: req.files || [],
    bucket: 'equipment-images',
    ownerId: req.user.id,
    supabase,
  });

  const existingBodyImages = parseMaybeJson(req.body.images, []);
  const images = [
    ...(Array.isArray(existingBodyImages)
      ? existingBodyImages.filter((u) => typeof u === 'string' && u.trim())
      : []),
    ...uploadedUrls,
  ];

  const payload = {
    owner_id: req.user.id,
    equipment_name: finalName,
    equipment_category: finalCategory,
    description: String(description).trim(),
    brand: String(brand ?? specs.brand ?? '').trim(),
    model: String(model ?? specs.model ?? '').trim(),
    horsepower: String(specs.horsepower ?? '').trim(),
    year: String(specs.year ?? '').trim(),
    hourly_price:
      hourly_price !== undefined && hourly_price !== ''
        ? Number(hourly_price)
        : resolvedUnit === 'hour'
          ? basePrice
          : null,
    daily_price:
      daily_price !== undefined && daily_price !== ''
        ? Number(daily_price)
        : resolvedUnit === 'day'
          ? basePrice
          : null,
    per_acre_price:
      per_acre_price !== undefined && per_acre_price !== ''
        ? Number(per_acre_price)
        : resolvedUnit === 'acre'
          ? basePrice
          : null,
    price: basePrice,
    price_unit: resolvedUnit,
    service_radius: Number(service_radius ?? serviceRadius) || 15,
    location: normalizedLoc.address || [normalizedLoc.village, normalizedLoc.district].filter(Boolean).join(', '),
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
    equipment_images: images,
  };

  const { data: created, error } = await supabase
    .from('equipment_listings')
    .insert(payload)
    .select(EQUIPMENT_SELECT)
    .single();

  if (error) throw mapSupabaseError(error, 'Could not save equipment listing.');

  res.status(201).json({
    success: true,
    data: formatEquipmentRow(created),
  });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'equipment id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('equipment_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read equipment listing.');
  if (!existing) throw new AppError('Equipment listing not found.', 404);

  if (req.user.role !== 'admin' && existing.owner_id !== req.user.id) {
    throw new AppError('You can only modify your own equipment listings.', 403);
  }

  const updates = {};
  const nextName = req.body.equipment_name ?? req.body.name;
  const nextCategory = req.body.equipment_category ?? req.body.category;
  if (nextName !== undefined) updates.equipment_name = String(nextName).trim();
  if (nextCategory !== undefined) updates.equipment_category = String(nextCategory).trim();
  if (req.body.description !== undefined) updates.description = String(req.body.description).trim();

  if (req.body.price !== undefined) {
    const p = Number(req.body.price);
    if (!Number.isFinite(p) || p < 0) throw new AppError('Invalid price.', 400);
    updates.price = p;
  }
  const nextUnit = req.body.price_unit ?? req.body.priceUnit;
  if (nextUnit && ['hour', 'day', 'acre'].includes(nextUnit)) {
    updates.price_unit = nextUnit;
  }
  if (req.body.hourly_price !== undefined) {
    updates.hourly_price = req.body.hourly_price === '' ? null : Number(req.body.hourly_price);
  }
  if (req.body.daily_price !== undefined) {
    updates.daily_price = req.body.daily_price === '' ? null : Number(req.body.daily_price);
  }
  if (req.body.serviceRadius !== undefined || req.body.service_radius !== undefined) {
    updates.service_radius = Number(req.body.service_radius ?? req.body.serviceRadius) || 15;
  }
  if (req.body.availability !== undefined || req.body.availability_status !== undefined) {
    const rawAvail = req.body.availability_status ?? req.body.availability;
    updates.availability_status = rawAvail === true || rawAvail === 'true';
  }

  if (req.body.specifications !== undefined || req.body.brand !== undefined || req.body.model !== undefined) {
    const specs = parseMaybeJson(req.body.specifications, {});
    if ((req.body.brand ?? specs.brand) !== undefined) updates.brand = String(req.body.brand ?? specs.brand ?? '').trim();
    if ((req.body.model ?? specs.model) !== undefined) updates.model = String(req.body.model ?? specs.model ?? '').trim();
    if (specs.horsepower !== undefined) updates.horsepower = String(specs.horsepower).trim();
    if (specs.year !== undefined) updates.year = String(specs.year).trim();
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
  if (req.body.taluk !== undefined) updates.taluk = String(req.body.taluk).trim();

  if (Array.isArray(req.files) && req.files.length > 0) {
    const uploaded = await uploadFilesToSupabaseStorage({
      files: req.files,
      bucket: 'equipment-images',
      ownerId: existing.owner_id,
      supabase,
    });
    const bodyImages = parseMaybeJson(req.body.images, existing.equipment_images || []);
    updates.equipment_images = [
      ...(Array.isArray(bodyImages) ? bodyImages.filter((u) => typeof u === 'string' && u.trim()) : []),
      ...uploaded,
    ];
  } else if (req.body.images !== undefined) {
    const parsed = parseMaybeJson(req.body.images, null);
    if (Array.isArray(parsed)) {
      updates.equipment_images = parsed.filter((u) => typeof u === 'string' && u.trim());
    }
  }

  const { data: updated, error: updErr } = await supabase
    .from('equipment_listings')
    .update(updates)
    .eq('id', id)
    .select(EQUIPMENT_SELECT)
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not update equipment listing.');

  res.json({
    success: true,
    data: formatEquipmentRow(updated),
  });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'equipment id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('equipment_listings')
    .select('id, owner_id, equipment_images')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read equipment listing.');
  if (!existing) throw new AppError('Equipment listing not found.', 404);

  if (req.user.role !== 'admin' && existing.owner_id !== req.user.id) {
    throw new AppError('You can only delete your own equipment listings.', 403);
  }

  await deleteOwnedStorageImages({
    urls: existing.equipment_images || [],
    bucket: 'equipment-images',
    ownerId: existing.owner_id,
    supabase,
  });

  const { error: delErr } = await supabase
    .from('equipment_listings')
    .delete()
    .eq('id', id);

  if (delErr) throw mapSupabaseError(delErr, 'Could not delete equipment listing.');

  res.json({
    success: true,
    message: 'Equipment listing removed.',
  });
});

export { isValidUuid };

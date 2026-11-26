import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatFacilityRow,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';
import {
  deleteOwnedStorageImages,
  uploadFilesToSupabaseStorage,
} from '../services/storageService.js';
import { hasValidCoords } from '../utils/haversine.js';
import {
  extractQueryCoords,
  normalizeLocation,
  parseMaybeJson,
} from '../utils/listingHelpers.js';

const FACILITY_SELECT =
  '*, owner:profiles!facility_listings_owner_id_fkey(id, full_name, mobile_number, village, district, state, role)';

export const getFacilities = asyncHandler(async (req, res) => {
  const {
    category,
    maxPrice,
    minCapacity,
    availability,
    search,
    operatorId,
    ownerId,
    district,
    village,
  } = req.query;
  const supabase = getSupabaseClient();
  const { page, limit } = parsePagination(req.query, 24, 50);

  let query = supabase
    .from('facility_listings')
    .select(FACILITY_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.ilike('facility_type', category);
  }
  const resolvedOwner = ownerId || operatorId;
  if (resolvedOwner) {
    assertValidUuid(resolvedOwner, 'ownerId');
    query = query.eq('owner_id', resolvedOwner);
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
  if (minCapacity !== undefined && minCapacity !== '') {
    const min = Number(minCapacity);
    if (Number.isFinite(min) && min >= 0) {
      query = query.gte('available_capacity', min);
    }
  }
  if (search && search.trim()) {
    const q = search.trim().replace(/,/g, ' ');
    query = query.or(
      `facility_name.ilike.%${q}%,facility_type.ilike.%${q}%,description.ilike.%${q}%,village.ilike.%${q}%,district.ilike.%${q}%`
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
  if (error) throw mapSupabaseError(error, 'Could not load facilities.');

  let results = (rows || []).map((r) => formatFacilityRow(r, userCoords));

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

export const getFacilityById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'facility id');
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from('facility_listings')
    .select(FACILITY_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Failed to fetch facility details.');
  if (!row) throw new AppError('Facility listing not found.', 404);

  const { userCoords } = extractQueryCoords(req.query);
  res.json({
    success: true,
    data: formatFacilityRow(row, userCoords),
  });
});

export const createFacility = asyncHandler(async (req, res) => {
  const {
    name,
    facility_name,
    category,
    facility_type,
    description = '',
    capacity,
    availableCapacity,
    available_capacity,
    capacityUnit,
    capacity_unit,
    price,
    priceUnit,
    price_unit,
    operatingHours,
    operating_hours,
    servicesOffered,
    services_offered,
    availability,
    availability_status,
    contactPhone,
    contact_information,
    location,
    village,
    taluk,
    district,
    state,
    latitude,
    longitude,
  } = req.body;

  const finalName = String(facility_name ?? name ?? '').trim();
  const finalType = String(facility_type ?? category ?? '').trim();
  if (!finalName || !finalType) {
    throw new AppError('Facility name and type are required.', 400);
  }

  const parsedCap = Number(capacity);
  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedCap) || parsedCap < 1) {
    throw new AppError('Valid total capacity (>= 1) is required.', 400);
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    throw new AppError('Valid service charge is required.', 400);
  }

  const parsedAvailable =
    (available_capacity ?? availableCapacity) !== undefined &&
    (available_capacity ?? availableCapacity) !== ''
      ? Math.min(parsedCap, Math.max(0, Number(available_capacity ?? availableCapacity)))
      : parsedCap;

  const supabase = getSupabaseClient();
  const normalizedLoc = normalizeLocation(
    location || { lat: latitude, lng: longitude, village, district, state },
    req.user
  );

  const uploadedUrls = await uploadFilesToSupabaseStorage({
    files: req.files || [],
    bucket: 'facility-images',
    ownerId: req.user.id,
    supabase,
  });
  const bodyImages = parseMaybeJson(req.body.images, []);
  const images = [
    ...(Array.isArray(bodyImages) ? bodyImages.filter((u) => typeof u === 'string' && u.trim()) : []),
    ...uploadedUrls,
  ];

  const rawServices = parseMaybeJson(services_offered ?? servicesOffered, []);
  const servicesList = Array.isArray(rawServices)
    ? rawServices.map((s) => String(s).trim()).filter(Boolean)
    : String(rawServices || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const payload = {
    owner_id: req.user.id,
    facility_name: finalName,
    facility_type: finalType,
    description: String(description).trim(),
    capacity: parsedCap,
    available_capacity: parsedAvailable,
    capacity_unit: String(capacity_unit ?? capacityUnit ?? 'tonnes').trim(),
    price: parsedPrice,
    price_unit: String(price_unit ?? priceUnit ?? 'per tonne/day').trim(),
    operating_hours: String(operating_hours ?? operatingHours ?? '6:00 AM - 8:00 PM').trim(),
    services_offered: servicesList,
    location:
      normalizedLoc.address ||
      [normalizedLoc.village, normalizedLoc.district].filter(Boolean).join(', '),
    village: normalizedLoc.village || '',
    taluk: String(taluk || '').trim(),
    district: normalizedLoc.district || '',
    state: normalizedLoc.state || '',
    latitude: normalizedLoc.lat,
    longitude: normalizedLoc.lng,
    contact_information: String(contact_information ?? contactPhone ?? req.user.phone ?? '').trim(),
    availability_status:
      availability_status !== undefined
        ? Boolean(availability_status)
        : availability === undefined
          ? parsedAvailable > 0
          : availability === true || availability === 'true',
    facility_images: images,
  };

  const { data: created, error } = await supabase
    .from('facility_listings')
    .insert(payload)
    .select(FACILITY_SELECT)
    .single();

  if (error) throw mapSupabaseError(error, 'Could not save facility listing.');

  res.status(201).json({
    success: true,
    data: formatFacilityRow(created),
  });
});

export const updateFacility = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'facility id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('facility_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read facility listing.');
  if (!existing) throw new AppError('Facility listing not found.', 404);

  if (req.user.role !== 'admin' && existing.owner_id !== req.user.id) {
    throw new AppError('You can only modify your own facility listings.', 403);
  }

  const updates = {};
  const nextName = req.body.facility_name ?? req.body.name;
  const nextType = req.body.facility_type ?? req.body.category;
  if (nextName !== undefined) updates.facility_name = String(nextName).trim();
  if (nextType !== undefined) updates.facility_type = String(nextType).trim();
  if (req.body.description !== undefined) updates.description = String(req.body.description).trim();

  if (req.body.capacity !== undefined) {
    updates.capacity = Math.max(1, Number(req.body.capacity));
  }
  if (req.body.availableCapacity !== undefined || req.body.available_capacity !== undefined) {
    updates.available_capacity = Math.max(
      0,
      Number(req.body.available_capacity ?? req.body.availableCapacity)
    );
  }
  if (req.body.capacityUnit !== undefined || req.body.capacity_unit !== undefined) {
    updates.capacity_unit = String(req.body.capacity_unit ?? req.body.capacityUnit).trim();
  }
  if (req.body.price !== undefined) updates.price = Math.max(0, Number(req.body.price));
  if (req.body.priceUnit !== undefined || req.body.price_unit !== undefined) {
    updates.price_unit = String(req.body.price_unit ?? req.body.priceUnit).trim();
  }
  if (req.body.operatingHours !== undefined || req.body.operating_hours !== undefined) {
    updates.operating_hours = String(req.body.operating_hours ?? req.body.operatingHours).trim();
  }
  if (req.body.contactPhone !== undefined || req.body.contact_information !== undefined) {
    updates.contact_information = String(
      req.body.contact_information ?? req.body.contactPhone
    ).trim();
  }
  if (req.body.servicesOffered !== undefined || req.body.services_offered !== undefined) {
    const raw = parseMaybeJson(req.body.services_offered ?? req.body.servicesOffered, []);
    updates.services_offered = Array.isArray(raw)
      ? raw.map((s) => String(s).trim()).filter(Boolean)
      : [];
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

  if (Array.isArray(req.files) && req.files.length > 0) {
    const uploaded = await uploadFilesToSupabaseStorage({
      files: req.files,
      bucket: 'facility-images',
      ownerId: existing.owner_id,
      supabase,
    });
    const bodyImages = parseMaybeJson(req.body.images, existing.facility_images || []);
    updates.facility_images = [
      ...(Array.isArray(bodyImages) ? bodyImages.filter((u) => typeof u === 'string' && u.trim()) : []),
      ...uploaded,
    ];
  }

  const { data: updated, error: updErr } = await supabase
    .from('facility_listings')
    .update(updates)
    .eq('id', id)
    .select(FACILITY_SELECT)
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not update facility listing.');

  res.json({
    success: true,
    data: formatFacilityRow(updated),
  });
});

export const deleteFacility = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'facility id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('facility_listings')
    .select('id, owner_id, facility_images')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read facility listing.');
  if (!existing) throw new AppError('Facility listing not found.', 404);

  if (req.user.role !== 'admin' && existing.owner_id !== req.user.id) {
    throw new AppError('You can only delete your own facility listings.', 403);
  }

  await deleteOwnedStorageImages({
    urls: existing.facility_images || [],
    bucket: 'facility-images',
    ownerId: existing.owner_id,
    supabase,
  });

  const { error: delErr } = await supabase
    .from('facility_listings')
    .delete()
    .eq('id', id);

  if (delErr) throw mapSupabaseError(delErr, 'Could not delete facility listing.');

  res.json({
    success: true,
    message: 'Facility listing removed.',
  });
});

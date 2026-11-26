import crypto from 'crypto';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatBookingRow,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';
import { normalizeLocation } from '../utils/listingHelpers.js';

const BOOKING_SELECT = `
  *,
  farmer:profiles!bookings_farmer_id_fkey(id, full_name, mobile_number, email, village, district, state, latitude, longitude, address),
  provider:profiles!bookings_provider_id_fkey(id, full_name, mobile_number, email, village, district, state, latitude, longitude, address),
  equipment:equipment_listings(*),
  labour:labour_profiles(*),
  facility:facility_listings(*)
`;

const SERVICE_TABLE_MAP = {
  equipment: {
    table: 'equipment_listings',
    fkColumn: 'equipment_id',
    ownerField: 'owner_id',
    getName: (row) => row.equipment_name,
  },
  labour: {
    table: 'labour_profiles',
    fkColumn: 'labour_id',
    ownerField: 'provider_id',
    getName: (row) => row.title || `${row.category} Team`,
  },
  facility: {
    table: 'facility_listings',
    fkColumn: 'facility_id',
    ownerField: 'owner_id',
    getName: (row) => row.facility_name,
  },
};

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateBookingCode() {
  return `AGC-${new Date().getFullYear()}-${crypto.randomInt(10000, 99999)}`;
}

export async function handleCreateBooking({
  user,
  body,
  supabase = getSupabaseClient(),
}) {
  const {
    serviceType,
    service_type,
    serviceId,
    equipmentId,
    equipment_id,
    labourId,
    labour_id,
    facilityId,
    facility_id,
    bookingDate,
    booking_date,
    startTime,
    start_time,
    endTime,
    end_time,
    duration = 1,
    durationUnit,
    workersRequested = 1,
    quantity = 1,
    selectedService = '',
    farmLocation,
    notes,
    farmerNotes,
    farmer_notes,
    paymentMethod = 'Pay directly to provider upon service delivery (Cash / UPI)',
  } = body || {};

  const finalType = String(service_type ?? serviceType ?? '').trim();
  const cfg = SERVICE_TABLE_MAP[finalType];
  if (!cfg) {
    throw new AppError('Invalid service type. Must be equipment, labour, or facility.', 400);
  }

  const targetServiceId = assertValidUuid(
    serviceId ??
      (finalType === 'equipment'
        ? equipment_id ?? equipmentId
        : finalType === 'labour'
          ? labour_id ?? labourId
          : facility_id ?? facilityId),
    'service id'
  );

  const finalBookingDate = String(booking_date ?? bookingDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(finalBookingDate)) {
    throw new AppError('Valid booking date (YYYY-MM-DD) is required.', 400);
  }
  if (finalBookingDate < getTodayIsoDate()) {
    throw new AppError('Booking date cannot be in the past.', 400);
  }

  const { data: serviceDoc, error: svcErr } = await supabase
    .from(cfg.table)
    .select('*')
    .eq('id', targetServiceId)
    .maybeSingle();

  if (svcErr) throw mapSupabaseError(svcErr, 'Failed to verify service listing.');
  if (!serviceDoc) {
    throw new AppError('Selected service listing does not exist.', 404);
  }
  if (!serviceDoc.availability_status) {
    throw new AppError('This service is currently marked as unavailable for booking.', 400);
  }

  const providerId = serviceDoc[cfg.ownerField];
  if (String(providerId) === String(user.id)) {
    throw new AppError('You cannot book your own listing.', 400);
  }

  const parsedDuration = Number(duration) || 1;
  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    throw new AppError('Duration must be greater than 0.', 400);
  }
  const parsedWorkers = Math.max(1, Number.parseInt(workersRequested, 10) || 1);
  const parsedQty = Math.max(1, Number.parseInt(quantity, 10) || 1);

  const { data: activeOnDate, error: conflictErr } = await supabase
    .from('bookings')
    .select('id, workers_requested')
    .eq(cfg.fkColumn, targetServiceId)
    .eq('booking_date', finalBookingDate)
    .in('status', ['Pending', 'Accepted']);

  if (conflictErr) throw mapSupabaseError(conflictErr, 'Failed to check existing bookings.');

  let totalAmount = 0;
  let resolvedUnit = durationUnit || serviceDoc.price_unit || 'day';

  if (finalType === 'equipment') {
    if ((activeOnDate || []).length > 0) {
      throw new AppError(
        `This equipment already has a Pending or Accepted booking on ${finalBookingDate}. Please choose a different date.`,
        409,
        'BOOKING_DATE_CONFLICT'
      );
    }
    const unitPrice =
      resolvedUnit === 'hour' && serviceDoc.hourly_price !== null
        ? Number(serviceDoc.hourly_price)
        : resolvedUnit === 'day' && serviceDoc.daily_price !== null
          ? Number(serviceDoc.daily_price)
          : Number(serviceDoc.price ?? 0);
    totalAmount = unitPrice * parsedDuration;
  } else if (finalType === 'labour') {
    const bookedWorkers = (activeOnDate || []).reduce(
      (sum, row) => sum + (Number(row.workers_requested) || 0),
      0
    );
    const remainingWorkers = Math.max(0, Number(serviceDoc.workers_available) - bookedWorkers);
    if (parsedWorkers > remainingWorkers) {
      throw new AppError(
        `Only ${remainingWorkers} worker(s) remain available on ${finalBookingDate}.`,
        409,
        'INSUFFICIENT_WORKERS'
      );
    }
    const rate =
      resolvedUnit === 'hour' && serviceDoc.hourly_rate !== null
        ? Number(serviceDoc.hourly_rate)
        : Number(serviceDoc.daily_rate ?? 0);
    totalAmount = rate * parsedWorkers * parsedDuration;
  } else if (finalType === 'facility') {
    if (parsedQty > Number(serviceDoc.available_capacity)) {
      throw new AppError(
        `Only ${serviceDoc.available_capacity} ${serviceDoc.capacity_unit} of capacity is available.`,
        400
      );
    }
    totalAmount = Number(serviceDoc.price ?? 0) * parsedQty * parsedDuration;
    resolvedUnit = durationUnit || 'day';
  }

  const normalizedLoc = normalizeLocation(farmLocation, user);
  const serviceName = cfg.getName(serviceDoc);
  const bookingCode = generateBookingCode();

  const insertPayload = {
    booking_code: bookingCode,
    farmer_id: user.id,
    provider_id: providerId,
    service_type: finalType,
    service_name: serviceName,
    equipment_id: finalType === 'equipment' ? targetServiceId : null,
    labour_id: finalType === 'labour' ? targetServiceId : null,
    facility_id: finalType === 'facility' ? targetServiceId : null,
    booking_date: finalBookingDate,
    start_time: start_time ?? startTime ?? null,
    end_time: end_time ?? endTime ?? null,
    duration: parsedDuration,
    duration_unit: resolvedUnit,
    quantity: parsedQty,
    workers_requested: parsedWorkers,
    selected_service: String(selectedService || '').trim(),
    farm_location: {
      address: normalizedLoc.address,
      village: normalizedLoc.village,
      district: normalizedLoc.district,
      lat: normalizedLoc.lat,
      lng: normalizedLoc.lng,
    },
    total_amount: Math.round(totalAmount * 100) / 100,
    farmer_notes: String(farmer_notes ?? farmerNotes ?? notes ?? '').trim(),
    payment_method: paymentMethod,
    status: 'Pending',
  };

  const { data: created, error: insertErr } = await supabase
    .from('bookings')
    .insert(insertPayload)
    .select(BOOKING_SELECT)
    .single();

  if (insertErr) throw mapSupabaseError(insertErr, 'Could not create booking request.');

  // Generate real persistent notification for the provider
  await supabase.from('notifications').insert({
    user_id: providerId,
    title: 'New Booking Request',
    message: `${user.name} requested ${serviceName} for ${finalBookingDate}.`,
    notification_type: 'booking_created',
    related_booking_id: created.id,
  });

  return formatBookingRow(created);
}

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await handleCreateBooking({ user: req.user, body: req.body });
  res.status(201).json({
    success: true,
    message: 'Your booking request has been sent.',
    data: booking,
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { status, serviceType } = req.query;
  const supabase = getSupabaseClient();
  const { page, limit, from, to } = parsePagination(req.query, 30, 100);

  let query = supabase
    .from('bookings')
    .select(BOOKING_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (req.user.role === 'farmer') {
    query = query.eq('farmer_id', req.user.id);
  } else if (req.user.role !== 'admin') {
    query = query.eq('provider_id', req.user.id);
  }

  if (status && status !== 'All') {
    query = query.eq('status', status);
  }
  if (serviceType && serviceType !== 'All') {
    query = query.eq('service_type', serviceType);
  }

  const { data: rows, count, error } = await query;
  if (error) throw mapSupabaseError(error, 'Could not load bookings.');

  const formatted = (rows || []).map(formatBookingRow);
  res.json({
    success: true,
    count: formatted.length,
    total: count ?? formatted.length,
    page,
    limit,
    data: formatted,
  });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'booking id');
  const supabase = getSupabaseClient();

  const { data: row, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Failed to fetch booking details.');
  if (!row) throw new AppError('Booking not found.', 404);

  const isFarmer = String(row.farmer_id) === String(req.user.id);
  const isProvider = String(row.provider_id) === String(req.user.id);

  if (req.user.role !== 'admin' && !isFarmer && !isProvider) {
    throw new AppError('You do not have access to this booking.', 403);
  }

  res.json({
    success: true,
    data: formatBookingRow(row),
  });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'booking id');
  const { status, providerNote, provider_notes } = req.body;
  const supabase = getSupabaseClient();

  const { error: rpcError } = await supabase.rpc('transition_booking_atomic', {
    p_booking_id: id,
    p_actor_id: req.user.id,
    p_actor_role: req.user.role,
    p_new_status: status,
    p_provider_notes: provider_notes ?? providerNote ?? null,
  });

  if (rpcError) {
    throw mapSupabaseError(rpcError, 'Unable to update booking status.');
  }

  const { data: refreshed, error: fetchErr } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', id)
    .single();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Updated booking could not be reloaded.');

  res.json({
    success: true,
    data: formatBookingRow(refreshed),
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  req.body = { ...(req.body || {}), status: 'Cancelled' };
  return updateBookingStatus(req, res);
});

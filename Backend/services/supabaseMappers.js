import { AppError } from '../middleware/errorHandler.js';
import { calculateDistanceKm, hasValidCoords } from '../utils/haversine.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value) {
  return UUID_REGEX.test(String(value || '').trim());
}

export function assertValidUuid(value, label = 'identifier') {
  const cleaned = String(value || '').trim();
  if (!UUID_REGEX.test(cleaned)) {
    throw new AppError(`Invalid ${label}.`, 400, 'INVALID_ID');
  }
  return cleaned;
}

export function parsePagination(query = {}, defaultLimit = 24, maxLimit = 50) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit)
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
}

export function mapSupabaseError(error, fallbackMessage = 'Database request failed.') {
  if (!error) return new AppError(fallbackMessage, 500);
  if (error instanceof AppError) return error;

  const msg = String(error.message || '');
  if (error.code === '23505') {
    return new AppError('A duplicate record already exists.', 409, 'DUPLICATE_RECORD');
  }
  if (error.code === '23503') {
    return new AppError('Referenced record does not exist.', 400, 'INVALID_REFERENCE');
  }
  if (error.code === '23514' || error.code === '22P02') {
    return new AppError('Invalid field value or format.', 400, 'VALIDATION_ERROR');
  }
  if (msg.includes('BOOKING_NOT_FOUND')) {
    return new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  }
  if (msg.includes('BOOKING_FORBIDDEN')) {
    return new AppError('You do not have permission to modify this booking.', 403, 'FORBIDDEN');
  }
  if (msg.includes('FARMER_CAN_ONLY_CANCEL')) {
    return new AppError('Farmers can only cancel pending bookings.', 403, 'FORBIDDEN');
  }
  if (msg.includes('INVALID_TRANSITION_CANCEL')) {
    return new AppError('Only pending bookings can be cancelled.', 400, 'INVALID_TRANSITION');
  }
  if (msg.includes('INVALID_TRANSITION')) {
    return new AppError('This booking status transition is not allowed.', 400, 'INVALID_TRANSITION');
  }
  if (msg.includes('INSUFFICIENT_CAPACITY')) {
    return new AppError('Insufficient remaining facility capacity.', 400, 'INSUFFICIENT_CAPACITY');
  }

  return new AppError(fallbackMessage, 502, 'SUPABASE_QUERY_FAILED');
}

export function formatProfileRow(row, { includePrivate = true } = {}) {
  if (!row) return null;
  const loc = {
    lat: row.latitude ?? null,
    lng: row.longitude ?? null,
    address: row.address || '',
    village: row.village || '',
    taluk: row.taluk || '',
    district: row.district || '',
    state: row.state || '',
  };

  return {
    id: row.id,
    _id: row.id,
    profileId: row.id,
    full_name: row.full_name,
    name: row.full_name,
    role: row.role ?? null,
    preferred_language: row.preferred_language || 'en',
    language: row.preferred_language || 'en',
    village: row.village || '',
    taluk: row.taluk || '',
    district: row.district || '',
    state: row.state || '',
    address: row.address || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    location: loc,
    primary_crop: row.primary_crop || '',
    primaryCrop: row.primary_crop || '',
    farm_size: row.farm_size ?? null,
    farmSize: row.farm_size ?? null,
    farm_size_unit: row.farm_size_unit || 'acres',
    farmSizeUnit: row.farm_size_unit || 'acres',
    profile_image: row.profile_image || null,
    isActive: row.is_active !== false,
    is_active: row.is_active !== false,
    created_at: row.created_at,
    createdAt: row.created_at,
    updated_at: row.updated_at,
    updatedAt: row.updated_at,
    ...(includePrivate
      ? {
          mobile_number: row.mobile_number,
          mobileNumber: row.mobile_number,
          phone: row.mobile_number ? `+91 ${row.mobile_number}` : '',
          email: row.email ?? null,
        }
      : {}),
  };
}

function attachDistance(baseObj, userCoords) {
  const locationAvailable = hasValidCoords(baseObj.location);
  const distanceKm =
    hasValidCoords(userCoords) && locationAvailable
      ? calculateDistanceKm(userCoords, baseObj.location)
      : null;

  return {
    ...baseObj,
    locationAvailable,
    distanceKm,
  };
}

export function formatEquipmentRow(row, userCoords = null) {
  if (!row) return null;
  const owner = row.owner ? formatProfileRow(row.owner, { includePrivate: true }) : null;
  const locationObj = {
    lat: row.latitude ?? null,
    lng: row.longitude ?? null,
    address: row.location || '',
    village: row.village || '',
    taluk: row.taluk || '',
    district: row.district || '',
    state: row.state || '',
  };

  return attachDistance(
    {
      id: row.id,
      _id: row.id,
      owner_id: row.owner_id,
      ownerId: owner || row.owner_id,
      equipment_name: row.equipment_name,
      name: row.equipment_name,
      equipment_category: row.equipment_category,
      category: row.equipment_category,
      description: row.description || '',
      brand: row.brand || '',
      model: row.model || '',
      horsepower: row.horsepower || '',
      year: row.year || '',
      specifications: {
        brand: row.brand || '',
        model: row.model || '',
        horsepower: row.horsepower || '',
        year: row.year || '',
      },
      hourly_price: row.hourly_price !== null ? Number(row.hourly_price) : null,
      daily_price: row.daily_price !== null ? Number(row.daily_price) : null,
      per_acre_price: row.per_acre_price !== null ? Number(row.per_acre_price) : null,
      price: Number(row.price ?? row.hourly_price ?? row.daily_price ?? 0),
      priceUnit: row.price_unit || 'hour',
      price_unit: row.price_unit || 'hour',
      serviceRadius: row.service_radius ?? 15,
      service_radius: row.service_radius ?? 15,
      location: locationObj,
      village: row.village || '',
      taluk: row.taluk || '',
      district: row.district || '',
      state: row.state || '',
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      availability_status: row.availability_status !== false,
      availability: row.availability_status !== false,
      equipment_images: Array.isArray(row.equipment_images) ? row.equipment_images : [],
      images: Array.isArray(row.equipment_images) ? row.equipment_images : [],
      isReported: Boolean(row.is_reported),
      reportReason: row.report_reason || '',
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
    },
    userCoords
  );
}

export function formatLabourRow(row, userCoords = null) {
  if (!row) return null;
  const provider = row.provider ? formatProfileRow(row.provider, { includePrivate: true }) : null;
  const locationObj = {
    lat: row.latitude ?? null,
    lng: row.longitude ?? null,
    address: row.location || '',
    village: row.village || '',
    taluk: row.taluk || '',
    district: row.district || '',
    state: row.state || '',
  };
  const dailyRate = Number(row.daily_rate ?? 0);
  const hourlyRate = row.hourly_rate !== null ? Number(row.hourly_rate) : null;
  const activePrice =
    row.price_unit === 'hour' && hourlyRate !== null ? hourlyRate : dailyRate;

  return attachDistance(
    {
      id: row.id,
      _id: row.id,
      provider_id: row.provider_id,
      providerId: provider || row.provider_id,
      title: row.title || `${row.category} Service`,
      category: row.category,
      skills: Array.isArray(row.skills) ? row.skills : [],
      experience: row.experience || '',
      workersAvailable: row.workers_available ?? 1,
      workers_available: row.workers_available ?? 1,
      daily_rate: dailyRate,
      hourly_rate: hourlyRate,
      pricePerWorker: activePrice,
      priceUnit: row.price_unit || 'day',
      price_unit: row.price_unit || 'day',
      serviceRadius: row.service_radius ?? 15,
      availableDates: Array.isArray(row.available_dates) ? row.available_dates : [],
      description: row.description || '',
      location: locationObj,
      village: row.village || '',
      taluk: row.taluk || '',
      district: row.district || '',
      state: row.state || '',
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      availability_status: row.availability_status !== false,
      availability: row.availability_status !== false,
      isReported: Boolean(row.is_reported),
      reportReason: row.report_reason || '',
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
    },
    userCoords
  );
}

export function formatFacilityRow(row, userCoords = null) {
  if (!row) return null;
  const owner = row.owner ? formatProfileRow(row.owner, { includePrivate: true }) : null;
  const locationObj = {
    lat: row.latitude ?? null,
    lng: row.longitude ?? null,
    address: row.location || '',
    village: row.village || '',
    taluk: row.taluk || '',
    district: row.district || '',
    state: row.state || '',
  };

  return attachDistance(
    {
      id: row.id,
      _id: row.id,
      owner_id: row.owner_id,
      operatorId: owner || row.owner_id,
      ownerId: owner || row.owner_id,
      facility_name: row.facility_name,
      name: row.facility_name,
      facility_type: row.facility_type,
      category: row.facility_type,
      description: row.description || '',
      capacity: Number(row.capacity ?? 0),
      availableCapacity: Number(row.available_capacity ?? 0),
      available_capacity: Number(row.available_capacity ?? 0),
      capacityUnit: row.capacity_unit || 'tonnes',
      capacity_unit: row.capacity_unit || 'tonnes',
      price: Number(row.price ?? 0),
      priceUnit: row.price_unit || 'per tonne/day',
      price_unit: row.price_unit || 'per tonne/day',
      operatingHours: row.operating_hours || '6:00 AM - 8:00 PM',
      servicesOffered: Array.isArray(row.services_offered) ? row.services_offered : [],
      contact_information: row.contact_information || owner?.phone || '',
      contactPhone: row.contact_information || owner?.phone || '',
      location: locationObj,
      village: row.village || '',
      taluk: row.taluk || '',
      district: row.district || '',
      state: row.state || '',
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      availability_status: row.availability_status !== false,
      availability: row.availability_status !== false,
      facility_images: Array.isArray(row.facility_images) ? row.facility_images : [],
      images: Array.isArray(row.facility_images) ? row.facility_images : [],
      isReported: Boolean(row.is_reported),
      reportReason: row.report_reason || '',
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
    },
    userCoords
  );
}

export function formatBookingRow(row) {
  if (!row) return null;
  const farmer = row.farmer ? formatProfileRow(row.farmer, { includePrivate: true }) : null;
  const provider = row.provider ? formatProfileRow(row.provider, { includePrivate: true }) : null;
  const serviceId = row.equipment_id || row.labour_id || row.facility_id || null;

  let serviceDetails = null;
  if (row.equipment) serviceDetails = formatEquipmentRow(row.equipment);
  else if (row.labour) serviceDetails = formatLabourRow(row.labour);
  else if (row.facility) serviceDetails = formatFacilityRow(row.facility);

  return {
    id: row.id,
    _id: row.id,
    booking_code: row.booking_code,
    bookingCode: row.booking_code,
    farmer_id: row.farmer_id,
    farmerId: farmer || row.farmer_id,
    provider_id: row.provider_id,
    providerId: provider || row.provider_id,
    service_type: row.service_type,
    serviceType: row.service_type,
    service_name: row.service_name,
    serviceName: row.service_name,
    equipment_id: row.equipment_id,
    labour_id: row.labour_id,
    facility_id: row.facility_id,
    serviceId: serviceDetails || serviceId,
    booking_date: row.booking_date,
    bookingDate: row.booking_date,
    start_time: row.start_time || '',
    startTime: row.start_time || '',
    end_time: row.end_time || '',
    endTime: row.end_time || '',
    duration: Number(row.duration ?? 1),
    durationUnit: row.duration_unit || 'day',
    quantity: Number(row.quantity ?? 1),
    workersRequested: Number(row.workers_requested ?? 1),
    selectedService: row.selected_service || '',
    farmLocation: row.farm_location || {},
    total_amount: Number(row.total_amount ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    estimatedCost: Number(row.total_amount ?? 0),
    farmer_notes: row.farmer_notes || '',
    notes: row.farmer_notes || '',
    provider_notes: row.provider_notes || '',
    providerNote: row.provider_notes || '',
    paymentMethod: row.payment_method || '',
    status: row.status,
    created_at: row.created_at,
    createdAt: row.created_at,
    updated_at: row.updated_at,
    updatedAt: row.updated_at,
  };
}

export function formatReviewRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    reviewer_id: row.reviewer_id,
    reviewerId: row.reviewer ? formatProfileRow(row.reviewer, { includePrivate: false }) : row.reviewer_id,
    reviewed_user_id: row.reviewed_user_id,
    booking_id: row.booking_id,
    rating: Number(row.rating),
    review_text: row.review_text || '',
    reviewText: row.review_text || '',
    created_at: row.created_at,
    createdAt: row.created_at,
  };
}

export function formatNotificationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    user_id: row.user_id,
    title: row.title,
    message: row.message,
    notification_type: row.notification_type,
    notificationType: row.notification_type,
    related_booking_id: row.related_booking_id,
    relatedBookingId: row.related_booking_id,
    is_read: Boolean(row.is_read),
    isRead: Boolean(row.is_read),
    created_at: row.created_at,
    createdAt: row.created_at,
  };
}

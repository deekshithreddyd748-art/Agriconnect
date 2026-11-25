import Facility from '../models/Facility.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import {
  calculateDistanceKm,
  enrichAndFilterByDistance,
  hasValidCoords,
} from '../utils/haversine.js';
import {
  assertOwnershipOrAdmin,
  collectImages,
  extractQueryCoords,
  normalizeLocation,
  parseMaybeJson,
} from '../utils/listingHelpers.js';

export const getFacilities = asyncHandler(async (req, res) => {
  const { category, maxPrice, minCapacity, availability, search, operatorId } =
    req.query;
  const filter = {};

  if (category && category !== 'All') filter.category = category;
  if (operatorId) filter.operatorId = operatorId;
  if (availability === 'true' || availability === 'false') {
    filter.availability = availability === 'true';
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (Number.isFinite(max) && max >= 0) {
      filter.price = { $lte: max };
    }
  }
  if (minCapacity !== undefined && minCapacity !== '') {
    const min = Number(minCapacity);
    if (Number.isFinite(min) && min >= 0) {
      filter.availableCapacity = { $gte: min };
    }
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: regex },
      { category: regex },
      { description: regex },
      { 'location.village': regex },
      { 'location.district': regex },
    ];
  }

  const items = await Facility.find(filter)
    .populate('operatorId', 'name phone village district state')
    .sort({ createdAt: -1 });

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const results = enrichAndFilterByDistance(items, userCoords, radiusKm);

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
});

export const getFacilityById = asyncHandler(async (req, res) => {
  const item = await Facility.findById(req.params.id).populate(
    'operatorId',
    'name phone email village district state location'
  );
  if (!item) {
    throw new AppError('Facility listing not found.', 404);
  }

  const { userCoords } = extractQueryCoords(req.query);
  const obj = item.toObject();
  const locationAvailable = hasValidCoords(obj.location);
  const distanceKm =
    hasValidCoords(userCoords) && locationAvailable
      ? calculateDistanceKm(userCoords, obj.location)
      : null;

  res.json({
    success: true,
    data: {
      ...obj,
      locationAvailable,
      distanceKm,
    },
  });
});

export const createFacility = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    description,
    capacity,
    availableCapacity,
    capacityUnit,
    price,
    priceUnit,
    operatingHours,
    servicesOffered,
    availability,
    contactPhone,
    location,
  } = req.body;

  const images = collectImages(req, []);
  const normalizedLocation = normalizeLocation(location, req.user);
  const parsedServices = parseMaybeJson(servicesOffered, []);

  const totalCap = Number(capacity);
  const availCap =
    availableCapacity !== undefined && availableCapacity !== ''
      ? Number(availableCapacity)
      : totalCap;

  const facility = await Facility.create({
    operatorId: req.user._id,
    name,
    category,
    description,
    images,
    capacity: totalCap,
    availableCapacity: Math.min(availCap, totalCap),
    capacityUnit: capacityUnit || 'tons',
    price: Number(price),
    priceUnit: priceUnit || 'per ton/day',
    operatingHours: operatingHours || '06:00 AM - 08:00 PM',
    servicesOffered: Array.isArray(parsedServices) ? parsedServices : [],
    availability:
      availability === undefined ? true : availability === true || availability === 'true',
    contactPhone: contactPhone || req.user.phone,
    location: normalizedLocation,
  });

  const populated = await facility.populate(
    'operatorId',
    'name phone village district state'
  );
  res.status(201).json({
    success: true,
    data: populated,
  });
});

export const updateFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  assertOwnershipOrAdmin(facility, 'operatorId', req.user);

  const updatable = [
    'name',
    'category',
    'description',
    'capacityUnit',
    'priceUnit',
    'operatingHours',
    'contactPhone',
  ];
  for (const field of updatable) {
    if (req.body[field] !== undefined) {
      facility[field] = req.body[field];
    }
  }
  if (req.body.capacity !== undefined) facility.capacity = Number(req.body.capacity);
  if (req.body.availableCapacity !== undefined) {
    facility.availableCapacity = Math.min(
      Number(req.body.availableCapacity),
      facility.capacity
    );
  }
  if (req.body.price !== undefined) facility.price = Number(req.body.price);
  if (req.body.availability !== undefined) {
    facility.availability =
      req.body.availability === true || req.body.availability === 'true';
  }
  if (req.body.servicesOffered !== undefined) {
    const parsed = parseMaybeJson(req.body.servicesOffered, facility.servicesOffered);
    facility.servicesOffered = Array.isArray(parsed) ? parsed : [];
  }
  if (req.body.location !== undefined) {
    facility.location = normalizeLocation(req.body.location, req.user);
  }
  if (req.files?.length || req.body.images !== undefined) {
    facility.images = collectImages(req, facility.images);
  }

  await facility.save();
  const populated = await facility.populate(
    'operatorId',
    'name phone village district state'
  );
  res.json({
    success: true,
    data: populated,
  });
});

export const deleteFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  assertOwnershipOrAdmin(facility, 'operatorId', req.user);
  await facility.deleteOne();
  res.json({
    success: true,
    message: 'Facility listing removed.',
  });
});

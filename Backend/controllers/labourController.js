import Labour from '../models/Labour.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import {
  calculateDistanceKm,
  enrichAndFilterByDistance,
  hasValidCoords,
} from '../utils/haversine.js';
import {
  assertOwnershipOrAdmin,
  extractQueryCoords,
  normalizeLocation,
  parseMaybeJson,
} from '../utils/listingHelpers.js';

export const getLabours = asyncHandler(async (req, res) => {
  const { category, maxPrice, minWorkers, availability, search, providerId } =
    req.query;
  const filter = {};

  if (category && category !== 'All') filter.category = category;
  if (providerId) filter.providerId = providerId;
  if (availability === 'true' || availability === 'false') {
    filter.availability = availability === 'true';
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (Number.isFinite(max) && max >= 0) {
      filter.pricePerWorker = { $lte: max };
    }
  }
  if (minWorkers !== undefined && minWorkers !== '') {
    const min = Number(minWorkers);
    if (Number.isFinite(min) && min >= 1) {
      filter.workersAvailable = { $gte: min };
    }
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { title: regex },
      { category: regex },
      { description: regex },
      { 'location.village': regex },
      { 'location.district': regex },
    ];
  }

  const items = await Labour.find(filter)
    .populate('providerId', 'name phone village district state')
    .sort({ createdAt: -1 });

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const results = enrichAndFilterByDistance(items, userCoords, radiusKm);

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
});

export const getLabourById = asyncHandler(async (req, res) => {
  const item = await Labour.findById(req.params.id).populate(
    'providerId',
    'name phone email village district state location'
  );
  if (!item) {
    throw new AppError('Labour listing not found.', 404);
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

export const createLabour = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    description,
    workersAvailable,
    pricePerWorker,
    priceUnit,
    availability,
    availableDates,
    serviceRadius,
    location,
  } = req.body;

  const normalizedLocation = normalizeLocation(location, req.user);
  const parsedDates = parseMaybeJson(availableDates, []);

  const labour = await Labour.create({
    providerId: req.user._id,
    title: title || `${category} Team`,
    category,
    description,
    workersAvailable: Number(workersAvailable),
    pricePerWorker: Number(pricePerWorker),
    priceUnit: priceUnit || 'day',
    availability:
      availability === undefined ? true : availability === true || availability === 'true',
    availableDates: Array.isArray(parsedDates) ? parsedDates : [],
    serviceRadius: serviceRadius ? Number(serviceRadius) : 15,
    location: normalizedLocation,
  });

  const populated = await labour.populate(
    'providerId',
    'name phone village district state'
  );
  res.status(201).json({
    success: true,
    data: populated,
  });
});

export const updateLabour = asyncHandler(async (req, res) => {
  const labour = await Labour.findById(req.params.id);
  assertOwnershipOrAdmin(labour, 'providerId', req.user);

  const updatable = ['title', 'category', 'description', 'priceUnit'];
  for (const field of updatable) {
    if (req.body[field] !== undefined) {
      labour[field] = req.body[field];
    }
  }
  if (req.body.workersAvailable !== undefined) {
    labour.workersAvailable = Number(req.body.workersAvailable);
  }
  if (req.body.pricePerWorker !== undefined) {
    labour.pricePerWorker = Number(req.body.pricePerWorker);
  }
  if (req.body.serviceRadius !== undefined) {
    labour.serviceRadius = Number(req.body.serviceRadius);
  }
  if (req.body.availability !== undefined) {
    labour.availability =
      req.body.availability === true || req.body.availability === 'true';
  }
  if (req.body.availableDates !== undefined) {
    const parsed = parseMaybeJson(req.body.availableDates, labour.availableDates);
    labour.availableDates = Array.isArray(parsed) ? parsed : [];
  }
  if (req.body.location !== undefined) {
    labour.location = normalizeLocation(req.body.location, req.user);
  }

  await labour.save();
  const populated = await labour.populate(
    'providerId',
    'name phone village district state'
  );
  res.json({
    success: true,
    data: populated,
  });
});

export const deleteLabour = asyncHandler(async (req, res) => {
  const labour = await Labour.findById(req.params.id);
  assertOwnershipOrAdmin(labour, 'providerId', req.user);
  await labour.deleteOne();
  res.json({
    success: true,
    message: 'Labour listing removed.',
  });
});

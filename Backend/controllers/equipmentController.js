import Equipment from '../models/Equipment.js';
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

export const getEquipments = asyncHandler(async (req, res) => {
  const { category, maxPrice, availability, search, ownerId } = req.query;
  const filter = {};

  if (category && category !== 'All') filter.category = category;
  if (ownerId) filter.ownerId = ownerId;
  if (availability === 'true' || availability === 'false') {
    filter.availability = availability === 'true';
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (Number.isFinite(max) && max >= 0) {
      filter.price = { $lte: max };
    }
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { category: regex },
      { 'location.village': regex },
      { 'location.district': regex },
    ];
  }

  const items = await Equipment.find(filter)
    .populate('ownerId', 'name phone village district state')
    .sort({ createdAt: -1 });

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const results = enrichAndFilterByDistance(items, userCoords, radiusKm);

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
});

export const getEquipmentById = asyncHandler(async (req, res) => {
  const item = await Equipment.findById(req.params.id).populate(
    'ownerId',
    'name phone email village district state location'
  );
  if (!item) {
    throw new AppError('Equipment listing not found.', 404);
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

export const createEquipment = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    description,
    price,
    priceUnit,
    availability,
    serviceRadius,
    location,
    specifications,
  } = req.body;

  const images = collectImages(req, []);
  const normalizedLocation = normalizeLocation(location, req.user);
  const parsedSpecs = parseMaybeJson(specifications, {});

  const equipment = await Equipment.create({
    name,
    category,
    description,
    price: Number(price),
    priceUnit: priceUnit || 'hour',
    availability:
      availability === undefined ? true : availability === true || availability === 'true',
    serviceRadius: serviceRadius ? Number(serviceRadius) : 15,
    images,
    location: normalizedLocation,
    specifications: parsedSpecs,
    ownerId: req.user._id,
  });

  const populated = await equipment.populate(
    'ownerId',
    'name phone village district state'
  );
  res.status(201).json({
    success: true,
    data: populated,
  });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  assertOwnershipOrAdmin(equipment, 'ownerId', req.user);

  const updatable = ['name', 'category', 'description', 'priceUnit'];
  for (const field of updatable) {
    if (req.body[field] !== undefined) {
      equipment[field] = req.body[field];
    }
  }
  if (req.body.price !== undefined) equipment.price = Number(req.body.price);
  if (req.body.serviceRadius !== undefined) {
    equipment.serviceRadius = Number(req.body.serviceRadius);
  }
  if (req.body.availability !== undefined) {
    equipment.availability =
      req.body.availability === true || req.body.availability === 'true';
  }
  if (req.body.location !== undefined) {
    equipment.location = normalizeLocation(req.body.location, req.user);
  }
  if (req.body.specifications !== undefined) {
    equipment.specifications = parseMaybeJson(req.body.specifications, equipment.specifications);
  }
  if (req.files?.length || req.body.images !== undefined) {
    equipment.images = collectImages(req, equipment.images);
  }

  await equipment.save();
  const populated = await equipment.populate(
    'ownerId',
    'name phone village district state'
  );
  res.json({
    success: true,
    data: populated,
  });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  assertOwnershipOrAdmin(equipment, 'ownerId', req.user);
  await equipment.deleteOne();
  res.json({
    success: true,
    message: 'Equipment listing removed.',
  });
});

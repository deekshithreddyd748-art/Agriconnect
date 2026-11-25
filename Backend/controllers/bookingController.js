import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';
import Labour from '../models/Labour.js';
import Facility from '../models/Facility.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { normalizeLocation } from '../utils/listingHelpers.js';

const SERVICE_MAP = {
  equipment: {
    model: Equipment,
    modelName: 'Equipment',
    ownerField: 'ownerId',
    getName: (doc) => doc.name,
  },
  labour: {
    model: Labour,
    modelName: 'Labour',
    ownerField: 'providerId',
    getName: (doc) => doc.title || `${doc.category} Team`,
  },
  facility: {
    model: Facility,
    modelName: 'Facility',
    ownerField: 'operatorId',
    getName: (doc) => doc.name,
  },
};

export const createBooking = asyncHandler(async (req, res) => {
  const {
    serviceType,
    serviceId,
    bookingDate,
    duration = 1,
    durationUnit,
    workersRequested = 1,
    quantity = 1,
    selectedService = '',
    farmLocation,
    notes = '',
    paymentMethod = 'Pay directly to provider upon service delivery (Cash / UPI)',
  } = req.body;

  const config = SERVICE_MAP[serviceType];
  if (!config) {
    throw new AppError('Invalid service type.', 400);
  }

  const serviceDoc = await config.model.findById(serviceId);
  if (!serviceDoc) {
    throw new AppError('Selected service listing does not exist.', 404);
  }
  if (!serviceDoc.availability) {
    throw new AppError(
      'This service is currently marked as unavailable for booking.',
      400
    );
  }

  const providerId = serviceDoc[config.ownerField];
  if (providerId.toString() === req.user._id.toString()) {
    throw new AppError('You cannot book your own listing.', 400);
  }

  const parsedDuration = Math.max(1, Number(duration) || 1);
  const parsedWorkers = Math.max(1, Number(workersRequested) || 1);
  const parsedQty = Math.max(1, Number(quantity) || 1);

  let estimatedCost = 0;
  let resolvedUnit = durationUnit || serviceDoc.priceUnit || 'day';

  if (serviceType === 'equipment') {
    estimatedCost = serviceDoc.price * parsedDuration;
    resolvedUnit = durationUnit || serviceDoc.priceUnit;
  } else if (serviceType === 'labour') {
    if (parsedWorkers > serviceDoc.workersAvailable) {
      throw new AppError(
        `Only ${serviceDoc.workersAvailable} workers are currently available.`,
        400
      );
    }
    estimatedCost = serviceDoc.pricePerWorker * parsedWorkers * parsedDuration;
    resolvedUnit = durationUnit || serviceDoc.priceUnit;
  } else if (serviceType === 'facility') {
    if (parsedQty > serviceDoc.availableCapacity) {
      throw new AppError(
        `Only ${serviceDoc.availableCapacity} ${serviceDoc.capacityUnit} of capacity is available.`,
        400
      );
    }
    estimatedCost = serviceDoc.price * parsedQty * parsedDuration;
    resolvedUnit = durationUnit || 'day';
  }

  const normalizedLoc = normalizeLocation(farmLocation, req.user);

  const booking = await Booking.create({
    serviceType,
    serviceModel: config.modelName,
    serviceId: serviceDoc._id,
    serviceName: config.getName(serviceDoc),
    farmerId: req.user._id,
    providerId,
    bookingDate,
    duration: parsedDuration,
    durationUnit: resolvedUnit,
    workersRequested: parsedWorkers,
    quantity: parsedQty,
    selectedService,
    farmLocation: {
      address: normalizedLoc.address,
      village: normalizedLoc.village,
      district: normalizedLoc.district,
      lat: normalizedLoc.lat,
      lng: normalizedLoc.lng,
    },
    notes,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    paymentMethod,
    status: 'Pending',
  });

  const populated = await Booking.findById(booking._id)
    .populate('farmerId', 'name phone email village district state')
    .populate('providerId', 'name phone email village district state');

  res.status(201).json({
    success: true,
    data: populated,
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { status, serviceType } = req.query;
  const filter = {};

  if (req.user.role === 'farmer') {
    filter.farmerId = req.user._id;
  } else if (req.user.role !== 'admin') {
    filter.providerId = req.user._id;
  }

  if (status && status !== 'All') filter.status = status;
  if (serviceType && serviceType !== 'All') filter.serviceType = serviceType;

  const bookings = await Booking.find(filter)
    .populate('farmerId', 'name phone email village district state')
    .populate('providerId', 'name phone email village district state')
    .populate('serviceId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('farmerId', 'name phone email village district state location')
    .populate('providerId', 'name phone email village district state location')
    .populate('serviceId');

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const userId = req.user._id.toString();
  const isFarmer = booking.farmerId?._id?.toString() === userId;
  const isProvider = booking.providerId?._id?.toString() === userId;

  if (req.user.role !== 'admin' && !isFarmer && !isProvider) {
    throw new AppError('You do not have access to this booking.', 403);
  }

  res.json({
    success: true,
    data: booking,
  });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, providerNote } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const userId = req.user._id.toString();
  const isFarmer = booking.farmerId.toString() === userId;
  const isProvider = booking.providerId.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isFarmer && !isProvider && !isAdmin) {
    throw new AppError('You do not have permission to update this booking.', 403);
  }

  if (isFarmer && !isAdmin) {
    if (status !== 'Cancelled') {
      throw new AppError('Farmers can only cancel pending bookings.', 403);
    }
    if (booking.status !== 'Pending') {
      throw new AppError('Only pending bookings can be cancelled.', 400);
    }
  } else if (isProvider && !isAdmin) {
    const validTransitions = {
      Pending: ['Accepted', 'Rejected'],
      Accepted: ['Completed'],
    };
    const allowed = validTransitions[booking.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Cannot change booking status from ${booking.status} to ${status}.`,
        400
      );
    }
  }

  if (booking.serviceType === 'facility' && status === 'Accepted' && booking.status === 'Pending') {
    const facility = await Facility.findById(booking.serviceId);
    if (facility) {
      if (facility.availableCapacity < booking.quantity) {
        throw new AppError('Insufficient remaining facility capacity.', 400);
      }
      facility.availableCapacity -= booking.quantity;
      if (facility.availableCapacity === 0) {
        facility.availability = false;
      }
      await facility.save();
    }
  }

  booking.status = status;
  if (providerNote !== undefined) {
    booking.providerNote = providerNote;
  }
  await booking.save();

  const updated = await Booking.findById(booking._id)
    .populate('farmerId', 'name phone email village district state')
    .populate('providerId', 'name phone email village district state')
    .populate('serviceId');

  res.json({
    success: true,
    data: updated,
  });
});

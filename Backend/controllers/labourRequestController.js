import crypto from 'crypto';
import LabourRequest from '../models/LabourRequest.js';
import LabourApplication from '../models/LabourApplication.js';
import LabourBooking from '../models/LabourBooking.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { enrichAndFilterByDistance } from '../utils/haversine.js';
import { extractQueryCoords, normalizeLocation } from '../utils/listingHelpers.js';

const OPEN_STATUSES = [
  'Open',
  'Applications Received',
  'Pending',
  'Worker Accepted',
  'Partially Filled',
];

const EDITABLE_STATUSES = ['Open', 'Applications Received', 'Pending'];

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateCode(prefix) {
  const year = new Date().getFullYear();
  const suffix = crypto.randomInt(1000, 9999);
  return `${prefix}-${year}-${suffix}`;
}

function computeStatusFromCounts(accepted, required, currentStatus, hasPendingApps = false) {
  if (['In Progress', 'Completed', 'Cancelled'].includes(currentStatus)) {
    return currentStatus;
  }
  if (accepted >= required) return 'Filled';
  if (accepted > 0) return 'Partially Filled';
  if (hasPendingApps) return 'Applications Received';
  return 'Open';
}

export const createLabourRequest = asyncHandler(async (req, res) => {
  const {
    category,
    workType,
    workersRequired,
    numberOfWorkers,
    startDate,
    requiredDate,
    durationDays = 1,
    dailyWage = 0,
    budget = null,
    farmSize = null,
    farmSizeUnit = 'acres',
    village,
    district,
    state,
    location,
    instructions = '',
    preferredHours = '',
  } = req.body;

  const finalCategory = category || workType;
  if (!finalCategory) {
    throw new AppError('Work type / category is required.', 400);
  }

  const workersNum = Number(workersRequired ?? numberOfWorkers);
  if (!Number.isInteger(workersNum) || workersNum < 1) {
    throw new AppError('Number of workers must be a positive whole number.', 400);
  }

  const durationNum = durationDays !== undefined && durationDays !== '' ? Number(durationDays) : 1;
  if (!Number.isFinite(durationNum) || durationNum <= 0) {
    throw new AppError('Duration in days must be a positive number.', 400);
  }

  const wageNum = dailyWage !== undefined && dailyWage !== '' && dailyWage !== null ? Number(dailyWage) : 0;
  if (!Number.isFinite(wageNum) || wageNum < 0) {
    throw new AppError('Daily wage cannot be negative.', 400);
  }

  const budgetNum = budget !== undefined && budget !== '' && budget !== null ? Number(budget) : null;
  if (budgetNum !== null && (!Number.isFinite(budgetNum) || budgetNum < 0)) {
    throw new AppError('Expected budget cannot be negative.', 400);
  }

  const finalStartDate = startDate || requiredDate;
  const today = getTodayIsoDate();
  if (!finalStartDate || finalStartDate < today) {
    throw new AppError('Required date cannot be in the past.', 400);
  }

  const normalizedLoc = normalizeLocation(location, {
    village: village || req.user.village,
    district: district || req.user.district,
    state: state || req.user.state,
    location: req.user.location,
  });

  if (!normalizedLoc.village) {
    throw new AppError('Work village / location is required.', 400);
  }

  const estimatedTotal =
    wageNum > 0
      ? Math.round(workersNum * durationNum * wageNum * 100) / 100
      : budgetNum !== null
        ? Math.round(budgetNum * 100) / 100
        : 0;

  let requestCode = generateCode('LR');
  for (let i = 0; i < 3; i += 1) {
    const exists = await LabourRequest.exists({ requestCode });
    if (!exists) break;
    requestCode = generateCode('LR');
  }

  const created = await LabourRequest.create({
    requestCode,
    farmerId: req.user._id,
    category: finalCategory,
    workersRequired: workersNum,
    workersAccepted: 0,
    remainingVacancies: workersNum,
    acceptedWorkerIds: [],
    startDate: finalStartDate,
    durationDays: durationNum,
    dailyWage: wageNum,
    budget: budgetNum,
    farmSize: farmSize !== undefined && farmSize !== '' && farmSize !== null ? Number(farmSize) : null,
    farmSizeUnit: farmSizeUnit === 'hectares' ? 'hectares' : 'acres',
    estimatedTotal,
    location: normalizedLoc,
    instructions,
    preferredHours,
    status: 'Open',
  });

  const populated = await created.populate(
    'farmerId',
    'name phone village district state'
  );

  res.status(201).json({
    success: true,
    data: populated,
  });
});

export const updateLabourRequest = asyncHandler(async (req, res) => {
  const request = await LabourRequest.findById(req.params.id);
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (
    request.farmerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('You can only edit your own labour requests.', 403);
  }
  if (!EDITABLE_STATUSES.includes(request.status)) {
    throw new AppError(`Cannot edit a request in status "${request.status}".`, 400);
  }

  const {
    category,
    workType,
    workersRequired,
    numberOfWorkers,
    startDate,
    requiredDate,
    durationDays,
    dailyWage,
    budget,
    farmSize,
    farmSizeUnit,
    village,
    district,
    state,
    location,
    instructions,
    preferredHours,
  } = req.body;

  if (category || workType) request.category = category || workType;

  if (workersRequired !== undefined || numberOfWorkers !== undefined) {
    const wNum = Number(workersRequired ?? numberOfWorkers);
    if (!Number.isInteger(wNum) || wNum < Math.max(1, request.workersAccepted)) {
      throw new AppError(
        `Workers required must be an integer at least ${Math.max(1, request.workersAccepted)}.`,
        400
      );
    }
    request.workersRequired = wNum;
  }

  const nextStart = startDate || requiredDate;
  if (nextStart !== undefined) {
    if (nextStart < getTodayIsoDate()) {
      throw new AppError('Required date cannot be in the past.', 400);
    }
    request.startDate = nextStart;
  }

  if (durationDays !== undefined) {
    const dNum = Number(durationDays);
    if (!Number.isFinite(dNum) || dNum <= 0) {
      throw new AppError('Duration must be a positive number.', 400);
    }
    request.durationDays = dNum;
  }

  if (dailyWage !== undefined) {
    const wNum = dailyWage === '' || dailyWage === null ? 0 : Number(dailyWage);
    if (!Number.isFinite(wNum) || wNum < 0) {
      throw new AppError('Daily wage cannot be negative.', 400);
    }
    request.dailyWage = wNum;
  }

  if (budget !== undefined) {
    const bNum = budget === '' || budget === null ? null : Number(budget);
    if (bNum !== null && (!Number.isFinite(bNum) || bNum < 0)) {
      throw new AppError('Budget cannot be negative.', 400);
    }
    request.budget = bNum;
  }

  if (farmSize !== undefined) {
    request.farmSize = farmSize === '' || farmSize === null ? null : Number(farmSize);
  }
  if (farmSizeUnit !== undefined) {
    request.farmSizeUnit = farmSizeUnit === 'hectares' ? 'hectares' : 'acres';
  }
  if (instructions !== undefined) request.instructions = instructions;
  if (preferredHours !== undefined) request.preferredHours = preferredHours;

  if (location !== undefined || village !== undefined || district !== undefined || state !== undefined) {
    const normalized = normalizeLocation(location, {
      village: village ?? request.location?.village,
      district: district ?? request.location?.district,
      state: state ?? request.location?.state,
      location: request.location,
    });
    if (!normalized.village) {
      throw new AppError('Work village / location is required.', 400);
    }
    request.location = normalized;
  }

  request.remainingVacancies = Math.max(0, request.workersRequired - request.workersAccepted);
  request.estimatedTotal =
    request.dailyWage > 0
      ? Math.round(request.workersRequired * request.durationDays * request.dailyWage * 100) / 100
      : request.budget !== null
        ? Math.round(request.budget * 100) / 100
        : 0;

  await request.save();
  res.json({ success: true, data: request });
});

export const getLabourRequests = asyncHandler(async (req, res) => {
  const { mine, category, district, search, status } = req.query;

  if (mine === 'true') {
    const requests = await LabourRequest.find({ farmerId: req.user._id })
      .populate('acceptedWorkerIds', 'name phone village district skills experience availability')
      .sort({ createdAt: -1 })
      .lean();

    const requestIds = requests.map((r) => r._id);
    const [applications, bookings] = await Promise.all([
      LabourApplication.find({ requestId: { $in: requestIds } })
        .sort({ appliedAt: -1 })
        .lean(),
      LabourBooking.find({ labourRequestId: { $in: requestIds } })
        .populate('workerId', 'name phone village district skills experience availability')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const appsByReq = new Map();
    for (const app of applications) {
      const key = app.requestId.toString();
      if (!appsByReq.has(key)) appsByReq.set(key, []);
      appsByReq.get(key).push(app);
    }

    const bookingsByReq = new Map();
    for (const b of bookings) {
      const key = b.labourRequestId.toString();
      if (!bookingsByReq.has(key)) bookingsByReq.set(key, []);
      bookingsByReq.get(key).push(b);
    }

    const data = requests.map((r) => ({
      ...r,
      remainingVacancies:
        r.remainingVacancies ?? Math.max(0, r.workersRequired - r.workersAccepted),
      applications: appsByReq.get(r._id.toString()) || [],
      bookings: bookingsByReq.get(r._id.toString()) || [],
    }));

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  }

  const filter = {};
  if (status && status !== 'All') {
    filter.status = status;
  } else {
    filter.status = { $in: OPEN_STATUSES };
  }
  if (category && category !== 'All') filter.category = category;
  if (district && district.trim()) {
    filter['location.district'] = new RegExp(district.trim(), 'i');
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { category: regex },
      { requestCode: regex },
      { instructions: regex },
      { 'location.village': regex },
      { 'location.district': regex },
    ];
  }

  const requests = await LabourRequest.find(filter)
    .populate('farmerId', 'name phone village district state')
    .sort({ createdAt: -1 });

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const enriched = enrichAndFilterByDistance(requests, userCoords, radiusKm);

  const reqIds = enriched.map((r) => r._id);
  const [myApps, myBookings] = await Promise.all([
    LabourApplication.find({ workerId: req.user._id, requestId: { $in: reqIds } }).lean(),
    LabourBooking.find({ workerId: req.user._id, labourRequestId: { $in: reqIds } }).lean(),
  ]);
  const appMap = new Map(myApps.map((a) => [a.requestId.toString(), a]));
  const bookingMap = new Map(myBookings.map((b) => [b.labourRequestId.toString(), b]));

  const data = enriched.map((r) => {
    const hasAcceptedBooking = bookingMap.has(r._id.toString());
    const safeFarmer = r.farmerId
      ? {
          _id: r.farmerId._id,
          name: r.farmerId.name,
          village: r.farmerId.village,
          district: r.farmerId.district,
          state: r.farmerId.state,
          ...(hasAcceptedBooking || req.user.role === 'admin'
            ? { phone: r.farmerId.phone }
            : {}),
        }
      : null;

    return {
      ...r,
      farmerId: safeFarmer,
      remainingVacancies:
        r.remainingVacancies ?? Math.max(0, r.workersRequired - r.workersAccepted),
      myApplication: appMap.get(r._id.toString()) || null,
      myBooking: bookingMap.get(r._id.toString()) || null,
    };
  });

  return res.json({
    success: true,
    count: data.length,
    data,
  });
});

export const getLabourRequestById = asyncHandler(async (req, res) => {
  const request = await LabourRequest.findById(req.params.id)
    .populate('farmerId', 'name phone village district state')
    .populate('acceptedWorkerIds', 'name phone village district skills experience availability');
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }

  const isOwner =
    request.farmerId?._id?.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  const [applications, bookings] = await Promise.all([
    isOwner
      ? LabourApplication.find({ requestId: request._id }).sort({ appliedAt: -1 })
      : LabourApplication.find({ requestId: request._id, workerId: req.user._id }),
    isOwner
      ? LabourBooking.find({ labourRequestId: request._id })
          .populate('workerId', 'name phone village district skills experience availability')
          .sort({ createdAt: -1 })
      : LabourBooking.find({ labourRequestId: request._id, workerId: req.user._id }),
  ]);

  res.json({
    success: true,
    data: {
      ...request.toObject(),
      applications,
      bookings,
    },
  });
});

/**
 * Worker directly accepts an available vacancy on an open labour request.
 * Uses an atomic conditional update to prevent overbooking or duplicate acceptance.
 */
export const acceptLabourRequest = asyncHandler(async (req, res) => {
  const existingRequest = await LabourRequest.findById(req.params.id);
  if (!existingRequest) {
    throw new AppError('Labour request not found.', 404);
  }
  if (existingRequest.farmerId.toString() === req.user._id.toString()) {
    throw new AppError('You cannot accept your own labour request.', 400);
  }

  const updatedReq = await LabourRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      status: { $in: OPEN_STATUSES },
      acceptedWorkerIds: { $ne: req.user._id },
      $expr: { $lt: ['$workersAccepted', '$workersRequired'] },
    },
    {
      $inc: { workersAccepted: 1 },
      $addToSet: { acceptedWorkerIds: req.user._id },
    },
    { new: true }
  );

  if (!updatedReq) {
    const alreadyAccepted = existingRequest.acceptedWorkerIds.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (alreadyAccepted) {
      throw new AppError('You have already accepted this labour request.', 409);
    }
    throw new AppError(
      'This labour request has no remaining vacancies.',
      409
    );
  }

  updatedReq.remainingVacancies = Math.max(
    0,
    updatedReq.workersRequired - updatedReq.workersAccepted
  );
  updatedReq.status = computeStatusFromCounts(
    updatedReq.workersAccepted,
    updatedReq.workersRequired,
    updatedReq.status
  );
  await updatedReq.save();

  let booking;
  try {
    booking = await LabourBooking.create({
      bookingCode: generateCode('LB'),
      labourRequestId: updatedReq._id,
      farmerId: updatedReq.farmerId,
      workerId: req.user._id,
      bookingStatus: 'Accepted',
    });
  } catch (err) {
    await LabourRequest.findByIdAndUpdate(updatedReq._id, {
      $inc: { workersAccepted: -1 },
      $pull: { acceptedWorkerIds: req.user._id },
    });
    if (err.code === 11000) {
      throw new AppError('You have already accepted this labour request.', 409);
    }
    throw err;
  }

  await LabourApplication.findOneAndUpdate(
    { requestId: updatedReq._id, workerId: req.user._id },
    {
      requestId: updatedReq._id,
      workerId: req.user._id,
      workerName: req.user.name,
      workerPhone: req.user.phone,
      workerVillage: [req.user.village, req.user.district].filter(Boolean).join(', '),
      skills: req.user.skills || [],
      experience: req.user.experience || '',
      status: 'Accepted',
    },
    { upsert: true }
  );

  const populatedBooking = await LabourBooking.findById(booking._id)
    .populate('farmerId', 'name phone village district state')
    .populate('labourRequestId');

  res.status(201).json({
    success: true,
    data: {
      booking: populatedBooking,
      request: updatedReq,
    },
  });
});

export const cancelLabourRequest = asyncHandler(async (req, res) => {
  const request = await LabourRequest.findById(req.params.id);
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (
    request.farmerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('You can only cancel your own labour requests.', 403);
  }
  if (['Completed', 'Cancelled'].includes(request.status)) {
    throw new AppError(`Cannot cancel a request that is already ${request.status}.`, 400);
  }

  request.status = 'Cancelled';
  await request.save();
  await LabourBooking.updateMany(
    { labourRequestId: request._id, bookingStatus: { $in: ['Accepted', 'In Progress'] } },
    { bookingStatus: 'Cancelled' }
  );

  res.json({
    success: true,
    data: request,
  });
});

export const updateLabourRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await LabourRequest.findById(req.params.id);
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (
    request.farmerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('You can only update your own labour requests.', 403);
  }
  if (!['In Progress', 'Completed', 'Cancelled'].includes(status)) {
    throw new AppError('Invalid status transition.', 400);
  }

  request.status = status;
  await request.save();
  res.json({ success: true, data: request });
});

export const updateLabourBookingStatus = asyncHandler(async (req, res) => {
  const { bookingStatus } = req.body;
  const booking = await LabourBooking.findById(req.params.bookingId);
  if (!booking) {
    throw new AppError('Labour booking not found.', 404);
  }

  const userId = req.user._id.toString();
  const isFarmer = booking.farmerId.toString() === userId;
  const isWorker = booking.workerId.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isFarmer && !isWorker && !isAdmin) {
    throw new AppError('Not authorized to update this labour booking.', 403);
  }

  const validTransitions = {
    Accepted: ['In Progress', 'Completed', 'Cancelled'],
    'In Progress': ['Completed'],
  };
  const allowed = validTransitions[booking.bookingStatus] || [];
  if (!allowed.includes(bookingStatus)) {
    throw new AppError(
      `Cannot transition booking from ${booking.bookingStatus} to ${bookingStatus}.`,
      400
    );
  }

  booking.bookingStatus = bookingStatus;
  await booking.save();

  if (bookingStatus === 'Cancelled') {
    const parentReq = await LabourRequest.findById(booking.labourRequestId);
    if (parentReq && !['Completed', 'Cancelled'].includes(parentReq.status)) {
      const siblingCount = await LabourApplication.countDocuments({
        requestId: parentReq._id,
        status: 'Pending',
      });
      const acceptedApp = await LabourApplication.findOne({
        requestId: parentReq._id,
        workerId: booking.workerId,
      });
      const releaseCount = Math.max(1, Number(acceptedApp?.numberOfWorkers) || 1);
      if (acceptedApp && acceptedApp.status === 'Accepted') {
        acceptedApp.status = 'Withdrawn';
        await acceptedApp.save();
      }
      parentReq.workersAccepted = Math.max(0, (parentReq.workersAccepted || 1) - releaseCount);
      parentReq.acceptedWorkerIds = (parentReq.acceptedWorkerIds || []).filter(
        (id) => id.toString() !== booking.workerId.toString()
      );
      parentReq.remainingVacancies = Math.max(
        0,
        parentReq.workersRequired - parentReq.workersAccepted
      );
      parentReq.status = computeStatusFromCounts(
        parentReq.workersAccepted,
        parentReq.workersRequired,
        parentReq.status,
        siblingCount > 0
      );
      await parentReq.save();
    }
  } else if (bookingStatus === 'In Progress' || bookingStatus === 'Completed') {
    const siblingBookings = await LabourBooking.find({
      labourRequestId: booking.labourRequestId,
      bookingStatus: { $ne: 'Cancelled' },
    }).lean();

    const allCompleted =
      siblingBookings.length > 0 &&
      siblingBookings.every((b) => b.bookingStatus === 'Completed');

    await LabourRequest.findByIdAndUpdate(booking.labourRequestId, {
      status: allCompleted ? 'Completed' : 'In Progress',
    });
  }

  res.json({ success: true, data: booking });
});

export const getRequestApplications = asyncHandler(async (req, res) => {
  const request = await LabourRequest.findById(req.params.id).lean();
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (
    request.farmerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('Only the request owner can view applications.', 403);
  }
  const applications = await LabourApplication.find({ requestId: request._id })
    .populate('workerId', 'name phone village district skills experience availability')
    .sort({ appliedAt: -1 });
  res.json({ success: true, count: applications.length, data: applications });
});

export const applyToLabourRequest = asyncHandler(async (req, res) => {
  const { message = '', numberOfWorkers = 1 } = req.body;
  const request = await LabourRequest.findById(req.params.id);

  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (request.farmerId.toString() === req.user._id.toString()) {
    throw new AppError('You cannot apply to your own labour request.', 400);
  }
  if (!OPEN_STATUSES.includes(request.status)) {
    throw new AppError('This labour request is no longer accepting applications.', 400);
  }
  if (request.workersAccepted >= request.workersRequired) {
    throw new AppError('All required worker positions are already filled.', 409);
  }

  const workersNum = Number(numberOfWorkers) || 1;
  if (!Number.isInteger(workersNum) || workersNum < 1) {
    throw new AppError('Number of workers offered must be a positive whole number.', 400);
  }

  const existing = await LabourApplication.findOne({
    requestId: request._id,
    workerId: req.user._id,
  });
  if (existing) {
    throw new AppError('You have already applied to this labour request.', 409);
  }

  try {
    const application = await LabourApplication.create({
      requestId: request._id,
      workerId: req.user._id,
      workerName: req.user.name,
      workerPhone: req.user.phone,
      workerVillage: [req.user.village, req.user.district].filter(Boolean).join(', '),
      skills: req.user.skills || [],
      experience: req.user.experience || '',
      numberOfWorkers: workersNum,
      message,
      status: 'Pending',
    });

    if (['Open', 'Pending'].includes(request.status) && request.workersAccepted === 0) {
      request.status = 'Applications Received';
      await request.save();
    }

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('You have already applied to this labour request.', 409);
    }
    throw err;
  }
});

async function processApplicationDecision({ request, application, status, reviewerUser }) {
  if (!['Accepted', 'Rejected'].includes(status)) {
    throw new AppError('Application status must be Accepted or Rejected.', 400);
  }
  if (
    request.farmerId.toString() !== reviewerUser._id.toString() &&
    reviewerUser.role !== 'admin'
  ) {
    throw new AppError('Only the farmer who posted this request can review applications.', 403);
  }
  if (application.status !== 'Pending') {
    throw new AppError(`Application is already ${application.status}.`, 400);
  }

  if (status === 'Accepted') {
    const offerCount = Math.max(1, Number(application.numberOfWorkers) || 1);
    const updatedReq = await LabourRequest.findOneAndUpdate(
      {
        _id: request._id,
        status: { $in: OPEN_STATUSES },
        $expr: {
          $lte: [{ $add: ['$workersAccepted', offerCount] }, '$workersRequired'],
        },
      },
      {
        $inc: { workersAccepted: offerCount },
        $addToSet: { acceptedWorkerIds: application.workerId },
      },
      { new: true }
    );

    if (!updatedReq) {
      throw new AppError(
        'Cannot accept application: insufficient remaining worker capacity.',
        409
      );
    }

    updatedReq.remainingVacancies = Math.max(
      0,
      updatedReq.workersRequired - updatedReq.workersAccepted
    );
    const remainingPending = await LabourApplication.exists({
      requestId: updatedReq._id,
      _id: { $ne: application._id },
      status: 'Pending',
    });
    updatedReq.status = computeStatusFromCounts(
      updatedReq.workersAccepted,
      updatedReq.workersRequired,
      updatedReq.status,
      Boolean(remainingPending)
    );
    await updatedReq.save();

    application.status = 'Accepted';
    await application.save();

    await LabourBooking.findOneAndUpdate(
      { labourRequestId: updatedReq._id, workerId: application.workerId },
      {
        bookingCode: generateCode('LB'),
        labourRequestId: updatedReq._id,
        farmerId: updatedReq.farmerId,
        workerId: application.workerId,
        bookingStatus: 'Accepted',
      },
      { upsert: true }
    );

    return { application, request: updatedReq };
  }

  application.status = 'Rejected';
  await application.save();
  return { application, request };
}

export const respondToApplication = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await LabourRequest.findById(req.params.id);
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  const application = await LabourApplication.findOne({
    _id: req.params.appId,
    requestId: request._id,
  });
  if (!application) {
    throw new AppError('Application not found.', 404);
  }

  const result = await processApplicationDecision({
    request,
    application,
    status,
    reviewerUser: req.user,
  });
  res.json({ success: true, data: result });
});

export const respondToApplicationById = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const application = await LabourApplication.findById(req.params.id);
  if (!application) {
    throw new AppError('Application not found.', 404);
  }
  const request = await LabourRequest.findById(application.requestId);
  if (!request) {
    throw new AppError('Parent labour request not found.', 404);
  }

  const result = await processApplicationDecision({
    request,
    application,
    status,
    reviewerUser: req.user,
  });
  res.json({ success: true, data: result });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await LabourApplication.find({ workerId: req.user._id })
    .populate({
      path: 'requestId',
      populate: { path: 'farmerId', select: 'name phone village district state' },
    })
    .sort({ appliedAt: -1 });

  res.json({
    success: true,
    count: applications.length,
    data: applications,
  });
});

export const getWorkerBookings = asyncHandler(async (req, res) => {
  const bookings = await LabourBooking.find({ workerId: req.user._id })
    .populate('farmerId', 'name phone village district state')
    .populate('labourRequestId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

export const getFarmerLabourBookings = asyncHandler(async (req, res) => {
  const bookings = await LabourBooking.find({ farmerId: req.user._id })
    .populate('workerId', 'name phone village district skills experience availability')
    .populate('labourRequestId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

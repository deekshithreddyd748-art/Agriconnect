import crypto from 'crypto';
import LabourRequest from '../models/LabourRequest.js';
import LabourApplication from '../models/LabourApplication.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { enrichAndFilterByDistance } from '../utils/haversine.js';
import { extractQueryCoords, normalizeLocation } from '../utils/listingHelpers.js';

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateRequestCode() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomInt(1000, 9999);
  return `LR-${year}-${suffix}`;
}

function computeStatusFromCounts(accepted, required, currentStatus) {
  if (['In Progress', 'Completed', 'Cancelled'].includes(currentStatus)) {
    return currentStatus;
  }
  if (accepted <= 0) return 'Open';
  if (accepted < required) return 'Partially Filled';
  return 'Fully Filled';
}

export const createLabourRequest = asyncHandler(async (req, res) => {
  const {
    category,
    workersRequired,
    startDate,
    durationDays,
    dailyWage,
    village,
    district,
    state,
    location,
    instructions = '',
    preferredHours = '',
  } = req.body;

  const workersNum = Number(workersRequired);
  if (!Number.isInteger(workersNum) || workersNum < 1) {
    throw new AppError('Number of workers must be a positive whole number.', 400);
  }

  const durationNum = Number(durationDays);
  if (!Number.isFinite(durationNum) || durationNum <= 0) {
    throw new AppError('Duration in days must be a positive number.', 400);
  }

  const wageNum = Number(dailyWage);
  if (!Number.isFinite(wageNum) || wageNum <= 0) {
    throw new AppError('Daily wage offered must be a positive amount.', 400);
  }

  const today = getTodayIsoDate();
  if (!startDate || startDate < today) {
    throw new AppError('Work start date cannot be in the past.', 400);
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

  const estimatedTotal = Math.round(workersNum * durationNum * wageNum * 100) / 100;

  let requestCode = generateRequestCode();
  for (let i = 0; i < 3; i += 1) {
    const exists = await LabourRequest.exists({ requestCode });
    if (!exists) break;
    requestCode = generateRequestCode();
  }

  const created = await LabourRequest.create({
    requestCode,
    farmerId: req.user._id,
    category,
    workersRequired: workersNum,
    workersAccepted: 0,
    startDate,
    durationDays: durationNum,
    dailyWage: wageNum,
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

export const getLabourRequests = asyncHandler(async (req, res) => {
  const { mine, category, district, search, status } = req.query;

  if (mine === 'true') {
    const requests = await LabourRequest.find({ farmerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const requestIds = requests.map((r) => r._id);
    const applications = await LabourApplication.find({
      requestId: { $in: requestIds },
    })
      .sort({ appliedAt: -1 })
      .lean();

    const appsByReq = new Map();
    for (const app of applications) {
      const key = app.requestId.toString();
      if (!appsByReq.has(key)) appsByReq.set(key, []);
      appsByReq.get(key).push(app);
    }

    const data = requests.map((r) => ({
      ...r,
      applications: appsByReq.get(r._id.toString()) || [],
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
    filter.status = { $in: ['Open', 'Partially Filled'] };
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

  const myApps = await LabourApplication.find({
    workerId: req.user._id,
    requestId: { $in: enriched.map((r) => r._id) },
  }).lean();
  const appMap = new Map(myApps.map((a) => [a.requestId.toString(), a]));

  const data = enriched.map((r) => ({
    ...r,
    myApplication: appMap.get(r._id.toString()) || null,
  }));

  return res.json({
    success: true,
    count: data.length,
    data,
  });
});

export const getLabourRequestById = asyncHandler(async (req, res) => {
  const request = await LabourRequest.findById(req.params.id).populate(
    'farmerId',
    'name phone village district state'
  );
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }

  const isOwner =
    request.farmerId?._id?.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  const applications = isOwner
    ? await LabourApplication.find({ requestId: request._id }).sort({ appliedAt: -1 })
    : await LabourApplication.find({
        requestId: request._id,
        workerId: req.user._id,
      });

  res.json({
    success: true,
    data: {
      ...request.toObject(),
      applications,
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

export const applyToLabourRequest = asyncHandler(async (req, res) => {
  const { message = '' } = req.body;
  const request = await LabourRequest.findById(req.params.id);

  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (request.farmerId.toString() === req.user._id.toString()) {
    throw new AppError('You cannot apply to your own labour request.', 400);
  }
  if (!['Open', 'Partially Filled'].includes(request.status)) {
    throw new AppError('This labour request is no longer accepting applications.', 400);
  }
  if (request.workersAccepted >= request.workersRequired) {
    throw new AppError('All required worker positions are already filled.', 409);
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
      message,
      status: 'Pending',
    });

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

export const respondToApplication = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Accepted', 'Rejected'].includes(status)) {
    throw new AppError('Application status must be Accepted or Rejected.', 400);
  }

  const request = await LabourRequest.findById(req.params.id);
  if (!request) {
    throw new AppError('Labour request not found.', 404);
  }
  if (
    request.farmerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('Only the farmer who posted this request can review applications.', 403);
  }

  const application = await LabourApplication.findOne({
    _id: req.params.appId,
    requestId: request._id,
  });
  if (!application) {
    throw new AppError('Application not found.', 404);
  }
  if (application.status !== 'Pending') {
    throw new AppError(`Application is already ${application.status}.`, 400);
  }

  if (status === 'Accepted') {
    const updatedReq = await LabourRequest.findOneAndUpdate(
      {
        _id: request._id,
        status: { $in: ['Open', 'Partially Filled'] },
        $expr: { $lt: ['$workersAccepted', '$workersRequired'] },
      },
      { $inc: { workersAccepted: 1 } },
      { new: true }
    );

    if (!updatedReq) {
      throw new AppError(
        'Cannot accept more workers: required worker slots are already filled.',
        409
      );
    }

    updatedReq.status = computeStatusFromCounts(
      updatedReq.workersAccepted,
      updatedReq.workersRequired,
      updatedReq.status
    );
    await updatedReq.save();

    application.status = 'Accepted';
    await application.save();

    return res.json({
      success: true,
      data: { application, request: updatedReq },
    });
  }

  application.status = 'Rejected';
  await application.save();
  return res.json({
    success: true,
    data: { application, request },
  });
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

import crypto from 'crypto';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatProfileRow,
  mapSupabaseError,
} from '../services/supabaseMappers.js';
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
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
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

function formatLabourRequestRow(row) {
  if (!row) return null;
  const farmer = row.farmer ? formatProfileRow(row.farmer, { includePrivate: true }) : null;
  const loc = row.location || {};
  return {
    id: row.id,
    _id: row.id,
    requestCode: row.request_code,
    request_code: row.request_code,
    farmerId: farmer || row.farmer_id,
    farmer_id: row.farmer_id,
    category: row.category,
    workersRequired: row.workers_required,
    workersAccepted: row.workers_accepted,
    remainingVacancies: row.remaining_vacancies,
    startDate: row.start_date,
    durationDays: Number(row.duration_days ?? 1),
    dailyWage: Number(row.daily_wage ?? 0),
    budget: row.budget !== null ? Number(row.budget) : null,
    farmSize: row.farm_size !== null ? Number(row.farm_size) : null,
    farmSizeUnit: row.farm_size_unit || 'acres',
    estimatedTotal: Number(row.estimated_total ?? 0),
    location: {
      lat: loc.lat ?? null,
      lng: loc.lng ?? null,
      address: loc.address || '',
      village: loc.village || '',
      district: loc.district || '',
      state: loc.state || '',
    },
    instructions: row.instructions || '',
    preferredHours: row.preferred_hours || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatLabourBookingRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    bookingCode: row.booking_code,
    booking_code: row.booking_code,
    labourRequestId: row.request ? formatLabourRequestRow(row.request) : row.request_id,
    requestId: row.request_id,
    farmerId: row.farmer ? formatProfileRow(row.farmer, { includePrivate: true }) : row.farmer_id,
    workerId: row.worker ? formatProfileRow(row.worker, { includePrivate: true }) : row.worker_id,
    acceptedDate: row.accepted_date,
    dailyWage: Number(row.daily_wage ?? 0),
    durationDays: Number(row.duration_days ?? 1),
    bookingStatus: row.status,
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function formatApplicationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    requestId: row.request ? formatLabourRequestRow(row.request) : row.request_id,
    workerId: row.worker ? formatProfileRow(row.worker, { includePrivate: true }) : row.labour_provider_id,
    numberOfWorkers: row.workers_offered ?? 1,
    proposedWage: row.proposed_wage !== null ? Number(row.proposed_wage) : null,
    message: row.message || '',
    status: row.status,
    appliedAt: row.created_at,
    createdAt: row.created_at,
  };
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
  if (!finalCategory) throw new AppError('Work type / category is required.', 400);

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
  if (!finalStartDate || finalStartDate < getTodayIsoDate()) {
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

  const supabase = getSupabaseClient();
  const requestCode = generateCode('LR');

  const { data: created, error } = await supabase
    .from('labour_requests')
    .insert({
      request_code: requestCode,
      farmer_id: req.user.id,
      category: finalCategory,
      workers_required: workersNum,
      workers_accepted: 0,
      remaining_vacancies: workersNum,
      start_date: finalStartDate,
      duration_days: durationNum,
      daily_wage: wageNum,
      budget: budgetNum,
      farm_size: farmSize !== undefined && farmSize !== '' && farmSize !== null ? Number(farmSize) : null,
      farm_size_unit: farmSizeUnit === 'hectares' ? 'hectares' : 'acres',
      estimated_total: estimatedTotal,
      location: normalizedLoc,
      instructions: String(instructions || '').trim(),
      preferred_hours: String(preferredHours || '').trim(),
      status: 'Open',
    })
    .select('*, farmer:profiles!labour_requests_farmer_id_fkey(id, full_name, mobile_number, village, district, state)')
    .single();

  if (error) throw mapSupabaseError(error, 'Could not post labour request.');

  res.status(201).json({
    success: true,
    data: formatLabourRequestRow(created),
  });
});

export const updateLabourRequest = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('labour_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read labour request.');
  if (!existing) throw new AppError('Labour request not found.', 404);
  if (String(existing.farmer_id) !== String(req.user.id) && req.user.role !== 'admin') {
    throw new AppError('You can only edit your own labour requests.', 403);
  }
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw new AppError(`Cannot edit a request in status "${existing.status}".`, 400);
  }

  const nextWorkers =
    (req.body.workersRequired ?? req.body.numberOfWorkers) !== undefined
      ? Number(req.body.workersRequired ?? req.body.numberOfWorkers)
      : existing.workers_required;
  const nextDuration =
    req.body.durationDays !== undefined ? Number(req.body.durationDays) : Number(existing.duration_days);
  const nextWage =
    req.body.dailyWage !== undefined
      ? Number(req.body.dailyWage || 0)
      : Number(existing.daily_wage || 0);
  const nextBudget =
    req.body.budget !== undefined
      ? req.body.budget === '' || req.body.budget === null
        ? null
        : Number(req.body.budget)
      : existing.budget;

  const updates = {
    category: req.body.category || req.body.workType || existing.category,
    workers_required: nextWorkers,
    remaining_vacancies: Math.max(0, nextWorkers - existing.workers_accepted),
    duration_days: nextDuration,
    daily_wage: nextWage,
    budget: nextBudget,
    estimated_total:
      nextWage > 0
        ? Math.round(nextWorkers * nextDuration * nextWage * 100) / 100
        : nextBudget !== null
          ? Math.round(Number(nextBudget) * 100) / 100
          : 0,
    instructions: req.body.instructions ?? existing.instructions,
    preferred_hours: req.body.preferredHours ?? existing.preferred_hours,
  };

  const nextStart = req.body.startDate || req.body.requiredDate;
  if (nextStart) {
    if (nextStart < getTodayIsoDate()) throw new AppError('Required date cannot be in the past.', 400);
    updates.start_date = nextStart;
  }

  const { data: updated, error: updErr } = await supabase
    .from('labour_requests')
    .update(updates)
    .eq('id', id)
    .select('*, farmer:profiles!labour_requests_farmer_id_fkey(id, full_name, mobile_number, village, district, state)')
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not update labour request.');

  res.json({ success: true, data: formatLabourRequestRow(updated) });
});

export const getLabourRequests = asyncHandler(async (req, res) => {
  const { mine, category, status } = req.query;
  const supabase = getSupabaseClient();

  let query = supabase
    .from('labour_requests')
    .select('*, farmer:profiles!labour_requests_farmer_id_fkey(id, full_name, mobile_number, village, district, state)')
    .order('created_at', { ascending: false });

  if (mine === 'true' || req.user.role === 'farmer') {
    query = query.eq('farmer_id', req.user.id);
  } else {
    query = query.in('status', OPEN_STATUSES);
  }
  if (category && category !== 'All') query = query.eq('category', category);
  if (status && status !== 'All') query = query.eq('status', status);

  const { data: rows, error } = await query;
  if (error) throw mapSupabaseError(error, 'Could not load labour requests.');

  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const formatted = (rows || []).map(formatLabourRequestRow);
  const enriched = enrichAndFilterByDistance(formatted, userCoords, radiusKm);

  res.json({
    success: true,
    count: enriched.length,
    data: enriched,
  });
});

export const getLabourRequestById = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from('labour_requests')
    .select('*, farmer:profiles!labour_requests_farmer_id_fkey(id, full_name, mobile_number, village, district, state)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Failed to read labour request.');
  if (!row) throw new AppError('Labour request not found.', 404);

  res.json({ success: true, data: formatLabourRequestRow(row) });
});

export const cancelLabourRequest = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('labour_requests')
    .select('id, farmer_id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to load labour request.');
  if (!existing) throw new AppError('Labour request not found.', 404);
  if (String(existing.farmer_id) !== String(req.user.id) && req.user.role !== 'admin') {
    throw new AppError('You can only cancel your own labour requests.', 403);
  }
  if (existing.status === 'Completed' || existing.status === 'Cancelled') {
    throw new AppError(`Cannot cancel request in status "${existing.status}".`, 400);
  }

  const { data: updated, error } = await supabase
    .from('labour_requests')
    .update({ status: 'Cancelled' })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw mapSupabaseError(error, 'Could not cancel labour request.');
  res.json({ success: true, data: formatLabourRequestRow(updated) });
});

export const updateLabourRequestStatus = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const { status } = req.body;
  if (!['In Progress', 'Completed', 'Cancelled'].includes(status)) {
    throw new AppError('Invalid status transition.', 400);
  }

  const supabase = getSupabaseClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('labour_requests')
    .select('id, farmer_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read labour request.');
  if (!existing) throw new AppError('Labour request not found.', 404);
  if (String(existing.farmer_id) !== String(req.user.id) && req.user.role !== 'admin') {
    throw new AppError('You can only update your own labour requests.', 403);
  }

  const { data: updated, error } = await supabase
    .from('labour_requests')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw mapSupabaseError(error, 'Could not update labour request status.');
  res.json({ success: true, data: formatLabourRequestRow(updated) });
});

export const acceptLabourRequest = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const supabase = getSupabaseClient();

  const { data: reqRow, error: fetchErr } = await supabase
    .from('labour_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read labour request.');
  if (!reqRow) throw new AppError('Labour request not found.', 404);
  if (String(reqRow.farmer_id) === String(req.user.id)) {
    throw new AppError('You cannot accept your own labour request.', 400);
  }
  if (!OPEN_STATUSES.includes(reqRow.status) || reqRow.remaining_vacancies <= 0) {
    throw new AppError('This labour request is no longer accepting workers.', 409);
  }

  const nextAccepted = Number(reqRow.workers_accepted) + 1;
  const nextRemaining = Math.max(0, Number(reqRow.workers_required) - nextAccepted);
  const nextStatus = computeStatusFromCounts(
    nextAccepted,
    reqRow.workers_required,
    reqRow.status
  );

  const { data: createdBooking, error: lbErr } = await supabase
    .from('labour_bookings')
    .insert({
      booking_code: generateCode('LB'),
      request_id: id,
      farmer_id: reqRow.farmer_id,
      worker_id: req.user.id,
      accepted_date: reqRow.start_date,
      daily_wage: reqRow.daily_wage,
      duration_days: reqRow.duration_days,
      status: 'Accepted',
    })
    .select('*')
    .single();

  if (lbErr) {
    if (lbErr.code === '23505') {
      throw new AppError('You have already accepted this labour request.', 409);
    }
    throw mapSupabaseError(lbErr, 'Could not create worker confirmation.');
  }

  const { data: updatedReq } = await supabase
    .from('labour_requests')
    .update({
      workers_accepted: nextAccepted,
      remaining_vacancies: nextRemaining,
      status: nextStatus,
    })
    .eq('id', id)
    .select('*')
    .single();

  await supabase.from('notifications').insert({
    user_id: reqRow.farmer_id,
    title: 'Worker Accepted Request',
    message: `${req.user.name} accepted your ${reqRow.category} request (${reqRow.request_code}).`,
    notification_type: 'labour_request_accepted',
  });

  res.status(201).json({
    success: true,
    data: {
      booking: formatLabourBookingRow(createdBooking),
      request: formatLabourRequestRow(updatedReq || reqRow),
    },
  });
});

export const applyToLabourRequest = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const workersOffered = Math.max(1, Number(req.body?.numberOfWorkers || req.body?.workersOffered || 1));
  const supabase = getSupabaseClient();

  const { data: reqRow, error: fetchErr } = await supabase
    .from('labour_requests')
    .select('id, farmer_id, remaining_vacancies, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to read labour request.');
  if (!reqRow) throw new AppError('Labour request not found.', 404);
  if (!OPEN_STATUSES.includes(reqRow.status)) {
    throw new AppError('This request is closed for applications.', 400);
  }

  const { data: created, error } = await supabase
    .from('labour_applications')
    .insert({
      request_id: id,
      labour_provider_id: req.user.id,
      workers_offered: workersOffered,
      proposed_wage: req.body?.proposedWage ?? null,
      message: String(req.body?.message || '').trim(),
      status: 'Pending',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('You have already applied to this labour request.', 409);
    }
    throw mapSupabaseError(error, 'Could not submit application.');
  }

  res.status(201).json({ success: true, data: formatApplicationRow(created) });
});

export const getRequestApplications = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'labour request id');
  const supabase = getSupabaseClient();

  const { data: reqRow, error: reqErr } = await supabase
    .from('labour_requests')
    .select('id, farmer_id')
    .eq('id', id)
    .maybeSingle();

  if (reqErr) throw mapSupabaseError(reqErr, 'Failed to read labour request.');
  if (!reqRow) throw new AppError('Labour request not found.', 404);
  if (String(reqRow.farmer_id) !== String(req.user.id) && req.user.role !== 'admin') {
    throw new AppError('Only the request owner can view applications.', 403);
  }

  const { data: apps, error } = await supabase
    .from('labour_applications')
    .select('*, worker:profiles!labour_applications_labour_provider_id_fkey(id, full_name, mobile_number, village, district)')
    .eq('request_id', id)
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load applications.');
  res.json({ success: true, count: (apps || []).length, data: (apps || []).map(formatApplicationRow) });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();
  const { data: apps, error } = await supabase
    .from('labour_applications')
    .select('*, request:labour_requests(*, farmer:profiles!labour_requests_farmer_id_fkey(id, full_name, mobile_number, village, district, state))')
    .eq('labour_provider_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load applications.');
  res.json({ success: true, count: (apps || []).length, data: (apps || []).map(formatApplicationRow) });
});

export const getWorkerBookings = asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase
    .from('labour_bookings')
    .select('*, farmer:profiles!labour_bookings_farmer_id_fkey(id, full_name, mobile_number, village, district, state), request:labour_requests(*)')
    .eq('worker_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load worker bookings.');
  const formatted = (rows || []).map(formatLabourBookingRow);
  res.json({ success: true, count: formatted.length, data: formatted });
});

export const getFarmerLabourBookings = asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase
    .from('labour_bookings')
    .select('*, worker:profiles!labour_bookings_worker_id_fkey(id, full_name, mobile_number, village, district), request:labour_requests(*)')
    .eq('farmer_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load labour bookings.');
  const formatted = (rows || []).map(formatLabourBookingRow);
  res.json({ success: true, count: formatted.length, data: formatted });
});

export const updateLabourBookingStatus = asyncHandler(async (req, res) => {
  const bookingId = assertValidUuid(req.params.bookingId, 'labour booking id');
  const nextStatus = req.body?.bookingStatus ?? req.body?.status;
  const supabase = getSupabaseClient();

  const { data: booking, error: fetchErr } = await supabase
    .from('labour_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to load labour booking.');
  if (!booking) throw new AppError('Labour booking not found.', 404);

  const isFarmer = String(booking.farmer_id) === String(req.user.id);
  const isWorker = String(booking.worker_id) === String(req.user.id);
  if (!isFarmer && !isWorker && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this labour booking.', 403);
  }

  const validTransitions = {
    Accepted: ['In Progress', 'Completed', 'Cancelled'],
    'In Progress': ['Completed'],
  };
  if (!(validTransitions[booking.status] || []).includes(nextStatus)) {
    throw new AppError(`Cannot transition booking from ${booking.status} to ${nextStatus}.`, 400);
  }

  const { data: updated, error: updErr } = await supabase
    .from('labour_bookings')
    .update({ status: nextStatus })
    .eq('id', bookingId)
    .select('*')
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not update labour booking.');
  res.json({ success: true, data: formatLabourBookingRow(updated) });
});

async function handleAppDecision({ request, application, status, reviewerUser, supabase }) {
  if (String(request.farmer_id) !== String(reviewerUser.id) && reviewerUser.role !== 'admin') {
    throw new AppError('Only the farmer who posted this request can respond.', 403);
  }
  if (!['Accepted', 'Rejected'].includes(status)) {
    throw new AppError('Decision must be Accepted or Rejected.', 400);
  }
  if (application.status !== 'Pending') {
    throw new AppError('This application has already been processed.', 400);
  }

  if (status === 'Accepted') {
    const offerCount = Math.max(1, Number(application.workers_offered) || 1);
    const nextAccepted = Number(request.workers_accepted) + offerCount;
    if (nextAccepted > Number(request.workers_required)) {
      throw new AppError('Cannot accept application: insufficient remaining capacity.', 409);
    }

    await supabase
      .from('labour_requests')
      .update({
        workers_accepted: nextAccepted,
        remaining_vacancies: Math.max(0, Number(request.workers_required) - nextAccepted),
        status: computeStatusFromCounts(nextAccepted, request.workers_required, request.status),
      })
      .eq('id', request.id);

    await supabase
      .from('labour_bookings')
      .upsert(
        {
          booking_code: generateCode('LB'),
          request_id: request.id,
          farmer_id: request.farmer_id,
          worker_id: application.labour_provider_id,
          accepted_date: request.start_date,
          daily_wage: request.daily_wage,
          duration_days: request.duration_days,
          status: 'Accepted',
        },
        { onConflict: 'request_id,worker_id' }
      );
  }

  const { data: updatedApp } = await supabase
    .from('labour_applications')
    .update({ status })
    .eq('id', application.id)
    .select('*')
    .single();

  return { application: formatApplicationRow(updatedApp || application), request: formatLabourRequestRow(request) };
}

export const respondToApplication = asyncHandler(async (req, res) => {
  const reqId = assertValidUuid(req.params.id, 'request id');
  const appId = assertValidUuid(req.params.appId, 'application id');
  const supabase = getSupabaseClient();

  const [reqRes, appRes] = await Promise.all([
    supabase.from('labour_requests').select('*').eq('id', reqId).maybeSingle(),
    supabase.from('labour_applications').select('*').eq('id', appId).eq('request_id', reqId).maybeSingle(),
  ]);
  if (!reqRes.data) throw new AppError('Labour request not found.', 404);
  if (!appRes.data) throw new AppError('Application not found.', 404);

  const result = await handleAppDecision({
    request: reqRes.data,
    application: appRes.data,
    status: req.body?.status,
    reviewerUser: req.user,
    supabase,
  });
  res.json({ success: true, data: result });
});

export const respondToApplicationById = asyncHandler(async (req, res) => {
  const appId = assertValidUuid(req.params.id, 'application id');
  const supabase = getSupabaseClient();

  const { data: appRow } = await supabase
    .from('labour_applications')
    .select('*')
    .eq('id', appId)
    .maybeSingle();
  if (!appRow) throw new AppError('Application not found.', 404);

  const { data: reqRow } = await supabase
    .from('labour_requests')
    .select('*')
    .eq('id', appRow.request_id)
    .maybeSingle();
  if (!reqRow) throw new AppError('Parent labour request not found.', 404);

  const result = await handleAppDecision({
    request: reqRow,
    application: appRow,
    status: req.body?.status,
    reviewerUser: req.user,
    supabase,
  });
  res.json({ success: true, data: result });
});

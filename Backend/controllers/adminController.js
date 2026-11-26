import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatBookingRow,
  formatProfileRow,
  mapSupabaseError,
} from '../services/supabaseMappers.js';

const BOOKING_STATUSES = ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'];

const LISTING_TABLES = {
  equipment: 'equipment_listings',
  labour: 'labour_profiles',
  facility: 'facility_listings',
};

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const supabase = getSupabaseClient();

  const [
    usersRes,
    equipmentsRes,
    laboursRes,
    facilitiesRes,
    bookingsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('equipment_listings').select('id, is_reported'),
    supabase.from('labour_profiles').select('id, is_reported'),
    supabase.from('facility_listings').select('id, is_reported'),
    supabase
      .from('bookings')
      .select('*, farmer:profiles!bookings_farmer_id_fkey(id, full_name), provider:profiles!bookings_provider_id_fkey(id, full_name)')
      .order('created_at', { ascending: false }),
  ]);

  const err =
    usersRes.error ||
    equipmentsRes.error ||
    laboursRes.error ||
    facilitiesRes.error ||
    bookingsRes.error;
  if (err) throw mapSupabaseError(err, 'Could not load admin overview.');

  const users = usersRes.data || [];
  const equipments = equipmentsRes.data || [];
  const labours = laboursRes.data || [];
  const facilities = facilitiesRes.data || [];
  const bookings = bookingsRes.data || [];

  const statusMap = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]));
  bookings.forEach((b) => {
    if (statusMap[b.status] !== undefined) statusMap[b.status] += 1;
  });

  const equipmentOwners = users.filter((u) => u.role === 'equipment_owner').length;
  const labourProviders = users.filter((u) => u.role === 'labour_provider').length;
  const facilityOperators = users.filter((u) => u.role === 'facility_operator').length;

  res.json({
    success: true,
    data: {
      totalUsers: users.length,
      totalFarmers: users.filter((u) => u.role === 'farmer').length,
      totalProviders: equipmentOwners + labourProviders + facilityOperators,
      providerBreakdown: {
        equipmentOwners,
        labourProviders,
        facilityOperators,
      },
      totalEquipment: equipments.length,
      totalLabour: labours.length,
      totalFacilities: facilities.length,
      reportedListingsCount:
        equipments.filter((e) => e.is_reported).length +
        labours.filter((l) => l.is_reported).length +
        facilities.filter((f) => f.is_reported).length,
      totalBookings: bookings.length,
      bookingStatusBreakdown: BOOKING_STATUSES.map((status) => ({
        status,
        count: statusMap[status] || 0,
      })),
      recentBookings: bookings.slice(0, 8).map(formatBookingRow),
      recentUsers: users.slice(0, 5).map((u) => formatProfileRow(u, { includePrivate: true })),
    },
  });
});

export const getAllUsers = asyncHandler(async (_req, res) => {
  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load users.');
  res.json({
    success: true,
    data: (rows || []).map((r) => formatProfileRow(r, { includePrivate: true })),
  });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'user id');
  const supabase = getSupabaseClient();

  const { data: user, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to look up profile.');
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deactivated here.', 400);
  }

  const { data: updated, error: updErr } = await supabase
    .from('profiles')
    .update({ is_active: !user.is_active })
    .eq('id', id)
    .select('*')
    .single();

  if (updErr) throw mapSupabaseError(updErr, 'Could not update user status.');
  res.json({ success: true, data: formatProfileRow(updated, { includePrivate: true }) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'user id');
  const supabase = getSupabaseClient();

  const { data: user, error: fetchErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw mapSupabaseError(fetchErr, 'Failed to look up profile.');
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deleted.', 400);
  }

  const { error: delErr } = await supabase.from('profiles').delete().eq('id', id);
  if (delErr) throw mapSupabaseError(delErr, 'Could not remove user.');
  res.json({ success: true, message: 'User removed.' });
});

export const getAllListingsAdmin = asyncHandler(async (_req, res) => {
  const supabase = getSupabaseClient();

  const [eqRes, lbRes, fcRes] = await Promise.all([
    supabase
      .from('equipment_listings')
      .select('*, owner:profiles!equipment_listings_owner_id_fkey(id, full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('labour_profiles')
      .select('*, provider:profiles!labour_profiles_provider_id_fkey(id, full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('facility_listings')
      .select('*, owner:profiles!facility_listings_owner_id_fkey(id, full_name)')
      .order('created_at', { ascending: false }),
  ]);

  const err = eqRes.error || lbRes.error || fcRes.error;
  if (err) throw mapSupabaseError(err, 'Could not load admin listings.');

  const unified = [
    ...(eqRes.data || []).map((e) => ({
      _id: e.id,
      type: 'equipment',
      title: e.equipment_name,
      category: e.equipment_category,
      ownerName: e.owner?.full_name || 'Unknown',
      availability: e.availability_status,
      isReported: Boolean(e.is_reported),
      reportReason: e.report_reason || '',
      locationText: [e.village, e.district].filter(Boolean).join(', '),
      createdAt: e.created_at,
    })),
    ...(lbRes.data || []).map((l) => ({
      _id: l.id,
      type: 'labour',
      title: l.title || `${l.category} Team`,
      category: l.category,
      ownerName: l.provider?.full_name || 'Unknown',
      availability: l.availability_status,
      isReported: Boolean(l.is_reported),
      reportReason: l.report_reason || '',
      locationText: [l.village, l.district].filter(Boolean).join(', '),
      createdAt: l.created_at,
    })),
    ...(fcRes.data || []).map((f) => ({
      _id: f.id,
      type: 'facility',
      title: f.facility_name,
      category: f.facility_type,
      ownerName: f.owner?.full_name || 'Unknown',
      availability: f.availability_status,
      isReported: Boolean(f.is_reported),
      reportReason: f.report_reason || '',
      locationText: [f.village, f.district].filter(Boolean).join(', '),
      createdAt: f.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: unified });
});

export const getAllBookingsAdmin = asyncHandler(async (_req, res) => {
  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase
    .from('bookings')
    .select(
      '*, farmer:profiles!bookings_farmer_id_fkey(id, full_name, mobile_number, village, district), provider:profiles!bookings_provider_id_fkey(id, full_name, mobile_number, village, district)'
    )
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load bookings.');
  res.json({ success: true, data: (rows || []).map(formatBookingRow) });
});

export const toggleListingAvailabilityAdmin = asyncHandler(async (req, res) => {
  const table = LISTING_TABLES[req.params.type];
  if (!table) throw new AppError('Invalid listing type.', 400);
  const id = assertValidUuid(req.params.id, 'listing id');
  const supabase = getSupabaseClient();

  const { data: row } = await supabase
    .from(table)
    .select('id, availability_status')
    .eq('id', id)
    .maybeSingle();
  if (!row) throw new AppError('Listing not found.', 404);

  const { data: updated, error } = await supabase
    .from(table)
    .update({ availability_status: !row.availability_status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw mapSupabaseError(error, 'Could not update listing availability.');

  res.json({ success: true, data: updated });
});

export const dismissListingReportAdmin = asyncHandler(async (req, res) => {
  const table = LISTING_TABLES[req.params.type];
  if (!table) throw new AppError('Invalid listing type.', 400);
  const id = assertValidUuid(req.params.id, 'listing id');
  const supabase = getSupabaseClient();

  const { data: updated, error } = await supabase
    .from(table)
    .update({
      is_reported: false,
      report_reason: '',
      reported_by: null,
      reported_at: null,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw mapSupabaseError(error, 'Could not dismiss report.');
  if (!updated) throw new AppError('Listing not found.', 404);

  res.json({ success: true, message: 'Report dismissed.' });
});

export const deleteListingAdmin = asyncHandler(async (req, res) => {
  const table = LISTING_TABLES[req.params.type];
  if (!table) throw new AppError('Invalid listing type.', 400);
  const id = assertValidUuid(req.params.id, 'listing id');
  const supabase = getSupabaseClient();

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw mapSupabaseError(error, 'Could not delete listing.');

  res.json({ success: true, message: 'Listing deleted by administrator.' });
});

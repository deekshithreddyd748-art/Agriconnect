import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatBookingRow,
  formatEquipmentRow,
  formatFacilityRow,
  formatLabourRow,
  formatNotificationRow,
  mapSupabaseError,
} from '../services/supabaseMappers.js';
import { enrichAndFilterByDistance } from '../utils/haversine.js';
import { extractQueryCoords } from '../utils/listingHelpers.js';

const REPORT_TABLES = {
  equipment: 'equipment_listings',
  labour: 'labour_profiles',
  facility: 'facility_listings',
};

export const getPublicStats = asyncHandler(async (_req, res) => {
  const supabase = getSupabaseClient();
  const [
    farmersRes,
    providersRes,
    equipmentRes,
    labourRes,
    facilityRes,
    bookingsRes,
    completedRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'farmer')
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['equipment_owner', 'labour_provider', 'facility_operator'])
      .eq('is_active', true),
    supabase.from('equipment_listings').select('id', { count: 'exact', head: true }),
    supabase.from('labour_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('facility_listings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Completed'),
  ]);

  const firstErr =
    farmersRes.error ||
    providersRes.error ||
    equipmentRes.error ||
    labourRes.error ||
    facilityRes.error ||
    bookingsRes.error ||
    completedRes.error;
  if (firstErr) throw mapSupabaseError(firstErr, 'Could not load public platform statistics.');

  const equipment = equipmentRes.count ?? 0;
  const labour = labourRes.count ?? 0;
  const facilities = facilityRes.count ?? 0;

  res.json({
    success: true,
    data: {
      farmers: farmersRes.count ?? 0,
      providers: providersRes.count ?? 0,
      equipment,
      labour,
      facilities,
      totalServices: equipment + labour + facilities,
      bookings: bookingsRes.count ?? 0,
      completedBookings: completedRes.count ?? 0,
    },
  });
});

export const getNearbyServices = asyncHandler(async (req, res) => {
  const { serviceType = 'all', district, village } = req.query;
  const { userCoords, radiusKm } = extractQueryCoords(req.query);
  const supabase = getSupabaseClient();

  const applyLoc = (q) => {
    let next = q.eq('availability_status', true);
    if (district && district.trim()) next = next.ilike('district', `%${district.trim()}%`);
    if (village && village.trim()) next = next.ilike('village', `%${village.trim()}%`);
    return next.limit(200);
  };

  const [eqRes, lbRes, fcRes] = await Promise.all([
    serviceType === 'all' || serviceType === 'equipment'
      ? applyLoc(
          supabase
            .from('equipment_listings')
            .select('*, owner:profiles!equipment_listings_owner_id_fkey(id, full_name, mobile_number, village, district)')
        )
      : { data: [], error: null },
    serviceType === 'all' || serviceType === 'labour'
      ? applyLoc(
          supabase
            .from('labour_profiles')
            .select('*, provider:profiles!labour_profiles_provider_id_fkey(id, full_name, mobile_number, village, district)')
        )
      : { data: [], error: null },
    serviceType === 'all' || serviceType === 'facility'
      ? applyLoc(
          supabase
            .from('facility_listings')
            .select('*, owner:profiles!facility_listings_owner_id_fkey(id, full_name, mobile_number, village, district)')
        )
      : { data: [], error: null },
  ]);

  const err = eqRes.error || lbRes.error || fcRes.error;
  if (err) throw mapSupabaseError(err, 'Could not load nearby services.');

  const mappedEquipments = enrichAndFilterByDistance(
    (eqRes.data || []).map((r) => formatEquipmentRow(r, userCoords)),
    userCoords,
    radiusKm
  ).map((item) => ({
    ...item,
    serviceType: 'equipment',
    displayTitle: item.name,
    providerName: item.ownerId?.name || 'Owner',
    priceLabel: `Rs ${item.price} / ${item.priceUnit}`,
  }));

  const mappedLabours = enrichAndFilterByDistance(
    (lbRes.data || []).map((r) => formatLabourRow(r, userCoords)),
    userCoords,
    radiusKm
  ).map((item) => ({
    ...item,
    serviceType: 'labour',
    displayTitle: item.title || `${item.category} Team`,
    providerName: item.providerId?.name || 'Provider',
    priceLabel: `Rs ${item.pricePerWorker} / worker / ${item.priceUnit}`,
  }));

  const mappedFacilities = enrichAndFilterByDistance(
    (fcRes.data || []).map((r) => formatFacilityRow(r, userCoords)),
    userCoords,
    radiusKm
  ).map((item) => ({
    ...item,
    serviceType: 'facility',
    displayTitle: item.name,
    providerName: item.operatorId?.name || 'Operator',
    priceLabel: `Rs ${item.price} ${item.priceUnit}`,
  }));

  const combined = [...mappedEquipments, ...mappedLabours, ...mappedFacilities].sort(
    (a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    }
  );

  res.json({
    success: true,
    count: combined.length,
    data: {
      all: combined,
      equipment: mappedEquipments,
      labour: mappedLabours,
      facilities: mappedFacilities,
    },
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 15 } = req.query;
  const userCoords = {
    lat: lat ?? req.user.location?.lat,
    lng: lng ?? req.user.location?.lng,
  };
  const supabase = getSupabaseClient();

  if (req.user.role === 'farmer') {
    const [
      eqRes,
      lbRes,
      fcRes,
      bookingsRes,
      labourReqRes,
      favCountRes,
      notifRes,
    ] = await Promise.all([
      supabase.from('equipment_listings').select('*').eq('availability_status', true).order('created_at', { ascending: false }).limit(100),
      supabase.from('labour_profiles').select('*').eq('availability_status', true).order('created_at', { ascending: false }).limit(100),
      supabase.from('facility_listings').select('*').eq('availability_status', true).order('created_at', { ascending: false }).limit(100),
      supabase
        .from('bookings')
        .select('*, provider:profiles!bookings_provider_id_fkey(id, full_name, mobile_number, village, district)')
        .eq('farmer_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('labour_requests')
        .select('*')
        .eq('farmer_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('favourites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.user.id),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const firstErr =
      eqRes.error ||
      lbRes.error ||
      fcRes.error ||
      bookingsRes.error ||
      labourReqRes.error ||
      favCountRes.error ||
      notifRes.error;
    if (firstErr) throw mapSupabaseError(firstErr, 'Could not load dashboard stats.');

    const equipments = (eqRes.data || []).map((r) => formatEquipmentRow(r, userCoords));
    const labours = (lbRes.data || []).map((r) => formatLabourRow(r, userCoords));
    const facilities = (fcRes.data || []).map((r) => formatFacilityRow(r, userCoords));
    const bookings = (bookingsRes.data || []).map(formatBookingRow);
    const labourRequests = labourReqRes.data || [];
    const notifications = (notifRes.data || []).map(formatNotificationRow);

    const requestIds = labourRequests.map((r) => r.id);
    let pendingAppsCount = 0;
    if (requestIds.length > 0) {
      const { count } = await supabase
        .from('labour_applications')
        .select('id', { count: 'exact', head: true })
        .in('request_id', requestIds)
        .eq('status', 'Pending');
      pendingAppsCount = count ?? 0;
    }

    const nearbyEquipment = enrichAndFilterByDistance(equipments, userCoords, radius);
    const nearbyLabour = enrichAndFilterByDistance(labours, userCoords, radius);
    const nearbyFacilities = enrichAndFilterByDistance(facilities, userCoords, radius);

    const pendingBookings = bookings.filter((b) => b.status === 'Pending');
    const upcomingBookings = bookings.filter((b) => b.status === 'Accepted');
    const completedBookings = bookings.filter((b) => b.status === 'Completed');

    return res.json({
      success: true,
      data: {
        nearbyServiceCount:
          nearbyEquipment.length + nearbyLabour.length + nearbyFacilities.length,
        availableMachineryCount: nearbyEquipment.length,
        availableLabourCount: nearbyLabour.length,
        nearbyFacilitiesCount: nearbyFacilities.length,
        totalAvailableMachinery: equipments.length,
        totalAvailableLabour: labours.length,
        totalAvailableFacilities: facilities.length,
        availableMachineryPreview: equipments.slice(0, 4),
        availableLabourPreview: labours.slice(0, 4),
        availableFacilitiesPreview: facilities.slice(0, 4),
        upcomingBookings,
        pendingBookings,
        completedBookingsCount: completedBookings.length,
        savedListingsCount: favCountRes.count ?? 0,
        unreadNotificationsCount: notifications.filter((n) => !n.is_read).length,
        notifications: notifications.slice(0, 8),
        labourRequests: labourRequests.slice(0, 4).map((r) => ({
          ...r,
          _id: r.id,
          requestCode: r.request_code,
          workersRequired: r.workers_required,
          workersAccepted: r.workers_accepted,
          remainingVacancies: r.remaining_vacancies,
          startDate: r.start_date,
          durationDays: r.duration_days,
          dailyWage: Number(r.daily_wage ?? 0),
          estimatedTotal: Number(r.estimated_total ?? 0),
        })),
        openLabourRequestsCount: labourRequests.filter((r) =>
          ['Open', 'Applications Received', 'Pending', 'Worker Accepted', 'Partially Filled'].includes(r.status)
        ).length,
        pendingApplicationsCount: pendingAppsCount,
        recentActivity: bookings.slice(0, 6),
      },
    });
  }

  const providerCfg = {
    equipment_owner: { table: 'equipment_listings', col: 'owner_id', format: formatEquipmentRow },
    labour_provider: { table: 'labour_profiles', col: 'provider_id', format: formatLabourRow },
    facility_operator: { table: 'facility_listings', col: 'owner_id', format: formatFacilityRow },
  }[req.user.role];

  const [listingsRes, bookingsRes, notifRes] = await Promise.all([
    providerCfg
      ? supabase
          .from(providerCfg.table)
          .select('*')
          .eq(providerCfg.col, req.user.id)
          .order('created_at', { ascending: false })
      : { data: [], error: null },
    supabase
      .from('bookings')
      .select('*, farmer:profiles!bookings_farmer_id_fkey(id, full_name, mobile_number, village, district)')
      .eq('provider_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const err = listingsRes.error || bookingsRes.error || notifRes.error;
  if (err) throw mapSupabaseError(err, 'Could not load provider dashboard stats.');

  const rawListings = listingsRes.data || [];
  const listings = providerCfg ? rawListings.map((r) => providerCfg.format(r)) : [];
  const bookings = (bookingsRes.data || []).map(formatBookingRow);
  const notifications = (notifRes.data || []).map(formatNotificationRow);

  const activeListings = rawListings.filter((l) => l.availability_status !== false).length;
  const pendingRequests = bookings.filter((b) => b.status === 'Pending');
  const acceptedBookings = bookings.filter((b) => b.status === 'Accepted');
  const completedBookings = bookings.filter((b) => b.status === 'Completed');
  const estimatedEarnings = [...acceptedBookings, ...completedBookings].reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  );

  return res.json({
    success: true,
    data: {
      totalListings: listings.length,
      activeListings,
      unavailableListings: listings.length - activeListings,
      pendingRequestsCount: pendingRequests.length,
      acceptedBookingsCount: acceptedBookings.length,
      completedServicesCount: completedBookings.length,
      estimatedEarnings,
      unreadNotificationsCount: notifications.filter((n) => !n.is_read).length,
      notifications: notifications.slice(0, 6),
      listings: listings.slice(0, 6),
      recentRequests: bookings.slice(0, 6),
    },
  });
});

export const reportListing = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const targetId = assertValidUuid(id, 'listing id');
  const table = REPORT_TABLES[type];
  if (!table) throw new AppError('Invalid listing type.', 400);

  const reason = String(req.body?.reason || '').trim().slice(0, 400);
  if (!reason) {
    throw new AppError('Please provide a reason for reporting this listing.', 400);
  }

  const supabase = getSupabaseClient();
  const { data: updated, error } = await supabase
    .from(table)
    .update({
      is_reported: true,
      report_reason: reason,
      reported_by: req.user.id,
      reported_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .select('id')
    .maybeSingle();

  if (error) throw mapSupabaseError(error, 'Could not submit listing report.');
  if (!updated) throw new AppError('Listing not found.', 404);

  res.json({
    success: true,
    message: 'Listing has been flagged for administrator review.',
  });
});

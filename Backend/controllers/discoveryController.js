import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Labour from '../models/Labour.js';
import Facility from '../models/Facility.js';
import Booking from '../models/Booking.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { enrichAndFilterByDistance } from '../utils/haversine.js';
import { extractQueryCoords } from '../utils/listingHelpers.js';

export const getPublicStats = asyncHandler(async (_req, res) => {
  const [
    farmersCount,
    providersCount,
    equipmentCount,
    labourCount,
    facilitiesCount,
    bookingsCount,
    completedCount,
  ] = await Promise.all([
    User.countDocuments({ role: 'farmer', isActive: true }),
    User.countDocuments({
      role: { $in: ['equipment_owner', 'labour_provider', 'facility_operator'] },
      isActive: true,
    }),
    Equipment.countDocuments({}),
    Labour.countDocuments({}),
    Facility.countDocuments({}),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'Completed' }),
  ]);

  res.json({
    success: true,
    data: {
      farmers: farmersCount,
      providers: providersCount,
      equipment: equipmentCount,
      labour: labourCount,
      facilities: facilitiesCount,
      totalServices: equipmentCount + labourCount + facilitiesCount,
      bookings: bookingsCount,
      completedBookings: completedCount,
    },
  });
});

export const getNearbyServices = asyncHandler(async (req, res) => {
  const { serviceType = 'all' } = req.query;
  const { userCoords, radiusKm } = extractQueryCoords(req.query);

  const [equipments, labours, facilities] = await Promise.all([
    serviceType === 'all' || serviceType === 'equipment'
      ? Equipment.find({ availability: true }).populate('ownerId', 'name phone village district')
      : [],
    serviceType === 'all' || serviceType === 'labour'
      ? Labour.find({ availability: true }).populate('providerId', 'name phone village district')
      : [],
    serviceType === 'all' || serviceType === 'facility'
      ? Facility.find({ availability: true }).populate('operatorId', 'name phone village district')
      : [],
  ]);

  const mappedEquipments = enrichAndFilterByDistance(equipments, userCoords, radiusKm).map(
    (item) => ({
      ...item,
      serviceType: 'equipment',
      displayTitle: item.name,
      providerName: item.ownerId?.name || 'Owner',
      priceLabel: `Rs ${item.price} / ${item.priceUnit}`,
    })
  );

  const mappedLabours = enrichAndFilterByDistance(labours, userCoords, radiusKm).map(
    (item) => ({
      ...item,
      serviceType: 'labour',
      displayTitle: item.title || `${item.category} Team`,
      providerName: item.providerId?.name || 'Provider',
      priceLabel: `Rs ${item.pricePerWorker} / worker / ${item.priceUnit}`,
    })
  );

  const mappedFacilities = enrichAndFilterByDistance(facilities, userCoords, radiusKm).map(
    (item) => ({
      ...item,
      serviceType: 'facility',
      displayTitle: item.name,
      providerName: item.operatorId?.name || 'Operator',
      priceLabel: `Rs ${item.price} ${item.priceUnit}`,
    })
  );

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

  if (req.user.role === 'farmer') {
    const [equipments, labours, facilities, bookings] = await Promise.all([
      Equipment.find({ availability: true }).lean(),
      Labour.find({ availability: true }).lean(),
      Facility.find({ availability: true }).lean(),
      Booking.find({ farmerId: req.user._id })
        .populate('providerId', 'name phone')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const nearbyEquipment = enrichAndFilterByDistance(equipments, userCoords, radius);
    const nearbyLabour = enrichAndFilterByDistance(labours, userCoords, radius);
    const nearbyFacilities = enrichAndFilterByDistance(facilities, userCoords, radius);

    const pendingBookings = bookings.filter((b) => b.status === 'Pending');
    const upcomingBookings = bookings.filter((b) => b.status === 'Accepted');

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
        upcomingBookings,
        pendingBookings,
        recentActivity: bookings.slice(0, 6),
      },
    });
  }

  const providerFilter = {
    equipment_owner: { model: Equipment, field: 'ownerId' },
    labour_provider: { model: Labour, field: 'providerId' },
    facility_operator: { model: Facility, field: 'operatorId' },
  }[req.user.role];

  const [listings, bookings] = await Promise.all([
    providerFilter
      ? providerFilter.model.find({ [providerFilter.field]: req.user._id }).lean()
      : [],
    Booking.find({ providerId: req.user._id })
      .populate('farmerId', 'name phone village district')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const activeListings = listings.filter((l) => l.availability).length;
  const pendingRequests = bookings.filter((b) => b.status === 'Pending');
  const acceptedBookings = bookings.filter((b) => b.status === 'Accepted');
  const completedBookings = bookings.filter((b) => b.status === 'Completed');
  const estimatedEarnings = [...acceptedBookings, ...completedBookings].reduce(
    (sum, item) => sum + (item.estimatedCost || 0),
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
      recentRequests: bookings.slice(0, 6),
    },
  });
});

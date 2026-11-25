import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Labour from '../models/Labour.js';
import Facility from '../models/Facility.js';
import Booking, { BOOKING_STATUSES } from '../models/Booking.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const LISTING_MODELS = {
  equipment: Equipment,
  labour: Labour,
  facility: Facility,
};

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalFarmers,
    equipmentOwners,
    labourProviders,
    facilityOperators,
    totalEquipment,
    totalLabour,
    totalFacilities,
    totalBookings,
    statusAggregation,
    recentBookings,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'equipment_owner' }),
    User.countDocuments({ role: 'labour_provider' }),
    User.countDocuments({ role: 'facility_operator' }),
    Equipment.countDocuments({}),
    Labour.countDocuments({}),
    Facility.countDocuments({}),
    Booking.countDocuments({}),
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.find({})
      .populate('farmerId', 'name')
      .populate('providerId', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    User.find({}).select('-password').sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const statusMap = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]));
  for (const row of statusAggregation) {
    statusMap[row._id] = row.count;
  }

  const bookingStatusBreakdown = BOOKING_STATUSES.map((status) => ({
    status,
    count: statusMap[status] || 0,
  }));

  res.json({
    success: true,
    data: {
      totalUsers,
      totalFarmers,
      totalProviders: equipmentOwners + labourProviders + facilityOperators,
      providerBreakdown: {
        equipmentOwners,
        labourProviders,
        facilityOperators,
      },
      totalEquipment,
      totalLabour,
      totalFacilities,
      totalBookings,
      bookingStatusBreakdown,
      recentBookings,
      recentUsers,
    },
  });
});

export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deactivated here.', 400);
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deleted.', 400);
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User removed.' });
});

export const getAllListingsAdmin = asyncHandler(async (_req, res) => {
  const [equipments, labours, facilities] = await Promise.all([
    Equipment.find({}).populate('ownerId', 'name email').sort({ createdAt: -1 }).lean(),
    Labour.find({}).populate('providerId', 'name email').sort({ createdAt: -1 }).lean(),
    Facility.find({}).populate('operatorId', 'name email').sort({ createdAt: -1 }).lean(),
  ]);

  const unified = [
    ...equipments.map((e) => ({
      _id: e._id,
      type: 'equipment',
      title: e.name,
      category: e.category,
      ownerName: e.ownerId?.name || 'Unknown',
      availability: e.availability,
      locationText: [e.location?.village, e.location?.district].filter(Boolean).join(', '),
      createdAt: e.createdAt,
    })),
    ...labours.map((l) => ({
      _id: l._id,
      type: 'labour',
      title: l.title || `${l.category} Team`,
      category: l.category,
      ownerName: l.providerId?.name || 'Unknown',
      availability: l.availability,
      locationText: [l.location?.village, l.location?.district].filter(Boolean).join(', '),
      createdAt: l.createdAt,
    })),
    ...facilities.map((f) => ({
      _id: f._id,
      type: 'facility',
      title: f.name,
      category: f.category,
      ownerName: f.operatorId?.name || 'Unknown',
      availability: f.availability,
      locationText: [f.location?.village, f.location?.district].filter(Boolean).join(', '),
      createdAt: f.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: unified });
});

export const toggleListingAvailabilityAdmin = asyncHandler(async (req, res) => {
  const Model = LISTING_MODELS[req.params.type];
  if (!Model) throw new AppError('Invalid listing type.', 400);

  const doc = await Model.findById(req.params.id);
  if (!doc) throw new AppError('Listing not found.', 404);
  doc.availability = !doc.availability;
  await doc.save();

  res.json({ success: true, data: doc });
});

export const deleteListingAdmin = asyncHandler(async (req, res) => {
  const Model = LISTING_MODELS[req.params.type];
  if (!Model) throw new AppError('Invalid listing type.', 400);

  const doc = await Model.findById(req.params.id);
  if (!doc) throw new AppError('Listing not found.', 404);
  await doc.deleteOne();

  res.json({ success: true, message: 'Listing deleted by administrator.' });
});

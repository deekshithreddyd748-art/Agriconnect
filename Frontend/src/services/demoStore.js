import {
  DEMO_USERS,
  INITIAL_DEMO_BOOKINGS,
  INITIAL_DEMO_EQUIPMENTS,
  INITIAL_DEMO_FAVOURITES,
  INITIAL_DEMO_FACILITIES,
  INITIAL_DEMO_LABOURS,
  INITIAL_DEMO_LABOUR_REQUESTS,
  INITIAL_DEMO_NOTIFICATIONS,
  INITIAL_DEMO_REVIEWS,
} from '../data/demoWorkspaceData.js';
import { calculateDistanceKm, hasValidCoords } from '../utils/distance.js';

const GUEST_SESSION_KEY = 'agriconnect_guest_session';
const GUEST_STATE_KEY = 'agriconnect_guest_state_v1';

function createInitialState() {
  return {
    equipments: INITIAL_DEMO_EQUIPMENTS,
    labours: INITIAL_DEMO_LABOURS,
    facilities: INITIAL_DEMO_FACILITIES,
    bookings: INITIAL_DEMO_BOOKINGS,
    labourRequests: INITIAL_DEMO_LABOUR_REQUESTS,
    labourBookings: [],
    reviews: INITIAL_DEMO_REVIEWS,
    notifications: INITIAL_DEMO_NOTIFICATIONS,
    favourites: INITIAL_DEMO_FAVOURITES,
  };
}

export function getSavedGuestUser() {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGuestUser(userObj) {
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(userObj));
  ensureDemoStateInitialized();
  return userObj;
}

export function clearGuestSession() {
  localStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem(GUEST_STATE_KEY);
}

export function createGuestUserForRole(role = 'farmer', { isDemoAccount = false } = {}) {
  const safeRole = ['farmer', 'equipment_owner', 'labour_provider', 'facility_operator'].includes(
    role
  )
    ? role
    : 'farmer';
  const base = DEMO_USERS[safeRole] || DEMO_USERS.farmer;
  return {
    ...base,
    name: isDemoAccount ? 'Demo Farmer' : 'Guest',
    full_name: isDemoAccount ? 'Demo Farmer' : 'Guest',
    email: 'demo@agriconnect.in',
    isGuest: true,
    isDemoAccount,
  };
}

function ensureDemoStateInitialized() {
  try {
    if (!localStorage.getItem(GUEST_STATE_KEY)) {
      localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(createInitialState()));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function loadDemoState() {
  try {
    const raw = localStorage.getItem(GUEST_STATE_KEY);
    if (!raw) {
      const init = createInitialState();
      localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch {
    return createInitialState();
  }
}

function saveDemoState(state) {
  try {
    localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

function applyDistance(items, params = {}) {
  const userCoords =
    params.lat !== undefined && params.lng !== undefined
      ? { lat: Number(params.lat), lng: Number(params.lng) }
      : null;
  const radiusKm = Number(params.radius) || null;
  const userHasCoords = userCoords && hasValidCoords(userCoords);

  let mapped = items.map((item) => {
    const provHas = hasValidCoords(item.location);
    const distanceKm = userHasCoords && provHas ? calculateDistanceKm(userCoords, item.location) : null;
    return { ...item, locationAvailable: provHas, distanceKm };
  });

  if (userHasCoords && radiusKm > 0) {
    mapped = mapped.filter((item) => item.distanceKm !== null && item.distanceKm <= radiusKm);
    mapped.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }
  return mapped;
}

function makeResponse(config, data, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: { 'x-agriconnect-demo-fallback': 'true' },
    config,
  };
}

function parseBody(data) {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const obj = {};
    for (const [k, v] of data.entries()) {
      if (typeof v === 'string') obj[k] = v;
    }
    return obj;
  }
  return data;
}

/**
 * Serves resilient offline/demo data whenever Guest Mode is active or when
 * the backend database / Vercel rewrite returns unavailable.
 * Admin routes are strictly forbidden in Guest Mode.
 */
export function handleDemoApiRequest(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = String(config.url || '');
  const pathOnly = url.split('?')[0];
  const params = config.params || {};
  const body = parseBody(config.data);
  const state = loadDemoState();
  const activeUser = getSavedGuestUser() || createGuestUserForRole('farmer');

  // Strict admin boundary
  if (pathOnly.startsWith('/admin')) {
    return Promise.reject({
      response: {
        status: 403,
        data: { success: false, message: 'Guest Demo Mode cannot access Administrator routes.' },
      },
    });
  }

  // Auth / Profile
  if (pathOnly === '/auth/me' && method === 'get') {
    return makeResponse(config, { success: true, user: activeUser });
  }
  if ((pathOnly === '/auth/profile' || pathOnly === '/farmer/profile' || pathOnly.startsWith('/profiles/')) && (method === 'put' || method === 'patch')) {
    const updatedUser = {
      ...activeUser,
      ...body,
      name: body.name || body.full_name || activeUser.name,
      full_name: body.full_name || body.name || activeUser.full_name,
    };
    saveGuestUser(updatedUser);
    return makeResponse(config, { success: true, user: updatedUser, profile: updatedUser });
  }

  // Public stats
  if (pathOnly === '/discovery/public-stats') {
    return makeResponse(config, {
      success: true,
      demoFallback: true,
      data: {
        farmers: 124,
        providers: 48,
        equipment: state.equipments.length,
        labour: state.labours.length,
        facilities: state.facilities.length,
        totalServices: state.equipments.length + state.labours.length + state.facilities.length,
        bookings: state.bookings.length + 34,
        completedBookings: 28,
      },
    });
  }

  // Nearby map
  if (pathOnly === '/discovery/nearby') {
    const st = params.serviceType || 'all';
    const eq = st === 'all' || st === 'equipment'
      ? applyDistance(state.equipments, params).map((i) => ({ ...i, serviceType: 'equipment', displayTitle: i.name, providerName: i.ownerId?.name || 'Owner', priceLabel: `Rs ${i.price} / ${i.priceUnit}` }))
      : [];
    const lb = st === 'all' || st === 'labour'
      ? applyDistance(state.labours, params).map((i) => ({ ...i, serviceType: 'labour', displayTitle: i.title, providerName: i.providerId?.name || 'Provider', priceLabel: `Rs ${i.pricePerWorker} / day` }))
      : [];
    const fc = st === 'all' || st === 'facility'
      ? applyDistance(state.facilities, params).map((i) => ({ ...i, serviceType: 'facility', displayTitle: i.name, providerName: i.operatorId?.name || 'Operator', priceLabel: `Rs ${i.price} ${i.priceUnit}` }))
      : [];
    const all = [...eq, ...lb, ...fc];
    return makeResponse(config, { success: true, count: all.length, data: { all, equipment: eq, labour: lb, facilities: fc } });
  }

  // Dashboard
  if (pathOnly === '/discovery/dashboard') {
    if (activeUser.role === 'farmer') {
      const pending = state.bookings.filter((b) => b.status === 'Pending');
      const upcoming = state.bookings.filter((b) => b.status === 'Accepted');
      return makeResponse(config, {
        success: true,
        data: {
          nearbyServiceCount: state.equipments.length + state.labours.length + state.facilities.length,
          availableMachineryCount: state.equipments.filter((e) => e.availability).length,
          availableLabourCount: state.labours.filter((l) => l.availability).length,
          nearbyFacilitiesCount: state.facilities.filter((f) => f.availability).length,
          totalAvailableMachinery: state.equipments.filter((e) => e.availability).length,
          totalAvailableLabour: state.labours.filter((l) => l.availability).length,
          totalAvailableFacilities: state.facilities.filter((f) => f.availability).length,
          availableMachineryPreview: state.equipments.slice(0, 4),
          availableLabourPreview: state.labours.slice(0, 4),
          availableFacilitiesPreview: state.facilities.slice(0, 4),
          upcomingBookings: upcoming,
          pendingBookings: pending,
          savedListingsCount: state.favourites.length,
          unreadNotificationsCount: state.notifications.filter((n) => !n.is_read).length,
          notifications: state.notifications,
          labourRequests: state.labourRequests.slice(0, 4),
          openLabourRequestsCount: state.labourRequests.length,
          pendingApplicationsCount: 2,
          recentActivity: state.bookings.slice(0, 6),
        },
      });
    }

    const roleListings =
      activeUser.role === 'equipment_owner'
        ? state.equipments
        : activeUser.role === 'labour_provider'
          ? state.labours
          : state.facilities;
    const pendingReq = state.bookings.filter((b) => b.status === 'Pending');
    const acceptedReq = state.bookings.filter((b) => b.status === 'Accepted');
    const completedReq = state.bookings.filter((b) => b.status === 'Completed');

    return makeResponse(config, {
      success: true,
      data: {
        totalListings: roleListings.length,
        activeListings: roleListings.filter((l) => l.availability).length,
        unavailableListings: roleListings.filter((l) => !l.availability).length,
        pendingRequestsCount: pendingReq.length,
        acceptedBookingsCount: acceptedReq.length,
        completedServicesCount: completedReq.length,
        estimatedEarnings: 10860,
        unreadNotificationsCount: state.notifications.filter((n) => !n.is_read).length,
        notifications: state.notifications,
        listings: roleListings.slice(0, 6),
        recentRequests: state.bookings.slice(0, 6),
      },
    });
  }

  // Equipment CRUD + filter
  if (pathOnly === '/equipment' && method === 'get') {
    let list = applyDistance(state.equipments, params);
    if (params.category && params.category !== 'All') list = list.filter((i) => i.category === params.category);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((i) => `${i.name} ${i.category} ${i.description} ${i.location?.district}`.toLowerCase().includes(q));
    }
    if (params.district) {
      const d = String(params.district).toLowerCase();
      list = list.filter((i) => (i.location?.district || '').toLowerCase().includes(d));
    }
    if (params.availability === 'true' || params.availability === 'false') {
      const want = params.availability === 'true';
      list = list.filter((i) => Boolean(i.availability) === want);
    }
    if (params.maxPrice) list = list.filter((i) => i.price <= Number(params.maxPrice));
    return makeResponse(config, { success: true, count: list.length, total: list.length, totalPages: 1, data: list });
  }
  if (pathOnly.startsWith('/equipment/') && method === 'get') {
    const id = pathOnly.split('/')[2];
    const item = applyDistance(state.equipments, params).find((e) => e.id === id) || state.equipments[0];
    return makeResponse(config, { success: true, data: item });
  }
  if (pathOnly === '/equipment' && method === 'post') {
    const newItem = {
      id: `demo-eq-${Date.now()}`,
      _id: `demo-eq-${Date.now()}`,
      name: body.name || 'Demo Agricultural Equipment',
      category: body.category || 'Tractors',
      description: body.description || 'Added during Guest Demo Mode.',
      price: Number(body.price) || 650,
      priceUnit: body.priceUnit || 'hour',
      availability: body.availability !== 'false',
      images: ['/images/tractor.svg'],
      ownerId: activeUser,
      location: { lat: 12.5218, lng: 76.8951, village: activeUser.village || 'Mandya', district: activeUser.district || 'Mandya' },
    };
    state.equipments.unshift(newItem);
    saveDemoState(state);
    return makeResponse(config, { success: true, data: newItem }, 201);
  }
  if (pathOnly.startsWith('/equipment/') && (method === 'put' || method === 'patch')) {
    const id = pathOnly.split('/')[2];
    const idx = state.equipments.findIndex((i) => i.id === id);
    if (idx !== -1) {
      state.equipments[idx] = { ...state.equipments[idx], ...body, availability: body.availability === undefined ? state.equipments[idx].availability : body.availability === true || body.availability === 'true' };
      saveDemoState(state);
      return makeResponse(config, { success: true, data: state.equipments[idx] });
    }
  }
  if (pathOnly.startsWith('/equipment/') && method === 'delete') {
    const id = pathOnly.split('/')[2];
    state.equipments = state.equipments.filter((i) => i.id !== id);
    saveDemoState(state);
    return makeResponse(config, { success: true, message: 'Removed in demo mode.' });
  }

  // Labour CRUD + filter
  if (pathOnly === '/labour' && method === 'get') {
    let list = applyDistance(state.labours, params);
    if (params.category && params.category !== 'All') list = list.filter((i) => i.category === params.category);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((i) => `${i.title} ${i.category} ${i.description} ${i.location?.district}`.toLowerCase().includes(q));
    }
    if (params.minWorkers) list = list.filter((i) => i.workersAvailable >= Number(params.minWorkers));
    if (params.maxPrice) list = list.filter((i) => i.pricePerWorker <= Number(params.maxPrice));
    return makeResponse(config, { success: true, count: list.length, total: list.length, totalPages: 1, data: list });
  }
  if (pathOnly.startsWith('/labour/') && method === 'get') {
    const id = pathOnly.split('/')[2];
    const item = applyDistance(state.labours, params).find((e) => e.id === id) || state.labours[0];
    return makeResponse(config, { success: true, data: item });
  }
  if (pathOnly === '/labour' && method === 'post') {
    const newItem = {
      id: `demo-lb-${Date.now()}`,
      _id: `demo-lb-${Date.now()}`,
      title: body.title || `${body.category || 'Harvesting'} Demo Crew`,
      category: body.category || 'Harvesting',
      skills: Array.isArray(body.skills) ? body.skills : ['Harvesting'],
      workersAvailable: Number(body.workersAvailable) || 5,
      pricePerWorker: Number(body.pricePerWorker) || 450,
      priceUnit: body.priceUnit || 'day',
      availability: true,
      providerId: activeUser,
      location: { lat: 12.5218, lng: 76.8951, village: activeUser.village || 'Mandya', district: activeUser.district || 'Mandya' },
    };
    state.labours.unshift(newItem);
    saveDemoState(state);
    return makeResponse(config, { success: true, data: newItem }, 201);
  }

  // Facilities CRUD + filter
  if (pathOnly === '/facilities' && method === 'get') {
    let list = applyDistance(state.facilities, params);
    if (params.category && params.category !== 'All') list = list.filter((i) => i.category === params.category);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((i) => `${i.name} ${i.category} ${i.description} ${i.location?.district}`.toLowerCase().includes(q));
    }
    if (params.minCapacity) list = list.filter((i) => i.availableCapacity >= Number(params.minCapacity));
    return makeResponse(config, { success: true, count: list.length, total: list.length, totalPages: 1, data: list });
  }
  if (pathOnly.startsWith('/facilities/') && method === 'get') {
    const id = pathOnly.split('/')[2];
    const item = applyDistance(state.facilities, params).find((e) => e.id === id) || state.facilities[0];
    return makeResponse(config, { success: true, data: item });
  }

  // Bookings
  if (pathOnly === '/bookings' && method === 'get') {
    let list = state.bookings;
    if (params.status && params.status !== 'All') list = list.filter((b) => b.status === params.status);
    return makeResponse(config, { success: true, count: list.length, data: list });
  }
  if (pathOnly.startsWith('/bookings/') && method === 'get') {
    const id = pathOnly.split('/')[2];
    const item = state.bookings.find((b) => b.id === id) || state.bookings[0];
    return makeResponse(config, { success: true, data: item });
  }
  if (pathOnly === '/bookings' && method === 'post') {
    const svcType = body.serviceType || 'equipment';
    const svcList = svcType === 'equipment' ? state.equipments : svcType === 'labour' ? state.labours : state.facilities;
    const target = svcList.find((s) => s.id === body.serviceId) || svcList[0];
    const unitPrice = target?.price ?? target?.pricePerWorker ?? 500;
    const est = unitPrice * (Number(body.duration) || 1) * (Number(body.workersRequested) || Number(body.quantity) || 1);
    const created = {
      id: `demo-bk-${Date.now()}`,
      _id: `demo-bk-${Date.now()}`,
      bookingCode: `DEMO-${Math.floor(10000 + Math.random() * 89999)}`,
      serviceType: svcType,
      serviceId: target,
      serviceName: target?.name || target?.title || 'Demo Service',
      farmerId: activeUser,
      providerId: DEMO_USERS.equipment_owner,
      bookingDate: body.bookingDate || '2026-12-10',
      duration: Number(body.duration) || 1,
      durationUnit: body.durationUnit || target?.priceUnit || 'day',
      quantity: Number(body.quantity) || 1,
      workersRequested: Number(body.workersRequested) || 1,
      estimatedCost: est,
      totalAmount: est,
      status: 'Pending',
      notes: body.notes || '',
      providerNote: '',
      farmLocation: body.farmLocation || activeUser.location,
      paymentMethod: 'Pay directly upon service delivery (Demo Mode)',
      createdAt: new Date().toISOString(),
    };
    state.bookings.unshift(created);
    state.notifications.unshift({
      id: `demo-notif-${Date.now()}`,
      title: 'Demo Booking Created',
      message: `Booking ${created.bookingCode} for ${created.serviceName} submitted locally in Demo Mode.`,
      notification_type: 'booking_created',
      related_booking_id: created.id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    saveDemoState(state);
    return makeResponse(config, { success: true, data: created }, 201);
  }
  if (pathOnly.startsWith('/bookings/') && (pathOnly.endsWith('/status') || pathOnly.endsWith('/cancel')) && method === 'patch') {
    const id = pathOnly.split('/')[2];
    const nextStatus = pathOnly.endsWith('/cancel') ? 'Cancelled' : body.status;
    const idx = state.bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      state.bookings[idx] = { ...state.bookings[idx], status: nextStatus, providerNote: body.providerNote ?? state.bookings[idx].providerNote };
      saveDemoState(state);
      return makeResponse(config, { success: true, data: state.bookings[idx] });
    }
  }

  // Labour Requests
  if ((pathOnly === '/labour-requests' || pathOnly === '/farmer/labour-requests') && method === 'get') {
    return makeResponse(config, { success: true, count: state.labourRequests.length, data: state.labourRequests });
  }
  if (pathOnly === '/labour-requests/farmer/bookings' || pathOnly === '/labour-requests/worker/bookings') {
    return makeResponse(config, { success: true, count: state.labourBookings.length, data: state.labourBookings });
  }
  if (pathOnly === '/labour-requests/worker/my-applications') {
    return makeResponse(config, { success: true, count: 0, data: [] });
  }
  if (pathOnly === '/labour-requests' && method === 'post') {
    const workers = Number(body.workersRequired) || 4;
    const days = Number(body.durationDays) || 2;
    const wage = Number(body.dailyWage) || 500;
    const reqObj = {
      id: `demo-lr-${Date.now()}`,
      _id: `demo-lr-${Date.now()}`,
      requestCode: `DEMO-LR-${Math.floor(1000 + Math.random() * 8999)}`,
      farmerId: activeUser,
      category: body.category || 'Harvesting',
      workersRequired: workers,
      workersAccepted: 0,
      remainingVacancies: workers,
      startDate: body.startDate || '2026-12-12',
      durationDays: days,
      dailyWage: wage,
      estimatedTotal: workers * days * wage,
      location: body.location || activeUser.location,
      instructions: body.instructions || '',
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    state.labourRequests.unshift(reqObj);
    saveDemoState(state);
    return makeResponse(config, { success: true, data: reqObj }, 201);
  }
  if (pathOnly.endsWith('/accept') && method === 'post') {
    const reqId = pathOnly.split('/')[2];
    const target = state.labourRequests.find((r) => r.id === reqId);
    if (target && target.remainingVacancies > 0) {
      target.workersAccepted += 1;
      target.remainingVacancies -= 1;
      target.status = target.remainingVacancies === 0 ? 'Filled' : 'Partially Filled';
      saveDemoState(state);
      return makeResponse(config, { success: true, data: { request: target } }, 201);
    }
  }

  // Reviews, Notifications & Favourites
  if (pathOnly === '/reviews' && method === 'get') {
    return makeResponse(config, { success: true, averageRating: 5, totalReviews: state.reviews.length, data: state.reviews });
  }
  if (pathOnly === '/reviews' && method === 'post') {
    const rev = {
      id: `demo-rev-${Date.now()}`,
      _id: `demo-rev-${Date.now()}`,
      reviewer_id: activeUser.id,
      reviewerId: { name: activeUser.name },
      booking_id: body.booking_id,
      rating: Number(body.rating) || 5,
      review_text: body.review_text || '',
      created_at: new Date().toISOString(),
    };
    state.reviews.unshift(rev);
    saveDemoState(state);
    return makeResponse(config, { success: true, data: rev }, 201);
  }
  if (pathOnly === '/notifications' && method === 'get') {
    return makeResponse(config, {
      success: true,
      unreadCount: state.notifications.filter((n) => !n.is_read).length,
      data: state.notifications,
    });
  }
  if (pathOnly === '/notifications/read-all' && method === 'patch') {
    state.notifications = state.notifications.map((n) => ({ ...n, is_read: true }));
    saveDemoState(state);
    return makeResponse(config, { success: true });
  }
  if (pathOnly.startsWith('/notifications/') && pathOnly.endsWith('/read')) {
    const id = pathOnly.split('/')[2];
    state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    saveDemoState(state);
    return makeResponse(config, { success: true });
  }
  if (pathOnly === '/favourites' && method === 'get') {
    return makeResponse(config, { success: true, count: state.favourites.length, data: state.favourites });
  }
  if (pathOnly === '/favourites' && method === 'post') {
    const listPool = body.listing_type === 'equipment' ? state.equipments : body.listing_type === 'labour' ? state.labours : state.facilities;
    const item = listPool.find((x) => x.id === body.listing_id);
    const fav = { id: `demo-fav-${Date.now()}`, listing_type: body.listing_type, listing_id: body.listing_id, listing: item || null };
    if (!state.favourites.some((f) => f.listing_type === fav.listing_type && f.listing_id === fav.listing_id)) {
      state.favourites.unshift(fav);
      saveDemoState(state);
    }
    return makeResponse(config, { success: true, data: fav }, 201);
  }
  if (pathOnly.startsWith('/favourites/') && method === 'delete') {
    const id = pathOnly.split('/')[2];
    state.favourites = state.favourites.filter((f) => f.id !== id && f.listing_id !== id);
    saveDemoState(state);
    return makeResponse(config, { success: true });
  }

  return makeResponse(config, { success: true, data: [] });
}

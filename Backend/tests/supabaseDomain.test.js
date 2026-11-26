import assert from 'node:assert/strict';
import test from 'node:test';
import { handleCreateBooking } from '../controllers/bookingController.js';
import {
  assertValidUuid,
  isValidUuid,
  mapSupabaseError,
  parsePagination,
} from '../services/supabaseMappers.js';
import { uploadFilesToSupabaseStorage } from '../services/storageService.js';

function createBookingMockSupabase({ equipment, existingBookings = [], insertBookingRow }) {
  const insertedNotifications = [];
  const insertedBookings = [];

  const supabase = {
    insertedNotifications,
    insertedBookings,
    from(table) {
      let mode = 'select';
      let insertData = null;
      const filters = [];

      const chain = {
        select() {
          return chain;
        },
        insert(payload) {
          mode = 'insert';
          insertData = payload;
          return chain;
        },
        eq(col, val) {
          filters.push({ op: 'eq', col, val });
          return chain;
        },
        in(col, vals) {
          filters.push({ op: 'in', col, vals });
          return chain;
        },
        then(resolve, reject) {
          if (table === 'bookings' && mode === 'select') {
            return Promise.resolve({ data: existingBookings, error: null }).then(resolve, reject);
          }
          if (table === 'notifications' && mode === 'insert') {
            insertedNotifications.push(insertData);
            return Promise.resolve({ data: [insertData], error: null }).then(resolve, reject);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
        async maybeSingle() {
          if (table === 'equipment_listings') {
            return { data: equipment, error: null };
          }
          return { data: null, error: null };
        },
        async single() {
          if (table === 'bookings' && mode === 'insert') {
            insertedBookings.push(insertData);
            return { data: insertBookingRow(insertData), error: null };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  };

  return supabase;
}

test('UUID validation and Supabase error mapping prevent raw SQL leaks', () => {
  assert.equal(isValidUuid('11111111-1111-4111-8111-111111111101'), true);
  assert.equal(isValidUuid('not-a-uuid'), false);
  assert.throws(() => assertValidUuid('bad-id', 'equipment id'), (err) => err.statusCode === 400);

  const dup = mapSupabaseError({ code: '23505', message: 'raw pg constraint detail' });
  assert.equal(dup.statusCode, 409);
  assert.ok(!dup.message.includes('raw pg constraint detail'));

  const invalidTrans = mapSupabaseError({ message: 'INVALID_TRANSITION' });
  assert.equal(invalidTrans.statusCode, 400);

  const pageMeta = parsePagination({ page: '2', limit: '999' }, 24, 50);
  assert.equal(pageMeta.page, 2);
  assert.equal(pageMeta.limit, 50);
  assert.equal(pageMeta.from, 50);
});

test('Booking creation rejects past dates, self-bookings, and date conflicts', async () => {
  const farmer = {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Ramesh Gowda',
    village: 'Mandya',
    district: 'Mandya',
    state: 'Karnataka',
    location: { lat: 12.5, lng: 76.8, address: 'Mandya' },
  };
  const ownerId = '11111111-1111-4111-8111-111111111102';
  const eqId = '22222222-2222-4222-8222-222222222201';

  const equipment = {
    id: eqId,
    owner_id: ownerId,
    equipment_name: 'Mahindra Arjun Tractor',
    price: 750,
    hourly_price: 750,
    daily_price: null,
    price_unit: 'hour',
    availability_status: true,
  };

  const futureDate = '2099-05-01';

  // 1. Past date rejected
  await assert.rejects(
    () =>
      handleCreateBooking({
        user: farmer,
        body: { serviceType: 'equipment', serviceId: eqId, bookingDate: '2020-01-01' },
        supabase: createBookingMockSupabase({ equipment }),
      }),
    (err) => err.statusCode === 400
  );

  // 2. Self-booking rejected
  await assert.rejects(
    () =>
      handleCreateBooking({
        user: { ...farmer, id: ownerId },
        body: { serviceType: 'equipment', serviceId: eqId, bookingDate: futureDate },
        supabase: createBookingMockSupabase({ equipment }),
      }),
    (err) => err.statusCode === 400
  );

  // 3. Date conflict rejected with 409
  await assert.rejects(
    () =>
      handleCreateBooking({
        user: farmer,
        body: { serviceType: 'equipment', serviceId: eqId, bookingDate: futureDate },
        supabase: createBookingMockSupabase({
          equipment,
          existingBookings: [{ id: 'existing-booking', workers_requested: 1 }],
        }),
      }),
    (err) => err.statusCode === 409
  );

  // 4. Successful creation records Pending booking + provider notification
  const mockDb = createBookingMockSupabase({
    equipment,
    existingBookings: [],
    insertBookingRow: (data) => ({
      ...data,
      id: '55555555-5555-4555-8555-555555555501',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  const booking = await handleCreateBooking({
    user: farmer,
    body: {
      serviceType: 'equipment',
      serviceId: eqId,
      bookingDate: futureDate,
      duration: 3,
      durationUnit: 'hour',
      farmerNotes: 'Bring rotavator attachment',
    },
    supabase: mockDb,
  });

  assert.equal(booking.status, 'Pending');
  assert.equal(booking.totalAmount, 2250);
  assert.equal(mockDb.insertedNotifications.length, 1);
  assert.equal(mockDb.insertedNotifications[0].user_id, ownerId);
  assert.equal(mockDb.insertedNotifications[0].notification_type, 'booking_created');
});

test('Storage service enforces bucket allowlist cleanly', async () => {
  await assert.rejects(
    () =>
      uploadFilesToSupabaseStorage({
        files: [{ originalname: 'test.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') }],
        bucket: 'untrusted-bucket',
        ownerId: '11111111-1111-4111-8111-111111111101',
        supabase: {},
      }),
    (err) => err.statusCode === 400
  );
});

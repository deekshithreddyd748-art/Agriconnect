import assert from 'node:assert/strict';
import test from 'node:test';
import {
  continueProfile,
  handleContinueProfile,
  handleSelectProfileRole,
  normalizeFullName,
  normalizeIndianMobile,
  normalizeOptionalEmail,
  normalizeSelectableRole,
} from '../controllers/profileController.js';
import { authorize } from '../middleware/auth.js';

function createMockSupabase(initialRows = []) {
  const rows = [...initialRows];

  return {
    rows,
    from(table) {
      assert.equal(table, 'profiles');
      const state = {
        mode: null,
        filters: [],
        insertPayload: null,
        updatePayload: null,
      };

      const chain = {
        select() {
          if (!state.mode) state.mode = 'select';
          return chain;
        },
        insert(payload) {
          state.mode = 'insert';
          state.insertPayload = payload;
          return chain;
        },
        update(payload) {
          state.mode = 'update';
          state.updatePayload = payload;
          return chain;
        },
        eq(col, val) {
          state.filters.push({ op: 'eq', col, val });
          return chain;
        },
        is(col, val) {
          state.filters.push({ op: 'is', col, val });
          return chain;
        },
        async maybeSingle() {
          if (state.mode === 'select') {
            const match = rows.find((r) =>
              state.filters.every((f) => r[f.col] === f.val)
            );
            return { data: match || null, error: null };
          }
          if (state.mode === 'update') {
            const idx = rows.findIndex((r) =>
              state.filters.every((f) => r[f.col] === f.val)
            );
            if (idx === -1) return { data: null, error: null };
            rows[idx] = { ...rows[idx], ...state.updatePayload };
            return { data: rows[idx], error: null };
          }
          return { data: null, error: null };
        },
        async single() {
          if (state.mode === 'insert') {
            const duplicate = rows.find(
              (r) => r.mobile_number === state.insertPayload.mobile_number
            );
            if (duplicate) {
              return {
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
              };
            }
            const created = {
              id: `00000000-0000-4000-8000-${String(rows.length + 1).padStart(12, '0')}`,
              full_name: state.insertPayload.full_name,
              mobile_number: state.insertPayload.mobile_number,
              email: state.insertPayload.email ?? null,
              role: state.insertPayload.role ?? null,
              created_at: new Date().toISOString(),
            };
            rows.push(created);
            return { data: created, error: null };
          }
          return chain.maybeSingle();
        },
      };
      return chain;
    },
  };
}

const noopSyncUser = async (profile) => ({
  _id: '507f1f77bcf86cd799439011',
  supabaseProfileId: profile.id,
  name: profile.full_name,
  email: profile.email,
  phone: `+91 ${profile.mobile_number}`,
  mobileNumber: profile.mobile_number,
  role: profile.role || 'farmer',
  pendingRoleSelection: !profile.role,
  isActive: true,
  location: { lat: null, lng: null, address: '' },
});

const stubSignToken = (_uid, pid) => `stub.token.${pid}`;

test('Validation normalizers enforce Indian mobile rules and optional email', () => {
  assert.equal(normalizeIndianMobile('+91 98765-43210'), '9876543210');
  assert.equal(normalizeIndianMobile('09876543210'), '9876543210');
  assert.throws(() => normalizeIndianMobile('1234567890'), /INVALID_MOBILE|10-digit/);
  assert.throws(() => normalizeFullName('A'), /full name/i);
  assert.equal(normalizeOptionalEmail(''), null);
  assert.equal(normalizeOptionalEmail('  Test@Example.COM  '), 'test@example.com');
  assert.throws(() => normalizeOptionalEmail('bad-email'), /valid email/i);
  assert.throws(() => normalizeSelectableRole('admin'), /Administrator role cannot/);
});

test('Missing Supabase env vars returns explicit 503 SUPABASE_NOT_CONFIGURED (never fake DB)', async () => {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  let nextErr = null;
  await new Promise((resolve) => {
    continueProfile(
      { body: { fullName: 'Ramesh', mobileNumber: '9876543210' } },
      {},
      (err) => {
        nextErr = err;
        resolve();
      }
    );
  });

  process.env.SUPABASE_URL = prevUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;

  assert.ok(nextErr);
  assert.equal(nextErr.statusCode, 503);
  assert.equal(nextErr.errorCode, 'SUPABASE_NOT_CONFIGURED');
});

test('New profile creation (without email) stores NULL email and requires role selection', async () => {
  const supabase = createMockSupabase();
  const res = await handleContinueProfile({
    body: { fullName: 'Ramesh Gowda', mobileNumber: '9876543210', email: '' },
    supabase,
    syncUserFn: noopSyncUser,
    signTokenFn: stubSignToken,
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.payload.isNew, true);
  assert.equal(res.payload.requiresRoleSelection, true);
  assert.equal(res.payload.profile.email, null);
  assert.equal(res.payload.profile.role, null);
  assert.equal(supabase.rows.length, 1);
});

test('Returning mobile with saved role logs straight in and skips role selection', async () => {
  const supabase = createMockSupabase([
    {
      id: '11111111-1111-4111-8111-111111111111',
      full_name: 'Suresh Patil',
      mobile_number: '9876501234',
      email: null,
      role: 'farmer',
      created_at: new Date().toISOString(),
    },
  ]);

  const res = await handleContinueProfile({
    body: { fullName: 'Suresh Patil', mobileNumber: '9876501234' },
    supabase,
    syncUserFn: noopSyncUser,
    signTokenFn: stubSignToken,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.isNew, false);
  assert.equal(res.payload.exists, true);
  assert.equal(res.payload.conflictDetected, false);
  assert.equal(res.payload.requiresRoleSelection, false);
  assert.equal(res.payload.profile.role, 'farmer');
});

test('Returning mobile with mismatched name preserves saved profile without overwriting', async () => {
  const supabase = createMockSupabase([
    {
      id: '22222222-2222-4222-8222-222222222222',
      full_name: 'Mahesh Reddy',
      mobile_number: '9876511111',
      email: 'mahesh@farm.in',
      role: 'equipment_owner',
      created_at: new Date().toISOString(),
    },
  ]);

  const mismatchRes = await handleContinueProfile({
    body: { fullName: 'Different Person', mobileNumber: '9876511111' },
    supabase,
    syncUserFn: noopSyncUser,
    signTokenFn: stubSignToken,
  });

  assert.equal(mismatchRes.payload.conflictDetected, true);
  assert.equal(mismatchRes.payload.nameMismatch, true);
  assert.equal(mismatchRes.payload.profile.full_name, 'Mahesh Reddy');
  assert.equal(mismatchRes.payload.token, null);

  const confirmRes = await handleContinueProfile({
    body: {
      fullName: 'Different Person',
      mobileNumber: '9876511111',
      confirmUseExisting: true,
    },
    supabase,
    syncUserFn: noopSyncUser,
    signTokenFn: stubSignToken,
  });

  assert.equal(confirmRes.payload.conflictDetected, false);
  assert.equal(confirmRes.payload.user.name, 'Mahesh Reddy');
  assert.equal(confirmRes.payload.user.role, 'equipment_owner');
});

test('Role selection saves role once, blocks admin, and blocks overwriting saved role', async () => {
  const supabase = createMockSupabase([
    {
      id: '33333333-3333-4333-8333-333333333333',
      full_name: 'Lakshmi Devi',
      mobile_number: '9876522222',
      email: null,
      role: null,
      created_at: new Date().toISOString(),
    },
  ]);

  await assert.rejects(
    () =>
      handleSelectProfileRole({
        profileId: '33333333-3333-4333-8333-333333333333',
        sessionProfileId: '33333333-3333-4333-8333-333333333333',
        rawRole: 'admin',
        supabase,
        syncUserFn: noopSyncUser,
      }),
    (err) => err.statusCode === 403
  );

  const saved = await handleSelectProfileRole({
    profileId: '33333333-3333-4333-8333-333333333333',
    sessionProfileId: '33333333-3333-4333-8333-333333333333',
    rawRole: 'labour_provider',
    supabase,
    syncUserFn: noopSyncUser,
  });

  assert.equal(saved.statusCode, 200);
  assert.equal(saved.payload.profile.role, 'labour_provider');

  await assert.rejects(
    () =>
      handleSelectProfileRole({
        profileId: '33333333-3333-4333-8333-333333333333',
        sessionProfileId: '33333333-3333-4333-8333-333333333333',
        rawRole: 'farmer',
        supabase,
        syncUserFn: noopSyncUser,
      }),
    (err) => err.statusCode === 409
  );
});

test('profile_demo token is strictly forbidden from admin routes', () => {
  const middleware = authorize('admin');
  let capturedErr = null;
  middleware(
    {
      authLevel: 'profile_demo',
      user: { role: 'admin', pendingRoleSelection: false },
    },
    {},
    (err) => {
      capturedErr = err;
    }
  );
  assert.ok(capturedErr);
  assert.equal(capturedErr.statusCode, 403);
  assert.equal(capturedErr.errorCode, 'ADMIN_SESSION_FORBIDDEN');
});

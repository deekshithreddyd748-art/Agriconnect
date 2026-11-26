import { createClient } from '@supabase/supabase-js';
import { AppError } from '../middleware/errorHandler.js';

let cachedClient = null;
let cachedKeySignature = '';

/**
 * Returns whether SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.
 */
export function isSupabaseConfigured() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return Boolean(url && serviceRoleKey);
}

/**
 * Returns a server-only Supabase admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Fails loudly with HTTP 503 if Supabase configuration is missing.
 */
export function getSupabaseClient() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceRoleKey) {
    throw new AppError(
      'Supabase database is not configured on the server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Backend/.env.',
      503,
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const signature = `${url}::${serviceRoleKey.slice(0, 12)}`;
  if (!cachedClient || cachedKeySignature !== signature) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    cachedKeySignature = signature;
  }

  return cachedClient;
}

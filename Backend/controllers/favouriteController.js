import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  assertValidUuid,
  formatEquipmentRow,
  formatFacilityRow,
  formatLabourRow,
  mapSupabaseError,
} from '../services/supabaseMappers.js';

const LISTING_TABLES = {
  equipment: { table: 'equipment_listings', format: formatEquipmentRow },
  labour: { table: 'labour_profiles', format: formatLabourRow },
  facility: { table: 'facility_listings', format: formatFacilityRow },
};

export const getFavourites = asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();
  const { data: favRows, error } = await supabase
    .from('favourites')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw mapSupabaseError(error, 'Could not load saved listings.');
  if (!favRows || favRows.length === 0) {
    return res.json({ success: true, count: 0, data: [] });
  }

  const eqIds = favRows.filter((f) => f.listing_type === 'equipment').map((f) => f.listing_id);
  const lbIds = favRows.filter((f) => f.listing_type === 'labour').map((f) => f.listing_id);
  const fcIds = favRows.filter((f) => f.listing_type === 'facility').map((f) => f.listing_id);

  const [eqRes, lbRes, fcRes] = await Promise.all([
    eqIds.length
      ? supabase.from('equipment_listings').select('*').in('id', eqIds)
      : { data: [] },
    lbIds.length
      ? supabase.from('labour_profiles').select('*').in('id', lbIds)
      : { data: [] },
    fcIds.length
      ? supabase.from('facility_listings').select('*').in('id', fcIds)
      : { data: [] },
  ]);

  const mapById = new Map();
  (eqRes.data || []).forEach((r) => mapById.set(`equipment:${r.id}`, formatEquipmentRow(r)));
  (lbRes.data || []).forEach((r) => mapById.set(`labour:${r.id}`, formatLabourRow(r)));
  (fcRes.data || []).forEach((r) => mapById.set(`facility:${r.id}`, formatFacilityRow(r)));

  const enriched = favRows.map((fav) => ({
    id: fav.id,
    _id: fav.id,
    user_id: fav.user_id,
    listing_type: fav.listing_type,
    listingType: fav.listing_type,
    listing_id: fav.listing_id,
    listingId: fav.listing_id,
    listing: mapById.get(`${fav.listing_type}:${fav.listing_id}`) || null,
    created_at: fav.created_at,
  }));

  res.json({
    success: true,
    count: enriched.length,
    data: enriched,
  });
});

export const addFavourite = asyncHandler(async (req, res) => {
  const listingType = String(req.body?.listing_type ?? req.body?.listingType ?? '').trim();
  const listingId = assertValidUuid(
    req.body?.listing_id ?? req.body?.listingId,
    'listing id'
  );

  const tableCfg = LISTING_TABLES[listingType];
  if (!tableCfg) {
    throw new AppError('listing_type must be equipment, labour, or facility.', 400);
  }

  const supabase = getSupabaseClient();
  const { data: target, error: targetErr } = await supabase
    .from(tableCfg.table)
    .select('id')
    .eq('id', listingId)
    .maybeSingle();

  if (targetErr) throw mapSupabaseError(targetErr, 'Could not verify listing.');
  if (!target) throw new AppError('Listing not found.', 404);

  const { data: created, error } = await supabase
    .from('favourites')
    .insert({
      user_id: req.user.id,
      listing_type: listingType,
      listing_id: listingId,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('This listing is already in your saved list.', 409, 'DUPLICATE_FAVOURITE');
    }
    throw mapSupabaseError(error, 'Could not save listing.');
  }

  res.status(201).json({
    success: true,
    data: created,
  });
});

export const removeFavourite = asyncHandler(async (req, res) => {
  const id = assertValidUuid(req.params.id, 'favourite id');
  const supabase = getSupabaseClient();

  const { data: deletedByFavId, error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', req.user.id)
    .or(`id.eq.${id},listing_id.eq.${id}`)
    .select('id');

  if (error) throw mapSupabaseError(error, 'Could not remove saved listing.');
  if (!deletedByFavId || deletedByFavId.length === 0) {
    throw new AppError('Saved listing not found.', 404);
  }

  res.json({
    success: true,
    message: 'Removed from saved listings.',
  });
});

export const EQUIPMENT_CATEGORIES = [
  'Tractors',
  'Rotavators',
  'Harvesters',
  'Tillers',
  'Seeders',
  'Seed Drills',
  'Cultivators',
  'Sprayers',
  'Threshers',
  'Ploughs',
  'Water Pumps',
  'Other agricultural machinery',
];

export const LABOUR_CATEGORIES = [
  'Sowing / Planting',
  'Transplanting',
  'Weeding',
  'Harvesting',
  'Pesticide Spraying',
  'Tractor / Machinery Operator',
  'Irrigation Work',
  'Land Preparation',
  'Fertilizer Application',
  'General Farm Help',
  'Other Agricultural Work',
];

export const FACILITY_CATEGORIES = [
  'Warehouses',
  'Cold Storage',
  'Drying Facilities',
  'Sorting Facilities',
  'Grading Facilities',
  'Packaging Facilities',
  'Rice Mills',
  'Flour Mills',
];

export const RADIUS_OPTIONS = [5, 10, 15, 25];

export const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Punjabi',
  'Gujarati',
];

export const ROLE_LABELS = {
  farmer: 'Farmer',
  equipment_owner: 'Equipment Owner',
  labour_provider: 'Labour Provider',
  facility_operator: 'Facility Owner',
  admin: 'Administrator',
};

export const PROVIDER_ROLES = [
  'equipment_owner',
  'labour_provider',
  'facility_operator',
];

/**
 * Administrative region options used ONLY as a non-GPS fallback.
 * Intentionally contains NO latitude or longitude so coordinates are never fabricated.
 */
export const REGION_OPTIONS = [
  { village: 'Baramati', district: 'Pune', state: 'Maharashtra' },
  { village: 'Malegaon Bk', district: 'Pune', state: 'Maharashtra' },
  { village: 'Pandare', district: 'Pune', state: 'Maharashtra' },
  { village: 'Niphad', district: 'Nashik', state: 'Maharashtra' },
  { village: 'Karnal', district: 'Karnal', state: 'Haryana' },
  { village: 'Narsampet', district: 'Warangal', state: 'Telangana' },
  { village: 'Mandya', district: 'Mandya', state: 'Karnataka' },
  { village: 'Thanjavur', district: 'Thanjavur', state: 'Tamil Nadu' },
];

export const STATUS_BADGES = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Open: 'bg-sky-100 text-sky-800 border-sky-200',
  'Applications Received': 'bg-violet-100 text-violet-800 border-violet-200',
  'Worker Accepted': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Partially Filled': 'bg-amber-100 text-amber-800 border-amber-200',
  Filled: 'bg-forest-100 text-forest-800 border-forest-200',
  'Fully Filled': 'bg-forest-100 text-forest-800 border-forest-200',
  'In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  Completed: 'bg-forest-100 text-forest-700 border-forest-200',
};

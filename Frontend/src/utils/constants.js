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
  'Harvesting',
  'Sowing',
  'Transplantation',
  'Weeding',
  'Spraying',
  'Irrigation',
  'General Farm Labour',
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

export const PRESET_LOCATIONS = [
  {
    label: 'Baramati, Pune (Maharashtra)',
    village: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.1517,
    lng: 74.5777,
  },
  {
    label: 'Malegaon Bk, Pune (Maharashtra)',
    village: 'Malegaon Bk',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.1742,
    lng: 74.539,
  },
  {
    label: 'Pandare, Pune (Maharashtra)',
    village: 'Pandare',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.118,
    lng: 74.544,
  },
  {
    label: 'Nashik Agro Belt (Maharashtra)',
    village: 'Niphad',
    district: 'Nashik',
    state: 'Maharashtra',
    lat: 20.0736,
    lng: 74.1045,
  },
  {
    label: 'Karnal Agri Hub (Haryana)',
    village: 'Karnal',
    district: 'Karnal',
    state: 'Haryana',
    lat: 29.6857,
    lng: 76.9905,
  },
  {
    label: 'Warangal Rural (Telangana)',
    village: 'Narsampet',
    district: 'Warangal',
    state: 'Telangana',
    lat: 17.9285,
    lng: 79.8943,
  },
];

export const STATUS_BADGES = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  Completed: 'bg-forest-100 text-forest-700 border-forest-200',
};

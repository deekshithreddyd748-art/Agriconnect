# AgriConnect

**Empowering Farmers. Connecting Resources.**

AgriConnect is a mobile-first, multilingual, GPS-first agricultural service platform connecting Indian farmers with agricultural machinery owners, farm labour providers, and post-harvest storage facility operators.

---

## Key Platform Capabilities

- **100% Regional Localization (6 Indian Languages) & Optional Voice Readout**: Instant UI switching and `localStorage` persistence for **English**, **ಕನ್ನಡ (Kannada)**, **हिन्दी (Hindi)**, **తెలుగు (Telugu)**, **தமிழ் (Tamil)**, and **मराठी (Marathi)** via `i18next`, locale-aware `Intl` formatting, plus optional non-blocking Web Speech API readout (`window.speechSynthesis`).
- **Simplified Mobile Profile Identification (Supabase PostgreSQL)**:
  - No password or SMS OTP verification required.
  - Enter **Full Name** (required), **10-digit Indian Mobile Number** (required, `+91`), and **Email Address** (optional — stored as `NULL` when omitted).
  - **New Users**: Profile is saved to Supabase `public.profiles` -> redirected to `/select-role` (`Farmer`, `Equipment Owner`, `Labour Provider`, or `Facility Owner`; Administrator is never publicly selectable) -> redirected to their role dashboard.
  - **Returning Users**: Existing profile and saved role are preserved without overwriting. If submitted details differ from a saved profile on the same mobile number, AgriConnect notifies the user and lets them continue with their preserved saved profile.
- **Demo Security Notice**: Mobile profile identification is **demo-only profile lookup**, not verified multi-factor authentication. Public profile sessions (`authLevel: 'profile_demo'`) are strictly blocked from administrator routes and cannot elevate to `admin`.
- **Farmer-Centric & Provider Dashboards**: Prioritizes `Request Labour`, `Find Agricultural Equipment`, `Find Nearby Workers`, `Find Post-Harvest Facilities`, `My Labour Requests`, `My Bookings`, `Notifications`, `Nearby Services Map`, and `Profile & Settings` with visible **Home** and **Back** navigation.
- **Structured Labour Requests & Atomic Worker Acceptance (`LabourBooking`)**: Searchable work categories, live cost estimator (`Workers × Duration × Daily Wage` in ₹), atomic worker acceptance (`POST /api/labour-requests/:id/accept`) preventing duplicates and overbooking, and privacy-scoped contact reveal.
- **Isolated Interactive Labour Demo (`/labour-demo`)**: Uses isolated mock data (`Frontend/src/data/demoLabourData.json`) strictly in client state so visitors can walk through all steps safely without mutating the database.
- **GPS-First Hyperlocal Discovery**: One-tap device GPS pinpointing (`CurrentLocationPicker` + OpenStreetMap/Nominatim reverse geocoding + Haversine 5–25 km radius sorting) with zero manual latitude/longitude input fields in UI.

---

## Supabase Schema Setup

Run [Backend/supabase/migrations/001_create_profiles.sql](Backend/supabase/migrations/001_create_profiles.sql) in the Supabase SQL Editor before starting the backend:

- Creates `public.profiles` (`id`, `full_name`, `mobile_number UNIQUE`, nullable `email`, `role`, `created_at`, `updated_at`).
- Enables Row Level Security (`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`) with strict non-permissive `anon` policies so mobile numbers and emails cannot be enumerated directly from browser clients.
- All profile reads/writes go through the Express backend using `SUPABASE_SERVICE_ROLE_KEY` (server-only).

---

## Environment Variables

### Backend (`Backend/.env`)
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Express HTTP port |
| `NODE_ENV` | `development` / `production` | Environment mode |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase project URL (server-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service-role-key>` | Server-only Supabase key (NEVER expose in Frontend) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/agriconnect` | MongoDB connection string for operational entities (machinery, labour, facilities, bookings) |
| `JWT_SECRET` | `<long-random-secret>` | Secret for signing scoped session tokens |
| `JWT_EXPIRES_IN` | `7d` | Session token expiration |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated allowed CORS origins |
| `AUTO_SEED` | `true` | Auto-seed operational listings when database is empty |

### Frontend (`Frontend/.env`)
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000/api` | Backend REST API base URL (production: `/api` or deployed backend URL) |
| `VITE_ASSET_URL` | `http://localhost:5000` | Backend origin for `/uploads/*` images |

---

## Local Development

```bash
# Terminal 1 (Backend)
cd Backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 (Frontend)
cd Frontend
cp .env.example .env
npm install
npm run dev
```

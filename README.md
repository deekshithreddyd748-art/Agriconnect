# AgriConnect

**Empowering Farmers. Connecting Resources.**

AgriConnect is a mobile-first, multilingual, GPS-first agricultural service platform connecting Indian farmers with farm workers, agricultural machinery owners, and post-harvest facility operators.

---

## Key Platform Capabilities

- **100% Regional Localization (6 Indian Languages)**: Instant UI switching and `localStorage` persistence for **English**, **ಕನ್ನಡ (Kannada)**, **हिन्दी (Hindi)**, **తెలుగు (Telugu)**, **தமிழ் (Tamil)**, and **मराठी (Marathi)** via `i18next`, locale-aware `Intl` date/number/currency formatting, UTF-8 Indian script typography (`Noto Sans`), and dev-mode missing-translation warnings.
- **6-Step Farmer Onboarding & Real SMS OTP Auth**: Step 1 Select Language & Role -> Step 2 Mobile Number -> Step 3 Request OTP -> Step 4 Verify OTP (with 60s resend cooldown, expiry, and edit number) -> Step 5 Minimal Farmer Profile (`Full Name`, `Village`, `District`, optional `Primary Crop`, optional `Farm Size` in `acres`/`hectares`) -> Step 6 Farmer Dashboard. Supports real Indian SMS providers (`MSG91`, `2Factor`, `Twilio`) configured strictly via backend environment variables — returns explicit `503 SMS_NOT_CONFIGURED` if unconfigured (no fake/mock OTP).
- **Farmer-Centric Dashboard**: Prioritizes `Request Labour`, `Find Agricultural Equipment`, `Find Nearby Workers`, `Find Post-Harvest Facilities`, `My Labour Requests`, `My Bookings`, `Notifications`, `Labour Demo / How It Works`, and `Profile & Settings`.
- **Structured Labour Requests & Atomic Worker Acceptance (`LabourBooking`)**: Searchable 10-category selector (`Sowing / Planting`, `Harvesting`, `Weeding`, `Pesticide Spraying`, `Tractor / Machinery Operator`, `Irrigation Work`, `Land Preparation`, `Fertilizer Application`, `General Farm Help`, `Other Agricultural Work`), initial `Pending` status, live cost estimator (`Workers × Duration × Daily Wage` in ₹), atomic worker direct acceptance (`POST /api/labour-requests/:id/accept`) preventing duplicates and overbooking, and privacy-scoped contact reveal.
- **Isolated 6-Step Interactive Labour Demo (`/labour-demo`)**: Uses isolated mock data (`Frontend/src/data/demoLabourData.json`) strictly in client state so visitors can walk through all 6 steps safely without touching the database or SMS gateway.
- **GPS-First Hyperlocal Discovery**: One-tap device GPS pinpointing (`CurrentLocationPicker` + OpenStreetMap/Nominatim reverse geocoding + Haversine 5–25 km radius sorting) with zero manual latitude/longitude input fields in UI.

---

## Environment Variables

### Backend (`Backend/.env`)
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Express HTTP port |
| `NODE_ENV` | `development` / `production` | Environment mode |
| `MONGO_URI` | `mongodb+srv://.../agriconnect` | MongoDB connection string (falls back to embedded local MongoDB in development when unreachable) |
| `JWT_SECRET` | `<long-random-secret>` | Secret for signing JWTs and HMAC OTP hashes |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `CLIENT_URL` | `http://localhost:5173,https://agriconnect-deekshithreddyd748-6042.vercel.app` | Comma-separated allowed CORS origins |
| `AUTO_SEED` | `true` | Auto-seed demo users, machinery, labour teams, facilities, and bookings when `User` collection is empty |
| `SMS_PROVIDER` | `msg91` / `twilio_verify` / `2factor` / `twilio` | Active SMS OTP gateway provider (`Backend/services/smsOtpService.js`) |
| `MSG91_AUTH_KEY` / `MSG91_TEMPLATE_ID` / `MSG91_SERVER_VERIFY` | optional | MSG91 OTP v5 send + optional server-side verify credentials |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_VERIFY_SERVICE_SID` | optional | Twilio Verify v2 server-side OTP send & verification credentials |
| `TWOFACTOR_API_KEY` / `TWOFACTOR_TEMPLATE_NAME` | optional | 2Factor.in SMS OTP API credentials |
| `TWILIO_FROM_NUMBER` | optional | Twilio Programmable SMS sender number (if not using Twilio Verify) |

### Frontend (`Frontend/.env`)
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-backend-domain>/api` | Backend REST API base URL (local: `http://localhost:5000/api`) |
| `VITE_ASSET_URL` | `https://<your-backend-domain>` | Backend origin for `/uploads/*` images |

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

---

## Production Deployment

### Backend (Render / Railway)
- **Root Directory**: `Backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Env Vars**: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `CLIENT_URL=https://agriconnect-deekshithreddyd748-6042.vercel.app`, `AUTO_SEED=true`, and your `SMS_PROVIDER` credentials (`MSG91_*`, `TWOFACTOR_*`, or `TWILIO_*`).

### Frontend (Vercel)
- **Root Directory**: `Frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**: `VITE_API_URL`, `VITE_ASSET_URL`
- [Frontend/vercel.json](Frontend/vercel.json) handles SPA rewrites on nested route refreshes.

---

## Demo Accounts (Seeded Email/Password Accounts)

1-click auto-fill is available on `/login`:
- **Farmer**: `farmer@agriconnect.in` / `Demo@123`
- **Equipment Owner**: `owner@agriconnect.in` / `Demo@123`
- **Labour Provider**: `labour@agriconnect.in` / `Demo@123`
- **Facility Owner**: `facility@agriconnect.in` / `Demo@123`
- **Administrator**: `admin@agriconnect.in` / `Admin@123`

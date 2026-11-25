# AgriConnect

**Empowering Farmers. Connecting Resources.**

AgriConnect is a mobile-first, multilingual, hyperlocal agricultural service platform connecting farmers with farm labour, machinery owners, and post-harvest facility operators.

---

## New Farmer-Centric Capabilities

- **6 Regional Languages (Instant Switch + Persistent)**: `English`, `ಕನ್ನಡ` (Kannada), `हिन्दी` (Hindi), `తెలుగు` (Telugu), `தமிழ்` (Tamil), and `मराठी` (Marathi) via `i18next` and `src/locales/*.json`.
- **3-Step Mobile OTP Onboarding**: Role selection cards → 10-digit Indian mobile OTP verification (with clearly labelled development mock OTP mode when SMS gateway credentials are unset) → minimal rural profile setup.
- **Redesigned Farmer Dashboard**: Mobile-first action cards prioritizing **Request Labour**, **Find Equipment**, **Find Facilities**, **My Bookings**, **Labour Demo**, and **Help / How It Works**, plus live notifications.
- **Request Labour & Worker Discovery Workflow**: Searchable 8-category dropdown with icons, live total cost estimator (`workers × days × dailyWage`), unique `LR-YYYY-XXXX` IDs, open job discovery for Labour Providers, duplicate-application prevention, atomic capacity enforcement (`Open` → `Partially Filled` → `Fully Filled`), and booking confirmation.
- **Isolated Interactive Labour Demo (`/labour-demo`)**: Complete 5-step interactive simulation stored strictly in local component state so judges and first-time visitors can test the workflow without writing to MongoDB.

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
| `AUTO_SEED` | `true` | Auto-seed demo data if `User` collection is empty |
| `ENABLE_DEMO_OTP` | `true` | Enables clearly labelled mock OTP generation when SMS gateway credentials are absent |
| `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN` / `FROM_NUMBER` | optional | Optional production SMS OTP gateway credentials |

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
- **Env Vars**: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `CLIENT_URL=https://agriconnect-deekshithreddyd748-6042.vercel.app`, `AUTO_SEED=true` (plus Twilio vars or `ENABLE_DEMO_OTP=true` for hackathon demos).

### Frontend (Vercel)
- **Root Directory**: `Frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**: `VITE_API_URL`, `VITE_ASSET_URL`
- [Frontend/vercel.json](Frontend/vercel.json) handles SPA rewrites on nested route refreshes.

---

## Demo Accounts

- **Mobile OTP Demo Numbers**: Farmer `9823011223`, Labour Provider `9890177889`
- **Email / Password Demo Accounts** (1-click fill on `/login`):
  - Farmer: `farmer@agriconnect.in` / `Demo@123`
  - Equipment Owner: `owner@agriconnect.in` / `Demo@123`
  - Labour Provider: `labour@agriconnect.in` / `Demo@123`
  - Facility Owner: `facility@agriconnect.in` / `Demo@123`
  - Administrator: `admin@agriconnect.in` / `Admin@123`

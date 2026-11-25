# AgriConnect

**Empowering Farmers. Connecting Resources.**

AgriConnect is a responsive, hyperlocal full-stack web platform connecting farmers with nearby agricultural machinery owners, skilled harvesting labour providers, and post-harvest facility operators.

---

## Key Features

- **Hyperlocal Location Discovery**: Browser Geolocation API, quick village/town presets, district & village filtering, click-to-pick Leaflet/OpenStreetMap coordinates, configurable radius (`5 km`, `10 km`, `15 km`, `25 km`), and Haversine distance sorting. Listings without coordinates explicitly report `Location unavailable`.
- **Machinery Marketplace**: 12 categories of agricultural equipment, search/filter by category, district, max price, and availability, List & Map views, image upload via Multer, and cost estimation.
- **Agricultural Labour Network**: Crew discovery with `skills`, `experience`, available workers, daily/hourly wages, and available dates.
- **Post-Harvest Facility Network**: Cold storage, warehouses, drying, sorting, grading, and packaging facilities with live `availableCapacity` tracking.
- **Complete Booking Lifecycle**: `Pending`, `Accepted`, `Rejected`, `Cancelled`, `Completed` with server-side overlapping booking prevention and role-scoped authorization.
- **Admin Control Center**: Platform-wide analytics (Recharts), user activation/suspension, listing moderation, reported listing review, and booking oversight.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, React Hook Form, Recharts, Leaflet + OpenStreetMap, React Hot Toast
- **Backend**: Node.js, Express.js, MongoDB + Mongoose ODM, JWT, bcryptjs, Multer, Express Validator, Helmet, CORS

---

## Environment Variables

### Backend (`Backend/.env`)
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Express HTTP port |
| `NODE_ENV` | `development` / `production` | Environment mode |
| `MONGO_URI` | `mongodb+srv://.../agriconnect` | MongoDB connection string (falls back to embedded local MongoDB in development when unreachable) |
| `JWT_SECRET` | `<long-random-secret>` | Secret for signing JWTs (never expose in Frontend) |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `CLIENT_URL` | `http://localhost:5173,https://agriconnect-deekshithreddyd748-6042.vercel.app` | Comma-separated allowed CORS origins |
| `AUTO_SEED` | `true` | Auto-seed demo data if `User` collection is empty |

### Frontend (`Frontend/.env`)
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-backend-domain>/api` | Backend REST API base URL (local: `http://localhost:5000/api`) |
| `VITE_ASSET_URL` | `https://<your-backend-domain>` | Backend origin for `/uploads/*` images |

---

## Local Development

### 1. Backend
```bash
cd Backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend
```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

---

## Production Deployment

### Backend Deployment (Render / Railway)
1. Create a free MongoDB Atlas cluster (`M0`) and obtain your `MONGO_URI`.
2. Create a new **Web Service** pointing to this repository with:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Set Environment Variables (`NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `CLIENT_URL=https://agriconnect-deekshithreddyd748-6042.vercel.app`, `AUTO_SEED=true`).

### Frontend Deployment (Vercel)
1. In Vercel Project Settings:
   - **Root Directory**: `Frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Add Environment Variables:
   - `VITE_API_URL=https://<your-deployed-backend>/api`
   - `VITE_ASSET_URL=https://<your-deployed-backend>`
3. [Frontend/vercel.json](Frontend/vercel.json) configures SPA rewrites so refreshing nested routes (e.g., `/machinery`, `/farmer/dashboard`) resolves cleanly to `/index.html`.

---

## Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Farmer | `farmer@agriconnect.in` | `Demo@123` |
| Equipment Owner | `owner@agriconnect.in` | `Demo@123` |
| Labour Provider | `labour@agriconnect.in` | `Demo@123` |
| Facility Owner | `facility@agriconnect.in` | `Demo@123` |
| Administrator | `admin@agriconnect.in` | `Admin@123` |

---

## Media & Attribution
- Hero photograph (`Frontend/public/images/hero-farmer.jpg`) and category vector graphics (`Frontend/public/images/*.svg`) are original assets generated for the AgriConnect project.

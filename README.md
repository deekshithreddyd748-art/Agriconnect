# AgriConnect

**Connecting Farmers. Empowering Agriculture.**

AgriConnect is a responsive, hyperlocal full-stack web platform connecting farmers with nearby agricultural machinery owners, skilled harvesting labour providers, and post-harvest facility operators.

---

## Key Features

- **Hyperlocal Location Discovery**: Browser Geolocation API, quick village/town presets, click-to-pick Leaflet/OpenStreetMap coordinates, radius filters (`5 km`, `10 km`, `15 km`, `25 km`), and real Haversine distance sorting. Listings without coordinates are honestly flagged as location unavailable.
- **Machinery Marketplace**: Browse 10 categories of agricultural equipment, filter by category/price/availability/distance, switch between List & Map view, calculate estimated booking cost, and track booking status.
- **Agricultural Labour Network**: Discover nearby skilled farm crews by work category and team size, request workers for specific dates, and manage approvals.
- **Post-Harvest Facility Network**: Locate nearby cold storages, warehouses, grain dryers, and mills with live available capacity and reservation workflows.
- **Role-Based Dashboards & Security**: JWT authentication, bcrypt password hashing, role-scoped APIs (`farmer`, `equipment_owner`, `labour_provider`, `facility_operator`, `admin`), Multer image uploads, and an Admin Control Center with Recharts analytics.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, React Hook Form, Recharts, Leaflet + OpenStreetMap, React Hot Toast
- **Backend**: Node.js, Express.js, MongoDB + Mongoose ODM, JWT, bcryptjs, Multer, Express Validator, Helmet, CORS

---

## Project Structure

```text
Agriconnect/
├── Backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/seedData.js
│   ├── uploads/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── Frontend/
    ├── public/images/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    ├── .env.example
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

1. **Node.js (v18+ LTS)** and **npm**
2. **MongoDB** (local MongoDB Community Server on `mongodb://127.0.0.1:27017/agriconnect` or a free MongoDB Atlas connection string)

---

## Installation & Setup

### 1. Configure & Start Backend

```bash
cd Backend
cp .env.example .env
# Edit .env if using MongoDB Atlas instead of local MongoDB
npm install
npm run seed   # Optional: Backend auto-seeds demo data on startup if DB is empty
npm run dev
```

The API runs on `http://localhost:5000`.

### 2. Configure & Start Frontend

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

The web app runs on `http://localhost:5173`.

---

## Hackathon Demo Accounts

All demo accounts are also available with one-click auto-fill on the `/login` page:

| Role | Email | Password |
| :--- | :--- | :--- |
| Farmer | `farmer@agriconnect.in` | `Demo@123` |
| Equipment Owner | `owner@agriconnect.in` | `Demo@123` |
| Labour Provider | `labour@agriconnect.in` | `Demo@123` |
| Facility Operator | `facility@agriconnect.in` | `Demo@123` |
| Administrator | `admin@agriconnect.in` | `Admin@123` |

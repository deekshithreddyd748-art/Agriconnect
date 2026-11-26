import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { isSupabaseConfigured } from './services/supabaseClient.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import labourRoutes from './routes/labourRoutes.js';
import labourRequestRoutes from './routes/labourRequestRoutes.js';
import labourApplicationRoutes from './routes/labourApplicationRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import discoveryRoutes from './routes/discoveryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

const allowedOrigins = (
  process.env.CLIENT_URL ||
  'http://localhost:5173,https://agriconnect-deekshithreddyd748-6042.vercel.app'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  const supabaseReady = isSupabaseConfigured();
  res.json({
    success: true,
    service: 'AgriConnect API',
    status: 'ok',
    database: 'supabase',
    supabaseConfigured: supabaseReady,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/labour-requests', labourRequestRoutes);
app.use('/api/labour-applications', labourApplicationRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(
      `AgriConnect Backend running on http://localhost:${PORT} (Supabase configured: ${isSupabaseConfigured()})`
    );
  });
}

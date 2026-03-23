import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
dotenv.config();

import { router } from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { requestLogger } from './lib/logger';
import { securityHeaders, apiRateLimit, realIp, sanitizeQuery } from './middleware/security';
import { startAllJobs } from './jobs/cronJobs';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (for correct IP behind Nginx/load balancer)
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
}));
app.use(securityHeaders);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://clearmed.in',
      'https://clearmedapp.vercel.app',
    ].filter(Boolean) as string[];

    const isVercelPreview = origin.endsWith('.vercel.app');
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev || isVercelPreview || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-Key'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Middleware ────────────────────────────────────────────────────────────
app.use(realIp);
app.use(requestLogger);
app.use(sanitizeQuery);
app.use('/api', apiRateLimit);
app.use('/uploads', express.static('uploads'));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api', router);

app.get('/health', (_, res) => res.json({
  status: 'ok', version: '4.0.0',
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV,
}));

app.use(notFound);
app.use(errorHandler);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🚀 ClearMed API v4 → http://localhost:${PORT}`);
  console.log(`   Security: HSTS, Rate limiting, OWASP hardening`);
  console.log(`   DPDP Act 2023: Erasure + Export endpoints live\n`);
  startAllJobs();
});
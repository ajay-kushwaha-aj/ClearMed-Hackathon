/**
 * Security Middleware — Phase 4
 * OWASP Top 10 hardening, rate limiting, file validation, admin auth guards
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken, AdminTokenPayload } from '../lib/auth';
import { logger } from '../lib/logger';

// ── Augment Express Request ───────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

// ── HSTS + Security Headers ───────────────────────────────────────────────
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // HSTS: Force HTTPS for 1 year
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS protection legacy header
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Remove server header (set in Helmet, but explicit)
  res.removeHeader('X-Powered-By');
  next();
}

// ── Rate Limiters ─────────────────────────────────────────────────────────

// General API: 300 req / 15min per IP
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many requests. Please try again later.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Auth endpoints: 10 req / 15min per IP (brute-force protection)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

// Upload: 5 uploads / hour per IP
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Upload limit reached. You can upload up to 5 bills per hour.' },
});

// Symptom analysis: 20 queries / hour per IP
export const symptomRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many symptom queries. Please try again later.' },
});

// ── File Upload Validation ────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.pdf']);

const MAX_FILE_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024;

export function validateUploadedFile(req: Request, res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) { next(); return; }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    res.status(400).json({ error: `File type not allowed. Accepted: JPEG, PNG, PDF, WebP` });
    return;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    res.status(400).json({ error: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10}MB` });
    return;
  }

  // Check magic bytes (first 8 bytes)
  const buf = file.buffer || Buffer.alloc(0);
  if (buf.length >= 4) {
    const hex = buf.slice(0, 8).toString('hex');
    const isJpeg = hex.startsWith('ffd8ff');
    const isPng  = hex.startsWith('89504e47');
    const isPdf  = hex.startsWith('25504446'); // %PDF
    const isWebp = buf.slice(0, 4).toString('ascii') === 'RIFF';

    if (!isJpeg && !isPng && !isPdf && !isWebp && file.mimetype !== 'image/heic') {
      logger.warn('[FileValidation] Magic bytes mismatch', { mimetype: file.mimetype, hex: hex.slice(0, 16) });
      res.status(400).json({ error: 'File content does not match declared type.' });
      return;
    }
  }

  next();
}

// ── Admin JWT Auth guard ───────────────────────────────────────────────────

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.admin = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) { res.status(401).json({ error: 'Unauthenticated' }); return; }
    if (!roles.includes(req.admin.role)) {
      res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
      return;
    }
    next();
  };
}

// ── Request sanitization (prevent NoSQL/query injection) ──────────────────

export function sanitizeQuery(req: Request, res: Response, next: NextFunction) {
  // Remove $ operators from query params (MongoDB NoSQL injection prevention)
  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete req.query[key];
    }
  }
  // Prisma uses parameterized queries natively — this is extra defense
  next();
}

// ── IP extraction (behind proxy) ──────────────────────────────────────────
export function realIp(req: Request, res: Response, next: NextFunction) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    (req as any).ip = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }
  next();
}

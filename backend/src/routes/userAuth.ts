import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();
function makeReferralCode(name: string): string {
  const base = (name || 'CM').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'CM';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`.slice(0, 8);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ── Register ───────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, city, referralCode } = z.object({
      name: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number').optional(),
      password: z.string().min(6),
      city: z.string().optional(),
      referralCode: z.string().optional(),
    }).parse(req.body);

    if (!email && !phone) {
      res.status(400).json({ error: 'Email or phone number is required' });
      return;
    }

    // Check existing user
    const existing = await prisma.user.findFirst({
      where: email ? { email } : { phone },
    });
    if (existing) {
      res.status(409).json({ error: email ? 'Email already registered' : 'Phone already registered' });
      return;
    }

    // Hash password & generate referral code
    const passwordHash = await bcrypt.hash(password, 10);
    const myReferralCode = makeReferralCode(name);

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        city,
        referralCode: myReferralCode,
        // Store password in bio field as workaround (no passwordHash in User model)
        // In production: add passwordHash field to User model
        bio: `__pwd__${passwordHash}`,
      },
    });

    // Process referral if code provided
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer && referrer.id !== user.id) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            code: referralCode,
          },
        }).catch(() => {});
        await prisma.user.update({
          where: { id: referrer.id },
          data: { points: { increment: 200 }, totalPoints: { increment: 200 } },
        }).catch(() => {});
      }
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      data: { id: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city, points: user.points, referralCode: user.referralCode },
      token,
      message: 'Account created successfully! Welcome to ClearMed.',
    });
  } catch (err) { next(err); }
});

// ── Login ──────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = z.object({
      identifier: z.string().min(1, 'Email or phone required'),
      password: z.string().min(1, 'Password required'),
    }).parse(req.body);

    // Find by email or phone
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user || !user.bio?.startsWith('__pwd__')) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    const storedHash = user.bio.replace('__pwd__', '');
    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      data: { id: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city, points: user.points, referralCode: user.referralCode },
      token,
    });
  } catch (err) { next(err); }
});

// ── Get current user ───────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, phone: true, city: true, points: true, totalPoints: true, referralCode: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ data: user });
  } catch (err) { next(err); }
});

// ── Update profile ─────────────────────────────────────────────────────────
router.patch('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { name, city } = z.object({
      name: z.string().min(2).optional(),
      city: z.string().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { ...(name ? { name } : {}), ...(city ? { city } : {}) },
      select: { id: true, name: true, email: true, phone: true, city: true, points: true },
    });
    res.json({ data: user });
  } catch (err) { next(err); }
});

export default router;

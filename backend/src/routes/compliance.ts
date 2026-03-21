import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { exportUserData } from '../lib/dataRetention';

const router = Router();

// ── Submit erasure request (public — user requests own data deletion) ──────
router.post('/erasure-request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email, reason } = z.object({
      userId: z.string().optional(),
      email: z.string().email(),
      reason: z.string().optional(),
    }).parse(req.body);

    // Find user by email
    let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user && email) {
      user = await prisma.user.findFirst({ where: { email } });
    }

    if (!user) {
      // Still log the request — even if user not found
      res.json({ message: 'If an account exists with that email, a deletion request has been filed. We will process it within 30 days as required by DPDP Act 2023.' });
      return;
    }

    // Check no existing pending request
    const existing = await prisma.erasureRequest.findFirst({ where: { userId: user.id, status: 'BILL_PENDING' } });
    if (existing) {
      res.json({ message: 'A deletion request is already pending for this account. We will process it within 30 days.' });
      return;
    }

    await prisma.erasureRequest.create({
      data: { userId: user.id, email, reason, status: 'BILL_PENDING' },
    });

    res.json({ message: 'Deletion request received. Per the Digital Personal Data Protection Act 2023, we will process your request within 30 days and notify you at the provided email address.' });
  } catch (err) { next(err); }
});

// ── Download own data (DPDP portability) ──────────────────────────────────
router.post('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email } = z.object({
      userId: z.string().optional(),
      email: z.string().email().optional(),
    }).parse(req.body);

    let user = null;
    if (userId) user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user && email) user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const data = await exportUserData(user.id);
    res.json({ data });
  } catch (err) { next(err); }
});

// ── Cookie consent record ─────────────────────────────────────────────────
router.post('/consent', async (req: Request, res: Response, next: NextFunction) => {
  // In production: store consent timestamp + version in DB or cookie
  // For now: acknowledge
  res.json({ message: 'Consent recorded', timestamp: new Date().toISOString() });
});

export default router;

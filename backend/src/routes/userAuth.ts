import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS || 're_test_key');

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
      name: z.string().min(2).trim(),
      email: z.string().email().trim().toLowerCase().optional(),
      phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number').optional(),
      password: z.string().min(6),
      city: z.string().trim().optional(),
      referralCode: z.string().trim().optional(),
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

    // Generate 6-digit OTP
    const emailOtp = email ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    const emailOtpExpiry = email ? new Date(Date.now() + 10 * 60 * 1000) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        city,
        referralCode: myReferralCode,
        bio: `__pwd__${passwordHash}`,
        emailOtp,
        emailOtpExpiry,
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
        }).catch(() => { });
        await prisma.user.update({
          where: { id: referrer.id },
          data: { points: { increment: 200 }, totalPoints: { increment: 200 } },
        }).catch(() => { });
      }
    }

    if (email) {
      console.log(`\n=========================================`);
      console.log(`[AUTH] VERIFICATION OTP FOR ${email}: ${emailOtp}`);
      console.log(`=========================================\n`);

      if (process.env.RESEND_API_KEY || process.env.SMTP_PASS) {
        const { error: resendError } = await resend.emails.send({
          from: 'ClearMed <noreply@clearmed.online>',
          to: email,
          subject: 'Verify your ClearMed account',
          html: `<p>Welcome to ClearMed!</p><p>Your verification code is: <strong style="font-size: 24px; color: #0f766e">${emailOtp}</strong></p><p>This code expires in 10 minutes.</p>`,
        });
        if (resendError) {
          console.error('[Resend] Failed to send OTP:', resendError);
        }
      } else {
        console.warn(`[Resend] No API key. OTP for ${email} is ${emailOtp}`);
      }

      res.status(201).json({
        data: { id: user.id, email: user.email, verificationRequired: true },
        message: `Please verify your email address. We sent a 6-digit code to ${email}`,
      });
      return;
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
      identifier: z.string().min(1, 'Email or phone required').trim(),
      password: z.string().min(1, 'Password required'),
    }).parse(req.body);

    // Find by email or phone
    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier.toLowerCase() : identifier.replace(/\D/g, '').slice(-10);

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: normalizedIdentifier } : { phone: normalizedIdentifier },
    });

    if (!user || !user.bio?.startsWith('__pwd__')) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    // Validate password FIRST, before checking verification
    const storedHash = user.bio.replace('__pwd__', '');
    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    // Only after password is confirmed correct, check email verification
    if (user.email && !user.isEmailVerified) {
      // Generate a fresh OTP so user can verify right now
      const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { emailOtp, emailOtpExpiry } });

      console.log(`\n=========================================`);
      console.log(`[AUTH] LOGIN VERIFICATION OTP FOR ${user.email}: ${emailOtp}`);
      console.log(`=========================================\n`);

      // Try to send email (may fail on Resend free tier for unverified domains)
      if ((process.env.RESEND_API_KEY || process.env.SMTP_PASS) && user.email) {
        resend.emails.send({
          from: 'ClearMed <noreply@clearmed.online>',
          to: user.email,
          subject: 'Verify your ClearMed account',
          html: `<p>Your verification code is: <strong style="font-size: 24px; color: #0f766e">${emailOtp}</strong></p><p>This code expires in 10 minutes.</p>`,
        }).catch(err => console.error('[Resend] Email delivery failed (free tier?):', err));
      }

      // In development, include the OTP in the response so the frontend can show it
      const isDev = process.env.NODE_ENV !== 'production';
      res.status(403).json({
        error: 'Email verification required',
        data: {
          verificationRequired: true,
          userId: user.id,
          email: user.email,
          ...(isDev ? { devOtp: emailOtp } : {}),
        }
      });
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
      select: {
        id: true, name: true, email: true, phone: true, city: true,
        points: true, totalPoints: true, streak: true,
        referralCode: true, isEmailVerified: true,
        createdAt: true, lastActive: true,
        _count: { select: { bills: true, feedback: true } },
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, activity: true, points: true, description: true, createdAt: true },
        },
        bills: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, status: true, totalCost: true, createdAt: true,
            hospital: { select: { name: true } },
            treatment: { select: { name: true } },
          },
        },
      },
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

// ── Email Verification ─────────────────────────────────────────────────────
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, otp } = z.object({
      userId: z.string(),
      otp: z.string().length(6),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (user.isEmailVerified) { res.status(400).json({ error: 'Email already verified' }); return; }

    if (user.emailOtp !== otp || !user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
      res.status(400).json({ error: 'Invalid or expired verification code' }); return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, emailOtp: null, emailOtpExpiry: null },
    });

    const token = jwt.sign({ userId: updated.id, email: updated.email, name: updated.name }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      data: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, city: updated.city, points: updated.points, referralCode: updated.referralCode },
      token,
      message: 'Email verified successfully! Welcome to ClearMed.',
    });
  } catch (err) { next(err); }
});

// Resend Verification Email
router.post('/resend-verification', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier is required' });

    let email = identifier.toLowerCase().trim();
    let phone = identifier.replace(/\D/g, '');

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isEmailVerified && !user.phone) return res.status(400).json({ error: 'Email is already verified' });

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp, emailOtpExpiry }
    });

    if (user.email) {
      console.log(`\n=========================================`);
      console.log(`[AUTH] RESEND VERIFICATION OTP FOR ${user.email}: ${emailOtp}`);
      console.log(`=========================================\n`);

      if (process.env.RESEND_API_KEY || process.env.SMTP_PASS) {
        const { error: resendError } = await resend.emails.send({
          from: 'ClearMed <noreply@clearmed.online>',
          to: user.email,
          subject: 'Verify your ClearMed account',
          html: `<p>Welcome back!</p><p>Your new verification code is: <strong style="font-size: 24px; color: #0f766e">${emailOtp}</strong></p><p>This code expires in 10 minutes.</p>`,
        });
        if (resendError) console.error('[Resend] Failed to send OTP:', resendError);
      }
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error during resend' });
  }
});

// ── Forgot Password ────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = z.object({ identifier: z.string().min(1).trim().toLowerCase() }).parse(req.body);

    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier : identifier.replace(/\D/g, '').slice(-10);

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: normalizedIdentifier } : { phone: normalizedIdentifier },
    });

    if (!user) {
      // Return a vague success to not leak email addresses
      res.json({ message: 'If that account exists, a reset code has been sent.' }); return;
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtp, resetOtpExpiry },
    });

    if (isEmail) {
      console.log(`\n=========================================`);
      console.log(`[AUTH] PASSWORD RESET OTP FOR ${user.email}: ${resetOtp}`);
      console.log(`=========================================\n`);

      if (process.env.RESEND_API_KEY || process.env.SMTP_PASS) {
        const { error: resendError } = await resend.emails.send({
          from: 'ClearMed <noreply@clearmed.online>',
          to: user.email!,
          subject: 'Password Reset Request',
          html: `<p>Your password reset code is: <strong style="font-size: 24px; color: #0f766e">${resetOtp}</strong></p><p>This code expires in 15 minutes. If you did not request this, please ignore this email.</p>`,
        });
        if (resendError) {
          console.error('[Resend] Failed to send reset OTP:', resendError);
        }
      } else {
        console.warn(`[Resend] No API key. Reset OTP for ${user.email} is ${resetOtp}`);
      }
    } else {
      console.warn(`[SMS] Sending reset OTP to ${user.phone} is disabled. Code: ${resetOtp}`);
    }

    res.json({ message: 'If that account exists, a reset code has been sent.' });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, otp, newPassword } = z.object({
      identifier: z.string().trim().toLowerCase(),
      otp: z.string().length(6),
      newPassword: z.string().min(6),
    }).parse(req.body);

    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier : identifier.replace(/\D/g, '').slice(-10);

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: normalizedIdentifier } : { phone: normalizedIdentifier },
    });

    if (!user || user.resetOtp !== otp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset code' }); return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { bio: `__pwd__${passwordHash}`, resetOtp: null, resetOtpExpiry: null },
    });

    res.json({ message: 'Password has been successfully reset. You can now login.' });
  } catch (err) { next(err); }
});

export default router;

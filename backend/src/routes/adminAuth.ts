import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminLogin, setupTotp, confirmTotp, hashPassword } from '../lib/auth';
import { requireAdmin, requireRole, authRateLimit } from '../middleware/security';
import { writeAuditLog } from '../lib/auditLog';
import prisma from '../lib/prisma';

const router = Router();

// ── Login ──────────────────────────────────────────────────────────────────
router.post('/login', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, totpToken } = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      totpToken: z.string().length(6).optional(),
    }).parse(req.body);

    const result = await adminLogin(email, password, totpToken);

    if (!result.success) {
      if (result.requireTotp) {
        res.status(200).json({ requireTotp: true });
        return;
      }
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({ token: result.token, message: 'Login successful' });
  } catch (err) { next(err); }
});

// ── Whoami ─────────────────────────────────────────────────────────────────
router.get('/me', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin!.adminId },
      select: { id: true, name: true, email: true, role: true, totpEnabled: true, lastLogin: true, createdAt: true },
    });
    res.json({ data: admin });
  } catch (err) { next(err); }
});

// ── Setup TOTP ─────────────────────────────────────────────────────────────
router.post('/totp/setup', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await setupTotp(req.admin!.adminId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ── Confirm TOTP ───────────────────────────────────────────────────────────
router.post('/totp/confirm', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = z.object({ token: z.string().length(6) }).parse(req.body);
    const ok = await confirmTotp(req.admin!.adminId, token);
    if (!ok) { res.status(400).json({ error: 'Invalid TOTP token' }); return; }
    await writeAuditLog({ req, action: 'UPDATE', entity: 'admin_user', entityId: req.admin!.adminId, description: '2FA enabled' });
    res.json({ message: '2FA enabled successfully' });
  } catch (err) { next(err); }
});

// ── List admin users (SUPER_ADMIN only) ────────────────────────────────────
router.get('/users', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, name: true, email: true, role: true, totpEnabled: true, lastLogin: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: admins });
  } catch (err) { next(err); }
});

// ── Create admin user ──────────────────────────────────────────────────────
router.post('/users', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password, role } = z.object({
      email: z.string().email(),
      name: z.string().min(2),
      password: z.string().min(12),
      role: z.enum(['SUPER_ADMIN', 'MODERATOR', 'READ_ONLY']),
    }).parse(req.body);

    const existing = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) { res.status(409).json({ error: 'Email already exists' }); return; }

    const admin = await prisma.adminUser.create({
      data: { email: email.toLowerCase(), name, passwordHash: await hashPassword(password), role: role as any },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await writeAuditLog({ req, action: 'CREATE', entity: 'admin_user', entityId: admin.id, description: `Created admin: ${email} (${role})` });
    res.status(201).json({ data: admin });
  } catch (err) { next(err); }
});

// ── Update admin role ──────────────────────────────────────────────────────
router.patch('/users/:id', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isActive } = z.object({
      role: z.enum(['SUPER_ADMIN', 'MODERATOR', 'READ_ONLY']).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const admin = await prisma.adminUser.update({
      where: { id: req.params.id },
      data: { ...(role ? { role: role as any } : {}), ...(isActive !== undefined ? { isActive } : {}) },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await writeAuditLog({ req, action: 'UPDATE', entity: 'admin_user', entityId: admin.id, description: `Updated admin: ${JSON.stringify({ role, isActive })}` });
    res.json({ data: admin });
  } catch (err) { next(err); }
});

export default router;

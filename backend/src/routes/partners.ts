import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAdmin, requireRole } from '../middleware/security';
import { writeAuditLog } from '../lib/auditLog';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { customAlphabet } = require('nanoid');
import crypto from 'crypto';

const router = Router();
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

const PLAN_FEES: Record<string, number> = {
  FREE_TIER: 0,
  PRO: 4999,       // ₹4,999/month
  ENTERPRISE: 14999, // ₹14,999/month
};

const PLAN_FEATURES: Record<string, { slots: number; quota: number; label: string }> = {
  FREE_TIER:  { slots: 0, quota: 0,    label: 'Free' },
  PRO:        { slots: 3, quota: 500,  label: 'Pro' },
  ENTERPRISE: { slots: 10, quota: 2000, label: 'Enterprise' },
};

// ── Apply for partner program ──────────────────────────────────────────────
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      hospitalId: z.string(),
      plan: z.enum(['FREE_TIER','PRO','ENTERPRISE']).default('FREE_TIER'),
      contactName: z.string().min(2),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const existing = await prisma.hospitalPartner.findUnique({ where: { hospitalId: data.hospitalId } });
    if (existing) {
      res.status(409).json({ error: 'Hospital already has a partner application' });
      return;
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: data.hospitalId } });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }

    const token = nanoid();
    const features = PLAN_FEATURES[data.plan];

    const partner = await prisma.hospitalPartner.create({
      data: {
        hospitalId: data.hospitalId,
        plan: data.plan as any,
        status: data.plan === 'FREE_TIER' ? 'ACTIVE' : 'BILL_PENDING',
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        monthlyFee: PLAN_FEES[data.plan],
        analyticsToken: token,
        sponsoredSlots: features.slots,
      },
      include: { hospital: { select: { name: true, city: true } } },
    });

    res.status(201).json({
      data: partner,
      message: data.plan === 'FREE_TIER'
        ? 'Welcome to ClearMed Partner Program! Your profile is now active.'
        : 'Application received. Our team will contact you within 24 hours.',
    });
  } catch (err) { next(err); }
});

// ── Get partner dashboard data ─────────────────────────────────────────────
router.get('/dashboard/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await prisma.hospitalPartner.findUnique({
      where: { analyticsToken: req.params.token },
      include: {
        hospital: {
          select: { id: true, name: true, slug: true, city: true, rating: true, _count: { select: { bills: true, feedback: true } } },
        },
      },
    });

    if (!partner) { res.status(404).json({ error: 'Invalid token' }); return; }

    const [enquiries, recentEnquiries, profileViews, comparisonCount] = await Promise.all([
      prisma.patientEnquiry.count({ where: { partnerId: partner.id } }),
      prisma.patientEnquiry.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { treatment: { select: { name: true } } },
      }),
      // Proxy: bill count as profile view indicator
      prisma.bill.count({ where: { hospitalId: partner.hospitalId } }),
      // How many comparisons include this hospital
      prisma.bill.count({ where: { hospitalId: partner.hospitalId, status: 'BILL_VERIFIED' } }),
    ]);

    const newEnquiries = recentEnquiries.filter(e => e.status === 'ENQUIRY_NEW').length;

    res.json({
      data: {
        partner,
        stats: { totalEnquiries: enquiries, newEnquiries, profileViews, verifiedBills: comparisonCount },
        recentEnquiries,
        planFeatures: PLAN_FEATURES[partner.plan],
      },
    });
  } catch (err) { next(err); }
});

// ── Submit patient enquiry ─────────────────────────────────────────────────
router.post('/enquiry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      hospitalId: z.string(),
      treatmentId: z.string().optional(),
      patientName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      message: z.string().max(500).optional(),
      city: z.string().optional(),
      insurerId: z.string().optional(),
      source: z.string().optional().default('search'),
    });
    const data = schema.parse(req.body);

    const partner = await prisma.hospitalPartner.findUnique({
      where: { hospitalId: data.hospitalId },
    });

    if (!partner || partner.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Hospital is not accepting enquiries' });
      return;
    }

    const enquiry = await prisma.patientEnquiry.create({
      data: {
        partnerId: partner.id,
        treatmentId: data.treatmentId,
        patientName: data.patientName,
        phone: data.phone,
        email: data.email,
        message: data.message,
        city: data.city,
        insurerId: data.insurerId,
        source: data.source,
      },
    });

    res.status(201).json({ data: enquiry, message: "Enquiry sent! The hospital team will contact you within 24 hours." });
  } catch (err) { next(err); }
});

// ── Mark enquiry as contacted/converted ───────────────────────────────────
router.patch('/enquiry/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.enum(['ENQUIRY_CONTACTED','ENQUIRY_CONVERTED','ENQUIRY_CLOSED']) }).parse(req.body);
    const { token } = req.query as { token: string };

    const partner = await prisma.hospitalPartner.findUnique({ where: { analyticsToken: token } });
    if (!partner) { res.status(401).json({ error: 'Invalid token' }); return; }

    const enquiry = await prisma.patientEnquiry.update({
      where: { id: req.params.id, partnerId: partner.id },
      data: { status: status as any, ...(status === 'ENQUIRY_CONTACTED' ? { respondedAt: new Date() } : {}) },
    });
    res.json({ data: enquiry });
  } catch (err) { next(err); }
});

// ── Admin: approve/reject partner ─────────────────────────────────────────
router.patch('/admin/:id/approve', requireAdmin, requireRole('SUPER_ADMIN','MODERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await prisma.hospitalPartner.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', isVerified: true, verifiedAt: new Date() },
      include: { hospital: { select: { name: true } } },
    });
    await writeAuditLog({ req, action: 'APPROVE', entity: 'hospital_partner', entityId: partner.id, description: `Partner approved: ${(partner as any).hospital.name}` });
    res.json({ data: partner });
  } catch (err) { next(err); }
});

// ── List partners (admin) ─────────────────────────────────────────────────
router.get('/admin/list', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * 20;
    const [partners, total] = await Promise.all([
      prisma.hospitalPartner.findMany({
        where: status ? { status: status as any } : {},
        include: { hospital: { select: { name: true, city: true } }, _count: { select: { enquiries: true } } },
        orderBy: { createdAt: 'desc' }, skip, take: 20,
      }),
      prisma.hospitalPartner.count({ where: status ? { status: status as any } : {} }),
    ]);
    res.json({ data: partners, meta: { total } });
  } catch (err) { next(err); }
});

// ── Get sponsored hospitals for a treatment search ─────────────────────────
router.get('/sponsored', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, treatmentSlug } = req.query as Record<string, string>;
    const sponsored = await prisma.hospital.findMany({
      where: {
        city: city ? { contains: city, mode: 'insensitive' } : undefined,
        partner: { status: 'ACTIVE', sponsoredSlots: { gt: 0 } },
        ...(treatmentSlug ? { hospitalTreatments: { some: { treatment: { slug: treatmentSlug } } } } : {}),
      },
      include: {
        partner: { select: { plan: true, isVerified: true } },
        hospitalTreatments: treatmentSlug ? { where: { treatment: { slug: treatmentSlug } }, include: { treatment: true } } : { take: 0 },
        _count: { select: { doctors: true } },
      },
      take: 3,
    });
    res.json({ data: sponsored });
  } catch (err) { next(err); }
});

export { PLAN_FEATURES, PLAN_FEES };
export default router;

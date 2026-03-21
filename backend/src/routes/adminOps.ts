import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAdmin, requireRole } from '../middleware/security';
import { writeAuditLog } from '../lib/auditLog';
import { getAuditLogs } from '../lib/auditLog';
import { runRetentionPurge, processErasureRequest, exportUserData } from '../lib/dataRetention';

const router = Router();

// ── Analytics Dashboard ────────────────────────────────────────────────────
router.get('/analytics', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalBills, newBills7d, newBills30d,
      pendingBills, verifiedBills, rejectedBills, ocrReviewBills,
      totalUsers, newUsers7d, newUsers30d,
      totalReviews, newReviews7d,
      symptomQueries7d,
      abuseReportsOpen,
      erasurePending,
      billsByCity,
      billsByStatus,
      topTreatments,
    ] = await Promise.all([
      prisma.bill.count(),
      prisma.bill.count({ where: { createdAt: { gte: last7 } } }),
      prisma.bill.count({ where: { createdAt: { gte: last30 } } }),
      prisma.bill.count({ where: { status: 'BILL_PENDING' } }),
      prisma.bill.count({ where: { status: 'BILL_VERIFIED' } }),
      prisma.bill.count({ where: { status: 'BILL_REJECTED' } }),
      prisma.bill.count({ where: { status: 'BILL_OCR_REVIEW' } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last7 } } }),
      prisma.user.count({ where: { createdAt: { gte: last30 } } }),
      prisma.patientFeedback.count(),
      prisma.patientFeedback.count({ where: { createdAt: { gte: last7 } } }),
      prisma.symptomQuery.count({ where: { createdAt: { gte: last7 } } }),
      prisma.abuseReport.count({ where: { status: 'REPORT_OPEN' } }),
      prisma.erasureRequest.count({ where: { status: 'BILL_PENDING' } }),
      prisma.bill.groupBy({ by: ['city'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
      prisma.bill.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.bill.groupBy({ by: ['treatmentId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    ]);

    // Daily bill uploads last 14 days
    const dailyBills = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at)::text as date, COUNT(*) as count
      FROM bills
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json({
      data: {
        bills: { total: totalBills, last7d: newBills7d, last30d: newBills30d, pending: pendingBills, verified: verifiedBills, rejected: rejectedBills, ocrReview: ocrReviewBills },
        users: { total: totalUsers, last7d: newUsers7d, last30d: newUsers30d },
        reviews: { total: totalReviews, last7d: newReviews7d },
        symptoms: { last7d: symptomQueries7d },
        moderation: { abuseReportsOpen, erasurePending },
        charts: {
          billsByCity,
          billsByStatus: billsByStatus.reduce((acc: Record<string, number>, s) => { acc[s.status] = s._count.id; return acc; }, {}),
          dailyBills: dailyBills.map(d => ({ date: d.date, count: Number(d.count) })),
        },
      }
    });
  } catch (err) { next(err); }
});

// ── Audit Log ──────────────────────────────────────────────────────────────
router.get('/audit', requireAdmin, requireRole('SUPER_ADMIN', 'MODERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', entity, action } = req.query as Record<string, string>;
    const result = await getAuditLogs({ page: parseInt(page), limit: parseInt(limit), entity, action: action as any });
    res.json({ data: result.logs, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

// ── Abuse Reports ──────────────────────────────────────────────────────────
router.get('/abuse-reports', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'OPEN', page = '1' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * 20;
    const [reports, total] = await Promise.all([
      prisma.abuseReport.findMany({
        where: { status: status as any },
        orderBy: { createdAt: 'desc' }, skip, take: 20,
      }),
      prisma.abuseReport.count({ where: { status: status as any } }),
    ]);
    res.json({ data: reports, meta: { total } });
  } catch (err) { next(err); }
});

router.post('/abuse-reports/:id/resolve', requireAdmin, requireRole('SUPER_ADMIN', 'MODERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolution, status } = z.object({ resolution: z.string(), status: z.enum(['REPORT_RESOLVED','REPORT_DISMISSED']) }).parse(req.body);
    const report = await prisma.abuseReport.update({
      where: { id: req.params.id },
      data: { status: status as any, resolution, resolvedBy: req.admin!.adminId, resolvedAt: new Date() },
    });
    await writeAuditLog({ req, action: 'UPDATE', entity: 'abuse_report', entityId: report.id, description: `Abuse report ${status.toLowerCase()}: ${resolution}` });
    res.json({ data: report });
  } catch (err) { next(err); }
});

// ── DPDP Erasure Requests ──────────────────────────────────────────────────
router.get('/erasure-requests', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.erasureRequest.findMany({ orderBy: { requestedAt: 'desc' }, take: 50 });
    res.json({ data: requests });
  } catch (err) { next(err); }
});

router.post('/erasure-requests/:id/process', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.erasureRequest.findUnique({ where: { id: req.params.id } });
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
    const result = await processErasureRequest(request.userId, req.admin!.adminId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// User exports their own data (DPDP portability)
router.get('/users/:userId/export', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await exportUserData(req.params.userId);
    await writeAuditLog({ req, action: 'EXPORT', entity: 'user', entityId: req.params.userId, description: 'User data exported' });
    res.json({ data });
  } catch (err) { next(err); }
});

// ── Data Retention Purge (manual trigger) ─────────────────────────────────
router.post('/retention/purge', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ message: 'Retention purge started' });
    runRetentionPurge().then(r => console.log('[Admin] Purge result:', r));
  } catch (err) { next(err); }
});

// ── Hospital CSV Import ────────────────────────────────────────────────────
router.post('/import/hospitals', requireAdmin, requireRole('SUPER_ADMIN', 'MODERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = z.object({
      rows: z.array(z.object({
        name: z.string(),
        slug: z.string().optional(),
        city: z.string(),
        state: z.string().optional().default(''),
        address: z.string(),
        type: z.enum(['GOVERNMENT','PRIVATE','TRUST','CHARITABLE']).optional().default('PRIVATE'),
        beds: z.number().optional(),
        nabh: z.boolean().optional().default(false),
        phone: z.string().optional(),
        email: z.string().optional(),
      }))
    }).parse(req.body);

    let created = 0; let skipped = 0;
    for (const row of rows) {
      const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existing = await prisma.hospital.findUnique({ where: { slug } });
      if (existing) { skipped++; continue; }

      await prisma.hospital.create({
        data: {
          name: row.name, slug, city: row.city, state: row.state || '',
          address: row.address, type: (row.type || 'PRIVATE') as any,
          beds: row.beds, naabhStatus: row.nabh || false,
          phone: row.phone, email: row.email,
        },
      });
      created++;
    }

    await writeAuditLog({ req, action: 'CREATE', entity: 'hospital', description: `CSV import: ${created} created, ${skipped} skipped`, meta: { created, skipped } });
    res.json({ data: { created, skipped, total: rows.length } });
  } catch (err) { next(err); }
});

export default router;

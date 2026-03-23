import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { requireAdmin, requireRole } from '../middleware/security';
import { writeAuditLog } from '../lib/auditLog';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { customAlphabet } = require('nanoid');
import { logger } from '../lib/logger';

const router = Router();
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 40);

const PLAN_QUOTAS: Record<string, number> = {
  STARTER: 1000,
  PROFESSIONAL: 10000,
  ENTERPRISE: 100000,
};

const PLAN_FEES: Record<string, number> = {
  STARTER: 5000,
  PROFESSIONAL: 20000,
  ENTERPRISE: 50000,
};

// ── API Key authentication middleware ─────────────────────────────────────
async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string || req.query.api_key as string;

  if (!key) {
    res.status(401).json({ error: 'API key required. Pass X-Api-Key header or ?api_key= query param.' });
    return;
  }

  const hashed = crypto.createHash('sha256').update(key).digest('hex');

  // FIX: was findUnique({ where: { hashedKey: hashed } }) which Prisma rejects
  // because the generated WhereUniqueInput type may not expose hashedKey directly.
  // Using findFirst with a regular where clause is equivalent and always works.
  const apiKey = await prisma.apiKey.findFirst({ where: { hashedKey: hashed } });

  if (!apiKey || apiKey.status !== 'ACTIVE') {
    res.status(401).json({ error: 'Invalid or inactive API key' });
    return;
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    res.status(401).json({ error: 'API key has expired' });
    return;
  }

  if (apiKey.usedThisMonth >= apiKey.monthlyQuota) {
    res.status(429).json({
      error: 'Monthly quota exceeded',
      quota: apiKey.monthlyQuota,
      used: apiKey.usedThisMonth,
      plan: apiKey.plan,
    });
    return;
  }

  const start = Date.now();
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { usedThisMonth: { increment: 1 }, lastUsed: new Date() },
  });

  res.on('finish', () => {
    prisma.apiUsageLog.create({
      data: { keyId: apiKey.id, endpoint: req.path, method: req.method, status: res.statusCode, ms: Date.now() - start },
    }).catch(() => {});
  });

  (req as any).apiKey = apiKey;
  next();
}

// ── Cost percentile data ───────────────────────────────────────────────────
router.get('/costs/:treatmentSlug/:city', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { treatmentSlug, city } = req.params;
    const treatment = await prisma.treatment.findUnique({ where: { slug: treatmentSlug } });
    if (!treatment) { res.status(404).json({ error: 'Treatment not found' }); return; }

    const bills = await prisma.bill.findMany({
      where: { treatmentId: treatment.id, city: { contains: city, mode: 'insensitive' }, status: 'BILL_VERIFIED' },
      select: { totalCost: true, hospital: { select: { type: true } } },
    });

    if (!bills.length) { res.status(404).json({ error: 'No data available for this treatment/city combination' }); return; }

    const costs = bills.map(b => b.totalCost).sort((a, b) => a - b);
    const govtCosts = bills.filter(b => b.hospital.type === 'GOVERNMENT').map(b => b.totalCost);
    const pvtCosts = bills.filter(b => b.hospital.type === 'PRIVATE').map(b => b.totalCost);
    const percentile = (arr: number[], p: number) => arr[Math.floor((p / 100) * arr.length)] || 0;

    res.json({
      data: {
        treatment: { id: treatment.id, name: treatment.name, slug: treatment.slug },
        city,
        sampleSize: costs.length,
        statistics: {
          mean: Math.round(costs.reduce((s, v) => s + v, 0) / costs.length),
          median: Math.round(percentile(costs, 50)),
          p10: Math.round(percentile(costs, 10)),
          p25: Math.round(percentile(costs, 25)),
          p75: Math.round(percentile(costs, 75)),
          p90: Math.round(percentile(costs, 90)),
          min: Math.round(costs[0]),
          max: Math.round(costs[costs.length - 1]),
        },
        byHospitalType: {
          government: govtCosts.length > 0 ? { n: govtCosts.length, mean: Math.round(govtCosts.reduce((s, v) => s + v, 0) / govtCosts.length) } : null,
          private: pvtCosts.length > 0 ? { n: pvtCosts.length, mean: Math.round(pvtCosts.reduce((s, v) => s + v, 0) / pvtCosts.length) } : null,
        },
        asOf: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
});

// ── Hospital outcome data ─────────────────────────────────────────────────
router.get('/outcomes/:hospitalId/:treatmentId', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId, treatmentId } = req.params;
    const [score, hospital, treatment] = await Promise.all([
      prisma.clearMedScore.findUnique({ where: { hospitalId_treatmentId: { hospitalId, treatmentId } } }),
      prisma.hospital.findUnique({ where: { id: hospitalId }, select: { name: true, city: true, type: true, naabhStatus: true } }),
      prisma.treatment.findUnique({ where: { id: treatmentId }, select: { name: true, category: true } }),
    ]);

    if (!score) { res.status(404).json({ error: 'Score not available for this hospital-treatment pair' }); return; }
    if (!hospital || !treatment) { res.status(404).json({ error: 'Hospital or treatment not found' }); return; }

    res.json({
      data: {
        hospital: { id: hospitalId, ...hospital },
        treatment: { id: treatmentId, ...treatment },
        score: {
          overall: score.overallScore,
          components: {
            patientSatisfaction: score.satisfactionScore,
            doctorExperience: score.doctorScore,
            costEfficiency: score.costEfficiencyScore,
            successRate: score.successRateScore,
            recoveryTime: score.recoveryScore,
            naabhBonus: score.naabhBonus,
          },
          dataPoints: score.dataPoints,
          isReliable: score.isReliable,
          lastCalculated: score.lastCalculated,
        },
      },
    });
  } catch (err) { next(err); }
});

// ── Bulk cost data export ─────────────────────────────────────────────────
router.get('/bulk/costs', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = (req as any).apiKey;
    if (apiKey.plan === 'STARTER') {
      res.status(403).json({ error: 'Bulk export requires Professional or Enterprise plan' });
      return;
    }

    const { city, category } = req.query as Record<string, string>;
    const treatments = await prisma.treatment.findMany({
      where: category ? { category: { contains: category, mode: 'insensitive' } } : undefined,
      select: { id: true, name: true, slug: true, category: true },
      take: 50,
    });

    const result = [];
    for (const t of treatments) {
      const agg = await prisma.bill.aggregate({
        where: { treatmentId: t.id, status: 'BILL_VERIFIED', ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}) },
        _avg: { totalCost: true }, _min: { totalCost: true }, _max: { totalCost: true }, _count: { id: true },
      });
      if ((agg._count.id || 0) >= 2) {
        result.push({ treatment: t, avg: Math.round(agg._avg.totalCost || 0), min: Math.round(agg._min.totalCost || 0), max: Math.round(agg._max.totalCost || 0), n: agg._count.id });
      }
    }

    res.json({ data: result, total: result.length, generatedAt: new Date().toISOString() });
  } catch (err) { next(err); }
});

// ── Admin: Create API key ──────────────────────────────────────────────────
router.post('/keys', requireAdmin, requireRole('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgName, email, plan, name } = z.object({
      orgName: z.string(), email: z.string().email(),
      plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('STARTER'),
      name: z.string(),
    }).parse(req.body);

    const rawKey = `cm_${nanoid()}`;
    const hashed = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        name, orgName, email, key: rawKey, hashedKey: hashed,
        plan: plan as any, status: 'ACTIVE',
        monthlyQuota: PLAN_QUOTAS[plan],
      },
      select: { id: true, name: true, orgName: true, email: true, plan: true, monthlyQuota: true, createdAt: true },
    });

    await writeAuditLog({ req, action: 'CREATE', entity: 'api_key', entityId: apiKey.id, description: `B2B API key created for ${orgName}` });

    res.status(201).json({
      data: { ...apiKey, key: rawKey },
      message: 'Store this key securely — it will not be shown again.',
    });
  } catch (err) { next(err); }
});

// ── Admin: List API keys + usage ──────────────────────────────────────────
router.get('/keys', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      select: { id: true, name: true, orgName: true, email: true, plan: true, status: true, monthlyQuota: true, usedThisMonth: true, lastUsed: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: keys });
  } catch (err) { next(err); }
});

// ── API documentation ──────────────────────────────────────────────────────
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    title: 'ClearMed Healthcare Analytics API',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api/b2b`,
    authentication: 'Pass X-Api-Key header with your API key',
    plans: Object.entries(PLAN_FEES).map(([plan, fee]) => ({
      plan, fee: `₹${fee.toLocaleString('en-IN')}/month`, quota: `${PLAN_QUOTAS[plan].toLocaleString()} calls/month`,
    })),
    endpoints: [
      { method: 'GET', path: '/costs/:treatmentSlug/:city', description: 'Cost percentile data (p10, p25, median, p75, p90)', plans: 'All' },
      { method: 'GET', path: '/outcomes/:hospitalId/:treatmentId', description: 'ClearMed Score + outcome components', plans: 'All' },
      { method: 'GET', path: '/bulk/costs', description: 'Bulk cost data for all treatments', plans: 'Professional, Enterprise' },
    ],
    contact: 'api@clearmed.in',
  });
});

export default router;
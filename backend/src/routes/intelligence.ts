/**
 * Cost Intelligence API — Phase 3
 * Powers the Cost Intelligence Dashboard
 */
import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Dashboard: list of treatments with avg cost + trend for a city
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city = 'Delhi', category } = req.query as { city?: string; category?: string };

    const ht = await prisma.hospitalTreatment.findMany({
      where: {
        hospital: { city: { contains: city, mode: 'insensitive' } },
        ...(category && { treatment: { category: { equals: category } } }),
      },
      include: {
        treatment: { select: { id: true, name: true, slug: true, category: true } },
      },
    });

    const billStats = await prisma.bill.groupBy({
      by: ['treatmentId'],
      where: {
        status: 'BILL_VERIFIED',
        hospital: { city: { contains: city, mode: 'insensitive' } },
      },
      _avg: { totalCost: true },
      _min: { totalCost: true },
      _max: { totalCost: true },
      _count: { id: true },
    });

    const billMap = new Map(billStats.map(b => [b.treatmentId, b]));

    const trends = await prisma.costTrend.findMany({
      where: { city: { contains: city, mode: 'insensitive' } },
      select: { treatmentId: true, avgCost: true, month: true, year: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const trendMap = new Map<string, typeof trends>();
    for (const t of trends) {
      const key = t.treatmentId;
      if (!trendMap.has(key)) trendMap.set(key, []);
      trendMap.get(key)!.push(t);
    }

    const seen = new Set<string>();
    const rows: Array<Record<string, unknown>> = [];

    for (const h of ht) {
      if (seen.has(h.treatmentId)) continue;
      seen.add(h.treatmentId);

      const bills = billMap.get(h.treatmentId) as { _avg: { totalCost: number | null }; _min: { totalCost: number | null }; _max: { totalCost: number | null }; _count: { id: number } } | undefined;
      const trendData = trendMap.get(h.treatmentId) || [];

      let trend12m: number | undefined;
      if (trendData.length >= 2) {
        const oldest = trendData[0].avgCost;
        const newest = trendData.at(-1)!.avgCost;
        trend12m = oldest > 0 ? ((newest - oldest) / oldest) * 100 : undefined;
      }

      rows.push({
        treatment: h.treatment,
        avg: bills?._avg.totalCost ?? h.avgCostEstimate ?? 0,
        min: bills?._min.totalCost ?? h.minCostEstimate ?? 0,
        max: bills?._max.totalCost ?? h.maxCostEstimate ?? 0,
        dataPoints: bills?._count.id ?? 0,
        trend: trend12m != null ? parseFloat(trend12m.toFixed(1)) : undefined,
      });
    }

    (rows as Array<{ avg: number }>).sort((a, b) => b.avg - a.avg);
    res.json({ data: rows });
  } catch (err) { next(err); }
});

// Detailed intelligence for a treatment in a city
router.get('/treatment/:treatmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { treatmentId } = req.params;
    const { city = 'Delhi' } = req.query as { city?: string };

    const [treatment, trends] = await Promise.all([
      prisma.treatment.findUnique({ where: { id: treatmentId } }),
      prisma.costTrend.findMany({
        where: { treatmentId, city: { contains: city, mode: 'insensitive' } },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
        take: 12,
      }),
    ]);

    if (!treatment) { res.status(404).json({ error: 'Treatment not found' }); return; }

    // FIX: Use only 'select' (not mixed include+select) to avoid Prisma error
    const bills = await prisma.bill.findMany({
      where: {
        treatmentId,
        status: 'BILL_VERIFIED',
        hospital: { city: { contains: city, mode: 'insensitive' } },
      },
      select: {
        totalCost: true,
        roomCharges: true,
        surgeryFee: true,
        implantCost: true,
        pharmacyCost: true,
        otherCharges: true,
        hospital: { select: { type: true } },
      },
    });

    const currentAvg = bills.length > 0
      ? bills.reduce((s, b) => s + b.totalCost, 0) / bills.length
      : 0;

    let trend12m = 0;
    if (trends.length >= 2) {
      const oldest = trends[0].avgCost;
      const newest = trends.at(-1)!.avgCost;
      trend12m = oldest > 0 ? parseFloat(((newest - oldest) / oldest * 100).toFixed(1)) : 0;
    }

    const govtBills = bills.filter(b => ['GOVERNMENT', 'TRUST', 'CHARITABLE'].includes(b.hospital.type));
    const privateBills = bills.filter(b => b.hospital.type === 'PRIVATE');
    const govtVsPrivate = govtBills.length > 0 && privateBills.length > 0 ? {
      govtAvg: Math.round(govtBills.reduce((s, b) => s + b.totalCost, 0) / govtBills.length),
      privateAvg: Math.round(privateBills.reduce((s, b) => s + b.totalCost, 0) / privateBills.length),
      saving: 0,
    } : null;
    if (govtVsPrivate) govtVsPrivate.saving = govtVsPrivate.privateAvg - govtVsPrivate.govtAvg;

    const allCities = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];
    const cityComparison = await Promise.all(
      allCities.map(async c => {
        const rows = await prisma.bill.aggregate({
          where: { treatmentId, status: 'BILL_VERIFIED', hospital: { city: { contains: c, mode: 'insensitive' } } },
          _avg: { totalCost: true }, _count: { id: true },
        });
        return rows._count.id > 0 ? { city: c, avg: Math.round(rows._avg.totalCost || 0), sampleSize: rows._count.id } : null;
      })
    );

    const hasCostBreakdown = bills.some(b => b.roomCharges || b.surgeryFee);
    const costBreakdown = hasCostBreakdown ? {
      roomCharges: Math.round(bills.reduce((s, b) => s + (b.roomCharges || 0), 0) / bills.length),
      surgeryFee: Math.round(bills.reduce((s, b) => s + (b.surgeryFee || 0), 0) / bills.length),
      implantCost: Math.round(bills.reduce((s, b) => s + (b.implantCost || 0), 0) / bills.length),
      pharmacyCost: Math.round(bills.reduce((s, b) => s + (b.pharmacyCost || 0), 0) / bills.length),
      other: Math.round(bills.reduce((s, b) => s + (b.otherCharges || 0), 0) / bills.length),
    } : null;

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    res.json({
      data: {
        treatment: { id: treatment.id, name: treatment.name, slug: treatment.slug, category: treatment.category },
        city,
        currentAvg: Math.round(currentAvg),
        trend12m,
        govtVsPrivate,
        cityComparison: cityComparison.filter(Boolean),
        costBreakdown,
        trends: trends.map(t => ({
          month: t.month, year: t.year,
          label: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
          avg: Math.round(t.avgCost), min: Math.round(t.minCost), max: Math.round(t.maxCost),
          sampleSize: t.sampleSize,
        })),
      }
    });
  } catch (err) { next(err); }
});

export default router;
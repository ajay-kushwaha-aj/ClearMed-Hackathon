/**
 * Cost Trends Engine — Phase 3
 * Aggregates verified bill data into monthly cost trend snapshots.
 * Run via: npm run trends:build  OR  triggered nightly by cron job.
 */

import prisma from './prisma';

export interface TrendPoint {
  month: number;
  year: number;
  label: string;       // "Jan 2024"
  avg: number;
  min: number;
  max: number;
  sampleSize: number;
  govtAvg?: number;
  privateAvg?: number;
}

export interface CostIntelligence {
  treatment: { id: string; name: string; slug: string; category: string };
  city: string;
  trends: TrendPoint[];
  currentAvg: number;
  trend12m: number;        // % change over 12 months (positive = more expensive)
  govtVsPrivate: { govtAvg: number; privateAvg: number; saving: number } | null;
  cityComparison: Array<{ city: string; avg: number; sampleSize: number }>;
  costBreakdown: { roomCharges: number; surgeryFee: number; implantCost: number; pharmacyCost: number; other: number } | null;
}

// ── Build/refresh trends for all treatment-city pairs ─────────────────────
export async function buildAllTrends() {
  console.log('[Trends] Building cost trend snapshots...');

  // Get all distinct treatment-city combinations with bills
  const pairs = await prisma.bill.groupBy({
    by: ['treatmentId', 'city'],
    where: { status: 'BILL_VERIFIED' },
    _count: { id: true },
    having: { id: { _count: { gte: 2 } } },
  });

  let built = 0;
  for (const pair of pairs) {
    await buildTrendsForPair(pair.treatmentId, pair.city);
    built++;
  }

  console.log(`[Trends] Built ${built} treatment-city pairs`);
  return built;
}

async function buildTrendsForPair(treatmentId: string, city: string) {
  // Get all verified bills for this pair, grouped by month
  const bills = await prisma.bill.findMany({
    where: { treatmentId, city: { contains: city, mode: 'insensitive' }, status: 'BILL_VERIFIED' },
    select: {
      totalCost: true, admissionDate: true, createdAt: true,
      hospital: { select: { type: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by month/year
  const monthMap = new Map<string, typeof bills>();
  for (const bill of bills) {
    const d = bill.admissionDate || bill.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(bill);
  }

  // Upsert each month snapshot
  for (const [key, monthBills] of monthMap.entries()) {
    if (monthBills.length < 1) continue;
    const [year, month] = key.split('-').map(Number);
    const costs = monthBills.map(b => b.totalCost);
    const govtBills = monthBills.filter(b => b.hospital.type === 'GOVERNMENT').map(b => b.totalCost);
    const pvtBills = monthBills.filter(b => b.hospital.type === 'PRIVATE').map(b => b.totalCost);

    await prisma.costTrend.upsert({
      where: { treatmentId_city_month_year: { treatmentId, city, month, year } },
      update: {
        avgCost: avg(costs),
        minCost: Math.min(...costs),
        maxCost: Math.max(...costs),
        sampleSize: costs.length,
        govtAvg: govtBills.length > 0 ? avg(govtBills) : null,
        privateAvg: pvtBills.length > 0 ? avg(pvtBills) : null,
      },
      create: {
        treatmentId, city, month, year,
        avgCost: avg(costs),
        minCost: Math.min(...costs),
        maxCost: Math.max(...costs),
        sampleSize: costs.length,
        govtAvg: govtBills.length > 0 ? avg(govtBills) : null,
        privateAvg: pvtBills.length > 0 ? avg(pvtBills) : null,
      },
    });
  }
}

// ── Get full cost intelligence for treatment+city ─────────────────────────
export async function getCostIntelligence(
  treatmentSlug: string,
  city: string
): Promise<CostIntelligence | null> {
  const treatment = await prisma.treatment.findUnique({ where: { slug: treatmentSlug } });
  if (!treatment) return null;

  // Last 12 months of trends
  const now = new Date();
  const trendRows = await prisma.costTrend.findMany({
    where: {
      treatmentId: treatment.id,
      city: { contains: city, mode: 'insensitive' },
      OR: [
        { year: now.getFullYear() },
        { year: now.getFullYear() - 1 },
      ],
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
    take: 12,
  });

  const trends: TrendPoint[] = trendRows.map(r => ({
    month: r.month, year: r.year,
    label: monthLabel(r.month, r.year),
    avg: Math.round(r.avgCost),
    min: Math.round(r.minCost),
    max: Math.round(r.maxCost),
    sampleSize: r.sampleSize,
    govtAvg: r.govtAvg ? Math.round(r.govtAvg) : undefined,
    privateAvg: r.privateAvg ? Math.round(r.privateAvg) : undefined,
  }));

  // Live stats from bills
  const [billStats, govtStats, pvtStats, cityComparison, breakdown] = await Promise.all([
    prisma.bill.aggregate({
      where: { treatmentId: treatment.id, city: { contains: city, mode: 'insensitive' }, status: 'BILL_VERIFIED' },
      _avg: { totalCost: true }, _min: { totalCost: true }, _max: { totalCost: true },
    }),
    prisma.bill.aggregate({
      where: { treatmentId: treatment.id, city: { contains: city, mode: 'insensitive' }, status: 'BILL_VERIFIED', hospital: { type: 'GOVERNMENT' } },
      _avg: { totalCost: true },
    }),
    prisma.bill.aggregate({
      where: { treatmentId: treatment.id, city: { contains: city, mode: 'insensitive' }, status: 'BILL_VERIFIED', hospital: { type: 'PRIVATE' } },
      _avg: { totalCost: true },
    }),
    // City comparison
    prisma.bill.groupBy({
      by: ['city'],
      where: { treatmentId: treatment.id, status: 'BILL_VERIFIED' },
      _avg: { totalCost: true },
      _count: { id: true },
      orderBy: { _avg: { totalCost: 'asc' } },
    }),
    // Cost breakdown from bills
    prisma.bill.aggregate({
      where: { treatmentId: treatment.id, city: { contains: city, mode: 'insensitive' }, status: 'BILL_VERIFIED' },
      _avg: { roomCharges: true, surgeryFee: true, implantCost: true, pharmacyCost: true, otherCharges: true },
    }),
  ]);

  // 12m trend calculation
  let trend12m = 0;
  if (trends.length >= 2) {
    const oldest = trends[0].avg;
    const newest = trends[trends.length - 1].avg;
    trend12m = oldest > 0 ? parseFloat(((newest - oldest) / oldest * 100).toFixed(1)) : 0;
  }

  // Govt vs private saving
  const govtAvgVal = govtStats._avg.totalCost;
  const pvtAvgVal = pvtStats._avg.totalCost;
  const govtVsPrivate = (govtAvgVal && pvtAvgVal)
    ? { govtAvg: Math.round(govtAvgVal), privateAvg: Math.round(pvtAvgVal), saving: Math.round(pvtAvgVal - govtAvgVal) }
    : null;

  const bdAvg = breakdown._avg;
  const hasBreakdown = Object.values(bdAvg).some(v => v != null && (v as number) > 0);

  return {
    treatment: { id: treatment.id, name: treatment.name, slug: treatment.slug, category: treatment.category },
    city,
    trends,
    currentAvg: Math.round(billStats._avg.totalCost || 0),
    trend12m,
    govtVsPrivate,
    cityComparison: cityComparison.map(c => ({
      city: c.city,
      avg: Math.round(c._avg.totalCost || 0),
      sampleSize: c._count.id,
    })),
    costBreakdown: hasBreakdown ? {
      roomCharges: Math.round(bdAvg.roomCharges || 0),
      surgeryFee: Math.round(bdAvg.surgeryFee || 0),
      implantCost: Math.round(bdAvg.implantCost || 0),
      pharmacyCost: Math.round(bdAvg.pharmacyCost || 0),
      other: Math.round(bdAvg.otherCharges || 0),
    } : null,
  };
}

const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthLabel = (m: number, y: number) => `${MONTHS[m - 1]} ${y}`;

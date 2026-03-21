import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { withCache, CacheKeys } from '../lib/cache';

const router = Router();

// Insurance coverage percentages by policy type (typical Indian health insurance)
const COVERAGE_RULES: Record<string, { roomLimit: number; surgeryPct: number; implantPct: number; prePostPct: number; waitingPeriod: number }> = {
  STAR_HEALTH:      { roomLimit: 0.01, surgeryPct: 0.90, implantPct: 0.80, prePostPct: 0.80, waitingPeriod: 2 },
  HDFC_ERGO:        { roomLimit: 0.01, surgeryPct: 0.85, implantPct: 0.80, prePostPct: 0.80, waitingPeriod: 2 },
  NIVA_BUPA:        { roomLimit: 0.015, surgeryPct: 0.90, implantPct: 0.85, prePostPct: 0.85, waitingPeriod: 3 },
  CARE_HEALTH:      { roomLimit: 0.01, surgeryPct: 0.85, implantPct: 0.75, prePostPct: 0.75, waitingPeriod: 3 },
  NEW_INDIA:        { roomLimit: 0.005, surgeryPct: 0.80, implantPct: 0.70, prePostPct: 0.70, waitingPeriod: 2 },
  BAJAJ_ALLIANZ:    { roomLimit: 0.01, surgeryPct: 0.85, implantPct: 0.80, prePostPct: 0.80, waitingPeriod: 2 },
  MAX_BUPA:         { roomLimit: 0.015, surgeryPct: 0.90, implantPct: 0.85, prePostPct: 0.85, waitingPeriod: 3 },
  ICICI_LOMBARD:    { roomLimit: 0.01, surgeryPct: 0.85, implantPct: 0.80, prePostPct: 0.80, waitingPeriod: 4 },
  APOLLO_MUNICH:    { roomLimit: 0.015, surgeryPct: 0.90, implantPct: 0.85, prePostPct: 0.85, waitingPeriod: 2 },
  RELIANCE_HEALTH:  { roomLimit: 0.01, surgeryPct: 0.80, implantPct: 0.75, prePostPct: 0.75, waitingPeriod: 4 },
};

const INSURER_NAMES: Record<string, string> = {
  STAR_HEALTH: 'Star Health', HDFC_ERGO: 'HDFC Ergo', NIVA_BUPA: 'Niva Bupa',
  CARE_HEALTH: 'Care Health', NEW_INDIA: 'New India Assurance', BAJAJ_ALLIANZ: 'Bajaj Allianz',
  MAX_BUPA: 'Max Bupa', ICICI_LOMBARD: 'ICICI Lombard', APOLLO_MUNICH: 'Apollo Munich',
  RELIANCE_HEALTH: 'Reliance Health',
};

// ── Hospitals accepting a specific insurer ────────────────────────────────
router.get('/hospitals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { insurer, city, treatmentSlug } = req.query as Record<string, string>;

    const hospitals = await prisma.hospital.findMany({
      where: {
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(insurer ? { insurances: { some: { insurer: insurer as any } } } : {}),
        ...(treatmentSlug ? { hospitalTreatments: { some: { treatment: { slug: treatmentSlug }, isAvailable: true } } } : {}),
      },
      include: {
        insurances: { select: { insurer: true, isCashless: true } },
        hospitalTreatments: treatmentSlug ? {
          where: { treatment: { slug: treatmentSlug } },
          include: { treatment: { select: { name: true } } },
        } : { take: 0 },
        _count: { select: { doctors: true, bills: true } },
      },
      orderBy: { rating: 'desc' },
      take: 20,
    });

    res.json({
      data: hospitals.map(h => ({
        ...h,
        cashlessInsurers: h.insurances.filter(i => i.isCashless).map(i => ({ id: i.insurer, name: INSURER_NAMES[i.insurer] || i.insurer })),
      })),
    });
  } catch (err) { next(err); }
});

// ── Policy Coverage Estimator ─────────────────────────────────────────────
router.post('/estimate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      insurer: z.string(),
      sumInsured: z.number().min(100000),
      treatmentId: z.string().optional(),
      hospitalId: z.string().optional(),
      estimatedCost: z.number().optional(),
    });
    const { insurer, sumInsured, treatmentId, hospitalId, estimatedCost } = schema.parse(req.body);

    const rules = COVERAGE_RULES[insurer.toUpperCase()];
    if (!rules) { res.status(400).json({ error: 'Insurer not supported' }); return; }

    // Get cost from DB if not provided
    let cost = estimatedCost;
    if (!cost && treatmentId && hospitalId) {
      const ht = await prisma.hospitalTreatment.findFirst({
        where: { hospitalId, treatmentId },
        select: { avgCostEstimate: true },
      });
      cost = ht?.avgCostEstimate || undefined;
    }

    if (!cost) {
      res.status(400).json({ error: 'Could not determine treatment cost. Please provide estimatedCost.' });
      return;
    }

    // Clamp room limit per sum insured
    const maxDailyRoom = sumInsured * rules.roomLimit;
    const stayDays = 5; // average
    const roomCost = Math.min(cost * 0.20, maxDailyRoom * stayDays);
    const surgeryCovered = (cost * 0.50) * rules.surgeryPct;
    const implantCovered = (cost * 0.20) * rules.implantPct;
    const prePostCovered = (cost * 0.10) * rules.prePostPct;
    const totalCovered = Math.min(roomCost + surgeryCovered + implantCovered + prePostCovered, sumInsured);
    const outOfPocket = Math.max(0, cost - totalCovered);
    const coveragePct = (totalCovered / cost) * 100;

    res.json({
      data: {
        insurer: INSURER_NAMES[insurer.toUpperCase()] || insurer,
        sumInsured,
        estimatedTotalCost: Math.round(cost),
        estimatedCovered: Math.round(totalCovered),
        estimatedOutOfPocket: Math.round(outOfPocket),
        coveragePct: Math.round(coveragePct),
        breakdown: {
          roomCharges: { covered: Math.round(roomCost), note: `Max ₹${Math.round(maxDailyRoom)}/day` },
          surgeryFee: { covered: Math.round(surgeryCovered), pct: Math.round(rules.surgeryPct * 100) },
          implants: { covered: Math.round(implantCovered), pct: Math.round(rules.implantPct * 100) },
          prePostHospital: { covered: Math.round(prePostCovered), pct: Math.round(rules.prePostPct * 100) },
        },
        waitingPeriodYears: rules.waitingPeriod,
        disclaimer: 'This is an estimate only. Actual coverage depends on your specific policy terms, co-pay clauses, and TPA approval. Contact your insurer for exact coverage.',
      },
    });
  } catch (err) { next(err); }
});

// ── Cashless hospital finder ───────────────────────────────────────────────
router.get('/cashless', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { insurer, city } = req.query as Record<string, string>;
    if (!insurer) { res.status(400).json({ error: 'insurer required' }); return; }

    const hospitals = await prisma.hospital.findMany({
      where: {
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        insurances: { some: { insurer: insurer as any, isCashless: true } },
      },
      select: {
        id: true, name: true, slug: true, city: true, type: true,
        naabhStatus: true, rating: true, address: true, phone: true,
        insurances: { where: { insurer: insurer as any }, select: { isCashless: true, tpaName: true } },
        _count: { select: { doctors: true } },
      },
      orderBy: { rating: 'desc' },
    });

    res.json({
      data: hospitals,
      insurer: INSURER_NAMES[insurer.toUpperCase()] || insurer,
      total: hospitals.length,
    });
  } catch (err) { next(err); }
});

// ── List all supported insurers ────────────────────────────────────────────
router.get('/insurers', async (req: Request, res: Response, next: NextFunction) => {
  const insurers = Object.entries(INSURER_NAMES).map(([id, name]) => ({
    id, name,
    logo: `/insurers/${id.toLowerCase()}.png`,
    waitingPeriod: COVERAGE_RULES[id]?.waitingPeriod,
  }));
  res.json({ data: insurers });
});

// ── Seed insurance data for hospitals ─────────────────────────────────────
router.post('/seed-demo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({ select: { id: true, type: true } });
    const allInsurers = Object.keys(INSURER_NAMES) as any[];
    let created = 0;

    for (const hospital of hospitals) {
      // Private hospitals accept more insurers; govt hospitals accept fewer
      const count = hospital.type === 'PRIVATE' ? 5 : hospital.type === 'GOVERNMENT' ? 2 : 3;
      const selected = allInsurers.sort(() => Math.random() - 0.5).slice(0, count);
      for (const insurer of selected) {
        await prisma.hospitalInsurance.upsert({
          where: { hospitalId_insurer: { hospitalId: hospital.id, insurer } },
          create: { hospitalId: hospital.id, insurer, isCashless: Math.random() > 0.2 },
          update: {},
        });
        created++;
      }
    }
    res.json({ message: `Seeded ${created} insurance records` });
  } catch (err) { next(err); }
});

export { INSURER_NAMES };
export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { awardPoints } from '../lib/pointsEngine';

const router = Router();

// In-memory rate limiting map: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + 24 * 60 * 60 * 1000 };
    rateLimitMap.set(ip, record);
    return true;
  }
  if (record.count >= 5) return false;
  record.count++;
  return true;
}

// ── Submit review ─────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      hospitalId: z.string(),
      treatmentId: z.string(),
      userId: z.string().optional(),
      overallScore: z.number().min(1).max(5),
      doctorScore: z.number().min(1).max(5).optional(),
      facilityScore: z.number().min(1).max(5).optional(),
      careScore: z.number().min(1).max(5).optional(),
      costTransparency: z.number().min(1).max(5).optional(),
      recoveryDays: z.number().int().positive().optional(),
      complicationFlag: z.boolean().default(false),
      reviewText: z.string().min(20).max(2000).optional(),
      billId: z.string().optional(),  // links review to a verified bill
    });

    const data = schema.parse(req.body);

    if (!data.userId) {
      res.status(401).json({ error: 'You must be logged in to submit a review.' });
      return;
    }

    // 1. Rate Limiting Check
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Too many reviews submitted today. Please try again tomorrow.' });
      return;
    }

    // 2. Duplicate detection
    if (data.reviewText) {
      const duplicate = await prisma.patientFeedback.findFirst({
        where: { reviewText: data.reviewText }
      });
      if (duplicate) {
        res.status(400).json({ error: 'Duplicate review detected. This review has already been submitted.' });
        return;
      }
    }

    // 3. One Review per Treatment per User
    const existing = await prisma.patientFeedback.findFirst({
      where: { hospitalId: data.hospitalId, treatmentId: data.treatmentId, userId: data.userId }
    });
    if (existing) {
      res.status(429).json({ error: 'You have already reviewed this treatment at this hospital.' });
      return;
    }

    // Check if bill is verified (for Verified Patient badge)
    let isBillLinked = false;
    if (data.billId) {
      const bill = await prisma.bill.findUnique({
        where: { id: data.billId },
        select: { status: true, uploadedBy: true },
      });
      isBillLinked = bill?.status === 'BILL_VERIFIED' && bill?.uploadedBy === data.userId;
    }

    const review = await prisma.patientFeedback.create({
      data: {
        hospitalId: data.hospitalId,
        treatmentId: data.treatmentId,
        userId: data.userId,
        overallScore: data.overallScore,
        doctorScore: data.doctorScore,
        facilityScore: data.facilityScore,
        careScore: data.careScore,
        costTransparency: data.costTransparency,
        recoveryDays: data.recoveryDays,
        complicationFlag: data.complicationFlag,
        reviewText: data.reviewText,
        isBillLinked,
        isVerified: isBillLinked, // auto-verify if bill-linked
      },
      include: {
        hospital: { select: { name: true } },
        treatment: { select: { name: true } },
      },
    });

    // Award points for review
    await awardPoints(data.userId, 'REVIEW_POSTED', review.id).catch(() => {});

    res.status(201).json({
      data: review,
      message: isBillLinked
        ? 'Review posted with Verified Patient badge!'
        : 'Review posted. It will appear once moderated.',
    });
  } catch (err) { next(err); }
});

// ── Get reviews for hospital+treatment ────────────────────────────────────
router.get('/hospital/:hospitalId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { treatmentId, sort = 'helpful', page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orderBy = sort === 'helpful'
      ? [{ helpfulVotes: 'desc' as const }, { createdAt: 'desc' as const }]
      : sort === 'rating_high'
      ? [{ overallScore: 'desc' as const }]
      : sort === 'rating_low'
      ? [{ overallScore: 'asc' as const }]
      : [{ createdAt: 'desc' as const }];

    const where: Record<string, unknown> = {
      hospitalId: req.params.hospitalId,
      ...(treatmentId ? { treatmentId } : {}),
    };

    const [reviews, total, aggregates] = await Promise.all([
      prisma.patientFeedback.findMany({
        where,
        include: {
          treatment: { select: { name: true, slug: true } },
          user: { select: { name: true, city: true } },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.patientFeedback.count({ where }),
      prisma.patientFeedback.aggregate({
        where,
        _avg: { overallScore: true, doctorScore: true, facilityScore: true, careScore: true, costTransparency: true },
        _count: { id: true },
      }),
      prisma.patientFeedback.findMany({
        where,
        select: { overallScore: true, isBillLinked: true, userId: true }
      })
    ]);

    // Calculate advanced weighted score
    let vSum = 0, vCount = 0;
    let sSum = 0, sCount = 0;

    const allScores = aggregates[1] || aggregates; // From the 4th promised array
    allScores.forEach(r => {
      if (r.isBillLinked) { vSum += r.overallScore; vCount++; }
      else if (r.userId) { sSum += r.overallScore; sCount++; }
    });

    const vAvg = vCount > 0 ? vSum / vCount : 0;
    const sAvg = sCount > 0 ? sSum / sCount : 0;

    let totalWeight = 0;
    let weightedScore = 0;
    if (vCount > 0) { totalWeight += 0.7; weightedScore += vAvg * 0.7; }
    if (sCount > 0) { totalWeight += 0.3; weightedScore += sAvg * 0.3; }

    const finalRating = totalWeight > 0 ? (weightedScore / totalWeight) : 0;

    // Score distribution
    const distribution = await prisma.patientFeedback.groupBy({
      by: ['overallScore' as const],
      where,
      _count: { id: true },
    });

    res.json({
      data: reviews,
      meta: {
        total,
        verifiedCount: vCount,
        finalRating: finalRating > 0 ? finalRating : (aggregates._avg.overallScore || 0),
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        averages: aggregates._avg,
        distribution: distribution.reduce((acc: Record<number, number>, d) => {
          acc[Math.round(d.overallScore)] = d._count.id;
          return acc;
        }, {}),
      },
    });
  } catch (err) { next(err); }
});

// ── Vote review as helpful ─────────────────────────────────────────────────
router.post('/:id/helpful', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.patientFeedback.update({
      where: { id: req.params.id },
      data: { helpfulVotes: { increment: 1 } },
    });
    res.json({ message: 'Thanks for the feedback!' });
  } catch (err) { next(err); }
});

export default router;

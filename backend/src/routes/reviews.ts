import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { awardPoints } from '../lib/pointsEngine';

const router = Router();

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
    if (data.userId) {
      await awardPoints(data.userId, 'REVIEW_POSTED', review.id).catch(() => {});
    }

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
    ]);

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

/**
 * Gamification / Community API — Phase 3
 */
import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { POINTS, BADGES, awardPoints } from '../lib/pointsEngine';

const router = Router();

// Global leaderboard
router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '20', city } = req.query as { limit?: string; city?: string };

    const users = await prisma.user.findMany({
      where: { points: { gt: 0 }, ...(city && { city: { contains: city, mode: 'insensitive' } as never }) },
      orderBy: { points: 'desc' },
      take: parseInt(limit),
      select: {
        id: true, name: true, points: true,
        _count: { select: { bills: true, feedback: true } },
      },
    });

    const leaderboard = users.map((u, i) => {
      // Assign badge based on points
      const badge = [...BADGES].reverse().find(b => u.points >= b.minPoints);
      return {
        rank: i + 1,
        id: u.id,
        name: u.name || `Patient ${i + 1}`,
        totalPoints: u.points,
        billsContributed: u._count.bills,
        reviewsPosted: u._count.feedback,
        badge: badge ? { id: badge.id, label: badge.label, icon: badge.icon } : undefined,
      };
    });

    res.json({ data: leaderboard });
  } catch (err) { next(err); }
});

// Points config (for display)
router.get('/points-config', async (_req: Request, res: Response) => {
  res.json({ data: { points: POINTS, badges: BADGES } });
});

// Get user stats
router.get('/user/:userId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        _count: { select: { bills: true, feedback: true } },
        bills: { where: { status: 'BILL_VERIFIED' }, select: { id: true } },
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const badge = [...BADGES].reverse().find(b => user.points >= b.minPoints);
    const nextBadge = BADGES.find(b => user.points < b.minPoints);

    res.json({
      data: {
        id: user.id, name: user.name, points: user.points,
        billsCount: user._count.bills,
        verifiedBillsCount: user.bills.length,
        reviewsCount: user._count.feedback,
        currentBadge: badge,
        nextBadge: nextBadge ? { ...nextBadge, pointsNeeded: nextBadge.minPoints - user.points } : null,
      }
    });
  } catch (err) { next(err); }
});

// Award points (called internally after bill upload/review)
router.post('/award', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, activity, refId } = req.body;
    const result = await awardPoints(userId, activity, refId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// Community stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalBills, totalReviews, totalPoints] = await Promise.all([
      prisma.user.count({ where: { points: { gt: 0 } } }),
      prisma.bill.count({ where: { status: 'BILL_VERIFIED' } }),
      prisma.patientFeedback.count(),
      prisma.user.aggregate({ _sum: { points: true } }),
    ]);
    res.json({ data: { totalUsers, totalBills, totalReviews, totalPointsAwarded: totalPoints._sum.points || 0 } });
  } catch (err) { next(err); }
});

export default router;

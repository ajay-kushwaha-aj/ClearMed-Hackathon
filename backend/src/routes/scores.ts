import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { calculateClearMedScore, upsertClearMedScore, recalculateAllScores } from '../lib/scoreEngine';

const router = Router();

// Get score for a hospital-treatment pair
router.get('/:hospitalId/:treatmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId, treatmentId } = req.params;

    // Try cached score first
    const cached = await prisma.clearMedScore.findUnique({
      where: { hospitalId_treatmentId: { hospitalId, treatmentId } },
    });

    // Recalculate if stale (> 24h) or missing
    const isStale = !cached || (Date.now() - cached.lastCalculated.getTime()) > 24 * 60 * 60 * 1000;

    if (isStale) {
      await upsertClearMedScore(hospitalId, treatmentId);
      const fresh = await prisma.clearMedScore.findUnique({
        where: { hospitalId_treatmentId: { hospitalId, treatmentId } },
      });
      res.json({ data: fresh });
      return;
    }

    res.json({ data: cached });
  } catch (err) { next(err); }
});

// Get all scores for a hospital
router.get('/hospital/:hospitalId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scores = await prisma.clearMedScore.findMany({
      where: { hospitalId: req.params.hospitalId },
      include: { treatment: { select: { name: true, slug: true, category: true } } },
      orderBy: { overallScore: 'desc' },
    });
    res.json({ data: scores });
  } catch (err) { next(err); }
});

// Get leaderboard for a treatment in a city
router.get('/leaderboard/:treatmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { treatmentId } = req.params;
    const { city, limit = '10' } = req.query as { city?: string; limit?: string };

    const scores = await prisma.clearMedScore.findMany({
      where: {
        treatmentId,
        isReliable: true,
        hospital: city ? { city: { contains: city, mode: 'insensitive' } } : undefined,
      },
      include: {
        hospital: {
          select: { id: true, name: true, slug: true, city: true, type: true, naabhStatus: true, rating: true },
        },
        treatment: { select: { name: true, slug: true } },
      },
      orderBy: { overallScore: 'desc' },
      take: parseInt(limit),
    });

    res.json({ data: scores });
  } catch (err) { next(err); }
});

// Admin: recalculate all scores
router.post('/recalculate-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production: add admin auth middleware
    res.json({ message: 'Score recalculation started in background...' });
    // Run in background
    recalculateAllScores().then(result => {
      console.log('[ScoreEngine] Batch recalculation done:', result);
    });
  } catch (err) { next(err); }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Autocomplete search
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = '10' } = req.query as { q?: string; limit?: string };
    if (!q || q.length < 1) {
      res.json({ data: [] });
      return;
    }
    const treatments = await prisma.treatment.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { specialization: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    });
    res.json({ data: treatments });
  } catch (err) { next(err); }
});

// All treatments grouped by category
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const treatments = await prisma.treatment.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    // Group by category
    const grouped = treatments.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, typeof treatments>);
    res.json({ data: grouped });
  } catch (err) { next(err); }
});

// Single treatment by slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { slug: req.params.slug },
      include: {
        hospitalTreatments: {
          include: { hospital: { select: { id: true, name: true, slug: true, city: true, type: true, naabhStatus: true, rating: true } } },
          where: { isAvailable: true },
          orderBy: { avgCostEstimate: 'asc' },
        },
      }
    });
    if (!treatment) { res.status(404).json({ error: 'Treatment not found' }); return; }
    res.json({ data: treatment });
  } catch (err) { next(err); }
});

export default router;

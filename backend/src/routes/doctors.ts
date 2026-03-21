import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialization, city, hospitalId, limit = '20' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
    if (hospitalId) where.hospitalId = hospitalId;
    if (city) where.hospital = { city: { contains: city, mode: 'insensitive' } };

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        hospital: { select: { id: true, name: true, slug: true, city: true } }
      },
      orderBy: [{ rating: 'desc' }, { experienceYears: 'desc' }],
      take: parseInt(limit),
    });
    res.json({ data: doctors });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: { hospital: true }
    });
    if (!doctor) { res.status(404).json({ error: 'Doctor not found' }); return; }
    res.json({ data: doctor });
  } catch (err) { next(err); }
});

export default router;

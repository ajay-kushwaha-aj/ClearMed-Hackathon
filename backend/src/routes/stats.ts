import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [hospitals, treatments, bills, doctors] = await Promise.all([
      prisma.hospital.count(),
      prisma.treatment.count(),
      prisma.bill.count({ where: { status: 'BILL_VERIFIED' } }),
      prisma.doctor.count(),
    ]);
    res.json({ data: { hospitals, treatments, bills, doctors } });
  } catch (err) { next(err); }
});

export default router;

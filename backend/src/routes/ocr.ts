import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import prisma from '../lib/prisma';
import { processOcrInBackground } from '../lib/ocr';
import { z } from 'zod';

const router = Router();

// Get OCR review queue
router.get('/queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'BILL_OCR_REVIEW', page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where: { status: status as 'BILL_PENDING' | 'BILL_OCR_REVIEW' | 'BILL_VERIFIED' | 'BILL_REJECTED' },
        include: {
          hospital: { select: { id: true, name: true, city: true } },
          treatment: { select: { id: true, name: true } },
          ocrResult: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.bill.count({ where: { status: status as 'BILL_PENDING' | 'BILL_OCR_REVIEW' | 'BILL_VERIFIED' | 'BILL_REJECTED' } }),
    ]);

    res.json({ data: bills, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

// Get single bill with OCR data
router.get('/bill/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: {
        hospital: true,
        treatment: true,
        ocrResult: true,
      },
    });
    if (!bill) { res.status(404).json({ error: 'Bill not found' }); return; }
    res.json({ data: bill });
  } catch (err) { next(err); }
});

// Approve bill (mark as VERIFIED and trigger score recalculation)
router.patch('/bill/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      totalCost: z.coerce.number().optional(),
      roomCharges: z.coerce.number().optional(),
      implantCost: z.coerce.number().optional(),
      surgeryFee: z.coerce.number().optional(),
      pharmacyCost: z.coerce.number().optional(),
      otherCharges: z.coerce.number().optional(),
      stayDays: z.coerce.number().optional(),
    });
    const updates = schema.parse(req.body);

    const bill = await prisma.bill.update({
      where: { id: req.params.id },
      data: { ...updates, status: 'BILL_VERIFIED' },
    });

    // Trigger score recalculation in background
    const { upsertClearMedScore } = await import('../lib/scoreEngine');
    upsertClearMedScore(bill.hospitalId, bill.treatmentId).catch(console.error);

    res.json({ data: bill, message: 'Bill verified and score recalculation triggered.' });
  } catch (err) { next(err); }
});

// Reject bill
router.patch('/bill/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const bill = await prisma.bill.update({
      where: { id: req.params.id },
      data: { status: 'BILL_REJECTED', notes: reason },
    });
    res.json({ data: bill });
  } catch (err) { next(err); }
});

// Manually trigger OCR for a pending bill
router.post('/bill/:id/reprocess', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await prisma.bill.findUnique({ where: { id: req.params.id } });
    if (!bill) { res.status(404).json({ error: 'Bill not found' }); return; }
    if (!bill.fileUrl) { res.status(400).json({ error: 'No file attached to this bill' }); return; }

    const filePath = path.join(__dirname, '..', '..', bill.fileUrl.replace('/uploads/', 'uploads/'));

    // Start OCR in background
    res.json({ message: 'OCR reprocessing started' });
    processOcrInBackground(bill.id, filePath, prisma);
  } catch (err) { next(err); }
});

// Admin stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pending, ocrReview, verified, rejected, totalScores] = await Promise.all([
      prisma.bill.count({ where: { status: 'BILL_PENDING' } }),
      prisma.bill.count({ where: { status: 'BILL_OCR_REVIEW' } }),
      prisma.bill.count({ where: { status: 'BILL_VERIFIED' } }),
      prisma.bill.count({ where: { status: 'BILL_REJECTED' } }),
      prisma.clearMedScore.count({ where: { isReliable: true } }),
    ]);
    res.json({ data: { pending, ocrReview, verified, rejected, totalScores } });
  } catch (err) { next(err); }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { processOcrInBackground } from '../lib/ocr';
import { awardPoints } from '../lib/pointsEngine';

const router = Router();

// Configure multer
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bill_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG, WEBP files are accepted'));
  }
});

// Upload bill
router.post('/upload', upload.single('bill'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      hospitalId: z.string(),
      treatmentId: z.string(),
      city: z.string(),
      totalCost: z.coerce.number().positive(),
      roomCharges: z.coerce.number().optional(),
      implantCost: z.coerce.number().optional(),
      surgeryFee: z.coerce.number().optional(),
      pharmacyCost: z.coerce.number().optional(),
      otherCharges: z.coerce.number().optional(),
      admissionDate: z.string().optional(),
      dischargeDate: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const bill = await prisma.bill.create({
      data: {
        hospitalId: data.hospitalId,
        treatmentId: data.treatmentId,
        city: data.city,
        totalCost: data.totalCost,
        roomCharges: data.roomCharges,
        implantCost: data.implantCost,
        surgeryFee: data.surgeryFee,
        pharmacyCost: data.pharmacyCost,
        otherCharges: data.otherCharges,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        fileUrl,
        status: 'BILL_PENDING',
      }
    });

    // Create OCR result entry and trigger background processing if file was uploaded
    if (req.file) {
      await prisma.ocrResult.create({
        data: { billId: bill.id, status: 'QUEUED' }
      });
      // Non-blocking: process OCR in background
      processOcrInBackground(bill.id, req.file.path, prisma);
    }

    // Award points (non-blocking)
    let pointsEarned = 0;
    const userId = req.body.userId || bill.uploadedBy;
    if (userId) {
      const result = await awardPoints(userId, 'BILL_UPLOAD', bill.id).catch(() => null);
      if (result) pointsEarned += result.pointsEarned;
      if (req.file) {
        const ocrResult = await awardPoints(userId, 'OCR_BILL', bill.id).catch(() => null);
        if (ocrResult) pointsEarned += ocrResult.pointsEarned;
      }
    }

    res.status(201).json({
      data: bill,
      pointsEarned,
      message: req.file
        ? `Bill uploaded! OCR processing started. ${pointsEarned > 0 ? `+${pointsEarned} ClearMed points earned!` : ''}`
        : `Bill submitted! ${pointsEarned > 0 ? `+${pointsEarned} ClearMed points earned!` : ''} Verification within 24–48 hours.`,
    });
  } catch (err) {
    // Clean up uploaded file if DB save fails
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
});

// Get bills for a hospital (admin/public stats only - no PII)
router.get('/hospital/:hospitalId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId } = req.params;
    const { treatmentId } = req.query as { treatmentId?: string };

    const where: Record<string, unknown> = { hospitalId, status: 'BILL_VERIFIED' };
    if (treatmentId) where.treatmentId = treatmentId;

    const stats = await prisma.bill.aggregate({
      where,
      _avg: { totalCost: true, roomCharges: true, implantCost: true, surgeryFee: true, pharmacyCost: true, stayDays: true },
      _min: { totalCost: true },
      _max: { totalCost: true },
      _count: { id: true },
    });

    res.json({ data: stats });
  } catch (err) { next(err); }
});

export default router;

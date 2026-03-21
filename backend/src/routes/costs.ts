import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Cost intelligence for a treatment in a city
router.get('/:treatmentId/:city', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { treatmentId, city } = req.params;

    const [treatment, billStats, htStats] = await Promise.all([
      prisma.treatment.findFirst({
        where: { OR: [{ id: treatmentId }, { slug: treatmentId }] }
      }),
      prisma.bill.aggregate({
        where: {
          treatment: { OR: [{ id: treatmentId }, { slug: treatmentId }] },
          city: { contains: city, mode: 'insensitive' },
          status: 'BILL_VERIFIED',
        },
        _avg: { totalCost: true, roomCharges: true, implantCost: true, surgeryFee: true, pharmacyCost: true, stayDays: true },
        _min: { totalCost: true },
        _max: { totalCost: true },
        _count: { id: true },
      }),
      // Estimate-based fallback from HospitalTreatments
      prisma.hospitalTreatment.aggregate({
        where: {
          treatment: { OR: [{ id: treatmentId }, { slug: treatmentId }] },
          hospital: { city: { contains: city, mode: 'insensitive' } },
          isAvailable: true,
        },
        _avg: { avgCostEstimate: true, minCostEstimate: true, maxCostEstimate: true },
        _min: { minCostEstimate: true },
        _max: { maxCostEstimate: true },
        _count: { id: true },
      }),
    ]);

    if (!treatment) { res.status(404).json({ error: 'Treatment not found' }); return; }

    const useRealBills = billStats._count.id >= 3;

    res.json({
      data: {
        treatment,
        city,
        costs: {
          avg: Math.round(useRealBills ? billStats._avg.totalCost || 0 : htStats._avg.avgCostEstimate || 0),
          min: Math.round(useRealBills ? billStats._min.totalCost || 0 : htStats._min.minCostEstimate || 0),
          max: Math.round(useRealBills ? billStats._max.totalCost || 0 : htStats._max.maxCostEstimate || 0),
          avgRoomCharges: Math.round(billStats._avg.roomCharges || 0),
          avgImplantCost: Math.round(billStats._avg.implantCost || 0),
          avgSurgeryFee: Math.round(billStats._avg.surgeryFee || 0),
          avgPharmacyCost: Math.round(billStats._avg.pharmacyCost || 0),
          avgStayDays: Math.round(billStats._avg.stayDays || treatment.avgDuration || 0),
          dataPoints: billStats._count.id,
          dataSource: useRealBills ? 'real_bills' : 'estimates',
          hospitalsCount: htStats._count.id,
        }
      }
    });
  } catch (err) { next(err); }
});

export default router;

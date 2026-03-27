import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// ─── List hospitals with filters & pagination ──────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      treatment: z.string().optional(),
      department: z.string().optional(),
      search: z.string().optional(),
      city: z.string().optional(),
      type: z.enum(['GOVERNMENT', 'PRIVATE', 'TRUST', 'CHARITABLE']).optional(),
      minCost: z.coerce.number().optional(),
      maxCost: z.coerce.number().optional(),
      nabh: z.enum(['true', 'false']).optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      sort: z.enum(['rating', 'cost_asc', 'cost_desc', 'name']).default('rating'),
    });

    const params = schema.parse(req.query);
    const skip = (params.page - 1) * params.limit;

    // >> PERFORMANCE OPTIMIZATION 1: Two-Step Lookup <<
    // Resolve the Treatment ID first so we don't have to use slow text-matching on large joined tables.
    let targetTreatmentId: string | undefined;
    let fallbackDepartment: string | undefined;

    if (params.treatment) {
      const foundTreatment = await prisma.treatment.findFirst({
        where: {
          OR: [
            { slug: params.treatment },
            { name: { contains: params.treatment, mode: 'insensitive' } }
          ]
        }
      });

      if (!foundTreatment) {
        // If the treatment doesn't exist, don't even bother querying the database. Return empty instantly.
        res.json({ data: [], meta: { total: 0, page: params.page, limit: params.limit, totalPages: 0 } });
        return;
      }
      targetTreatmentId = foundTreatment.id;

      // Check if any hospitals actually have this treatment mapped
      const mappedCount = await prisma.hospitalTreatment.count({
        where: { treatmentId: foundTreatment.id, isAvailable: true }
      });

      // If no hospitals have this treatment mapped, fallback to department-based search
      // using the treatment's category (e.g., "Gynaecology") and specialization (e.g., "Gynaecologist")
      if (mappedCount === 0) {
        fallbackDepartment = foundTreatment.category || foundTreatment.specialization || undefined;
        targetTreatmentId = undefined; // Clear treatment ID so we use department instead
      }
    }

    const where: Record<string, unknown> = {};
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.type) where.type = params.type;
    if (params.nabh !== undefined) where.naabhStatus = params.nabh === 'true';
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' };

    const specialtyFilters: any[] = [];

    // Now we filter using the exact ID (which is indexed and extremely fast)
    if (targetTreatmentId) {
      specialtyFilters.push({
        hospitalTreatments: {
          some: {
            isAvailable: true,
            treatmentId: targetTreatmentId,
            ...(params.minCost || params.maxCost ? {
              avgCostEstimate: {
                ...(params.minCost ? { gte: params.minCost } : {}),
                ...(params.maxCost ? { lte: params.maxCost } : {}),
              }
            } : {})
          }
        }
      });
    }

    // Department filter — either explicit or from treatment category fallback
    const deptSearch = params.department || fallbackDepartment;
    if (deptSearch) {
      specialtyFilters.push({
        doctors: {
          some: {
            specialization: { contains: deptSearch, mode: 'insensitive' }
          }
        }
      });
    }

    if (specialtyFilters.length > 0) {
      where.OR = specialtyFilters;
    }

    const orderBy: Record<string, unknown>[] = params.sort === 'rating'
      ? [{ rating: 'desc' }]
      : params.sort === 'name'
        ? [{ name: 'asc' }]
        : [{ rating: 'desc' }];

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        include: {
          hospitalTreatments: {
            include: { treatment: true },
            // Fast indexed lookup instead of slow string matching
            where: targetTreatmentId ? {
              isAvailable: true,
              treatmentId: targetTreatmentId
            } : { isAvailable: true },
            take: 5,
          },
          doctors: {
            select: { id: true, name: true, specialization: true, experienceYears: true, rating: true },
            take: 3,
            orderBy: { experienceYears: 'desc' },
          },
          _count: {
            select: { bills: true, feedback: true, doctors: true }
          }
        },
        orderBy,
        skip,
        take: params.limit,
      }),
      prisma.hospital.count({ where }),
    ]);

    // >> PERFORMANCE OPTIMIZATION 2: Fix N+1 Query Issue <<
    const enriched = await Promise.all(hospitals.map(async (h) => {
      let costData = null;
      if (targetTreatmentId) {
        const costs = await prisma.bill.aggregate({
          where: {
            hospitalId: h.id,
            status: 'BILL_VERIFIED',
            // Fast indexed lookup here too!
            treatmentId: targetTreatmentId
          },
          _avg: { totalCost: true },
          _min: { totalCost: true },
          _max: { totalCost: true },
          _count: { id: true },
        });
        if (costs._count.id > 0) costData = costs;
      }

      const ht = h.hospitalTreatments[0];
      return {
        ...h,
        costSummary: costData ? {
          avg: Math.round(costData._avg.totalCost || 0),
          min: Math.round(costData._min.totalCost || 0),
          max: Math.round(costData._max.totalCost || 0),
          dataPoints: costData._count.id,
          source: 'real_bills',
        } : ht ? {
          avg: Math.round(ht.avgCostEstimate || 0),
          min: Math.round(ht.minCostEstimate || 0),
          max: Math.round(ht.maxCostEstimate || 0),
          dataPoints: 0,
          source: 'estimated',
        } : null,
      };
    }));

    // Sort by cost if requested
    let sorted = enriched;
    if (params.sort === 'cost_asc') {
      sorted = enriched.sort((a, b) => (a.costSummary?.avg || 999999999) - (b.costSummary?.avg || 999999999));
    } else if (params.sort === 'cost_desc') {
      sorted = enriched.sort((a, b) => (b.costSummary?.avg || 0) - (a.costSummary?.avg || 0));
    }

    res.json({
      data: sorted,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── Get single hospital ──────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      include: {
        doctors: {
          orderBy: { experienceYears: 'desc' }
        },
        hospitalTreatments: {
          include: { treatment: true },
          where: { isAvailable: true },
          orderBy: { avgCostEstimate: 'asc' },
        },
        feedback: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { isVerified: true },
        },
        _count: {
          select: { bills: true, feedback: true, doctors: true }
        }
      }
    });

    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    const billStats = await prisma.bill.groupBy({
      by: ['treatmentId'],
      where: { hospitalId: hospital.id, status: 'BILL_VERIFIED' },
      _avg: { totalCost: true, roomCharges: true, implantCost: true, surgeryFee: true },
      _min: { totalCost: true },
      _max: { totalCost: true },
      _count: { id: true },
    });

    res.json({ data: { ...hospital, billStats } });
  } catch (err) {
    next(err);
  }
});

// ─── Get doctors for hospital ──────────────────────────────────────────────
router.get('/:id/doctors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hospital = await prisma.hospital.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }

    const doctors = await prisma.doctor.findMany({
      where: { hospitalId: hospital.id },
      orderBy: [{ rating: 'desc' }, { experienceYears: 'desc' }]
    });
    res.json({ data: doctors });
  } catch (err) {
    next(err);
  }
});

// ─── Compare hospitals ─────────────────────────────────────────────────────
router.post('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, treatmentSlug } = z.object({
      ids: z.array(z.string()).min(2).max(4),
      treatmentSlug: z.string().optional(),
    }).parse(req.body);

    const hospitals = await prisma.hospital.findMany({
      where: { OR: ids.map(id => ({ id })) },
      include: {
        doctors: { orderBy: { experienceYears: 'desc' }, take: 5 },
        hospitalTreatments: {
          include: { treatment: true },
          where: treatmentSlug ? { treatment: { slug: treatmentSlug } } : { isAvailable: true },
        },
        _count: { select: { bills: true, feedback: true, doctors: true } }
      }
    });

    res.json({ data: hospitals });
  } catch (err) {
    next(err);
  }
});

export default router;
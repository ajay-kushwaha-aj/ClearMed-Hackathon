import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { analyzeSymptoms } from '../lib/symptomAnalyzer';
import prisma from '../lib/prisma';
import crypto from 'crypto';

const router = Router();

// Tighter rate limit for AI endpoint (cost protection)
const symptomLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many symptom queries. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/analyze', symptomLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symptoms, city } = z.object({
      symptoms: z.string().min(3).max(500),
      city: z.string().optional(),
    }).parse(req.body);

    const startTime = Date.now();
    const result = await analyzeSymptoms(symptoms, city);

    // Fetch matching hospitals grouped by departments
    const departments = Array.from(new Set(result.conditions.map(c => c.department).filter(Boolean)));
    const hospitalsByDepartment: Record<string, any[]> = {};

    if (departments.length > 0) {
      // Get hospitals in the city
      const localHospitals = await prisma.hospital.findMany({
        where: { city: { contains: city, mode: 'insensitive' } },
        include: { doctors: true },
        orderBy: { rating: 'desc' }
      });

      for (const dept of departments) {
        let root = dept.slice(0, 6).toLowerCase();
        if (dept.toLowerCase().includes('surgery')) root = 'surge';
        if (dept.toLowerCase().includes('medicine')) root = 'physician';

        const matched = localHospitals.filter(h => 
          h.doctors.some(d => d.specialization.toLowerCase().includes(root)) ||
          h.name.toLowerCase().includes(root)
        ).slice(0, 5); // limit to top 5 per dept

        hospitalsByDepartment[dept] = matched.map(h => ({
          id: h.id,
          name: h.name,
          address: h.address,
          city: h.city,
          rating: h.rating,
          imageUrl: h.imageUrl,
          doctors: h.doctors.filter(d => d.specialization.toLowerCase().includes(root))
        }));
      }
    }

    // Log query anonymously (for analytics and model improvement)
    const ipHash = crypto.createHash('sha256')
      .update(req.ip || 'unknown')
      .digest('hex')
      .slice(0, 16); // Truncated for privacy

    await prisma.symptomQuery.create({
      data: {
        query: symptoms,
        conditions: result.conditions as object,
        treatments: result.treatments as object,
        specialists: result.specialists as object,
        city,
        ipHash,
        responseTimeMs: Date.now() - startTime,
      },
    }).catch(() => {}); // Non-blocking, don't fail the response if logging fails

    // Append hospital data
    res.json({ data: { ...result, hospitalsByDepartment } });
  } catch (err) {
    next(err);
  }
});

// Get common symptom queries for homepage autocomplete
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const popular = await prisma.symptomQuery.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });
    res.json({ data: popular.map(p => ({ query: p.query, count: p._count.query })) });
  } catch (err) {
    next(err);
  }
});

export default router;

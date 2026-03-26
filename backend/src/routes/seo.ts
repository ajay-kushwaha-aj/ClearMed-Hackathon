/**
 * SEO Content API — Phase 3
 * Powers auto-generated treatment landing pages
 */
import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Generate data for a treatment SEO page
router.get('/treatment/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const treatment = await prisma.treatment.findUnique({ where: { slug } });
    if (!treatment) { res.status(404).json({ error: 'Treatment not found' }); return; }

    const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];

    // Per-city cost data
    const costByCity = await Promise.all(
      CITIES.map(async city => {
        // Real bills first
        const billStats = await prisma.bill.aggregate({
          where: { treatmentId: treatment.id, status: 'BILL_VERIFIED', hospital: { city: { contains: city, mode: 'insensitive' } } },
          _avg: { totalCost: true }, _min: { totalCost: true }, _max: { totalCost: true }, _count: { id: true },
        });

        // Fallback to estimates
        const htStats = await prisma.hospitalTreatment.aggregate({
          where: { treatmentId: treatment.id, hospital: { city: { contains: city, mode: 'insensitive' } } },
          _avg: { avgCostEstimate: true }, _min: { minCostEstimate: true }, _max: { maxCostEstimate: true },
          _count: { id: true },
        });

        const avg = billStats._avg.totalCost || htStats._avg.avgCostEstimate;
        if (!avg) return null;

        return {
          city,
          avg: Math.round(avg),
          min: Math.round(billStats._min.totalCost || htStats._min.minCostEstimate || avg * 0.7),
          max: Math.round(billStats._max.totalCost || htStats._max.maxCostEstimate || avg * 1.5),
          count: billStats._count.id || htStats._count.id,
        };
      })
    );

    // Top hospitals
    const topHospitals = await prisma.hospitalTreatment.findMany({
      where: { treatmentId: treatment.id, avgCostEstimate: { gt: 0 } },
      include: {
        hospital: { select: { id: true, name: true, slug: true, city: true, type: true, naabhStatus: true, rating: true } },
      },
      orderBy: { hospital: { rating: 'desc' } },
      take: 8,
    });

    const totalHospitals = await prisma.hospitalTreatment.count({ where: { treatmentId: treatment.id } });

    // Generate SEO metadata
    const validCities = costByCity.filter(Boolean) as Array<{ city: string; avg: number; min: number; max: number; count: number }>;
    const delhiCost = validCities.find(c => c.city === 'Delhi');
    const cheapestCity = [...validCities].sort((a, b) => a.avg - b.avg)[0];

    const avgFmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)} lakh` : `₹${Math.round(n / 1000)}K`;

    const seoTitle = `${treatment.name} Cost in India 2025 — Compare ${totalHospitals}+ Hospitals | ClearMed`;
    const seoDescription = delhiCost
      ? `${treatment.name} average cost in Delhi is ${avgFmt(delhiCost.avg)}. Compare prices across ${totalHospitals}+ hospitals in ${validCities.map(c => c.city).join(', ')}. Real data from verified patient bills.`
      : `Compare ${treatment.name} cost across ${totalHospitals}+ hospitals in India. Get transparent pricing from verified patient bills.`;

    const seoKeywords = [
      `${treatment.name} cost`,
      `${treatment.name} price India`,
      `${treatment.name} hospital`,
      `${treatment.name} cost Delhi`,
      `${treatment.name} cost Mumbai`,
      `best hospital for ${treatment.name}`,
      `${treatment.category} cost India`,
    ];

    // FAQ schema
    const faqSchema = [
      {
        question: `What is the average cost of ${treatment.name} in India?`,
        answer: validCities.length > 0
          ? `The average cost of ${treatment.name} in India ranges from ${avgFmt(Math.min(...validCities.map(c => c.min)))} to ${avgFmt(Math.max(...validCities.map(c => c.max)))}. In Delhi, it costs around ${delhiCost ? avgFmt(delhiCost.avg) : 'varies'}.`
          : `The cost varies significantly based on hospital type, city, and patient-specific factors. Check our hospital comparison for real pricing.`,
      },
      {
        question: `Which city has the cheapest ${treatment.name} in India?`,
        answer: cheapestCity
          ? `${cheapestCity.city} tends to offer the most affordable ${treatment.name} with an average of ${avgFmt(cheapestCity.avg)}. However, costs can vary between hospitals.`
          : `Costs vary by city. Use our search to compare hospitals in your city.`,
      },
      {
        question: `Is ${treatment.name} cheaper in government hospitals?`,
        answer: `Yes, government and charitable trust hospitals typically offer ${treatment.name} at significantly lower costs (sometimes 40-60% cheaper) than private hospitals. However, waiting times may be longer.`,
      },
      ...(treatment.avgDuration ? [{
        question: `How many days will I need to stay in hospital for ${treatment.name}?`,
        answer: `Most patients require ${treatment.avgDuration}–${treatment.avgDuration + 2} days of hospital stay for ${treatment.name}. Recovery time at home is typically 2–4 weeks, depending on your age and overall health.`,
      }] : []),
    ];

    res.json({
      data: {
        treatment: {
          ...treatment,
          seoTitle, seoDescription, seoKeywords, faqSchema,
        },
        costByCity: validCities,
        topHospitals: topHospitals.map(h => ({
          hospitalId: h.hospital.id,
          hospitalName: h.hospital.name,
          hospitalSlug: h.hospital.slug,
          city: h.hospital.city,
          type: h.hospital.type,
          naabhStatus: h.hospital.naabhStatus,
          rating: h.hospital.rating,
          avgCost: h.avgCostEstimate,
          minCost: h.minCostEstimate,
          maxCost: h.maxCostEstimate,
        })),
        totalHospitals,
      }
    });
  } catch (err) { next(err); }
});

// Sitemap data — list all treatment slugs
router.get('/sitemap/treatments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const treatments = await prisma.treatment.findMany({
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: treatments });
  } catch (err) { next(err); }
});

// Dynamic sitemap.xml
router.get('/sitemap.xml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const treatments = await prisma.treatment.findMany({ select: { slug: true } });
    const baseUrl = process.env.FRONTEND_URL || 'https://clearmed.online';
    const urls = [
      `${baseUrl}/`, `${baseUrl}/search`, `${baseUrl}/symptoms`,
      `${baseUrl}/dashboard`, `${baseUrl}/community`, `${baseUrl}/leaderboard`,
      ...treatments.map(t => `${baseUrl}/treatments/${t.slug}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;
    res.header('Content-Type', 'text/xml').send(xml);
  } catch (err) { next(err); }
});

export default router;

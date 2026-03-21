/**
 * SEO Content Generator — Phase 3
 * Generates structured page metadata and content for treatment landing pages
 * Pattern: /treatments/knee-replacement-cost-delhi
 */

import { getCostIntelligence } from './costTrends';
import prisma from './prisma';

export interface TreatmentPageContent {
  meta: {
    title: string;
    description: string;
    keywords: string[];
    canonical: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    costRange: string;
    dataPoints: number;
  };
  faqs: Array<{ question: string; answer: string }>;
  structuredData: Record<string, unknown>;
}

export async function generateTreatmentPageContent(
  treatmentSlug: string,
  city: string
): Promise<TreatmentPageContent | null> {
  const [treatment, intelligence, topHospitals] = await Promise.all([
    prisma.treatment.findUnique({ where: { slug: treatmentSlug } }),
    getCostIntelligence(treatmentSlug, city).catch(() => null),
    prisma.hospital.findMany({
      where: {
        city: { contains: city, mode: 'insensitive' },
        hospitalTreatments: { some: { treatment: { slug: treatmentSlug }, isAvailable: true } },
      },
      select: { name: true, slug: true, naabhStatus: true, type: true, rating: true },
      orderBy: { rating: 'desc' },
      take: 5,
    }),
  ]);

  if (!treatment) return null;

  const currentAvg = intelligence?.currentAvg || 0;
  const costRangeStr = currentAvg > 0
    ? `₹${(currentAvg * 0.7 / 100000).toFixed(1)}L – ₹${(currentAvg * 1.4 / 100000).toFixed(1)}L`
    : 'Varies by hospital';

  const fmtCity = city.charAt(0).toUpperCase() + city.slice(1);
  const tName = treatment.name;

  return {
    meta: {
      title: `${tName} Cost in ${fmtCity} 2025 — Compare Hospitals | ClearMed`,
      description: `Compare ${tName.toLowerCase()} costs in ${fmtCity}. Average cost ${costRangeStr}. See real patient bills, top-rated hospitals, and NABH-accredited options.`,
      keywords: [
        `${tName.toLowerCase()} cost in ${fmtCity.toLowerCase()}`,
        `best hospital for ${tName.toLowerCase()} in ${fmtCity.toLowerCase()}`,
        `${tName.toLowerCase()} price ${fmtCity.toLowerCase()}`,
        `${treatment.category.toLowerCase()} hospital ${fmtCity.toLowerCase()}`,
        `${tName.toLowerCase()} surgery India`,
      ],
      canonical: `/treatments/${treatmentSlug}-cost-${fmtCity.toLowerCase()}`,
    },
    hero: {
      headline: `${tName} Cost in ${fmtCity}`,
      subheadline: `Compare real costs across ${topHospitals.length}+ hospitals. Find the best hospital for your budget.`,
      costRange: costRangeStr,
      dataPoints: intelligence?.trends.reduce((s, t) => s + t.sampleSize, 0) || 0,
    },
    faqs: generateFaqs(treatment.name, city, currentAvg, intelligence?.govtVsPrivate || null, topHospitals),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MedicalProcedure',
      name: tName,
      procedureType: treatment.category,
      description: treatment.description,
      followup: `Recovery: ${treatment.avgDuration ? `${treatment.avgDuration * 6} days` : 'Varies'}`,
      hospitalGroup: topHospitals.map(h => ({
        '@type': 'Hospital',
        name: h.name,
        medicalSpecialty: treatment.specialization,
      })),
    },
  };
}

function generateFaqs(
  treatmentName: string,
  city: string,
  avgCost: number,
  govtVsPrivate: { govtAvg: number; privateAvg: number; saving: number } | null,
  hospitals: Array<{ name: string; type: string; naabhStatus: boolean }>
) {
  const faqs = [
    {
      question: `What is the average cost of ${treatmentName} in ${city}?`,
      answer: avgCost > 0
        ? `The average cost of ${treatmentName} in ${city} is ₹${(avgCost / 1000).toFixed(0)}K, based on verified patient bills submitted to ClearMed. Costs range from ₹${((avgCost * 0.6) / 100000).toFixed(1)}L to ₹${((avgCost * 1.5) / 100000).toFixed(1)}L depending on the hospital, surgeon, and implant used.`
        : `${treatmentName} costs vary significantly across hospitals in ${city}. Use ClearMed to compare real costs from verified patient bills.`,
    },
    {
      question: `Which hospitals are best for ${treatmentName} in ${city}?`,
      answer: hospitals.length > 0
        ? `Top hospitals for ${treatmentName} in ${city} include ${hospitals.slice(0, 3).map(h => h.name).join(', ')}. ${hospitals.filter(h => h.naabhStatus).length > 0 ? `Of these, ${hospitals.filter(h => h.naabhStatus).map(h => h.name).join(' and ')} are NABH accredited.` : ''} Use ClearMed to compare costs and doctor profiles.`
        : `Use ClearMed to find and compare hospitals offering ${treatmentName} in ${city} with verified cost data.`,
    },
    {
      question: `How much cheaper is government hospital for ${treatmentName}?`,
      answer: govtVsPrivate
        ? `Government hospitals in ${city} offer ${treatmentName} at an average of ₹${(govtVsPrivate.govtAvg / 1000).toFixed(0)}K vs ₹${(govtVsPrivate.privateAvg / 1000).toFixed(0)}K in private hospitals — saving you approximately ₹${(govtVsPrivate.saving / 1000).toFixed(0)}K. However, waiting times may be longer at government facilities.`
        : `Government hospitals in India typically charge 60–80% less than private hospitals for the same treatment. Check ClearMed for specific costs in ${city}.`,
    },
    {
      question: `Does health insurance cover ${treatmentName}?`,
      answer: `Most health insurance plans in India cover ${treatmentName} as it is typically classified as a planned surgical procedure. Check your policy for: waiting period (usually 2–4 years for orthopedic procedures), sub-limits for room rent, and pre-authorization requirements. NABH-accredited hospitals tend to have smoother insurance claim processes.`,
    },
    {
      question: `What factors affect the cost of ${treatmentName}?`,
      answer: `Key cost factors include: (1) Hospital type — government vs private, (2) Surgeon's experience and reputation, (3) Implant brand and quality, (4) Room category — general ward vs private room, (5) Length of stay, (6) Pre-op tests and post-op medications, (7) City — metro cities like Delhi and Mumbai tend to cost 20–30% more than tier-2 cities.`,
    },
  ];

  return faqs;
}

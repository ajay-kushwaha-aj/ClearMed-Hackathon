/**
 * ClearMed Score Engine — Phase 2
 *
 * Composite score (0–10) per hospital-treatment pair based on:
 *  - Patient Satisfaction   25%
 *  - Doctor Experience      20%
 *  - Cost Efficiency        20%
 *  - Success Rate (proxy)   20%
 *  - Recovery Speed         10%
 *  - NABH Bonus             +5% flat
 *
 * Minimum 5 data points (bills + reviews) required for a reliable score.
 */

import prisma from './prisma';

export interface ScoreBreakdown {
  overallScore: number;         // 0–10
  satisfactionScore: number;    // 0–10
  doctorScore: number;          // 0–10
  costEfficiencyScore: number;  // 0–10
  successRateScore: number;     // 0–10
  recoveryScore: number;        // 0–10
  naabhBonus: number;           // 0 or 0.5
  dataPoints: number;
  isReliable: boolean;          // true if >= 5 data points
}

const WEIGHTS = {
  successRate: 0.25,
  satisfaction: 0.20,
  doctor: 0.20,
  costEfficiency: 0.20,
  recovery: 0.15,
};

const MIN_DATA_POINTS = 5;

// ── Individual Score Calculators ─────────────────────────────────────────

function calcSatisfactionScore(feedback: Array<{
  overallScore: number;
  doctorScore?: number | null;
  facilityScore?: number | null;
  careScore?: number | null;
}>): number {
  if (feedback.length === 0) return 0;
  const avg = feedback.reduce((sum, f) => {
    const score = (f.overallScore + (f.doctorScore || f.overallScore) + (f.facilityScore || f.overallScore)) / 3;
    return sum + score;
  }, 0) / feedback.length;
  return Math.min(10, avg * 2); // Reviews are 1–5, scale to 0–10
}

function calcDoctorScore(doctors: Array<{ experienceYears?: number | null; rating?: number | null }>): number {
  if (doctors.length === 0) return 0;
  const avgExp = doctors.reduce((s, d) => s + (d.experienceYears || 0), 0) / doctors.length;
  const avgRating = doctors.reduce((s, d) => s + (d.rating || 0), 0) / doctors.length;

  // Experience: 10y = 5pts, 20y+ = 10pts
  const expScore = Math.min(10, (avgExp / 2));
  // Rating: 1–5 scale, normalize to 0–10
  const ratingScore = avgRating > 0 ? (avgRating / 5) * 10 : expScore;

  return (expScore + ratingScore) / 2;
}

function calcCostEfficiencyScore(
  hospitalAvgCost: number,
  cityAvgCost: number,
): number {
  if (!hospitalAvgCost || !cityAvgCost || cityAvgCost === 0) return 5; // Neutral if no data
  const ratio = hospitalAvgCost / cityAvgCost;

  // Score = 10 if 50% cheaper than city avg, 5 if at city avg, 0 if 2x more expensive
  if (ratio <= 0.5) return 10;
  if (ratio <= 0.75) return 8;
  if (ratio <= 0.9) return 7;
  if (ratio <= 1.1) return 5;   // At city average
  if (ratio <= 1.5) return 3;
  if (ratio <= 2.0) return 1;
  return 0;
}

function calcSuccessRateScore(feedback: Array<{ complicationFlag: boolean }>): number {
  if (feedback.length === 0) return 5; // Neutral
  const complicationRate = feedback.filter(f => f.complicationFlag).length / feedback.length;
  return Math.max(0, 10 - complicationRate * 20); // 0 complications = 10, 50%+ = 0
}

function calcRecoveryScore(feedback: Array<{ recoveryDays?: number | null }>, expectedDays: number): number {
  const withData = feedback.filter(f => f.recoveryDays && f.recoveryDays > 0);
  if (withData.length === 0 || expectedDays === 0) return 5; // Neutral

  const avgRecovery = withData.reduce((s, f) => s + (f.recoveryDays || 0), 0) / withData.length;
  const ratio = avgRecovery / expectedDays;

  // Score = 10 if 50% faster, 5 if at expected, 0 if 2x slower
  if (ratio <= 0.5) return 10;
  if (ratio <= 0.75) return 8;
  if (ratio <= 0.9) return 7;
  if (ratio <= 1.1) return 5;
  if (ratio <= 1.5) return 3;
  if (ratio <= 2.0) return 1;
  return 0;
}

// ── Main Score Calculator ─────────────────────────────────────────────────

export async function calculateClearMedScore(
  hospitalId: string,
  treatmentId: string,
): Promise<ScoreBreakdown> {
  const [hospital, treatment, feedback, doctors, bills, cityAvg] = await Promise.all([
    prisma.hospital.findUnique({ where: { id: hospitalId }, select: { naabhStatus: true, city: true } }),
    prisma.treatment.findUnique({ where: { id: treatmentId }, select: { avgDuration: true } }),
    prisma.patientFeedback.findMany({
      where: { hospitalId, treatmentId },
      select: { overallScore: true, doctorScore: true, facilityScore: true, careScore: true, recoveryDays: true, complicationFlag: true },
    }),
    prisma.doctor.findMany({
      where: { hospitalId },
      select: { experienceYears: true, rating: true },
    }),
    prisma.bill.aggregate({
      where: { hospitalId, treatmentId, status: 'BILL_VERIFIED' },
      _avg: { totalCost: true },
      _count: { id: true },
    }),
    // City average for cost efficiency
    prisma.bill.aggregate({
      where: {
        treatmentId,
        status: 'BILL_VERIFIED',
        hospital: { id: hospitalId }, // Same city via join
      },
      _avg: { totalCost: true },
    }),
  ]);

  // Get true city average
  const cityBills = await prisma.bill.aggregate({
    where: {
      treatmentId,
      status: 'BILL_VERIFIED',
      hospital: { city: hospital?.city || '' },
    },
    _avg: { totalCost: true },
    _count: { id: true },
  });

  const dataPoints = feedback.length + bills._count.id;
  const isReliable = dataPoints >= MIN_DATA_POINTS;

  const hospitalAvgCost = bills._avg.totalCost || 0;
  const cityAvgCost = cityBills._avg.totalCost || 0;
  const expectedDays = treatment?.avgDuration || 5;

  const satisfactionScore = calcSatisfactionScore(feedback);
  const doctorScore = calcDoctorScore(doctors);
  const costEfficiencyScore = calcCostEfficiencyScore(hospitalAvgCost, cityAvgCost);
  const successRateScore = calcSuccessRateScore(feedback);
  const recoveryScore = calcRecoveryScore(feedback, expectedDays);
  const naabhBonus = hospital?.naabhStatus ? 0.5 : 0;

  const rawScore =
    successRateScore * WEIGHTS.successRate +
    satisfactionScore * WEIGHTS.satisfaction +
    doctorScore * WEIGHTS.doctor +
    costEfficiencyScore * WEIGHTS.costEfficiency +
    recoveryScore * WEIGHTS.recovery;

  const overallScore = Math.min(10, Math.max(0, rawScore));

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    satisfactionScore: Math.round(satisfactionScore * 10) / 10,
    doctorScore: Math.round(doctorScore * 10) / 10,
    costEfficiencyScore: Math.round(costEfficiencyScore * 10) / 10,
    successRateScore: Math.round(successRateScore * 10) / 10,
    recoveryScore: Math.round(recoveryScore * 10) / 10,
    naabhBonus,
    dataPoints,
    isReliable,
  };
}

// ── Persist / refresh score in DB ─────────────────────────────────────────

export async function upsertClearMedScore(
  hospitalId: string,
  treatmentId: string,
): Promise<void> {
  try {
    const breakdown = await calculateClearMedScore(hospitalId, treatmentId);
    await prisma.clearMedScore.upsert({
      where: { hospitalId_treatmentId: { hospitalId, treatmentId } },
      update: {
        overallScore: breakdown.overallScore,
        satisfactionScore: breakdown.satisfactionScore,
        doctorScore: breakdown.doctorScore,
        costEfficiencyScore: breakdown.costEfficiencyScore,
        successRateScore: breakdown.successRateScore,
        recoveryScore: breakdown.recoveryScore,
        naabhBonus: breakdown.naabhBonus,
        dataPoints: breakdown.dataPoints,
        isReliable: breakdown.isReliable,
        lastCalculated: new Date(),
      },
      create: {
        hospitalId,
        treatmentId,
        overallScore: breakdown.overallScore,
        satisfactionScore: breakdown.satisfactionScore,
        doctorScore: breakdown.doctorScore,
        costEfficiencyScore: breakdown.costEfficiencyScore,
        successRateScore: breakdown.successRateScore,
        recoveryScore: breakdown.recoveryScore,
        naabhBonus: breakdown.naabhBonus,
        dataPoints: breakdown.dataPoints,
        isReliable: breakdown.isReliable,
      },
    });
  } catch (err) {
    console.error('[ScoreEngine] Failed to upsert score:', (err as Error).message);
  }
}

// ── Batch recalculate all scores ─────────────────────────────────────────

export async function recalculateAllScores(): Promise<{ updated: number; errors: number }> {
  const pairs = await prisma.hospitalTreatment.findMany({
    select: { hospitalId: true, treatmentId: true },
    where: { isAvailable: true },
  });

  let updated = 0;
  let errors = 0;

  for (const pair of pairs) {
    try {
      await upsertClearMedScore(pair.hospitalId, pair.treatmentId);
      updated++;
    } catch {
      errors++;
    }
  }

  return { updated, errors };
}

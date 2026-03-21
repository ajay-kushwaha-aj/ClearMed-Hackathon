/**
 * Standalone script to recalculate all ClearMed scores
 * Run: npm run scores:recalc
 */
import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import { upsertClearMedScore as upsertScore } from '../lib/scoreEngine';

async function main() {
  console.log('🔢 Recalculating all ClearMed scores...\n');

  const pairs = await prisma.hospitalTreatment.findMany({
    select: { hospitalId: true, treatmentId: true },
  });

  let done = 0, errors = 0;
  for (const { hospitalId, treatmentId } of pairs) {
    try {
      await upsertScore(hospitalId, treatmentId);
      done++;
      if (done % 10 === 0) process.stdout.write(`  ${done}/${pairs.length} scored...\r`);
    } catch { errors++; }
  }

  console.log(`\n✅ Recalculation complete: ${done} scored, ${errors} errors`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

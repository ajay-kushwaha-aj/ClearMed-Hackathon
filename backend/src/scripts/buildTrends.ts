/**
 * Trend Builder Script — ClearMed Phase 3
 * Run: npm run trends:build
 * Aggregates verified bills into monthly CostTrend rows for charting.
 */
import dotenv from 'dotenv';
dotenv.config();
import { buildAllTrends } from '../lib/costTrends';
import prisma from '../lib/prisma';

async function main() {
  console.log('📊 Building cost trend snapshots...\n');
  const count = await buildAllTrends();
  console.log(`\n✅ Done: ${count} treatment-city pairs updated`);
}
main().catch(console.error).finally(() => prisma.$disconnect());

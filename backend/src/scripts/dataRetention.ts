import dotenv from 'dotenv';
dotenv.config();
import { runRetentionPurge } from '../lib/dataRetention';
import prisma from '../lib/prisma';

async function main() {
  console.log('🗑️  Running data retention purge (DPDP Act 2023)...\n');
  const result = await runRetentionPurge();
  console.log('Purge results:');
  Object.entries(result).forEach(([k, v]) => console.log(`  ${k}: ${v} records`));
  console.log('\n✅ Done');
}
main().catch(console.error).finally(() => prisma.$disconnect());

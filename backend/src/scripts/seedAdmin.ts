/**
 * Seed Admin Users — ClearMed Phase 4
 * Run: npm run seed:admin
 * Creates default super admin + moderator accounts
 */
import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth';

const ADMINS = [
  { email: 'admin@clearmed.online', name: 'Super Admin', password: 'ClearMed@Admin2026', role: 'SUPER_ADMIN' as const },
  { email: 'moderator@clearmed.online', name: 'Content Moderator', password: 'ClearMed@Mod2026', role: 'MODERATOR' as const },
];

async function main() {
  console.log('🔐 Seeding admin users...\n');

  for (const a of ADMINS) {
    const existing = await prisma.adminUser.findUnique({ where: { email: a.email } });
    if (existing) {
      await prisma.adminUser.update({
        where: { email: a.email },
        data: { passwordHash: await hashPassword(a.password) },
      });
      console.log(`  🔄 Updated password for ${a.email}`);
      continue;
    }

    await prisma.adminUser.create({
      data: {
        email: a.email,
        name: a.name,
        passwordHash: await hashPassword(a.password),
        role: a.role,
        isActive: true,
      },
    });
    console.log(`  ✅ Created ${a.role}: ${a.email}`);
  }

  console.log('\n⚠️  IMPORTANT: Change default passwords before going to production!');
  console.log('   Enable 2FA by logging in and calling POST /api/admin/auth/totp/setup\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());

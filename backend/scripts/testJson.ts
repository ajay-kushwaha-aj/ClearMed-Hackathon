import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw<any[]>`SELECT * FROM hospitals WHERE CAST(departments AS TEXT) ILIKE '%Orthopaedics%'`;
  console.log("Hospitals found via raw sql:", result.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());

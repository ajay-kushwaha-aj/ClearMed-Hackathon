import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find hospitals with departments JSON
  const hospitals = await prisma.hospital.findMany({
    where: { departments: { not: null } }
  });

  console.log(`Found ${hospitals.length} hospitals with departments JSON.`);

  for (const h of hospitals) {
    if (!h.departments) continue;
    
    // Departments JSON is roughly: { "Category": ["Dept 1", "Dept 2"] }
    const depts = h.departments as Record<string, string[]>;
    
    // Flatten all department names
    const allDepts: string[] = [];
    for (const cat in depts) {
      if (Array.isArray(depts[cat])) {
        allDepts.push(...depts[cat]);
      }
    }

    console.log(`Hospital ${h.name} has ${allDepts.length} departments. Injecting dummy doctors for search index...`);
    
    let injectedCount = 0;
    for (const dept of allDepts) {
      // Check if a doctor already exists for this hospital with this specialization
      const existing = await prisma.doctor.findFirst({
        where: { hospitalId: h.id, specialization: dept }
      });

      if (!existing) {
        await prisma.doctor.create({
          data: {
            name: `${dept} Specialist`,
            specialization: dept,
            experienceYears: 15,
            rating: 4.5,
            hospitalId: h.id
          }
        });
        injectedCount++;
      }
    }
    console.log(`✅ Injected ${injectedCount} new generic department doctors for ${h.name}.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

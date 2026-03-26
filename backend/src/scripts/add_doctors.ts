import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics',
  'Gastroenterology', 'Dermatology', 'Urology', 'Ophthalmology', 'Dental',
  'Gynecology', 'Pulmonology', 'Endocrinology', 'Psychiatry', 'General Surgery'
];

const LAST_NAMES = [
  'Sharma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Rao', 'Reddy', 'Menon',
  'Iyer', 'Joshi', 'Das', 'Chatterjee', 'Bose', 'Nair', 'Varghese', 'Chauhan'
];

async function main() {
  const hospitals = await prisma.hospital.findMany({ include: { doctors: true } });

  for (const hospital of hospitals) {
    if (hospital.doctors && hospital.doctors.length >= 3) {
      console.log(`Skipping ${hospital.name}, already has ${hospital.doctors.length} doctors`);
      continue;
    }

    // Pick 3-5 random departments
    const shuffled = [...DEPARTMENTS].sort(() => 0.5 - Math.random());
    const selectedDepts = shuffled.slice(0, Math.floor(Math.random() * 3) + 3);

    for (const dept of selectedDepts) {
      // Create 1-2 doctors per dept
      const numDocs = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numDocs; i++) {
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        await prisma.doctor.create({
          data: {
            hospitalId: hospital.id,
            name: `Dr. ${lastName}`,
            specialization: dept,
            qualification: 'MBBS, MD',
            experienceYears: Math.floor(Math.random() * 20) + 5,
            rating: (Math.random() * 1.5 + 3.5),
            bio: `${dept} specialist with extensive experience in advanced procedures.`
          }
        });
      }
    }
    console.log(`Added departments and doctors to ${hospital.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AIIMS_DEPARTMENTS = {
  "Medicine & Allied": [
    "General Medicine",
    "Cardiology",
    "Endocrinology",
    "Gastroenterology",
    "Nephrology",
    "Geriatric Medicine",
    "Haematology"
  ],
  "🔪 Surgery & Allied": [
    "General Surgery",
    "Cardiothoracic & Vascular Surgery (CTVS)",
    "Gastrointestinal Surgery",
    "Orthopaedics",
    "Neurosurgery",
    "Urology"
  ],
  "👶 Women & Child": [
    "Obstetrics & Gynaecology",
    "Pediatrics"
  ],
  "🧠 Specialized Clinical Fields": [
    "Dermatology & Venereology",
    "Psychiatry",
    "Ophthalmology",
    "ENT"
  ],
  "🚑 Emergency & Critical Care": [
    "Emergency Medicine",
    "Anaesthesiology, Pain Medicine & Critical Care"
  ],
  "🏥 Community & Public Health": [
    "Centre for Community Medicine"
  ],
  "⭐ SUPER SPECIALTY CENTERS": [
    "Cardio-Thoracic Sciences Centre",
    "Neurosciences Centre",
    "Dr. R.P. Centre (Ophthalmology)",
    "Dental Education & Research Centre",
    "National Cancer Institute",
    "Trauma Center (JPNA)"
  ]
};

async function main() {
  const aiims = await prisma.hospital.findFirst({
    where: { name: { contains: 'AIIMS', mode: 'insensitive' } }
  });

  if (aiims) {
    await prisma.hospital.update({
      where: { id: aiims.id },
      data: { departments: AIIMS_DEPARTMENTS }
    });
    console.log(`Successfully updated departments for ${aiims.name}`);
  } else {
    // If not found, create a dummy AIIMS record for demonstration
    const newAiims = await prisma.hospital.create({
      data: {
        name: 'AIIMS Delhi',
        slug: 'aiims-delhi',
        city: 'New Delhi',
        state: 'Delhi',
        address: 'Ansari Nagar, New Delhi',
        type: 'GOVERNMENT',
        beds: 2400,
        departments: AIIMS_DEPARTMENTS,
        rating: 4.8
      }
    });
    console.log(`Created AIIMS Delhi and added departments: ${newAiims.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

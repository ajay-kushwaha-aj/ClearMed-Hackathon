import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const aiimsDepartments = {
  "Medicine & Allied": [
    "General Medicine",
    "Cardiology",
    "Endocrinology",
    "Gastroenterology",
    "Nephrology",
    "Geriatric Medicine",
    "Haematology"
  ],
  "Surgery & Allied": [
    "General Surgery",
    "Cardiothoracic & Vascular Surgery (CTVS)",
    "Gastrointestinal Surgery",
    "Orthopaedics",
    "Neurosurgery",
    "Urology"
  ],
  "Women & Child": [
    "Obstetrics & Gynaecology",
    "Pediatrics"
  ],
  "Specialized Clinical Fields": [
    "Dermatology & Venereology",
    "Psychiatry",
    "Ophthalmology",
    "ENT"
  ],
  "Emergency & Critical Care": [
    "Emergency Medicine",
    "Anaesthesiology, Pain Medicine & Critical Care"
  ],
  "Community & Public Health": [
    "Centre for Community Medicine",
    "Dietetics"
  ],
  "SUPER SPECIALTY CENTERS": [
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
    where: {
      name: { contains: "aiims", mode: "insensitive" }
    }
  });

  if (!aiims) {
    console.error("AIIMS hospital not found in the database. Creating a placeholder AIIMS Delhi so we can inject departments...");
    const newAiims = await prisma.hospital.create({
      data: {
        name: "AIIMS New Delhi",
        slug: "aiims-new-delhi",
        city: "Delhi",
        state: "Delhi",
        address: "Ansari Nagar, New Delhi",
        type: "GOVERNMENT",
        rating: 4.8,
        description: "All India Institute of Medical Sciences",
        departments: aiimsDepartments
      }
    });
    console.log(`✅ Created AIIMS New Delhi and injected departments!`);
    return;
  }

  await prisma.hospital.update({
    where: { id: aiims.id },
    data: { departments: aiimsDepartments }
  });

  console.log(`✅ Updated ${aiims.name} with requested departments!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

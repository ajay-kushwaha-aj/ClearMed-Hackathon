import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const treatments = await prisma.hospitalTreatment.findMany();
  let updatedCount = 0;

  for (const ht of treatments) {
    // Only update if no costBreakdown and it has an avgCostEstimate
    if (!ht.costBreakdown && ht.avgCostEstimate && ht.avgCostEstimate > 0) {
      const avg = ht.avgCostEstimate;
      
      // Calculate realistic mock proportions:
      // Surgery: 40%
      // Room Charges: 20%
      // Implant / Tech: 15%
      // Pharmacy: 12%
      // Pathology / Diagnostics: 8%
      // Other: 5%
      
      const breakdown = {
        "Surgery Fee": Math.round(avg * 0.40),
        "Room Charges": Math.round(avg * 0.20),
        "Implant/Device Cost": Math.round(avg * 0.15),
        "Pharmacy/Medicines": Math.round(avg * 0.12),
        "Diagnostics/Pathology": Math.round(avg * 0.08),
        "Other Charges": Math.round(avg * 0.05)
      };

      // Ensure that sum exactly matches the avg
      const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const diff = avg - sum;
      if (diff !== 0) {
        breakdown["Other Charges"] += diff; // pad the difference
      }

      await prisma.hospitalTreatment.update({
        where: { id: ht.id },
        data: { costBreakdown: breakdown }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} hospital treatments with a cost breakdown.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

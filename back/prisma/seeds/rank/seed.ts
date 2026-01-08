import { PrismaClient } from "@prisma/client";
import rankData from "./data.json";

export async function seedRanks(prisma: PrismaClient) {
  console.log("🌱 Seeding ranks...");

  for (const rank of rankData) {
    let requiredMissionId: string | null = null;

    if (rank.requiredMissionSlug) {
      const mission = await prisma.mission.findUnique({
        where: { slug: rank.requiredMissionSlug },
        select: { id: true },
      });

      if (!mission) {
        throw new Error(
          `❌ Mission not found: ${rank.requiredMissionSlug}`
        );
      }

      requiredMissionId = mission.id;
    }

    await prisma.rank.upsert({
      where: { slug: rank.slug },
      update: {
        name: rank.name,
        order: rank.order,
        requiredId: requiredMissionId,
      },
      create: {
        name: rank.name,
        order: rank.order,
        slug: rank.slug,
        requiredId: requiredMissionId,
      },
    });
  }

  console.log("✅ Ranks seeded");
}

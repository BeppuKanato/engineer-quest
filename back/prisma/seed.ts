import { seedCharacters } from "./seeds/character/seed";
import { seedDifficulties } from "./seeds/difuculties/seed";
import { seedMissions } from "./seeds/mission/seed";
import { seedMissionUnlocks } from "./seeds/missionUnlockByMission/seed";
import { prisma } from "../src/lib/prisma";
import { seedRanks } from "./seeds/rank/seed";

async function main() {
  console.log('🌱 Starting database seeding...');
  // await seedCharacters(prisma);
  // await seedDifficulties(prisma);
  await seedMissions(prisma);
  await seedMissionUnlocks(prisma);
  await seedRanks(prisma);
  console.log('🌳 All seeding completed!');
}

main()
.catch((e) => {
  console.error(e);
  process.exit(1);
})
.finally(async() => {
  await prisma.$disconnect();
});
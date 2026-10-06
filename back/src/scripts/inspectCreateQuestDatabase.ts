import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const legacyTables = [
  "CreateMission",
  "UserWork",
  "UserWorkReview",
  "CreateTheme",
  "CreateThemeRequirement",
  "CreateThemeChallenge",
  "UserCreateWork",
  "UserCreateWorkRequirementCheck",
  "UserCreateWorkChallengeCheck",
];

const newTables = [
  "CreateQuest",
  "CreateQuestRequirement",
  "CreateQuestCourse",
  "CreateQuestAttempt",
  "CreateQuestTestExecution",
  "CreateQuestSubmission",
  "CreateQuestHintView",
  "CreateQuestFeedback",
];

async function main() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY(${[...legacyTables, ...newTables]})
    ORDER BY table_name
  `;

  const counts = await Promise.all(
    tables
      .filter(({ table_name }) => legacyTables.includes(table_name))
      .map(async ({ table_name }) => {
        const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::bigint AS count FROM "${table_name}"`,
        );
        return { table: table_name, rows: Number(rows[0]?.count ?? 0) };
      }),
  );

  const externalReferences = await prisma.$queryRaw<
    Array<{ source_table: string; target_table: string; constraint_name: string }>
  >`
    SELECT
      source.relname AS source_table,
      target.relname AS target_table,
      constraint_record.conname AS constraint_name
    FROM pg_constraint AS constraint_record
    JOIN pg_class AS source ON source.oid = constraint_record.conrelid
    JOIN pg_class AS target ON target.oid = constraint_record.confrelid
    WHERE constraint_record.contype = 'f'
      AND target.relname = ANY(${legacyTables})
      AND NOT (source.relname = ANY(${legacyTables}))
    ORDER BY source.relname, target.relname
  `;

  const enumValues = await prisma.$queryRaw<Array<{ enum_name: string; enum_value: string }>>`
    SELECT types.typname AS enum_name, values.enumlabel AS enum_value
    FROM pg_type AS types
    JOIN pg_enum AS values ON values.enumtypid = types.oid
    WHERE types.typname IN (
      'CreateThemeCategory',
      'CreateWorkStatus',
      'CreateWorkVisibility',
      'CourseExamFeedbackActionType'
    )
    ORDER BY types.typname, values.enumsortorder
  `;

  console.log(JSON.stringify({ tables: tables.map((row) => row.table_name), counts, externalReferences, enumValues }, null, 2));
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

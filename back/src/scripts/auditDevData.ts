import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const masterTables = new Set(["Course", "CourseCategory", "CourseCategoryMap", "Mission", "MissionActivity", "Achievement", "KnowledgeCard", "KnowledgeCardScheduleEntry", "CreateQuest", "CreateQuestRequirement", "CreateQuestCourse", "_prisma_migrations"]);
type Snapshot = Record<string, { count: number; hashes: string[] }>;
const canonical = (value: unknown): string => {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
  return JSON.stringify(value);
};

async function main() {
  const [mode, file] = process.argv.slice(2);
  if (!["before", "after", "inspect"].includes(mode)) throw new Error("Expected before/after/inspect");
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`;
  const snapshot: Snapshot = {};
  const counts: Record<string, number> = {};
  for (const { table_name: name } of tables) {
    // Table identifiers come only from the catalog, and are SQL-quoted.
    const quoted = `"${name.replace(/"/g, '""')}"`;
    if (masterTables.has(name)) {
      const [row] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) AS count FROM ${quoted}`);
      counts[name] = Number(row.count);
    } else {
      const rows = await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM ${quoted}`);
      snapshot[name] = { count: rows.length, hashes: rows.map(row => createHash("sha256").update(canonical(row)).digest("hex")).sort() };
      counts[name] = rows.length;
    }
  }
  console.log(JSON.stringify({ counts }, null, 2));
  if (mode === "before") {
    if (!file) throw new Error("Snapshot path required");
    writeFileSync(file, JSON.stringify(snapshot));
    console.log("Saved protected-row fingerprints; no user content or credentials written.");
  }
  if (mode === "after") {
    if (!file) throw new Error("Snapshot path required");
    const baseline = JSON.parse(readFileSync(file, "utf8")) as Snapshot;
    const failures: string[] = [];
    let checkedRows = 0;
    for (const [name, before] of Object.entries(baseline)) {
      const available = new Map<string, number>();
      for (const hash of snapshot[name]?.hashes ?? []) available.set(hash, (available.get(hash) ?? 0) + 1);
      for (const hash of before.hashes) {
        if (!(available.get(hash) ?? 0)) failures.push(name);
        else available.set(hash, available.get(hash)! - 1);
        checkedRows++;
      }
    }
    if (failures.length) throw new Error(`Protected rows missing or modified: ${[...new Set(failures)].join(", ")}`);
    console.log(JSON.stringify({ preservedTables: Object.keys(baseline).length, checkedRows, allExistingProtectedRowsUnchanged: true }));
  }
  if (tables.some(t => t.table_name === "_prisma_migrations")) {
    const migrations = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]>`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at`;
    console.log(JSON.stringify({ migrations }, null, 2));
  }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : "Audit failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());

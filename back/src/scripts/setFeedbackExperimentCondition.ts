/**
 * Manual four-arm experiment assignment. The allocation method is intentionally
 * NOT chosen here: an authorized operator specifies the pre-planned condition.
 * Safe default is dry-run; never rewrite assignments with feedback history.
 *
 * Usage from back/:
 * npx ts-node src/scripts/setFeedbackExperimentCondition.ts --user-id=<internal-user-id> --condition=TOP_1
 * npx ts-node src/scripts/setFeedbackExperimentCondition.ts --user-id=<internal-user-id> --condition=TOP_1 --apply
 */
import { FeedbackCondition, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HEXAD_FEEDBACK_EXPERIMENT_KEY } from "../service/experimentAssignment.service";

const CONDITIONS = ["STANDARD", "TOP_1", "ROULETTE", "MULTI"] as const;
type Condition = typeof CONDITIONS[number];

function parseArgs(argv: string[]) {
  const fields = new Map<string, string>();
  for (const arg of argv) {
    if (arg === "--apply") {
      if (fields.has("apply")) throw new Error("Duplicate --apply flag");
      fields.set("apply", "true");
      continue;
    }
    const match = /^--(user-id|condition)=([^\s]+)$/.exec(arg);
    const name = match?.[1], value = match?.[2];
    if (!name || !value || fields.has(name)) throw new Error("Usage: --user-id=<id> --condition=STANDARD|TOP_1|ROULETTE|MULTI [--apply]");
    fields.set(name, value);
  }
  const userId = fields.get("user-id");
  const condition = fields.get("condition");
  if (!userId || !CONDITIONS.includes(condition as Condition)) throw new Error("Specify --user-id and a four-arm --condition");
  return { userId, condition: condition as Condition, apply: fields.has("apply") };
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const existing = await prisma.experimentAssignment.findUnique({
    where: { userId_experimentKey: { userId: args.userId, experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY } },
  });
  const [user, feedbackCount] = await Promise.all([
    prisma.user.findUnique({where:{id:args.userId},select:{id:true,hexadResponse:{select:{id:true}}}}),
    prisma.feedbackV1.count({where:{userId:args.userId}}),
  ]);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (feedbackCount > 0) throw new Error("FEEDBACK_ALREADY_EXISTS: cannot change a participant's condition after feedback generation");
  if (args.condition !== "STANDARD" && !user.hexadResponse) throw new Error("HEXAD_RESPONSE_REQUIRED");
  if (existing?.condition === args.condition) {
    console.log("Already assigned to requested condition; no change made.");
    return;
  }
  const action = existing ? "UPDATE" : "CREATE";
  console.log(JSON.stringify({
    mode: args.apply ? "APPLY" : "DRY_RUN", action,
    experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY,
    currentCondition: existing?.condition ?? null,
    desiredCondition: args.condition, feedbackCount,
  }, null, 2));
  if (!args.apply) {
    console.log("No changes made. Re-run with --apply after confirming the allocation plan.");
    return;
  }
  await prisma.$transaction(async tx => {
    const count = await tx.feedbackV1.count({where:{userId:args.userId}});
    if (count > 0) throw new Error("FEEDBACK_ALREADY_EXISTS");
    await tx.experimentAssignment.upsert({
      where: { userId_experimentKey: {userId:args.userId, experimentKey:HEXAD_FEEDBACK_EXPERIMENT_KEY} },
      update: { condition: args.condition as FeedbackCondition, top1Type: null, assignedAt: new Date() },
      create: { userId: args.userId, experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY, condition: args.condition as FeedbackCondition },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log("Assignment stored; historical feedback was not modified.");
}
void main().catch(error => {console.error(error instanceof Error ? error.message : error);process.exitCode=1;})
  .finally(()=>prisma.$disconnect());

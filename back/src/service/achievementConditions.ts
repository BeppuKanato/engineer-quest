import type { Achievement } from "@prisma/client";

type UnitGroupCondition = Pick<Achievement, "conditionUnitIds" | "conditionGroupName">;
const groupIds = (condition: UnitGroupCondition) => [...new Set(condition.conditionUnitIds ?? [])];
export function unitGroupProgress(condition: UnitGroupCondition, completedUnits: ReadonlySet<string>) {
  const ids = groupIds(condition);
  // 空や不正な集合を「すべて完了」として解除しない。
  if (!ids.length || ids.some(id => !id.trim())) return { goal: 1, progress: 0 };
  return { goal: ids.length, progress: ids.filter(id => completedUnits.has(id)).length };
}
export function unitGroupLabel(condition: UnitGroupCondition) {
  const count = groupIds(condition).length;
  if (!count) return "指定された単元をすべて完了";
  return condition.conditionGroupName?.trim()
    ? `${condition.conditionGroupName.trim()}の${count}単元をすべて完了`
    : `指定した${count}単元をすべて完了`;
}

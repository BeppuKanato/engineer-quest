export function summarizeReaction(events: { type: string; data: unknown }[]) {
  const rows = events.map(e => ({ type: e.type, data: e.data as Record<string, unknown> }));
  const choices = rows.filter(e => e.type === "CLICKED" || e.type === "NAVIGATION_SELECTED").sort((a, b) => String(a.data.selectedAt).localeCompare(String(b.data.selectedAt)));
  const first = choices[0];
  const base = { ruleVersion: "first-selection-v1", presented: rows.some(e => e.type === "PRESENTED"), viewportObserved: rows.some(e => e.type === "VIEWED") };
  if (!first || !first.data.choiceId || !first.data.selectedAt) return { ...base, judgement: "PENDING", reason: "NO_IDENTIFIABLE_FIRST_SELECTION" };
  if (choices.some(c => c !== first && c.data.selectedAt === first.data.selectedAt && c.data.choiceId !== first.data.choiceId)) return { ...base, judgement: "PENDING", reason: "AMBIGUOUS_ORDER" };
  const arrival = rows.find(e => e.type === "ARRIVED" && e.data.choiceId === first.data.choiceId);
  if (rows.some(e => e.type === "ARRIVAL_FAILED" && e.data.choiceId === first.data.choiceId)) return { ...base, judgement: "PENDING", reason: "FIRST_DESTINATION_FAILED" };
  if (!arrival) return { ...base, judgement: "PENDING", reason: "FIRST_DESTINATION_NOT_CONFIRMED" };
  return { ...base, judgement: arrival.data.actual === first.data.expected ? "MATCH" : "MISMATCH", reason: "FIRST_SELECTION_AND_RENDERED_DESTINATION", choiceId: first.data.choiceId };
}

import type { Input } from "./feedbackV1.engine";

export type EvidenceSource = {
  sourceId: string;
  kind: "learning" | "assessment" | "implementation" | "big_goal";
  /** JSON path binding this ID to the facts supplied to the analysis stage. */
  path: string;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

/** Only call with server-built, owner-scoped learning/goal snapshots (including saved ones).
 * Never walk arbitrary payloads, summaries, code, or selection-stage state for IDs.
 */
export function buildEvidenceSources(input: Pick<Input, "learning" | "bigGoal">): EvidenceSource[] {
  const sources = new Map<string, EvidenceSource>();
  const add = (id: unknown, kind: EvidenceSource["kind"], path: string) => {
    if (typeof id === "string" && id.trim() && !sources.has(id)) sources.set(id, { sourceId: id, kind, path });
  };
  const learning = object(input.learning);
  add(learning.id, "learning", "learning");
  for (const key of ["unit", "currentPhase", "currentQuest"]) add(object(learning[key]).id, "learning", `learning.${key}`);
  for (const key of ["phases", "sequence", "answers", "tests", "hints", "submissions"]) {
    array(learning[key]).forEach((row, i) => add(object(row).id, "learning", `learning.${key}[${i}]`));
  }
  array(object(learning.currentQuest).requirements).forEach((row, i) =>
    add(object(row).id, "learning", `learning.currentQuest.requirements[${i}]`));
  const snapshot = object(learning.conceptSnapshot);
  add(snapshot.id, "learning", "learning.conceptSnapshot");
  array(snapshot.missingCompletionEvidence).forEach((row, i) =>
    add(object(row).sourceId, "assessment", `learning.conceptSnapshot.missingCompletionEvidence[${i}]`));
  array(snapshot.concepts).forEach((value, i) => {
    const concept = object(value), path = `learning.conceptSnapshot.concepts[${i}]`;
    if (concept.kind === "assessment") {
      array(concept.evidence).forEach((value, j) => {
        const evidence = object(value);
        for (const key of ["first", "latest"]) add(object(evidence[key]).sourceId, "assessment", `${path}.evidence[${j}].${key}`);
      });
    } else if (concept.kind === "implementation") {
      const implementation = object(concept.implementation);
      array(implementation.sourceIds).forEach(id => add(id, "implementation", `${path}.implementation`));
      add(object(implementation.lastTest).sourceId, "implementation", `${path}.implementation.lastTest`);
      array(implementation.observedHints).forEach((row, j) =>
        add(object(row).sourceId, "implementation", `${path}.implementation.observedHints[${j}]`));
    }
  });
  // Old persisted snapshots have no goal row ID. Give that exact snapshot a local
  // reference, without querying a newer goal or inventing a historical database ID.
  if (input.bigGoal) add(input.bigGoal.sourceId ?? "feedback:big-goal", "big_goal", "bigGoal");
  return [...sources.values()];
}

/** Hydrate old persisted inputs before prompting; a supplied registry cannot add IDs. */
export function prepareEvidenceInput(input: Input): Input & { evidenceSources: EvidenceSource[] } {
  const evidenceSources = buildEvidenceSources(input);
  // PostgreSQL JSONB may reorder object keys; compare values, not serialization.
  if (input.evidenceSources !== undefined && (!Array.isArray(input.evidenceSources) ||
      input.evidenceSources.length !== evidenceSources.length || input.evidenceSources.some((value, i) => {
        const source = object(value), expected = evidenceSources[i];
        return Object.keys(source).length !== 3 || source.sourceId !== expected.sourceId || source.kind !== expected.kind || source.path !== expected.path;
      }))) {
    throw new Error("INVALID_EVIDENCE_SOURCES");
  }
  const goalSource = evidenceSources.find(source => source.kind === "big_goal");
  return { ...input, evidenceSources, bigGoal: input.bigGoal && goalSource ? { ...input.bigGoal, sourceId: goalSource.sourceId } : input.bigGoal };
}

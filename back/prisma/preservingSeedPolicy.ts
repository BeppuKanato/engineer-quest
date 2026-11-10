const masterModels = new Set(["Course", "CourseCategory", "CourseCategoryMap", "Mission", "MissionActivity", "Achievement", "KnowledgeCard", "KnowledgeCardPhaseScheduleEntry", "CreateQuest", "CreateQuestRequirement", "CreateQuestCourse"]);
const readOperations = new Set(["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy"]);

export function assertPreservingSeedOperation(model: string, operation: string) {
  if (operation === "delete" || operation === "deleteMany" || (!masterModels.has(model) && !readOperations.has(operation))) {
    throw new Error(`Preserving seed blocked ${model}.${operation}`);
  }
}

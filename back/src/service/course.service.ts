/** Course一覧をPrismaから組み立てる。単元としての進捗は新フローの進捗モデル（#78）で接続する。 */
import { CourseCategoryType, CourseDifficulty } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  CourseCategory,
  Difficulty,
  GetCoursesResponse,
} from "../types/course.types";

/** 関連コースの定義を逆引きする。所持カードや達成状況には依存しない読み取り専用の導線。 */
export async function getRelatedCreateQuestsByCourseId(courseId: string) {
  const items = await prisma.createQuest.findMany({
    where: { isPublished: true, relatedCourses: { some: { courseId, course: { isPublished: true } } } },
    select: { id: true, title: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return { items };
}

const toDifficulty = (difficulty: CourseDifficulty): Difficulty => {
  switch (difficulty) {
    case CourseDifficulty.EASY:
      return "easy";
    case CourseDifficulty.NORMAL:
      return "normal";
    case CourseDifficulty.HARD:
      return "hard";
  }
};

const toCourseCategory = (category: CourseCategoryType): CourseCategory => {
  switch (category) {
    case CourseCategoryType.GAME:
      return "game";
    case CourseCategoryType.ALGORITHM:
      return "algorithm";
    case CourseCategoryType.TOOL:
      return "tool";
    case CourseCategoryType.UI:
      return "ui";
    case CourseCategoryType.DATA:
      return "data";
    case CourseCategoryType.SORT:
      return "sort";
    case CourseCategoryType.SEARCH:
      return "search";
    case CourseCategoryType.GRAPH:
      return "graph";
    case CourseCategoryType.DATA_STRUCTURE:
      return "data_structure";
    case CourseCategoryType.DYNAMIC_PROGRAMMING:
      return "dynamic_programming";
  }
};

export const getCoursesByUserId = async (
  userId: string
): Promise<GetCoursesResponse> => {
  void userId;
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // 進捗は新フローの単元進捗が正本になる（#78）。それまでは未開始として返す。
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    categories: course.categories.map((categoryMap) =>
      toCourseCategory(categoryMap.category.name)
    ),
    difficulty: toDifficulty(course.difficulty),
    status: "not_started" as const,
    progressRate: 0,
  }));
};

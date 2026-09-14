export type LessonCompleteLesson = {
  id: string;
  title: string;
  rewardExp: number;
  learnedItems: string[];
};

export type NextLesson = {
  id: string;
  title: string;
};

/** `GET /missions/lesson/:lessonId/complete` の互換レスポンス型。 */
export type LessonCompleteData = {
  missionId: string;
  lesson: LessonCompleteLesson;
  nextLesson: NextLesson | null;
  completedLessonCount: number;
  totalLessonCount: number;
};

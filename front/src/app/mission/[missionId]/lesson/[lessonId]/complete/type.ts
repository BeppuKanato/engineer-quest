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

export type LessonCompleteData = {
  missionId: string;
  lesson: LessonCompleteLesson;
  nextLesson: NextLesson | null;
  completedLessonCount: number;
  totalLessonCount: number;
};
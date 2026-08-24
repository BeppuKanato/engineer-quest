import type { CourseExamFeedbackActionType } from "./courseExamFeedback.schema";

type ActionDefinition = {
  actionType: Exclude<CourseExamFeedbackActionType, "NO_APP_ACTION">;
  label: string;
  description: string;
};

export const COURSE_EXAM_FEEDBACK_ACTION_CATALOG: Record<
  ActionDefinition["actionType"],
  ActionDefinition
> = {
  RETRY_COURSE_EXAM: {
    actionType: "RETRY_COURSE_EXAM",
    label: "コース完了試験に再挑戦する",
    description: "今回と同じコース完了試験へ再挑戦する。",
  },
  SOLVE_PRACTICE_PROBLEM: {
    actionType: "SOLVE_PRACTICE_PROBLEM",
    label: "練習問題に取り組む",
    description: "利用可能な練習問題に取り組む。",
  },
  CREATE_LEARNING_MEMO: {
    actionType: "CREATE_LEARNING_MEMO",
    label: "学習メモを作成する",
    description: "クエストボードに学習内容をメモとして投稿する。",
  },
  CREATE_QUESTION_POST: {
    actionType: "CREATE_QUESTION_POST",
    label: "質問を投稿する",
    description: "クエストボードに質問を投稿する。",
  },
  CREATE_ERROR_HELP_POST: {
    actionType: "CREATE_ERROR_HELP_POST",
    label: "エラー相談を投稿する",
    description: "クエストボードにエラー相談を投稿する。",
  },
  CREATE_WORK_POST: {
    actionType: "CREATE_WORK_POST",
    label: "作品を共有する",
    description: "作成済みの作品をクエストボードで共有する。",
  },
  VIEW_BOARD_POSTS: {
    actionType: "VIEW_BOARD_POSTS",
    label: "クエストボードを見る",
    description: "クエストボードの投稿を閲覧する。",
  },
  ANSWER_BOARD_POST: {
    actionType: "ANSWER_BOARD_POST",
    label: "投稿へ回答する",
    description: "回答可能なクエストボード投稿へ回答する。",
  },
  REVIEW_KNOWLEDGE_CARDS: {
    actionType: "REVIEW_KNOWLEDGE_CARDS",
    label: "知識カードを復習する",
    description: "獲得済みの知識カードを確認して復習する。",
  },
  VIEW_ACHIEVEMENTS: {
    actionType: "VIEW_ACHIEVEMENTS",
    label: "実績を見る",
    description: "実績一覧と達成状況を確認する。",
  },
  SET_TARGET_ACHIEVEMENT: {
    actionType: "SET_TARGET_ACHIEVEMENT",
    label: "目標実績を設定する",
    description: "次に目指す実績を設定する。",
  },
  USE_BADGE_TICKET: {
    actionType: "USE_BADGE_TICKET",
    label: "バッジチケットを使う",
    description: "所持しているバッジチケットを使用する。",
  },
  VIEW_BADGE_COLLECTION: {
    actionType: "VIEW_BADGE_COLLECTION",
    label: "バッジコレクションを見る",
    description: "獲得済みバッジと未獲得バッジを確認する。",
  },
  SET_PROFILE_BADGE: {
    actionType: "SET_PROFILE_BADGE",
    label: "プロフィールバッジを設定する",
    description: "獲得済みバッジをプロフィールに設定する。",
  },
  VIEW_PROFILE: {
    actionType: "VIEW_PROFILE",
    label: "プロフィールを見る",
    description: "自分のプロフィールと学習状況を確認する。",
  },
};

export const getAvailableCourseExamFeedbackActions = ({
  hasWork,
  hasKnowledgeCard,
  badgeTickets,
  ownedBadgeCount,
  publishedBadgeCount,
}: {
  hasWork: boolean;
  hasKnowledgeCard: boolean;
  badgeTickets: number;
  ownedBadgeCount: number;
  publishedBadgeCount: number;
}) => {
  const actionTypes: ActionDefinition["actionType"][] = [
    "RETRY_COURSE_EXAM",
    "CREATE_LEARNING_MEMO",
    "CREATE_QUESTION_POST",
    "CREATE_ERROR_HELP_POST",
    "VIEW_BOARD_POSTS",
    "VIEW_ACHIEVEMENTS",
    "SET_TARGET_ACHIEVEMENT",
    "VIEW_BADGE_COLLECTION",
    "VIEW_PROFILE",
  ];
  if (hasWork) actionTypes.push("CREATE_WORK_POST");
  if (hasKnowledgeCard) actionTypes.push("REVIEW_KNOWLEDGE_CARDS");
  if (badgeTickets > 0 && ownedBadgeCount < publishedBadgeCount) {
    actionTypes.push("USE_BADGE_TICKET");
  }
  if (ownedBadgeCount > 0) actionTypes.push("SET_PROFILE_BADGE");
  return actionTypes.map((type) => COURSE_EXAM_FEEDBACK_ACTION_CATALOG[type]);
};


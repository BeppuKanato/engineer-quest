/**
 * 大目標モデルの型と表示文（Issue #365）。
 * 正本：実装仕様「2026-11-10_大目標モデル実装仕様」1章（型カタログ）。
 * 大目標は型のインスタンスとしてのみ作る。表示文は表示にだけ使い、
 * 達成判定には決して使わない（判定は params の条件で行う）。
 */
import { BigGoalType } from "@prisma/client";

/** 到達型の挑戦条件。指定した項目すべてを単元完了と一体で判定する。 */
export type UnitCompletionChallenge = {
  /** フェーズ7の入力レベル指定（"full" = 全部書く） */
  inputLevel?: "full" | "skeleton" | "fill-in";
  /** ヒントなしで完了すること */
  noHint?: boolean;
  /** 確認・応用問題の初回正答率の下限（0〜1） */
  minFirstAttemptRate?: number;
};

export type UnitCompletionParams = {
  courseId: string;
  challenge?: UnitCompletionChallenge;
};

export type AchievementGoalParams = {
  achievementId: string;
};

export type CreateQuestGoalParams = {
  /** 対象アルゴリズムに対応する単元（課題は関連単元で対応づける） */
  algorithmCourseId: string;
  count: number;
};

export type IntegrationGoalParams = {
  courseIds: string[];
  budgetLevel: string;
  count: number;
};

export type SharingGoalParams = {
  /** 紐づけ成果物＝完了した作る課題 */
  artifactQuestId: string;
};

export type RetentionGoalParams = {
  courseId: string;
};

export type BigGoalParamsByType = {
  UNIT_COMPLETION: UnitCompletionParams;
  ACHIEVEMENT: AchievementGoalParams;
  CREATE_QUEST: CreateQuestGoalParams;
  INTEGRATION: IntegrationGoalParams;
  SHARING: SharingGoalParams;
  RETENTION: RetentionGoalParams;
};

export type BigGoalParams = BigGoalParamsByType[BigGoalType];

/**
 * 型カタログ。activated=false の型は枠だけ用意し、前提（予算つき課題／
 * 2値スクリーン／確認問題の仕組み）が揃うまで候補に出さない。
 */
export const BIG_GOAL_TYPE_CATALOG: Record<
  BigGoalType,
  { label: string; definition: string; activated: boolean }
> = {
  UNIT_COMPLETION: {
    label: "単元到達型",
    definition:
      "対象単元を完了する。挑戦条件（フェーズ7の入力レベル、ヒントなし、初回正答率の下限）がある場合は、単元の完了と挑戦条件の充足を一体で判定する。",
    activated: true,
  },
  ACHIEVEMENT: {
    label: "実績型",
    definition: "指定の実績を獲得する。",
    activated: true,
  },
  CREATE_QUEST: {
    label: "応用型",
    definition:
      "作るで対象アルゴリズムの課題を指定件数だけ完了する（完了にはテスト合格が内包される）。",
    activated: true,
  },
  INTEGRATION: {
    label: "統合型",
    definition:
      "対象単元群について、作るの課題で操作回数の予算内に収まる解法を指定件数だけ提出する。操作回数は比較・交換・ステップ回数と入力サイズに対する伸びで測り、実時間は使わない。",
    activated: false,
  },
  SHARING: {
    label: "共有型",
    definition:
      "検証可能な成果物（完了した作るの課題とその解法）を紐づけた投稿が、LLM の2値スクリーンを通過する。投稿件数は条件にしない。",
    activated: false,
  },
  RETENTION: {
    label: "定着型",
    definition:
      "対象単元のカード内容について、間隔を空けて出題される確認問題に正解する。",
    activated: false,
  },
};

export type BigGoalDisplayNames = {
  courseTitle?: string;
  achievementTitle?: string;
  courseTitles?: string[];
};

const inputLevelLabel = (level: string) =>
  level === "full"
    ? "フェーズ7は全部書く書き方"
    : level === "skeleton"
      ? "フェーズ7は骨格から書く書き方"
      : "フェーズ7は穴埋めで書く書き方";

/**
 * 表示文は型ごとのテンプレートにパラメータを埋めて作る（仕様1章の仮置き）。
 * 目標の表示・提案に所要日数・期限などの時間指定は付けない。
 */
export function buildBigGoalDisplayText(
  type: BigGoalType,
  params: BigGoalParams,
  names: BigGoalDisplayNames
): string {
  switch (type) {
    case "UNIT_COMPLETION": {
      const p = params as UnitCompletionParams;
      const title = names.courseTitle ?? p.courseId;
      const parts: string[] = [];
      if (p.challenge?.inputLevel) parts.push(inputLevelLabel(p.challenge.inputLevel));
      if (p.challenge?.noHint) parts.push("ヒントなし");
      if (p.challenge?.minFirstAttemptRate !== undefined)
        parts.push(
          `確認・応用問題の初回正答率${Math.round(p.challenge.minFirstAttemptRate * 100)}%以上`
        );
      return parts.length
        ? `${title}の単元を完了する（${parts.join("、")}）`
        : `${title}の単元を完了する`;
    }
    case "ACHIEVEMENT": {
      const p = params as AchievementGoalParams;
      return `実績「${names.achievementTitle ?? p.achievementId}」を獲得する`;
    }
    case "CREATE_QUEST": {
      const p = params as CreateQuestGoalParams;
      const title = names.courseTitle ?? p.algorithmCourseId;
      return `作るで${title}の課題を${p.count}件完了する`;
    }
    case "INTEGRATION": {
      const p = params as IntegrationGoalParams;
      const titles = names.courseTitles ?? p.courseIds;
      return `${titles.join("と")}の使い分け課題を、操作回数の予算内で${p.count}件提出する`;
    }
    case "SHARING":
      return "作ったものを掲示板で共有する";
    case "RETENTION": {
      const p = params as RetentionGoalParams;
      const title = names.courseTitle ?? p.courseId;
      return `${title}のカード内容の確認問題に正解する`;
    }
  }
  throw new Error("UNKNOWN_BIG_GOAL_TYPE");
}

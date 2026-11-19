-- 既存カードと所持履歴を保持し、対応なしの空配列で追加する。
ALTER TABLE "KnowledgeCard" ADD COLUMN "relatedCreateQuestIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

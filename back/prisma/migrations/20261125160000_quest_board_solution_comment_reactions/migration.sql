-- 掲示板再設計の移植：解決した回答の指定と、回答へのリアクション
ALTER TABLE "QuestComment" ADD COLUMN "isSolution" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "QuestCommentReactionType" AS ENUM ('HELPFUL', 'THANKS');

CREATE TABLE "QuestCommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "QuestCommentReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestCommentReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestCommentReaction_commentId_userId_type_key" ON "QuestCommentReaction"("commentId", "userId", "type");
CREATE INDEX "QuestCommentReaction_commentId_idx" ON "QuestCommentReaction"("commentId");
CREATE INDEX "QuestCommentReaction_userId_idx" ON "QuestCommentReaction"("userId");
CREATE INDEX "QuestCommentReaction_type_idx" ON "QuestCommentReaction"("type");

ALTER TABLE "QuestCommentReaction" ADD CONSTRAINT "QuestCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "QuestComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestCommentReaction" ADD CONSTRAINT "QuestCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

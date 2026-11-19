import assert from "node:assert/strict";
import { AchievementRarity, QuestPostCategory, QuestPostStatus, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { addQuestCommentByFirebaseUid, getQuestPostByFirebaseUid, listQuestPostsByFirebaseUid } from "../service/questBoard.service";

const selectedAchievement = { title: "学びをつなぐ人", rarity: AchievementRarity.RARE, iconKey: "course" };
const author: { displayName: string | null; selectedMascotId: string; selectedProfileAchievement: typeof selectedAchievement } = { displayName: "投稿者", selectedMascotId: "penguin", selectedProfileAchievement: selectedAchievement };
const noAchievement = { displayName: "コメントの人", selectedMascotId: "owl", selectedProfileAchievement: null };
const date = new Date("2026-11-19T00:00:00Z");
const posts = [author, noAchievement, author].map((user, index) => ({
  id: `post-${index}`, userId: `author-${index}`, user,
  category: QuestPostCategory.QUESTION, status: QuestPostStatus.OPEN,
  title: index === 2 ? "この投稿は削除されました" : "投稿のタイトル",
  body: index === 2 ? "この投稿は削除されました" : "投稿の本文です。",
  code: null, referenceUrl: null, courseId: null, course: null,
  createdAt: date, updatedAt: date, comments: [], reactions: [],
}));
const comment = { id: "comment", body: "コメントです。", user: noAchievement, createdAt: date, updatedAt: date };
const expectedSelect = { displayName: true, selectedMascotId: true, selectedProfileAchievement: { select: { title: true, rarity: true, iconKey: true } } };
Object.assign(prisma.user, { findUnique: async () => ({ id: "viewer" }) });
Object.assign(prisma.questPost, {
  findMany: async (args: Prisma.QuestPostFindManyArgs) => {
    assert.deepEqual(args.include?.user, { select: expectedSelect });
    assert.equal(args.where?.visibility, "PUBLIC");
    return posts;
  },
  findFirst: async (args: Prisma.QuestPostFindFirstArgs) => {
    const post = posts.find((entry) => entry.id === args.where?.id);
    if (args.select) return post;
    assert.deepEqual(args.include?.user, { select: expectedSelect });
    assert.deepEqual(args.include?.comments && typeof args.include.comments === "object" && args.include.comments.include?.user, { select: expectedSelect });
    return post ? { ...post, comments: post.id === "post-0" ? [comment] : [] } : null;
  },
});
Object.assign(prisma.questComment, { create: async (args: Prisma.QuestCommentCreateArgs) => {
  assert.deepEqual(args.include?.user, { select: expectedSelect });
  assert.deepEqual(args.data, { postId: "post-0", userId: "viewer", body: "新しいコメント" });
  return { ...comment, body: "新しいコメント", user: author };
} });

async function main() {
  try {
    const list = await listQuestPostsByFirebaseUid({ firebaseUid: "fixture" });
    assert.equal(list.posts[0].authorMascotId, "penguin");
    assert.deepEqual(list.posts[0].authorAchievement, selectedAchievement);
    assert.equal(list.posts[1].authorMascotId, "owl");
    assert.equal(list.posts[1].authorAchievement, null);
    for (const post of list.posts) assert(!("user" in post), "Raw user data must not be returned");
    const detail = await getQuestPostByFirebaseUid({ firebaseUid: "fixture", postId: "post-0" });
    assert.deepEqual(detail.post.authorAchievement, selectedAchievement);
    assert.equal(detail.post.comments[0].authorMascotId, "owl");
    assert.equal(detail.post.comments[0].authorAchievement, null);
    assert.equal(detail.post.comments[0].authorName, "コメントの人");
    const added = await addQuestCommentByFirebaseUid({ firebaseUid: "fixture", postId: "post-0", body: " 新しいコメント " });
    assert.equal(added.comment.authorMascotId, "penguin");
    assert.deepEqual(added.comment.authorAchievement, selectedAchievement);
    const deletedDetail = await getQuestPostByFirebaseUid({ firebaseUid: "fixture", postId: "post-2" });
    for (const deleted of [list.posts[2], deletedDetail.post]) {
      assert.equal(deleted.authorName, "削除済み投稿");
      assert.equal(deleted.authorMascotId, null);
      assert.equal(deleted.authorAchievement, null);
      assert.equal(deleted.isOwner, false);
      assert.equal(deleted.canResolve, false);
      assert(!JSON.stringify(deleted).includes("penguin"));
      assert(!JSON.stringify(deleted).includes(selectedAchievement.title));
    }
    author.displayName = null;
    const unnamed = await listQuestPostsByFirebaseUid({ firebaseUid: "fixture" });
    assert.equal(unnamed.posts[0].authorName, "学習者");
    console.log("Quest board authors: list/detail/existing and new comments, null achievement, Japanese fallback, limited select, unchanged comment payload and deleted-author redaction passed.");
  } finally { await prisma.$disconnect(); }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });

import { aggregateConcepts, conceptDefinitions } from "./feedbackConcepts";
import { deriveLevel } from "./profile.service";
import { summarizeReaction } from "./feedbackV1.observation";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { getAchievementsByUser } from "./achievement.service";
import { HEXAD_FEEDBACK_EXPERIMENT_KEY } from "./experimentAssignment.service";
import { evaluateBigGoal } from "./bigGoal.evaluate";
import { getActiveBigGoal, loadBigGoalFacts } from "./bigGoal.service";
import type { BigGoalParams } from "./bigGoal.types";
import type { Action, BigGoalInput, Input, Target } from "./feedbackV1.engine";

/**
 * 分析段へ渡す大目標ブロックを組み立てる（Issue #368、実装仕様6.1）。
 * 渡すのはアクティブな大目標1つだけ。終了した目標の履歴は渡さない。
 * 進捗は生成時点の実態データからコード側で計算し直す（部分充足の内訳）。
 * 大目標が無い学習者では null とし、従来どおり目標ブロックなしで生成する。
 */
async function buildBigGoalInput(userId: string): Promise<BigGoalInput | null> {
  const goal = await getActiveBigGoal(userId);
  if (!goal) return null;
  const params = (goal.params ?? {}) as BigGoalParams;
  const facts = await loadBigGoalFacts(userId, goal.type, params);
  const evaluation = evaluateBigGoal(goal.type, params, facts);
  return {
    displayText: goal.displayText,
    type: goal.type,
    condition: params as Record<string, unknown>,
    progress: {
      outcome: evaluation.outcome,
      fraction: evaluation.fraction,
      detail: evaluation.detail,
      requirements: evaluation.requirements,
    },
    status: goal.status,
    confirmedAt: goal.confirmedAt?.toISOString() ?? null,
    daysSinceConfirmed: goal.confirmedAt
      ? Math.max(0, Math.floor((Date.now() - goal.confirmedAt.getTime()) / 86_400_000))
      : null,
  };
}

// Preserve cross-kind chronology without supplying elapsed time as an ability signal.
const sequence = (rows: { id: string; type: string; at: Date | undefined }[]) => rows
  .sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0) || a.id.localeCompare(b.id))
  .map(({ id, type }, index) => ({ id, type, order: index + 1 }));

const withoutFields = (value: object, fields: string[]) =>
  Object.fromEntries(Object.entries(value).filter(([key]) => !fields.includes(key)));

const definitions = [
  ["新しい単元を始める", "新しい知識・技能の習得", "未着手の公開単元がある"],
  ["途中の単元を再開する", "学習の継続", "開始済み未完了の単元がある"],
  ["完了済み単元を復習する", "知識の再整理・定着", "完了済みの単元がある"],
  ["単元のフェーズを復習する", "理解が不確かな点の補強", "完了済みフェーズが閲覧可能"],
  ["自分で実装に取り組む・再挑戦する", "自力での実装と理解の確認", "フェーズ7（自分で実装）が解放済み"],
  ["新しい作る課題を始める", "学んだ知識の応用", "未着手の公開課題"],
  ["途中の作る課題を再開する", "実装の継続・完成への取り組み", "開始済み未完了で保存コードから再開可能"],
  ["提出済みの作る課題を改善する", "実装の改善・応用の深化", "提出済みで再編集可能。未達要件への挑戦は未達がある場合だけ"],
  ["関連する知識カードで復習する", "関連知識の確認・整理", "獲得済みで内容閲覧可能"],
  ["知識カードで関連知識や用途を知る", "学習範囲の拡張・興味の探索", "獲得済みで内容閲覧可能。閲覧済みも可"],
  ["カードの収集状況を確認する", "収集の楽しさ・達成の実感", "1枚以上獲得済み"],
  ["学習履歴を振り返る", "取り組みの振り返り・進捗の実感", "表示できる完了・提出・獲得履歴がある"],
  ["実績・進捗を確認する", "達成の意味の確認・次の見通しの形成", "獲得済みまたは非秘密の条件公開実績がある"],
  ["目標実績を設定する", "自分で目標を選ぶ・取り組みの方向付け", "未獲得・非秘密で現在の目標と異なる"],
  ["XP・レベルを確認する", "学習に伴う進展の可視化・達成の実感", "本人のXPを表示可能"],
  ["作るの自己ベスト・提出状況を確認する", "応用課題への取り組みの振り返り", "開始済み課題がある"],
  ["関連する掲示板投稿を読む", "他者の視点・知識との接点を得る", "閲覧可能な公開投稿がある"],
  ["掲示板に質問する", "疑問の明確化・援助の要請", "質問フォームが利用可能。具体的疑問がある場合に推薦"],
  ["エラーについて相談する", "問題の切り分け・解決に向けた援助の要請", "エラー相談フォームが利用可能"],
  ["学習メモを掲示板に投稿する", "学習内容の言語化・整理と共有", "公開メモフォームが利用可能"],
  ["作ったものを共有する", "成果の説明・知識や工夫の共有", "共有可能な保存コードまたは提出作品がある"],
  ["他の人の投稿へ返信する", "他者への支援・説明を通じた理解の整理", "他者の公開・返信可能投稿がある"],
  ["次のフェーズへ進む", "学習の継続", "現在のフェーズの次のフェーズがある"],
];
export async function buildFeedbackV1Context(firebaseUid: string, kind: "mission" | "create" | "phase" | "unit", eventId: string) {
  const user = await prisma.user.findUnique({ where: { firebaseUid }, include: { hexadResponse: true, experimentAssignments: { where: { experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY } } } });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  const assignment = user.experimentAssignments[0];
  if (!assignment) throw new AppError(409, "EXPERIMENT_ASSIGNMENT_REQUIRED", "Experiment assignment required");
  if (assignment.condition === "PERSONALIZED" && !user.hexadResponse) throw new AppError(409, "HEXAD_RESPONSE_REQUIRED", "HEXAD required");
  const cutoff = new Date();
  let learning: unknown;
  let stageGoals: Input["stageGoals"] = null;
  // Set for the new-flow kinds; the phase event may name the next phase so the
  // "proceed" action (id 23) can be offered with a concrete target.
  let phaseEvent: { courseId: string; phaseKey: string; nextPhaseKey: string | null } | null = null;
  if (kind === "mission") {
    // Mission completion events no longer exist; mission-kind feedback is redefined with the new flow.
    throw new AppError(404, "EVENT_NOT_FOUND", "Completion event not found");
  } else if (kind === "phase" || kind === "unit") {
    const courseId = kind === "unit" ? eventId : eventId.split(":")[0];
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } });
    if (!course) throw new AppError(404, "EVENT_NOT_FOUND", "Unit not found");
    const [unitRow, phaseRows] = await Promise.all([
      prisma.unitLearningProgress.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } }),
      prisma.phaseLearningProgress.findMany({ where: { userId: user.id, courseId }, orderBy: [{ startedAt: "asc" }, { id: "asc" }] }),
    ]);
    const answerEvents = await prisma.learningEvent.findMany({ where: { userId: user.id, courseId, serverTimestamp: { lte: cutoff }, eventType: { in: ["answer_attempt", "assessment_snapshot", "assessment_evidence_missing", "implementation_test_result", "hint_open", "implementation_level_select", "implementation_complete"] } } });
    const conceptSnapshot = aggregateConcepts(courseId, answerEvents, phaseRows, crypto.randomUUID());
    const phases = phaseRows.map(p => ({ id: p.phaseKey, status: p.status, summary: p.summary ?? null }));
    const phaseSequence = sequence(phaseRows.filter(p => p.completedAt).map(p => ({ id: p.phaseKey, type: "phase", at: p.completedAt ?? undefined })));
    if (kind === "unit") {
      if (!unitRow || unitRow.status !== "COMPLETED") throw new AppError(404, "EVENT_NOT_FOUND", "Completion event not found");
      stageGoals = { current: { phaseKey: null, goal: "単元で確認できた内容を振り返り、次の学習方法を選ぶ" }, next: null };
      learning = { id: `unit-event:${courseId}`, unit: { id: course.id, title: course.title, status: unitRow.status }, conceptSnapshot, sequence: phaseSequence, phases };
    } else {
      const [, phaseKey, nextPhaseKey] = eventId.split(":");
      const current = phaseRows.find(p => p.phaseKey === phaseKey);
      if (!current || current.status !== "COMPLETED") throw new AppError(404, "EVENT_NOT_FOUND", "Completion event not found");
      const unitDefinition = conceptDefinitions.find(u=>u.courseId===courseId);
      const phaseIndex = unitDefinition?.phases.findIndex(p=>p.id===phaseKey) ?? -1;
      const allowedNext = phaseIndex >= 0 ? unitDefinition?.phases[phaseIndex+1]?.id ?? null : null;
      phaseEvent = { courseId, phaseKey, nextPhaseKey: allowedNext };
      if (nextPhaseKey && nextPhaseKey !== allowedNext) throw new AppError(400, "INVALID_NEXT_PHASE", "Invalid next phase");
      const currentStage = unitDefinition?.phases[phaseIndex];
      const nextStage = unitDefinition?.phases[phaseIndex+1];
      stageGoals = currentStage ? { current: {phaseKey,goal:currentStage.formalName}, next: nextStage ? {phaseKey:nextStage.id,goal:nextStage.formalName} : null } : null;
      learning = { id: `phase-event:${courseId}:${phaseKey}`, unit: { id: course.id, title: course.title, status: unitRow?.status ?? "IN_PROGRESS" }, conceptSnapshot, sequence: phaseSequence, phases, currentPhase: { id: phaseKey, stageNumber: unitDefinition?.phases.find(p=>p.id===phaseKey)?.phase ?? null, stageGoal: unitDefinition?.phases.find(p=>p.id===phaseKey)?.formalName ?? null, nextStage: unitDefinition?.phases[phaseIndex+1]?.formalName ?? null, summary: current.summary ?? null } };
    }
  } else {
    const event = await prisma.createQuestSubmission.findFirst({ where: { id: eventId, attempt: { userId: user.id } }, include: { attempt: { include: { quest: { include: { requirements: true } }, executions: { orderBy: { executedAt: "asc" } }, hintViews: { orderBy: { viewedAt: "asc" } }, submissions: { orderBy: { submittedAt: "asc" } } } } } });
    if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Submission not found");
    const a = event.attempt;
    learning = { sequence: sequence([
      ...a.executions.map(t => ({ id: t.id, type: "test", at: t.executedAt })), ...a.hintViews.map(t => ({ id: t.id, type: "hint", at: t.viewedAt })), ...a.submissions.map(t => ({ id: t.id, type: "submission", at: t.submittedAt })),
    ]), currentQuest: a.quest, selectedRequirementIds: a.selectedRequirementIds, tests: a.executions.map(v => withoutFields(v, ["executedAt"])), hints: a.hintViews.map(v => withoutFields(v, ["viewedAt"])), submissions: a.submissions.map(v => withoutFields(v, ["submittedAt"])) };
  }
  const [courseRows, quests, cards, achievements, posts, history, allUnitRows, allPhaseRows, bigGoal] = await Promise.all([
    prisma.course.findMany({ where: { isPublished: true }, select: { id: true, title: true } }),
    prisma.createQuest.findMany({ where: { isPublished: true }, include: { attempts: { where: { userId: user.id }, select: { status: true, bestScore: true, code: true } }, relatedCourses: true, requirements: { select: { id: true, title: true, description: true, kind: true } } } }),
    prisma.knowledgeCard.findMany({ where: { isPublished: true, userKnowledgeCards: { some: { userId: user.id } } } }),
    prisma.achievement.findMany({ where: { OR: [{ isSecret: false }, { userAchievements: { some: { userId: user.id } } }] }, include: { userAchievements: { where: { userId: user.id }, select: { id: true } } } }),
    prisma.questPost.findMany({ where: { visibility: "PUBLIC" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { comments: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } } }),
    prisma.feedbackV1.findMany({ where: { userId: user.id, createdAt: { gte: assignment.assignedAt, lte: cutoff } }, orderBy: { createdAt: "asc" }, select: { id: true, result: true, interactions: true, status: true } }),
    prisma.unitLearningProgress.findMany({ where: { userId: user.id } }),
    prisma.phaseLearningProgress.findMany({ where: { userId: user.id } }),
    buildBigGoalInput(user.id),
  ]);
  const legacyWhere = { createdAt: { gte: assignment.assignedAt, lte: cutoff } };
  const legacyCreateHistory = await prisma.createQuestFeedback.findMany({ where: { ...legacyWhere, submission: { attempt: { userId: user.id } } }, select: { id: true, actionType: true, status: true, generatedAt: true } });
  const achievementProgress = await getAchievementsByUser(user);
  // Legacy courses/missions no longer exist. Unit actions (ids 1-4) take their
  // targets from the new-flow progress tables below; action ids are not renumbered.
  const courses = courseRows.map(c => ({ id: c.id, status: "not_started", missions: [] as never[] }));
  const units = courseRows.map(c => {
    const unitRow = allUnitRows.find(r => r.courseId === c.id);
    return { id: c.id, title: c.title, status: unitRow?.status ?? "NOT_STARTED", phases: allPhaseRows.filter(p => p.courseId === c.id).map(p => ({ id: p.phaseKey, status: p.status })) };
  });
  const targets: Record<number, Target[]> = Object.fromEntries(definitions.map((_, i) => [i + 1, []]));
  const add = (id: number, targetId: string, href: string) => targets[id].push({ id: targetId, href });
  if (kind === "unit") {
    for (const u of units) {
      if (u.status === "NOT_STARTED") add(1, u.id, `/courses/roadmap/${encodeURIComponent(u.id)}`);
      if (u.status === "IN_PROGRESS") add(2, u.id, `/courses/roadmap/${encodeURIComponent(u.id)}/learn`);
      if (u.status === "COMPLETED") add(3, u.id, `/courses/roadmap/${encodeURIComponent(u.id)}`);
    }
    for (const p of allPhaseRows.filter(p => p.status === "COMPLETED")) add(4, `${p.courseId}:${p.phaseKey}`, `/courses/roadmap/${encodeURIComponent(p.courseId)}/learn?phase=${encodeURIComponent(p.phaseKey)}`);
  }
  if (kind === "phase" && phaseEvent) {
    for (const p of allPhaseRows.filter(p => p.courseId === phaseEvent.courseId && p.status === "COMPLETED")) add(4, p.phaseKey, `/courses/roadmap/${encodeURIComponent(p.courseId)}/learn?phase=${encodeURIComponent(p.phaseKey)}`);
    if (phaseEvent.nextPhaseKey) add(23, phaseEvent.nextPhaseKey, `/courses/roadmap/${encodeURIComponent(phaseEvent.courseId)}/learn?phase=${encodeURIComponent(phaseEvent.nextPhaseKey)}`);
  }
  for (const q of quests) {
    const a = q.attempts[0];
    add(!a ? 6 : a.status === "COMPLETED" ? 8 : 7, q.id, `/create/quests/${encodeURIComponent(q.id)}/work`);
    if (a) add(16, q.id, `/create/quests/${encodeURIComponent(q.id)}`);
    if (a?.code) add(21, q.id, `/quest-board/new?category=WORK_SHARE&targetId=${encodeURIComponent(q.id)}&title=${encodeURIComponent(q.title)}`);
  }
  for (const card of cards) for (const id of [9, 10]) if (kind !== "phase" || card.courseId === phaseEvent?.courseId) add(id, card.id, `/knowledge-cards?cardId=${encodeURIComponent(card.id)}`);
  if (cards.length) add(11, "collection", "/knowledge-cards");
  add(12, "history", "/history"); // The authorized completion/submission itself is a history item.
  for (const a of achievements) {
    add(13, a.id, `/achievements?focus=${encodeURIComponent(a.id)}`);
    if (!a.isSecret && !a.userAchievements.length && user.selectedTargetAchievementId !== a.id) add(14, a.id, `/achievements?focus=${encodeURIComponent(a.id)}`);
  }
  add(15, "profile", "/profile");
  for (const p of posts) {
    add(17, p.id, `/quest-board/${encodeURIComponent(p.id)}`);
    if (p.userId !== user.id) add(22, p.id, `/quest-board/${encodeURIComponent(p.id)}#reply`);
  }
  for (const [id, category] of [[18, "QUESTION"], [19, "ERROR_HELP"], [20, "MEMO"]] as const) add(id, category, `/quest-board/new?category=${category}`);
  const allActions: Action[] = definitions.map(([label, purpose, condition], i) => ({ id: i + 1, label, purpose, condition, targetIds: targets[i + 1].map(t => t.id) })).filter(a => a.targetIds.length);
  // Phase-result feedback recommends only inside the learning flow: proceed,
  // review a completed phase of this unit, or review with an acquired card.
  const actions = kind === "phase" ? allActions.filter(a => [23, 4, 9].includes(a.id)) : allActions;
  const h = user.hexadResponse;
  const hexad: Input["hexad"] = assignment.condition === "PERSONALIZED" && h ? { questionnaireVersion: h.questionnaireVersion, scoreRange: [4, 28], scores: { Philanthropist: h.philanthropistScore, Socialiser: h.socialiserScore, FreeSpirit: h.freeSpiritScore, Achiever: h.achieverScore, Disruptor: h.disruptorScore, Player: h.playerScore } } : null;
  const historyView = history.map(h => {
    const result = h.result as unknown as { selection?: { actionId: number; targetId: string | null; purpose: string; reason: string; candidates?: { actionId: number | null; targetId: string | null; capabilityId?: string | null; purpose: string; reason: string }[] }; validation?: { actionHref: string | null } } | null;
    const s = result?.selection;
    return { id: h.id, status: h.status, observation: summarizeReaction(h.interactions), recommendations: s ? (s.candidates ?? [s]).map((c,index)=>({ candidateId: `candidate-${index+1}`, actionId: c.actionId, targetId: c.targetId, purpose: c.purpose, reason: c.reason })) : [], interactions: h.interactions };
  });
  // The phase kind gets a lean state: the selection prompt carries the state, so
  // trimming it (no board posts / quest details) keeps generation fast.
  const state: Input["state"] = kind === "phase" ? {
    unit: units.find(u => u.id === phaseEvent?.courseId) ?? null,
    cards: cards.map(c => ({ id: c.id, title: c.title, acquired: true })),
    history: historyView,
  } : {
    courses, units, quests: quests.map(({ attempts, id, title, description, scenario, requirements, relatedCourses }) => ({ id, title, description, scenario, requirements, relatedCourses, attempts: attempts.map(({ code, ...a }) => ({ ...a, hasSavedCode: Boolean(code) })) })), cards: cards.map(c => ({ ...withoutFields(c, ["createdAt", "updatedAt"]), acquired: true, viewed: history.some(h => h.interactions.some(i => i.type === "ARRIVED" && (i.data as Record<string, unknown>).targetId === c.id)) ? "observed_arrival" : "not_observed" })),
    achievementProgress, achievements: achievements.map(({ userAchievements, ...a }) => ({ ...a, acquired: userAchievements.length > 0, isTarget: a.id === user.selectedTargetAchievementId })), experience: user.experience, level: deriveLevel(user.experience), legacyRecommendations: legacyCreateHistory.map(h => ({ ...h, targetId: "not_recorded", presentation: "not_observed", viewing: "not_observed", arrival: "not_observed" })),
    posts: posts.map(p => ({ id: p.id, category: p.category, title: p.title, body: p.body, code: p.code, courseId: p.courseId, isSelf: p.userId === user.id, comments: p.comments.map(c => ({ id: c.id, body: c.body, isSelf: c.userId === user.id })) })), history: historyView,
  };
  const input: Input = { learning, targets, actions, hexad, state, bigGoal, stageGoals };
  return { input, userId: user.id, condition: assignment.condition };
}

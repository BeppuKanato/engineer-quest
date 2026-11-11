"use client";
import { Alert, Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppHeader } from "@/app/component/appHeader";
import { useUserSession } from "@/app/component/userSession";
import { ApiError, fetcher } from "@/lib/fetcher";
import { completeLearningPhase, completeLearningUnit, startLearningUnit, type AchievedBigGoal, type LearningProgress, type UnlockedAchievement } from "@/api/learning.api";
import { getCurrentBigGoal, type BigGoal } from "@/api/bigGoal.api";
import { FeedbackDestination } from "@/app/component/feedbackV1";
import { auth } from "@/lib/firebase";
import { BfsUnitPreview } from "../bfs/unit/BfsUnitPreview";
import { BubbleSortUnitPreview } from "../bubble-sort/unit/BubbleSortUnitPreview";
import type { UnitPhaseSummary } from "../unit/unit.types";
import { DfsUnitPreview } from "../dfs/unit/DfsUnitPreview";
import { WallExtensionUnitPreview } from "../wall-extension/unit/WallExtensionUnitPreview";
import { MazeDiggingUnitPreview } from "../maze-digging/unit/MazeDiggingUnitPreview";
import { BinarySearchUnitPreview } from "../binary-search/unit/BinarySearchUnitPreview";
import { GreedyCoinsUnitPreview } from "../greedy-coins/unit/GreedyCoinsUnitPreview";
import { LearningRewardBoundary } from "../rewards/LearningRewardBoundary";
import { FinalLearningRewards } from "../rewards/FinalLearningRewards";
import { AchievementBand, NewAchievementZone } from "../rewards/AchievementPresentation";
import { phaseResultAchievements } from "../rewards/presentation";
import { useRewardBoundary } from "../rewards/useRewardBoundary";
import { codeDraftKey, readCodeDraft, writeCodeDraft } from "./codeDraft";
import { ProgressLoadingSkeleton } from "./ProgressLoadingSkeleton";
import { LearningRewardsContext } from "./LearningRewardsContext";
import { emptyLearningRewards, mergeLearningRewards, type LearningRewards } from "./rewards";
import { findLearningUnit, resumePhaseIndex, savedPhaseSummaries, type LearningUnit } from "./unitRegistry";
import { learningErrorMessage, useLearningProgress } from "./useLearningProgress";
import { useLearningLog } from "./useLearningLog";
import { BigGoalGate } from "./bigGoal/BigGoalGate";
import { BigGoalAchievementBand, BigGoalAchievementZone } from "./bigGoal/BigGoalAchievementBand";
import { BigGoalNextProposal } from "./bigGoal/BigGoalNextProposal";
import { bigGoalProgressFact } from "./bigGoal/bigGoalPresentation";
import { FeedbackScreen, type FeedbackGoalSummary } from "./feedback/FeedbackScreen";

export function LearningScreen({ courseId, reviewPhaseKey }: { courseId: string; reviewPhaseKey?: string }) {
  const unit = findLearningUnit(courseId), { firebaseUser } = useUserSession();
  const { progress, error, loading, reload, authenticated } = useLearningProgress(unit?.courseId);
  return <Box sx={{ height: "100dvh", minHeight: 0, display: "flex", flexDirection: "column" }}>
    <Box sx={{ flexShrink: 0 }}><AppHeader /></Box>
    <Box component={motion.main} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {!unit ? <Box sx={{ p: 3 }}><Typography>この単元は準備中です。</Typography><Button component={Link} href="/courses">コース一覧へ</Button></Box> : !authenticated && !loading ? <Button component={Link} href="/auth/login">ログインして学習する</Button> : error ?
        <Alert severity="error" action={<Button onClick={reload}>再読み込み</Button>}>{error}</Alert> : loading || !progress || !firebaseUser ? <ProgressLoadingSkeleton variant="screen" /> :
          <LearningRun key={`${firebaseUser.uid}:${courseId}`} unit={unit} progress={progress} reviewPhaseKey={reviewPhaseKey} />}
    </Box>
  </Box>;
}
function LearningRun({ unit, progress, reviewPhaseKey }: { unit: LearningUnit; progress: LearningProgress; reviewPhaseKey?: string }) {
  const { firebaseUser } = useUserSession();
  const uid = firebaseUser!.uid, courseId = unit.courseId;
  const rawLog = useLearningLog(courseId);
  const [renderedPhase, setRenderedPhase] = useState<{phaseKey:string;visit:number} | null>(null);
  const log = useCallback((event: Parameters<typeof rawLog>[0]) => {
    rawLog(event);
    if (event.eventType === "phase_start" && event.phaseKey) setRenderedPhase(current=>({phaseKey:event.phaseKey!,visit:(current?.visit ?? 0)+1}));
  }, [rawLog]);
  const [draft, setDraft] = useState<{ code?: string } | null>(null), [draftError, setDraftError] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null), [entryRevision, setEntryRevision] = useState(0);
  const [rewards, setRewards] = useState(emptyLearningRewards);
  // 実績の提示先（#333）。フェーズ結果画面用はフェーズキー別、最終リザルトの新着用は一括で持つ。
  const [phaseUnlocks, setPhaseUnlocks] = useState<Readonly<Record<string, readonly UnlockedAchievement[]>>>({});
  const [finalUnlocks, setFinalUnlocks] = useState<readonly UnlockedAchievement[]>([]);
  const { boundary, present, finish } = useRewardBoundary();
  const [finalShown, setFinalShown] = useState(false), [unitSaved, setUnitSaved] = useState(progress.unit?.status === "COMPLETED");
  const [unitError, setUnitError] = useState(false), [unitRevision, setUnitRevision] = useState(0);
  const completedUnitRequest = useRef(false);
  const next = resumePhaseIndex(unit, progress);
  const reviewIndex = unit.phases.findIndex(phase => phase.id === reviewPhaseKey);
  const initialPhase = reviewIndex >= 0 && reviewIndex <= (next ?? unit.phases.length - 1) ? reviewIndex : next;
  const getToken = useCallback(async () => {
    if (!firebaseUser || auth.currentUser?.uid !== uid) throw new Error("Session changed");
    return firebaseUser.getIdToken();
  }, [firebaseUser, uid]);
  // フィードバックの適用可否（#369）。先行生成の応答で判明するまでは unknown とし、
  // 適用されない学習者では結果画面の前進を従来のブリッジに戻す。
  const [feedbackAvailability, setFeedbackAvailability] = useState<"unknown" | "available" | "unavailable">("unknown");
  // 保存で達成した大目標（#369／#370）。提示先ごとにフェーズキー別／単元分で持つ。
  // phaseAchievedGoals は次の目標の提案を出すフィードバック画面のキー、
  // phaseGoalCelebrations は称賛を出す結果画面のキー、unitAchievedGoals は
  // 最終リザルトの称賛と単元のフィードバック画面の提案（兼用）。
  const [phaseAchievedGoals, setPhaseAchievedGoals] = useState<Readonly<Record<string, readonly AchievedBigGoal[]>>>({});
  const [phaseGoalCelebrations, setPhaseGoalCelebrations] = useState<Readonly<Record<string, readonly AchievedBigGoal[]>>>({});
  const [unitAchievedGoals, setUnitAchievedGoals] = useState<readonly AchievedBigGoal[]>([]);
  // 専用画面の大目標サマリ用。進捗の数値は API のコード計算をそのまま使う。
  const [currentGoal, setCurrentGoal] = useState<BigGoal | null>(null);
  const refreshCurrentGoal = useCallback(() => {
    void getToken().then(token => getCurrentBigGoal(token)).then(({ goal }) => {
      if (auth.currentUser?.uid === uid) setCurrentGoal(goal);
    }).catch(() => undefined);
  }, [getToken, uid]);
  useEffect(() => { refreshCurrentGoal(); }, [refreshCurrentGoal]);
  useEffect(() => { setDraft({ code: readCodeDraft(courseId, uid) }); }, [courseId, uid]);
  useEffect(() => {
    let current = true;
    setEntryError(null);
    // 開始記録は描画を待たせない（#151）。単元画面を経ない直接訪問でも開始を記録する。既に完了済みなら状態は維持する。
    // 失敗しても学習は続けられるため、警告として出し、再試行できるようにする。
    void (initialPhase === null ? Promise.resolve() : getToken().then(token => startLearningUnit(token, courseId, unit.phases[initialPhase].id))).then(() => {
      if (!current) return;
      log({ eventType: "unit_view", payload: { resume: !!progress.unit, phaseKey: initialPhase === null ? null : unit.phases[initialPhase].id } });
      if (!progress.unit) log({ eventType: "unit_start", phaseKey: unit.phases[initialPhase ?? 0].id, payload: { resume: false, direct: true } });
    }, error => { if (current) setEntryError(learningErrorMessage(error)); });
    return () => { current = false; };
  }, [getToken, courseId, unit, initialPhase, log, progress.unit, entryRevision]);
  const completePhase = useCallback(async (phaseKey: string, summary?: UnitPhaseSummary) => {
    const result = await completeLearningPhase(await getToken(), courseId, phaseKey, summary);
    if (auth.currentUser?.uid !== uid) return;
    setRewards(current => mergeLearningRewards(current, result));
    // 実績は解除されたフェーズの結果画面で提示する（#333）。最終フェーズ分は最終リザルトの新着へ。
    const forResult = phaseResultAchievements(phaseKey, unit.phases.at(-1)?.id, result.unlockedAchievements);
    if (forResult.length) setPhaseUnlocks(current => ({ ...current, [phaseKey]: [...(current[phaseKey] ?? []), ...forResult.filter(item => !(current[phaseKey] ?? []).some(x => x.id === item.id))] }));
    const forFinal = result.unlockedAchievements.filter(item => !forResult.some(x => x.id === item.id));
    if (forFinal.length) setFinalUnlocks(current => [...current, ...forFinal.filter(item => !current.some(x => x.id === item.id))]);
    // この保存で達成した大目標の提示先（#369／#370）。
    // 称賛は「その保存以降で最初に来る結果画面」へ（結果画面の無いフェーズからは
    // 次の結果画面へ持ち越し、無ければ最終リザルト）。次の目標の提案は
    // 「その保存以降で最初に来るフィードバック専用画面」へ（無ければ単元の画面）。
    // 提示先は目標IDで重複を除いて振り分けるため、同じ達成が二重に祝われたり
    // 提案が二重に出たりすることはない。
    const achieved = result.achievedBigGoals ?? [];
    if (achieved.length) {
      const phaseIndex = unit.phases.findIndex(p => p.id === phaseKey);
      const laterPhases = phaseIndex >= 0 ? unit.phases.slice(phaseIndex) : [];
      const celebrationTarget = laterPhases.find(p => p.transitionOut === "result");
      const proposalTarget = laterPhases.find(p => p.transitionOut === "result" || p.transitionOut === "result-in-phase");
      const append = (key: string) => (current: Readonly<Record<string, readonly AchievedBigGoal[]>>) => ({
        ...current,
        [key]: [...(current[key] ?? []), ...achieved.filter(goal => !(current[key] ?? []).some(x => x.id === goal.id))],
      });
      if (celebrationTarget) setPhaseGoalCelebrations(append(celebrationTarget.id));
      if (proposalTarget) setPhaseAchievedGoals(append(proposalTarget.id));
      if (!celebrationTarget || !proposalTarget) {
        setUnitAchievedGoals(current => [...current, ...achieved.filter(goal => !current.some(x => x.id === goal.id))]);
      }
    }
    refreshCurrentGoal();
    // 切れ目ダイアログは知識カード専用（#333）。提示は遷移を待たせない（#147）。エラー時はここへ到達しない。
    if (result.awardedCard) present({ phaseKey });
  }, [getToken, courseId, uid, unit, present, refreshCurrentGoal]);
  // フィードバックの先行生成（#202）と専用画面（#369）。生成の成否は学習の進行に影響させない。
  // 先行生成の応答で適用可否が判明する：割り当てなし（409）・対象イベントなし（404）は
  // unavailable とし、結果画面の前進を従来のブリッジに戻して学習者を画面に留めない。
  const startFeedback = useCallback((kind: "phase" | "unit", eventId: string) => {
    void getToken().then(token => fetcher(`/feedback-v1/${kind}/${encodeURIComponent(eventId)}`, { method: "POST", token })).then(
      () => setFeedbackAvailability("available"),
      (error: unknown) => {
        if (error instanceof ApiError && (error.status === 404 || error.status === 409)) setFeedbackAvailability("unavailable");
      },
    );
  }, [getToken]);
  const phaseFeedbackEventId = useCallback((phaseKey: string, nextPhaseKey: string | null) => `${courseId}:${phaseKey}${nextPhaseKey ? `:${nextPhaseKey}` : ""}`, [courseId]);
  const onCheckPhaseCompleted = useCallback((phaseKey: string, nextPhaseKey: string | null) => {
    startFeedback("phase", phaseFeedbackEventId(phaseKey, nextPhaseKey));
  }, [startFeedback, phaseFeedbackEventId]);
  const goalSummary: FeedbackGoalSummary | null = useMemo(() => currentGoal
    ? { displayText: currentGoal.displayText, progress: currentGoal.progress, fact: bigGoalProgressFact(currentGoal) }
    : null, [currentGoal]);
  const renderPhaseFeedbackScreen = useCallback((phaseKey: string, nextPhaseKey: string | null, nav: { goToPhase: (phaseKey: string) => void; goNext: () => void; goBack: () => void; figure: ReactNode }) => {
    const phase = unit.phases.find(item => item.id === phaseKey);
    const achieved = phaseAchievedGoals[phaseKey] ?? [];
    return <FeedbackScreen kind="phase" eventId={phaseFeedbackEventId(phaseKey, nextPhaseKey)}
      heading={phase ? `${phase.formalName}のフィードバック` : "フィードバック"}
      figure={nav.figure} goalSummary={achieved.length ? null : goalSummary}
      onAction={href => {
        if (!href) return false;
        const target = new URL(href, window.location.origin).searchParams.get("phase");
        if (!target) return false;
        if (target === nextPhaseKey) nav.goNext(); else nav.goToPhase(target);
        return true;
      }}
      onProceed={nav.goNext} proceedLabel="そのまま次へ"
      onUnavailable={() => { setFeedbackAvailability("unavailable"); nav.goNext(); }}>
      {achieved.length ? <BigGoalNextProposal achievedGoal={achieved[0]} getToken={getToken} /> : null}
    </FeedbackScreen>;
  }, [phaseFeedbackEventId, goalSummary, phaseAchievedGoals, getToken, unit]);
  const renderUnitFeedbackScreen = useCallback((nav: { goBack: () => void; figure: ReactNode }) => (
    <FeedbackScreen kind="unit" eventId={courseId} heading="単元のフィードバック"
      figure={nav.figure} goalSummary={unitAchievedGoals.length ? null : goalSummary}
      onProceed={nav.goBack} proceedLabel="結果に戻る"
      onUnavailable={() => { setFeedbackAvailability("unavailable"); nav.goBack(); }}>
      {unitAchievedGoals.length ? <BigGoalNextProposal achievedGoal={unitAchievedGoals[0]} getToken={getToken} /> : null}
    </FeedbackScreen>
  ), [courseId, goalSummary, unitAchievedGoals, getToken]);
  const onFinalResult = useCallback(() => setFinalShown(true), []);
  useEffect(() => {
    if (!finalShown || unitSaved || completedUnitRequest.current) return;
    let current = true;
    completedUnitRequest.current = true; setUnitError(false);
    void getToken().then(token => completeLearningUnit(token, courseId)).then(result => {
      if (!current) return;
      setUnitSaved(true); setRewards(rewards => mergeLearningRewards(rewards, result));
      // 単元完了で解除された実績は最終リザルトの「新しい実績」に出す（#333）。
      if (result.unlockedAchievements.length) setFinalUnlocks(current => [...current, ...result.unlockedAchievements.filter(item => !current.some(x => x.id === item.id))]);
      // 単元完了と重なって達成した大目標は、最終リザルトの称賛と単元の
      // フィードバック画面の提示につなげる（#369／#370）。最終フェーズの保存分と重複しないよう目標IDで除く。
      if (result.achievedBigGoals?.length) {
        setUnitAchievedGoals(current => [...current, ...result.achievedBigGoals!.filter(goal => !current.some(x => x.id === goal.id))]);
      }
      refreshCurrentGoal();
      log({ eventType: "unit_complete" });
      startFeedback("unit", courseId);
    }, () => { if (current) { completedUnitRequest.current = false; setUnitError(true); } });
    return () => { current = false; };
  }, [finalShown, unitSaved, courseId, getToken, log, unitRevision, startFeedback, refreshCurrentGoal]);
  const saveCode = useCallback((code: string) => setDraftError(!writeCodeDraft(courseId, uid, code)), [courseId, uid]);
  const dismissAwardedCard = useCallback((cardId: string) => setRewards(current => ({ ...current, awardedCards: current.awardedCards.filter(item => item.card.id !== cardId) })), []);
  if (!draft) return <Typography role="status">学習を開いています。</Typography>;
  // 単元コンテナは kind で出し分ける。進捗保存・下書き・学習ログ・フィードバック（#202）の経路は単元共通で、
  // コンテナ側の受け口（props の形）も単元間で同一にそろえてある。
  const unitPreviewProps = {
    embedded: true,
    initialPhaseIndex: initialPhase,
    initialFurthestIndex: next ?? unit.phases.length - 1,
    initialUnitComplete: progress.unit?.status === "COMPLETED",
    initialCompletedPhases: progress.phases.filter(phase => phase.status === "COMPLETED").map(phase => phase.phaseKey),
    initialSummaries: savedPhaseSummaries(unit, progress),
    initialCode: draft.code,
    onCodeChange: saveCode,
    // 入力量レベル別下書きの基底キー（Issue #328）。レベル対応済みの単元はこのキーからレベル別に読み書きする。
    codeDraftBaseKey: codeDraftKey(courseId, uid),
    onCodeDraftError: (failed: boolean) => setDraftError(failed),
    onPhaseComplete: completePhase,
    onFinalResult,
    onLearningEvent: log,
    rewards,
    renderRewards: (value: LearningRewards) => <FinalLearningRewards rewards={value} onEvent={log} />,
    renderPhaseAchievements: (phaseKey: string) => {
      const items = phaseUnlocks[phaseKey];
      return items?.length ? <AchievementBand items={items} phaseKey={phaseKey} onEvent={log} /> : null;
    },
    renderNewAchievements: () => finalUnlocks.length ? <NewAchievementZone items={finalUnlocks} onEvent={log} /> : null,
    renderPhaseGoalAchievement: (phaseKey: string) => {
      const goals = phaseGoalCelebrations[phaseKey];
      return goals?.length ? <BigGoalAchievementBand goals={goals} phaseKey={phaseKey} onEvent={log} /> : null;
    },
    renderFinalGoalAchievement: () => unitAchievedGoals.length ? <BigGoalAchievementZone goals={unitAchievedGoals} onEvent={log} /> : null,
    onCheckPhaseCompleted,
    feedbackEnabled: feedbackAvailability !== "unavailable",
    renderPhaseFeedbackScreen,
    renderUnitFeedbackScreen,
  };
  return <LearningRewardsContext.Provider value={{ rewards, dismissAwardedCard }}>
    <FeedbackDestination key={renderedPhase?.visit} ready={renderedPhase !== null} targetId={renderedPhase?.phaseKey}
      actualRoute={renderedPhase ? `/courses/roadmap/${encodeURIComponent(courseId)}/learn?phase=${encodeURIComponent(renderedPhase.phaseKey)}` : undefined} />
    {entryError && <Alert severity="warning" action={<Button onClick={() => setEntryRevision(value => value + 1)}>再試行</Button>}>学習の開始を記録できませんでした。学習は続けられます。{entryError}</Alert>}
    {draftError && <Alert severity="warning">このブラウザにコード下書きを保存できませんでした。</Alert>}
    {finalShown && !unitSaved && (unitError ? <Alert severity="error" action={<Button onClick={() => setUnitRevision(value => value + 1)}>再試行</Button>}>単元の完了を保存できませんでした。再試行してください。</Alert> : <Typography role="status">単元の完了を保存しています。</Typography>)}
    <BigGoalGate courseId={courseId} unitTitle={unit.title} getToken={getToken}>
      {unit.kind === "dfs" ? <DfsUnitPreview {...unitPreviewProps} /> : unit.kind === "wall-extension" ? <WallExtensionUnitPreview {...unitPreviewProps} /> : unit.kind === "bubble-sort" ? <BubbleSortUnitPreview {...unitPreviewProps} /> : unit.kind === "maze-digging" ? <MazeDiggingUnitPreview {...unitPreviewProps} /> : unit.kind === "binary-search" ? <BinarySearchUnitPreview {...unitPreviewProps} /> : unit.kind === "greedy-coins" ? <GreedyCoinsUnitPreview {...unitPreviewProps} /> : <BfsUnitPreview {...unitPreviewProps} />}
    </BigGoalGate>
    {boundary && <LearningRewardBoundary boundary={boundary} onDone={finish} onEvent={event => log({ ...event, phaseKey: typeof event.payload?.phaseKey === "string" ? event.payload.phaseKey : boundary.phaseKey })} />}
  </LearningRewardsContext.Provider>;
}

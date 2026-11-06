"use client";
import { Alert, Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/app/component/appHeader";
import { FeedbackV1 } from "@/app/component/feedbackV1";
import { useUserSession } from "@/app/component/userSession";
import { fetcher } from "@/lib/fetcher";
import { completeLearningPhase, completeLearningUnit, startLearningUnit, type LearningProgress } from "@/api/learning.api";
import { auth } from "@/lib/firebase";
import { BfsUnitPreview } from "../bfs/unit/BfsUnitPreview";
import type { BfsUnitPhaseSummary } from "../bfs/unit/unit.types";
import { WallExtensionUnitPreview } from "../wall-extension/unit/WallExtensionUnitPreview";
import { LearningRewardBoundary } from "../rewards/LearningRewardBoundary";
import { FinalLearningRewards } from "../rewards/FinalLearningRewards";
import { phaseBoundaryAchievements } from "../rewards/presentation";
import { useRewardBoundary } from "../rewards/useRewardBoundary";
import { readCodeDraft, writeCodeDraft } from "./codeDraft";
import { ProgressLoadingSkeleton } from "./ProgressLoadingSkeleton";
import { LearningRewardsContext } from "./LearningRewardsContext";
import { emptyLearningRewards, mergeLearningRewards, type LearningRewards } from "./rewards";
import { findLearningUnit, resumePhaseIndex, savedPhaseSummaries, type LearningUnit } from "./unitRegistry";
import { learningErrorMessage, useLearningProgress } from "./useLearningProgress";
import { useLearningLog } from "./useLearningLog";

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
  const log = useLearningLog(courseId);
  const [draft, setDraft] = useState<{ code?: string } | null>(null), [draftError, setDraftError] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null), [entryRevision, setEntryRevision] = useState(0);
  const [rewards, setRewards] = useState(emptyLearningRewards);
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
  const completePhase = useCallback(async (phaseKey: string, summary?: BfsUnitPhaseSummary) => {
    const result = await completeLearningPhase(await getToken(), courseId, phaseKey, summary);
    if (auth.currentUser?.uid !== uid) return;
    setRewards(current => mergeLearningRewards(current, result));
    // 提示はフェーズの切れ目に重ねて出し、遷移は待たせない（#147）。提示側の完了は待たない。エラー時はここへ到達しない。
    const achievements = phaseBoundaryAchievements(phaseKey, unit.phases.at(-1)?.id, result.unlockedAchievements);
    if (result.awardedCard || achievements.length) present({ phaseKey, achievements });
  }, [getToken, courseId, uid, unit, present]);
  // フィードバックの先行生成と表示（#202）。生成の成否は学習の進行に影響させない。
  const startFeedback = useCallback((kind: "phase" | "unit", eventId: string) => {
    void getToken().then(token => fetcher(`/feedback-v1/${kind}/${encodeURIComponent(eventId)}`, { method: "POST", token })).catch(() => undefined);
  }, [getToken]);
  const phaseFeedbackEventId = useCallback((phaseKey: string, nextPhaseKey: string | null) => `${courseId}:${phaseKey}${nextPhaseKey ? `:${nextPhaseKey}` : ""}`, [courseId]);
  const onCheckPhaseCompleted = useCallback((phaseKey: string, nextPhaseKey: string | null) => {
    startFeedback("phase", phaseFeedbackEventId(phaseKey, nextPhaseKey));
  }, [startFeedback, phaseFeedbackEventId]);
  const renderPhaseFeedback = useCallback((phaseKey: string, nextPhaseKey: string | null, nav: { goToPhase: (phaseKey: string) => void; goNext: () => void }) => (
    <FeedbackV1 kind="phase" eventId={phaseFeedbackEventId(phaseKey, nextPhaseKey)} onAction={href => {
      if (!href) return false;
      const target = new URL(href, window.location.origin).searchParams.get("phase");
      if (!target) return false;
      if (target === nextPhaseKey) nav.goNext(); else nav.goToPhase(target);
      return true;
    }} />
  ), [phaseFeedbackEventId]);
  const renderUnitFeedback = useCallback(() => <FeedbackV1 kind="unit" eventId={courseId} />, [courseId]);
  const onFinalResult = useCallback(() => setFinalShown(true), []);
  useEffect(() => {
    if (!finalShown || unitSaved || completedUnitRequest.current) return;
    let current = true;
    completedUnitRequest.current = true; setUnitError(false);
    void getToken().then(token => completeLearningUnit(token, courseId)).then(result => {
      if (!current) return;
      setUnitSaved(true); setRewards(rewards => mergeLearningRewards(rewards, result));
      log({ eventType: "unit_complete" });
      startFeedback("unit", courseId);
    }, () => { if (current) { completedUnitRequest.current = false; setUnitError(true); } });
    return () => { current = false; };
  }, [finalShown, unitSaved, courseId, getToken, log, unitRevision, startFeedback]);
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
    onPhaseComplete: completePhase,
    onFinalResult,
    onLearningEvent: log,
    rewards,
    renderRewards: (value: LearningRewards) => <FinalLearningRewards rewards={value} onEvent={log} />,
    onCheckPhaseCompleted,
    renderPhaseFeedback,
    renderUnitFeedback,
  };
  return <LearningRewardsContext.Provider value={{ rewards, dismissAwardedCard }}>
    {entryError && <Alert severity="warning" action={<Button onClick={() => setEntryRevision(value => value + 1)}>再試行</Button>}>学習の開始を記録できませんでした。学習は続けられます。{entryError}</Alert>}
    {draftError && <Alert severity="warning">このブラウザにコード下書きを保存できませんでした。</Alert>}
    {finalShown && !unitSaved && (unitError ? <Alert severity="error" action={<Button onClick={() => setUnitRevision(value => value + 1)}>再試行</Button>}>単元の完了を保存できませんでした。再試行してください。</Alert> : <Typography role="status">単元の完了を保存しています。</Typography>)}
    {unit.kind === "wall-extension" ? <WallExtensionUnitPreview {...unitPreviewProps} /> : <BfsUnitPreview {...unitPreviewProps} />}
    {boundary && <LearningRewardBoundary boundary={boundary} onDone={finish} onEvent={event => log({ ...event, phaseKey: typeof event.payload?.phaseKey === "string" ? event.payload.phaseKey : boundary.phaseKey })} />}
  </LearningRewardsContext.Provider>;
}

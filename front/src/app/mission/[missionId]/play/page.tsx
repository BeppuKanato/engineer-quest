"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QuizIcon from "@mui/icons-material/Quiz";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  answerMissionActivity,
  completeMission,
  completeMissionActivity,
  getMissionPlay,
} from "@/api/mission.api";
import { AppHeader } from "@/app/component/appHeader";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import {
  enqueueActivityCompletion,
  getPendingActivityCompletions,
  syncPendingActivityCompletions,
} from "@/lib/activityCompletionQueue";
import { auth } from "@/lib/firebase";

import type {
  ChoiceItem,
  MissionActivity,
  MissionActivityType,
  MissionPlayResponse,
} from "./type";
import { ActivitySuccessCelebration } from "./components/activitySuccessCelebration";
import { ActivityTransitionOverlay } from "./components/activityTransitionOverlay";
import { InteractiveMatchInput } from "./components/interactiveMatchInput";
import { LearningSidebar } from "./components/learningSidebar";
import { SortableOrderedStepsInput } from "./components/sortableOrderedStepsInput";
import { MissionVisualRenderer } from "./components/visual/missionVisualRenderer";

const activityLabel: Record<MissionActivityType, string> = {
  TUTORIAL: "チュートリアル",
  VIEW: "見る",
  CHOICE: "選択",
  MATCH: "分類",
  ORDERED_STEPS: "並べ替え",
  SELECT_FILL: "穴埋め",
  TRY_CODE: "コード",
  MISSION_CHECK: "確認",
};

type ActivityTransition = {
  kind: "section" | "mission_check";
  targetIndex: number;
};

const getActivityTransition = (
  mission: MissionPlayResponse,
  targetIndex: number,
  previousIndex: number | null
): ActivityTransition | null => {
  const targetActivity = mission.activities[targetIndex];
  if (!targetActivity) return null;

  const previousActivity =
    previousIndex === null ? null : mission.activities[previousIndex] ?? null;

  if (targetActivity.isMissionCheck && !previousActivity?.isMissionCheck) {
    return { kind: "mission_check", targetIndex };
  }

  if (targetActivity.isMissionCheck || !targetActivity.sectionId) return null;

  const firstActivityIndex = mission.activities.findIndex(
    (activity) =>
      activity.sectionId === targetActivity.sectionId && !activity.isMissionCheck
  );
  const enteredNewSection = previousActivity
    ? previousActivity.sectionId !== targetActivity.sectionId
    : firstActivityIndex === targetIndex;

  return enteredNewSection ? { kind: "section", targetIndex } : null;
};

const getEffectiveType = (activity: MissionActivity): MissionActivityType => {
  if (activity.type !== "MISSION_CHECK") return activity.type;

  const checkType = activity.content.checkType;
  if (
    checkType === "CHOICE" ||
    checkType === "MATCH" ||
    checkType === "ORDERED_STEPS" ||
    checkType === "SELECT_FILL" ||
    checkType === "TRY_CODE"
  ) {
    return checkType;
  }

  return "CHOICE";
};

const isAnswerRequired = (activity: MissionActivity) => {
  const type = getEffectiveType(activity);
  return (
    type === "CHOICE" ||
    type === "MATCH" ||
    type === "ORDERED_STEPS" ||
    type === "SELECT_FILL" ||
    type === "TRY_CODE"
  );
};

const ActivityIcon = ({ type }: { type: MissionActivityType }) => {
  if (type === "TRY_CODE" || type === "SELECT_FILL") return <CodeIcon />;
  if (type === "CHOICE" || type === "MATCH" || type === "ORDERED_STEPS" || type === "MISSION_CHECK") {
    return <QuizIcon />;
  }
  return <MenuBookIcon />;
};

const MissionPlayLoadingSkeleton = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
        <Skeleton variant="text" width="38%" height={28} />
        <Skeleton variant="text" width="72%" height={52} />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Skeleton variant="rounded" width={120} height={32} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" width={190} height={32} sx={{ borderRadius: 999 }} />
        </Stack>
        <Skeleton variant="text" width={170} height={22} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={10} sx={{ borderRadius: 999 }} />
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="text" width={110} height={32} sx={{ mt: 3 }} />
        <Skeleton variant="text" width="58%" height={24} />
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} variant="rounded" height={54} />
          ))}
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
          <Skeleton variant="rounded" width={130} height={48} />
          <Skeleton variant="rounded" width={150} height={48} />
        </Stack>
      </Paper>
    </Stack>
  </Container>
);

const syncCompletionQueueForUser = async (firebaseUid: string) =>
  syncPendingActivityCompletions(firebaseUid, async (item) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== firebaseUid) {
      throw new Error("The queued progress belongs to another user.");
    }

    const currentToken = await currentUser.getIdToken();
    return completeMissionActivity(
      currentToken,
      item.missionId,
      item.activityId
    );
  });

const ChoiceInput = ({
  choices,
  selectedChoiceId,
  onSelect,
  disabled,
}: {
  choices: ChoiceItem[];
  selectedChoiceId: string | null;
  onSelect: (choiceId: string) => void;
  disabled: boolean;
}) => (
  <Stack spacing={1.25}>
    {choices.map((choice) => {
      const selected = selectedChoiceId === choice.id;

      return (
        <Button
          key={choice.id}
          variant={selected ? "contained" : "outlined"}
          disabled={disabled}
          onClick={() => onSelect(choice.id)}
          sx={{
            justifyContent: "flex-start",
            minHeight: 48,
            borderRadius: 2,
            fontWeight: 800,
            textAlign: "left",
          }}
        >
          {choice.label}
        </Button>
      );
    })}
  </Stack>
);

const AnswerInput = ({
  activity,
  answer,
  onAnswerChange,
  disabled,
}: {
  activity: MissionActivity;
  answer: unknown;
  onAnswerChange: (answer: unknown) => void;
  disabled: boolean;
}) => {
  const type = getEffectiveType(activity);

  if (type === "CHOICE") {
    const answerRecord =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as { selectedChoiceId?: string })
        : {};

    return (
      <ChoiceInput
        choices={activity.content.choices ?? []}
        selectedChoiceId={answerRecord.selectedChoiceId ?? null}
        disabled={disabled}
        onSelect={(choiceId) => onAnswerChange({ selectedChoiceId: choiceId })}
      />
    );
  }

  if (type === "MATCH") {
    const currentMap =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as { itemTargetMap?: Record<string, string> }).itemTargetMap ?? {}
        : {};

    return (
      <InteractiveMatchInput
        items={activity.content.items ?? []}
        targets={activity.content.targets ?? []}
        answer={currentMap}
        disabled={disabled}
        onAnswerChange={(matchAnswer) => {
          const itemTargetMap = Object.entries(matchAnswer.matchPairs).reduce<Record<string, string>>(
            (acc, [targetId, itemIds]) => {
              itemIds.forEach((itemId) => {
                acc[itemId] = targetId;
              });
              return acc;
            },
            {}
          );
          onAnswerChange({ ...matchAnswer, itemTargetMap });
        }}
      />
    );
  }

  if (type === "ORDERED_STEPS") {
    return (
      <SortableOrderedStepsInput
        steps={activity.content.steps ?? []}
        answer={Array.isArray(answer) ? answer : []}
        disabled={disabled}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  if (type === "TRY_CODE") {
    const code = typeof answer === "string" ? answer : activity.content.starterCode ?? "";

    return (
      <TextField
        multiline
        minRows={10}
        value={code}
        disabled={disabled}
        onChange={(event) => onAnswerChange(event.target.value)}
        sx={{
          "& textarea": {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          },
        }}
      />
    );
  }

  if (type === "SELECT_FILL") {
    return (
      <TextField
        fullWidth
        value={typeof answer === "string" ? answer : ""}
        disabled={disabled}
        placeholder="答えを入力してください"
        onChange={(event) => onAnswerChange(event.target.value)}
      />
    );
  }

  return null;
};

const ActivityBody = ({ activity }: { activity: MissionActivity }) => {
  const body = activity.content.body ?? activity.content.text;
  const summary = activity.content.summary ?? [];
  const visual = activity.content.visual;

  const textContent = (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {body && (
        <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.9, color: "#334155" }}>
          {body}
        </Typography>
      )}

      {summary.length > 0 && (
        <Stack spacing={1}>
          {summary.map((item) => (
            <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
              <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 20, mt: 0.2 }} />
              <Typography fontWeight={800}>{item}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );

  if (!visual) return textContent;

  if (visual.placement === "aside") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 0.9fr)",
          gap: 3,
          alignItems: "center",
        }}
      >
        {textContent}
        <MissionVisualRenderer visual={visual} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {textContent}
      <MissionVisualRenderer visual={visual} />
    </Stack>
  );
};

export default function MissionPlayPage() {
  const params = useParams<{ missionId: string }>();
  const missionId = params.missionId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showOverlay, startNavigation, resetNavigation } = useNavigationFeedback();

  const [token, setToken] = useState<string | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [mission, setMission] = useState<MissionPlayResponse | null>(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [answerMap, setAnswerMap] = useState<Record<string, unknown>>({});
  const [answerResultMap, setAnswerResultMap] = useState<
    Record<string, { isCorrect: boolean | null; feedback?: string }>
  >({});
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEffectKey, setSuccessEffectKey] = useState(0);
  const [activityTransition, setActivityTransition] =
    useState<ActivityTransition | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setFirebaseUid(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const idToken = await user.getIdToken();
        const data = await getMissionPlay(idToken, missionId);

        if (!isMounted) return;

        const pendingActivityIds = getPendingActivityCompletions(user.uid)
          .filter((item) => item.missionId === missionId)
          .map((item) => item.activityId);
        const completedIds = new Set([
          ...data.progress.completedActivityIds,
          ...pendingActivityIds,
        ]);
        const completedResults = Object.fromEntries(
          data.activities
            .filter((activity) => completedIds.has(activity.id))
            .map((activity) => [
              activity.id,
              {
                isCorrect: true,
                feedback: activity.isMissionCheck ? "正解済みです。" : "完了済みです。",
              },
            ])
        );
        const isReviewMode = searchParams.get("review") === "1";
        const startIndex = isReviewMode
          ? 0
          : data.progress.currentActivityId &&
            !completedIds.has(data.progress.currentActivityId)
          ? data.activities.findIndex((activity) => activity.id === data.progress.currentActivityId)
          : data.activities.findIndex((activity) => !completedIds.has(activity.id));

        setToken(idToken);
        setFirebaseUid(user.uid);
        setMission(data);
        setCompletedActivityIds(completedIds);
        setAnswerResultMap(completedResults);
        const resolvedStartIndex =
          startIndex >= 0 ? startIndex : Math.max(0, data.activities.length - 1);
        setCurrentActivityIndex(resolvedStartIndex);
        setActivityTransition(
          getActivityTransition(data, resolvedStartIndex, null)
        );
        void syncCompletionQueueForUser(user.uid);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("ミッションの取得に失敗しました。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [missionId, searchParams]);

  useEffect(() => {
    const handleOnline = () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      void syncCompletionQueueForUser(currentUser.uid);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const currentActivity = mission?.activities[currentActivityIndex] ?? null;
  const completedCount = completedActivityIds.size;
  const currentPositionValue = mission
    ? Math.round(((currentActivityIndex + 1) / mission.activities.length) * 100)
    : 0;
  const currentSection = useMemo(() => {
    if (!mission || !currentActivity?.sectionId) return null;
    return mission.sections.find((section) => section.id === currentActivity.sectionId) ?? null;
  }, [mission, currentActivity]);

  const advanceToActivity = (nextIndex: number) => {
    if (!mission) return;
    setActivityTransition(
      getActivityTransition(mission, nextIndex, currentActivityIndex)
    );
    setCurrentActivityIndex(nextIndex);
    setErrorMessage(null);
  };

  const handleBackActivity = () => {
    if (!mission) return;

    for (let index = currentActivityIndex - 1; index >= 0; index -= 1) {
      if (completedActivityIds.has(mission.activities[index].id)) {
        setActivityTransition(null);
        setCurrentActivityIndex(index);
        setErrorMessage(null);
        return;
      }
    }

    startNavigation(() => {
      router.push(`/mission/${missionId}/overview`);
    });
  };

  const handleBackToRoadmap = () => {
    if (!mission) return;
    startNavigation(() => {
      router.push(
        `/courses/roadmap/${encodeURIComponent(mission.courseId)}`
      );
    });
  };

  const handleSidebarActivitySelect = (activityId: string) => {
    if (!mission) return;
    const activityIndex = mission.activities.findIndex(
      (activity) => activity.id === activityId
    );
    if (activityIndex < 0) return;

    const availableActivityId = mission.activities.find(
      (activity) => !completedActivityIds.has(activity.id)
    )?.id;
    const canSelect =
      completedActivityIds.has(activityId) ||
      activityId === availableActivityId ||
      activityIndex === currentActivityIndex;
    if (!canSelect) return;

    setActivityTransition(null);
    setCurrentActivityIndex(activityIndex);
    setErrorMessage(null);
  };

  const handleAnswer = async () => {
    if (!token || !mission || !currentActivity) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await answerMissionActivity(
        token,
        mission.id,
        currentActivity.id,
        answerMap[currentActivity.id]
      );
      if (result.isCorrect === true) {
        setSuccessEffectKey((current) => current + 1);
      }
      setAnswerResultMap((current) => ({
        ...current,
        [currentActivity.id]: result,
      }));
    } catch (error) {
      console.error(error);
      setErrorMessage("答えの確認に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteActivity = async () => {
    if (!mission || !currentActivity || !firebaseUid) return;

    const alreadyCompleted = completedActivityIds.has(currentActivity.id);
    const nextIndex = currentActivityIndex + 1;
    const isLastActivity = nextIndex >= mission.activities.length;
    const requiresServerConfirmation =
      currentActivity.isMissionCheck || isLastActivity;

    if (alreadyCompleted && !requiresServerConfirmation) {
      advanceToActivity(nextIndex);
      return;
    }

    const answerResult = answerResultMap[currentActivity.id];
    if (
      !alreadyCompleted &&
      currentActivity.isMissionCheck &&
      answerResult?.isCorrect !== true
    ) {
      setErrorMessage("確認問題に正解すると次へ進めます。");
      return;
    }

    if (!alreadyCompleted) {
      setCompletedActivityIds(
        (current) => new Set([...current, currentActivity.id])
      );
      setAnswerResultMap((current) => ({
        ...current,
        [currentActivity.id]: current[currentActivity.id] ?? {
          isCorrect: true,
          feedback: "完了しました。",
        },
      }));

      const queued = enqueueActivityCompletion(
        firebaseUid,
        mission.id,
        currentActivity.id
      );

      if (!queued) {
        setCompletedActivityIds((current) => {
          const next = new Set(current);
          next.delete(currentActivity.id);
          return next;
        });
        setErrorMessage("進捗を端末に保存できませんでした。もう一度お試しください。");
        return;
      }
    }

    if (!requiresServerConfirmation) {
      advanceToActivity(nextIndex);
      void syncCompletionQueueForUser(firebaseUid);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const syncResult = await syncCompletionQueueForUser(firebaseUid);
      const hasUnsyncedMissionProgress = syncResult.failedItems.some(
        (item) => item.missionId === mission.id
      );

      if (hasUnsyncedMissionProgress) {
        setErrorMessage(
          "進捗を同期できませんでした。通信状態を確認して、もう一度お試しください。"
        );
        return;
      }

      if (!isLastActivity) {
        advanceToActivity(nextIndex);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== firebaseUid) {
        throw new Error("Authenticated user changed before mission completion.");
      }

      const currentToken = await currentUser.getIdToken();
      const missionResult = await completeMission(currentToken, mission.id);
      window.sessionStorage.setItem(
        `mission-result:${mission.id}`,
        JSON.stringify(missionResult)
      );
      startNavigation(() => {
        router.push(`/mission/${encodeURIComponent(mission.id)}/result`);
      });
    } catch (error) {
      console.error(error);
      resetNavigation();
      setErrorMessage("進捗の確定に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
        <AppHeader />
        <MissionPlayLoadingSkeleton />
      </Box>
    );
  }

  if (!mission || !currentActivity) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
        <AppHeader />
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error">{errorMessage ?? "ミッションを表示できません。"}</Alert>
        </Container>
      </Box>
    );
  }

  const answerRequired = isAnswerRequired(currentActivity);
  const answerResult = answerResultMap[currentActivity.id];
  const isCurrentCompleted = completedActivityIds.has(currentActivity.id);
  const isCorrect = answerResult?.isCorrect === true || isCurrentCompleted;
  const canGoNext = !answerRequired || isCorrect;
  const regularSections = mission.sections.filter((section) =>
    mission.activities.some(
      (activity) => activity.sectionId === section.id && !activity.isMissionCheck
    )
  );
  const currentRegularSectionIndex = currentSection
    ? regularSections.findIndex((section) => section.id === currentSection.id)
    : -1;
  const currentSectionActivities = mission.activities.filter((activity) =>
    currentActivity.isMissionCheck
      ? activity.isMissionCheck
      : activity.sectionId === currentActivity.sectionId && !activity.isMissionCheck
  );
  const availableActivityId =
    mission.activities.find(
      (activity) => !completedActivityIds.has(activity.id)
    )?.id ?? null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F7F8FC",
      }}
    >
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="結果を準備しています..." />
      <ActivitySuccessCelebration fireKey={successEffectKey} />
      {activityTransition && (
        <ActivityTransitionOverlay
          open
          kind={activityTransition.kind}
          sectionNumber={
            currentRegularSectionIndex >= 0
              ? currentRegularSectionIndex + 1
              : null
          }
          sectionCount={regularSections.length}
          title={currentSection?.title ?? "新しいセクション"}
          description={currentSection?.description ?? null}
          activityCount={currentSectionActivities.length}
          onClose={() => setActivityTransition(null)}
        />
      )}

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            gap: 3,
            alignItems: "start",
          }}
        >
          <LearningSidebar
            mission={mission}
            currentActivityId={currentActivity.id}
            availableActivityId={availableActivityId}
            completedActivityIds={completedActivityIds}
            onSelectActivity={handleSidebarActivitySelect}
            onBackToRoadmap={handleBackToRoadmap}
          />

          <Box component="main" sx={{ minWidth: 0 }}>
            <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography color="text.secondary" fontWeight={800}>
                  {mission.title}
                </Typography>
                <Typography variant="h4" fontWeight={900} letterSpacing={0}>
                  {currentActivity.title}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  icon={<ActivityIcon type={currentActivity.type} />}
                  label={currentActivity.isMissionCheck ? "確認" : activityLabel[currentActivity.type]}
                  sx={{
                    bgcolor: currentActivity.isMissionCheck ? "#fff7ed" : "#eff6ff",
                    color: currentActivity.isMissionCheck ? "#c2410c" : "#1d4ed8",
                    fontWeight: 900,
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
                {currentSection && (
                  <Chip label={currentSection.title} sx={{ fontWeight: 800 }} />
                )}
                {isCorrect && (
                  <Chip
                    icon={<TaskAltIcon />}
                    label={isCurrentCompleted ? "完了済み" : "正解済み"}
                    sx={{
                      bgcolor: "#dcfce7",
                      color: "#16a34a",
                      fontWeight: 900,
                      "& .MuiChip-icon": { color: "inherit" },
                    }}
                  />
                )}
              </Stack>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    現在のアクティビティ
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    {currentActivityIndex + 1} / {mission.activities.length}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={currentPositionValue}
                  sx={{ height: 8, borderRadius: 999 }}
                />
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mt: 1, display: "block" }}>
                  {completedCount}件完了済み
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Stack spacing={3}>
              <Alert severity="info" icon={<MenuBookIcon />}>
                <Typography fontWeight={800}>{currentActivity.mentorMessage}</Typography>
              </Alert>

              <Box>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  やること
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {currentActivity.instruction}
                </Typography>
              </Box>

              <ActivityBody activity={currentActivity} />

              {answerRequired && (
                <AnswerInput
                  key={currentActivity.id}
                  activity={currentActivity}
                  answer={answerMap[currentActivity.id]}
                  disabled={isSubmitting || isCorrect}
                  onAnswerChange={(answer) => {
                    setAnswerMap((current) => ({
                      ...current,
                      [currentActivity.id]: answer,
                    }));
                    setAnswerResultMap((current) => {
                      if (!current[currentActivity.id] || current[currentActivity.id].isCorrect === true) {
                        return current;
                      }
                      const next = { ...current };
                      delete next[currentActivity.id];
                      return next;
                    });
                  }}
                />
              )}

              {answerResult && (
                <Alert severity={answerResult.isCorrect === false ? "warning" : "success"}>
                  {answerResult.feedback ?? "答えを確認しました。"}
                </Alert>
              )}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
              >
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  disabled={isSubmitting}
                  onClick={handleBackActivity}
                  sx={{ fontWeight: 900, borderRadius: 2, minWidth: 120 }}
                >
                  戻る
                </Button>

                {answerRequired && !isCorrect ? (
                  <Button
                    variant="contained"
                    disabled={isSubmitting}
                    onClick={handleAnswer}
                    sx={{ fontWeight: 900, borderRadius: 2, minWidth: 160 }}
                  >
                    {currentActivity.actionLabel || "答えを確認"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    disabled={isSubmitting || !canGoNext}
                    endIcon={<PlayArrowIcon />}
                    onClick={handleCompleteActivity}
                    sx={{ fontWeight: 900, borderRadius: 2, minWidth: 132 }}
                  >
                    {currentActivityIndex === mission.activities.length - 1 ? "完了する" : "次へ"}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

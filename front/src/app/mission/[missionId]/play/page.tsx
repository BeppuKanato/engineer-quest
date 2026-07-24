"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QuizIcon from "@mui/icons-material/Quiz";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  answerMissionActivity,
  completeMission,
  completeMissionActivity,
  getMissionPlay,
} from "@/api/mission.api";
import { AppHeader } from "@/app/component/appHeader";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { BlockingProcessOverlay } from "@/app/component/blockingProcessOverlay";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { getMascotImagePath, type MascotId, useUserMascot } from "@/app/component/mascot";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import {
  enqueueActivityCompletion,
  getPendingActivityCompletions,
  syncPendingActivityCompletions,
} from "@/lib/activityCompletionQueue";
import { auth } from "@/lib/firebase";
import type { Difficulty } from "@/app/courses/type";

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
import { BubbleSortVisualizer } from "./components/bubbleSortVisualizer";
import { CourseCheckEditor } from "./components/courseCheckEditor";

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

const parseDifficultyParam = (value: string | null): Difficulty | undefined => {
  if (value === "easy" || value === "normal" || value === "hard") {
    return value;
  }

  return undefined;
};

type ActivityTransition = {
  kind: "section" | "mission_check";
  targetIndex: number;
};

type ActivityResult = { isCorrect: boolean | null; feedback?: string };

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
  result,
  onSelect,
  disabled,
}: {
  choices: ChoiceItem[];
  selectedChoiceId: string | null;
  result?: ActivityResult;
  onSelect: (choiceId: string) => void;
  disabled: boolean;
}) => (
  <Stack spacing={1.25}>
    {choices.map((choice) => {
      const selected = selectedChoiceId === choice.id;
      const showResult = Boolean(result);
      const isCorrectChoice = choice.isCorrect === true;
      const isWrongSelected = showResult && selected && result?.isCorrect === false;

      return (
        <Paper
          key={choice.id}
          component="button"
          type="button"
          onClick={() => {
            if (!disabled) onSelect(choice.id);
          }}
          aria-disabled={disabled}
          sx={{
            width: "100%",
            minHeight: 72,
            px: 2,
            py: 1.4,
            display: "flex",
            alignItems: "center",
            gap: 1.4,
            textAlign: "left",
            borderRadius: 2,
            border: isCorrectChoice && showResult
              ? "2px solid #22c55e"
              : isWrongSelected
              ? "2px solid #ef4444"
              : selected
              ? "2px solid #2563eb"
              : "1px solid #bfdbfe",
            bgcolor: isCorrectChoice && showResult
              ? "#ecfdf5"
              : isWrongSelected
              ? "#fef2f2"
              : selected
              ? "#eff6ff"
              : "#fff",
            color: "#0f172a",
            fontWeight: 800,
            cursor: disabled ? "default" : "pointer",
            boxShadow: selected ? "0 10px 24px rgba(37, 99, 235, 0.12)" : "none",
            transition: "transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
            "&:hover": disabled
              ? undefined
              : {
                  transform: "translateY(-1px)",
                  borderColor: "#2563eb",
                  boxShadow: "0 12px 26px rgba(37, 99, 235, 0.14)",
                },
            "&:focus-visible": {
              outline: "3px solid rgba(37, 99, 235, 0.35)",
              outlineOffset: 2,
            },
          }}
        >
          {showResult && isCorrectChoice ? (
            <CheckCircleIcon sx={{ color: "#16a34a" }} />
          ) : isWrongSelected ? (
            <ErrorOutlineIcon sx={{ color: "#dc2626" }} />
          ) : selected ? (
            <CheckCircleIcon sx={{ color: "#2563eb" }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: "#64748b" }} />
          )}
          <Typography fontWeight={900}>{choice.label}</Typography>
        </Paper>
      );
    })}
  </Stack>
);

const AnswerInput = ({
  activity,
  answer,
  activityResult,
  onAnswerChange,
  disabled,
}: {
  activity: MissionActivity;
  answer: unknown;
  activityResult?: ActivityResult;
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
        result={activityResult}
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
      <Stack spacing={2}>
      <SortableOrderedStepsInput
        steps={activity.content.steps ?? []}
        answer={Array.isArray(answer) ? answer : []}
        disabled={disabled}
        onAnswerChange={onAnswerChange}
      />
      {activityResult?.isCorrect === true &&
        Array.isArray(activity.content.animationValues) && (
          <BubbleSortVisualizer
            initialValues={activity.content.animationValues as number[]}
            autoPlay
          />
        )}
      </Stack>
    );
  }

  if (type === "TRY_CODE") {
    const courseCheckAnswer =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as { code?: string; executionPassed?: boolean })
        : {};
    const code =
      typeof answer === "string"
        ? answer
        : courseCheckAnswer.code ?? activity.content.starterCode ?? "";
    if (
      activity.content.courseCheck === true &&
      typeof activity.content.sampleCode === "string" &&
      Array.isArray(activity.content.tests)
    ) {
      return (
        <CourseCheckEditor
          sampleCode={activity.content.sampleCode}
          value={code}
          tests={activity.content.tests as Array<{ input: number[]; expected: number[] }>}
          disabled={disabled}
          onChange={(nextCode) => onAnswerChange({ code: nextCode, executionPassed: false })}
          onPassed={() => onAnswerChange({ code, executionPassed: true })}
        />
      );
    }

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
      {summary.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid #bfdbfe",
            bgcolor: "#eff6ff",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <BookOutlinedIcon color="primary" />
            <Typography fontWeight={900}>今日覚えること</Typography>
          </Stack>
          <Stack spacing={0.75}>
            {summary.slice(0, 4).map((item) => (
              <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 20, mt: 0.2 }} />
                <Typography fontWeight={800} color="#0f172a">{item}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
      {body && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <LightbulbIcon sx={{ color: "#eab308", mt: 0.2 }} />
            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "#334155", fontWeight: 700 }}>
              {body}
            </Typography>
          </Stack>
        </Paper>
      )}
    </Stack>
  );

  const algorithmValues = Array.isArray(activity.content.algorithmValues)
    ? (activity.content.algorithmValues as number[])
    : null;

  if (algorithmValues) {
    return (
      <Stack spacing={2}>
        {textContent}
        <BubbleSortVisualizer initialValues={algorithmValues} />
      </Stack>
    );
  }

  if (!visual) return textContent;

  if (visual.placement === "aside") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(360px, 0.9fr)" },
          gap: 3,
          alignItems: "start",
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

const hasAnswer = (activity: MissionActivity, answer: unknown) => {
  const type = getEffectiveType(activity);

  if (type === "CHOICE") {
    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        (answer as { selectedChoiceId?: string }).selectedChoiceId
    );
  }

  if (type === "MATCH") {
    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        Object.keys((answer as { itemTargetMap?: Record<string, string> }).itemTargetMap ?? {}).length > 0
    );
  }

  if (type === "ORDERED_STEPS") {
    return (Array.isArray(answer) && answer.length > 0) || (activity.content.steps?.length ?? 0) > 0;
  }

  if (type === "TRY_CODE" && activity.content.courseCheck === true) {
    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        (answer as { executionPassed?: boolean }).executionPassed
    );
  }

  if (type === "SELECT_FILL" || type === "TRY_CODE") {
    return typeof answer === "string" && answer.trim().length > 0;
  }

  return true;
};

const getCorrectAnswerLabel = (activity: MissionActivity) => {
  if (getEffectiveType(activity) !== "CHOICE") return null;
  return activity.content.choices?.find((choice) => choice.isCorrect)?.label ?? null;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const stringifyAnswerValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => String(item)).join(" / ");
  if (value === undefined || value === null) return "";
  return String(value);
};

const AnswerReviewPanel = ({
  activity,
  answer,
  result,
}: {
  activity: MissionActivity;
  answer: unknown;
  result: ActivityResult;
}) => {
  if (result.isCorrect !== false) return null;

  const type = getEffectiveType(activity);

  if (type === "MATCH") {
    const answers = Array.isArray(activity.content.answers) ? activity.content.answers : [];
    if (answers.length === 0) return null;

    const targetLabelById = new Map(
      (activity.content.targets ?? []).map((target) => [target.id, target.label])
    );
    const itemLabelById = new Map(
      (activity.content.items ?? []).map((item) => [item.id, item.label])
    );
    const answerRecord = isPlainRecord(answer) ? answer : {};
    const userPairs = isPlainRecord(answerRecord.matchPairs) ? answerRecord.matchPairs : {};

    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}>
        <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1 }}>
          正しい分類
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          {answers.map((expected, index) => {
            if (!isPlainRecord(expected) || typeof expected.targetId !== "string") return null;
            const targetId = expected.targetId;
            const expectedLabels = toStringArray(expected.itemIds).map((id) => itemLabelById.get(id) ?? id);
            const userLabels = toStringArray(userPairs[targetId]).map((id) => itemLabelById.get(id) ?? id);

            return (
              <Box key={targetId || index} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                <Typography fontWeight={950} color="#1d4ed8">{targetLabelById.get(targetId) ?? targetId}</Typography>
                <Typography color="#166534" fontWeight={900} sx={{ mt: 0.75 }}>
                  正解: {expectedLabels.join("、") || "未設定"}
                </Typography>
                <Typography color="#92400e" fontWeight={800} sx={{ mt: 0.5 }}>
                  あなたの回答: {userLabels.join("、") || "未回答"}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  }

  if (type === "ORDERED_STEPS") {
    const expectedOrder = toStringArray(activity.content.answerOrder);
    if (expectedOrder.length === 0) return null;

    const stepLabelById = new Map((activity.content.steps ?? []).map((step) => [step.id, step.label]));
    const userOrder = toStringArray(answer);

    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}>
        <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1 }}>
          正しい順番
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid #bbf7d0", bgcolor: "#f0fdf4" }}>
            <Typography fontWeight={950} color="#166534">正解</Typography>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {expectedOrder.map((id, index) => (
                <Typography key={`${id}-${index}`} fontWeight={850} color="#0f172a">
                  {index + 1}. {stepLabelById.get(id) ?? id}
                </Typography>
              ))}
            </Stack>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid #fde68a", bgcolor: "#fffbeb" }}>
            <Typography fontWeight={950} color="#92400e">あなたの回答</Typography>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {userOrder.map((id, index) => (
                <Typography key={`${id}-${index}`} fontWeight={850} color="#0f172a">
                  {index + 1}. {stepLabelById.get(id) ?? id}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Box>
      </Paper>
    );
  }

  if (type === "SELECT_FILL") {
    const expected = activity.content.correctAnswers ?? activity.content.answer;
    if (expected === undefined) return null;

    const answerRecord = isPlainRecord(answer) ? answer : {};
    const userValue = answerRecord.values ?? answer;

    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}>
        <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1 }}>
          回答の確認
        </Typography>
        <Typography color="#166534" fontWeight={900}>正解: {stringifyAnswerValue(expected)}</Typography>
        <Typography color="#92400e" fontWeight={800} sx={{ mt: 0.5 }}>
          あなたの回答: {stringifyAnswerValue(userValue) || "未回答"}
        </Typography>
      </Paper>
    );
  }

  if (type === "TRY_CODE") {
    const expectedCode =
      typeof activity.content.answerCode === "string"
        ? activity.content.answerCode
        : typeof activity.content.expectedCode === "string"
          ? activity.content.expectedCode
          : null;
    if (!expectedCode) return null;

    const userCode = typeof answer === "string" ? answer : isPlainRecord(answer) && typeof answer.code === "string" ? answer.code : "";

    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}>
        <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1 }}>
          コードの確認
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          <Box>
            <Typography fontWeight={950} color="#166534" sx={{ mb: 0.75 }}>正解例</Typography>
            <Box component="pre" sx={{ m: 0, p: 1.5, borderRadius: 2, bgcolor: "#0f172a", color: "#e2e8f0", overflow: "auto", whiteSpace: "pre-wrap" }}>
              {expectedCode}
            </Box>
          </Box>
          <Box>
            <Typography fontWeight={950} color="#92400e" sx={{ mb: 0.75 }}>あなたの回答</Typography>
            <Box component="pre" sx={{ m: 0, p: 1.5, borderRadius: 2, bgcolor: "#1e293b", color: "#e2e8f0", overflow: "auto", whiteSpace: "pre-wrap" }}>
              {userCode || "未回答"}
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }

  return null;
};

const FeedbackPanel = ({
  result,
  mascotId,
  correctAnswerLabel,
}: {
  result: { isCorrect: boolean | null; feedback?: string };
  mascotId: MascotId;
  correctAnswerLabel?: string | null;
}) => {
  const isCorrect = result.isCorrect !== false;
  const feedbackText =
    result.feedback ??
    (isCorrect
      ? "よくできました。次のステップに進みましょう。"
      : "ヒントを見ながら、どの考え方が近いか確認してみましょう。");

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        minHeight: 132,
        borderRadius: 3,
        border: `1px solid ${isCorrect ? "#86efac" : "#fde68a"}`,
        bgcolor: isCorrect ? "#f0fdf4" : "#fffbeb",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: isCorrect ? "#dcfce7" : "#fef3c7",
              color: isCorrect ? "#16a34a" : "#d97706",
            }}
          >
            {isCorrect ? <CheckCircleIcon /> : <LightbulbIcon />}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={950} color={isCorrect ? "#15803d" : "#92400e"}>
              {isCorrect ? "正解！" : "もう一度考えてみよう"}
            </Typography>
            {!isCorrect && correctAnswerLabel && (
              <Typography sx={{ mt: 0.5, color: "#166534", fontWeight: 950, lineHeight: 1.7 }}>
                正解は「{correctAnswerLabel}」です。
              </Typography>
            )}
            <Typography sx={{ mt: 0.5, color: "#334155", fontWeight: 800, lineHeight: 1.7 }}>
              {feedbackText}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            component="img"
            src={getMascotImagePath(mascotId, isCorrect ? "happy" : "thinking")}
            alt="学習を応援する相棒"
            sx={{ width: 68, height: 68, objectFit: "contain" }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

const MascotCoach = ({
  mascotId,
  message,
  mood = "cheer",
}: {
  mascotId: MascotId;
  message: string;
  mood?: "cheer" | "happy" | "thinking";
}) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="center"
    justifyContent="flex-end"
    sx={{ alignSelf: "flex-end" }}
  >
    <Paper
      elevation={0}
      sx={{
        px: 2,
        py: 1.25,
        maxWidth: 360,
        borderRadius: 2,
        border: "1px solid #bfdbfe",
        bgcolor: "#fff",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          right: -8,
          top: "50%",
          width: 14,
          height: 14,
          bgcolor: "#fff",
          borderRight: "1px solid #bfdbfe",
          borderBottom: "1px solid #bfdbfe",
          transform: "translateY(-50%) rotate(-45deg)",
        },
      }}
    >
      <Typography color="#0f172a" fontWeight={900} sx={{ lineHeight: 1.7 }}>
        {message}
      </Typography>
    </Paper>
    <Box
      component="img"
      src={getMascotImagePath(mascotId, mood)}
      alt="学習を応援する相棒"
      sx={{ width: 82, height: 82, objectFit: "contain", flex: "0 0 auto" }}
    />
  </Stack>
);
export default function MissionPlayPage() {
  const { play } = useSoundEffect();
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
  const [isCompletingMission, setIsCompletingMission] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEffectKey, setSuccessEffectKey] = useState(0);
  const mascotId = useUserMascot();
  const [activityTransition, setActivityTransition] =
    useState<ActivityTransition | null>(null);
  const feedbackRegionRef = useRef<HTMLDivElement | null>(null);

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
        const data = await getMissionPlay(
          idToken,
          missionId,
          parseDifficultyParam(searchParams.get("difficulty"))
        );

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
  const currentActivityResult = currentActivity ? answerResultMap[currentActivity.id] : undefined;
  const completedCount = completedActivityIds.size;
  const currentPositionValue = mission
    ? Math.round(((currentActivityIndex + 1) / mission.activities.length) * 100)
    : 0;
  const currentSection = useMemo(() => {
    if (!mission || !currentActivity?.sectionId) return null;
    return mission.sections.find((section) => section.id === currentActivity.sectionId) ?? null;
  }, [mission, currentActivity]);

  useEffect(() => {
    if (!currentActivityResult) return;
    window.requestAnimationFrame(() => {
      feedbackRegionRef.current?.focus();
    });
  }, [currentActivityResult, currentActivity?.id]);

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
      const currentAnswerValue =
        answerMap[currentActivity.id] ??
        (getEffectiveType(currentActivity) === "ORDERED_STEPS"
          ? currentActivity.content.steps?.map((step) => step.id) ?? []
          : undefined);

      const result = await answerMissionActivity(
        token,
        mission.id,
        currentActivity.id,
        currentAnswerValue
      );
      if (result.isCorrect === true) {
        setSuccessEffectKey((current) => current + 1);
        play("answerCorrect");
      } else if (result.isCorrect === false) {
        play("answerIncorrect");
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

  const handleRetryCurrentActivity = () => {
    if (!currentActivity) return;

    setAnswerResultMap((current) => {
      if (!current[currentActivity.id]) return current;
      const next = { ...current };
      delete next[currentActivity.id];
      return next;
    });
    setErrorMessage(null);
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

      setIsCompletingMission(true);
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
        router.push(missionResult.nextPath);
      });
    } catch (error) {
      console.error(error);
      resetNavigation();
      setErrorMessage("進捗の確定に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
      setIsCompletingMission(false);
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
  const answerResult = currentActivityResult;
  const currentAnswer = answerMap[currentActivity.id];
  const hasCurrentAnswer = !answerRequired || hasAnswer(currentActivity, currentAnswer);
  const correctAnswerLabel = getCorrectAnswerLabel(currentActivity);
  const shouldRetry = answerResult?.isCorrect === false;
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
  const currentSectionActivityIndex = currentSectionActivities.findIndex(
    (activity) => activity.id === currentActivity.id
  );
  const remainingActivityCount = Math.max(
    mission.activities.length - completedCount - (isCurrentCompleted ? 0 : 1),
    0
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
      <BlockingProcessOverlay
        open={isCompletingMission}
        title="ミッション結果を保存しています"
        description="完了後に報酬確認へ移動します。この処理中は画面を閉じないでください。"
      />
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

      <Container maxWidth={false} sx={{ py: 3, maxWidth: 1440 }}>
        <Box sx={{ mb: 2 }}>
          <AppBreadcrumbs
            compact
            items={[
              { label: "コース", href: "/courses" },
              {
                label: mission.courseTitle,
                href: `/courses/roadmap/${encodeURIComponent(mission.courseId)}`,
              },
              { label: mission.title },
            ]}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
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
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
              bgcolor: "#fff",
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "flex-start" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    <Chip
                      icon={<ActivityIcon type={currentActivity.type} />}
                      label={currentActivity.isMissionCheck ? "確認" : activityLabel[currentActivity.type]}
                      sx={{
                        bgcolor: currentActivity.isMissionCheck ? "#fff7ed" : "#eff6ff",
                        color: currentActivity.isMissionCheck ? "#c2410c" : "#1d4ed8",
                        fontWeight: 950,
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                    {currentSection && (
                      <Chip label={currentSection.title} sx={{ fontWeight: 900, bgcolor: "#f1f5f9" }} />
                    )}
                    {isCorrect && (
                      <Chip
                        icon={<TaskAltIcon />}
                        label={isCurrentCompleted ? "完了済み" : "正解済み"}
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#16a34a",
                          fontWeight: 950,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    )}
                  </Stack>
                  <Typography color="#475569" fontWeight={900} sx={{ mb: 0.5 }}>
                    {mission.title}
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={950}
                    color="#0f172a"
                    letterSpacing={0}
                    sx={{ fontSize: { xs: 30, md: 40 }, lineHeight: 1.2 }}
                  >
                    {currentActivity.title}
                  </Typography>
                </Box>
                <Typography fontWeight={950} color="#0f172a" sx={{ whiteSpace: "nowrap" }}>
                  Activity {currentActivityIndex + 1} / {mission.activities.length}
                </Typography>
              </Stack>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography color="#475569" fontWeight={900}>
                    現在のアクティビティ
                  </Typography>
                  <Typography color="#475569" fontWeight={900}>
                    残り {remainingActivityCount} 件
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={currentPositionValue}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    bgcolor: "#dbeafe",
                    "& .MuiLinearProgress-bar": { borderRadius: 999 },
                  }}
                />
                <Typography color="#475569" fontWeight={800} sx={{ mt: 1, display: "block" }}>
                  {completedCount}件完了済み
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={
                    currentActivity.isMissionCheck
                      ? "ミッション確認"
                      : currentSectionActivityIndex >= 0
                        ? `このセクションの ${currentSectionActivityIndex + 1} / ${currentSectionActivities.length}`
                        : "セクション外のアクティビティ"
                  }
                  sx={{ fontWeight: 900, bgcolor: "#f8fafc", color: "#334155" }}
                />
                <Chip
                  label={answerRequired ? "回答して進む" : "確認して進む"}
                  sx={{
                    fontWeight: 900,
                    bgcolor: answerRequired ? "#fff7ed" : "#ecfdf5",
                    color: answerRequired ? "#c2410c" : "#047857",
                  }}
                />
              </Stack>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
              bgcolor: "#fff",
            }}
          >
            <Stack spacing={3}>
              {currentActivity.mentorMessage && (
                <Alert
                  severity="info"
                  icon={<MenuBookIcon />}
                  sx={{
                    border: "1px solid #bfdbfe",
                    bgcolor: "#eff6ff",
                    color: "#1e3a8a",
                    "& .MuiAlert-icon": { color: "#2563eb" },
                  }}
                >
                  <Typography fontWeight={900}>{currentActivity.mentorMessage}</Typography>
                </Alert>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #dbeafe",
                  bgcolor: "#f8fbff",
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <LightbulbIcon sx={{ color: "#eab308", mt: 0.2 }} />
                  <Box>
                    <Typography fontWeight={950} color="#0f172a" sx={{ mb: 0.5 }}>
                      やること
                    </Typography>
                    <Typography color="#334155" fontWeight={800} sx={{ lineHeight: 1.8 }}>
                      {currentActivity.instruction}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <ActivityBody activity={currentActivity} />

              {!answerResult && (
                <MascotCoach
                  mascotId={mascotId}
                  message={
                    answerRequired
                      ? "まずは図を見て、近いものから選んでみよう。"
                      : "図と要点を見ながら、流れをつかんでいこう。"
                  }
                  mood={answerRequired ? "thinking" : "cheer"}
                />
              )}

              {answerRequired && (
                <AnswerInput
                  key={currentActivity.id}
                  activity={currentActivity}
                  answer={currentAnswer}
                  activityResult={answerResult}
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

              {answerRequired && (
                <Box
                  ref={feedbackRegionRef}
                  tabIndex={-1}
                  aria-live="polite"
                  sx={{
                    minHeight: answerResult ? 132 : 64,
                    outline: "none",
                    display: "grid",
                    gap: 1.5,
                    alignItems: "start",
                  }}
                >
                  {!answerResult && !hasCurrentAnswer && (
                    <Alert severity="info" sx={{ border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
                      選択肢または回答を入力すると、答えを確認できます。
                    </Alert>
                  )}

                  {answerResult && (
                    <>
                      <FeedbackPanel result={answerResult} mascotId={mascotId} correctAnswerLabel={correctAnswerLabel} />
                      <AnswerReviewPanel activity={currentActivity} answer={currentAnswer} result={answerResult} />
                    </>
                  )}
                </Box>
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
                  sx={{ fontWeight: 950, borderRadius: 2, minWidth: 140, minHeight: 48 }}
                >
                  戻る
                </Button>

                {answerRequired && !isCorrect ? (
                  <Button
                    variant="contained"
                    disabled={isSubmitting || (!shouldRetry && !hasCurrentAnswer)}
                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                    onClick={shouldRetry ? handleRetryCurrentActivity : handleAnswer}
                    sx={{ fontWeight: 950, borderRadius: 2, minWidth: 180, minHeight: 48 }}
                  >
                    {isSubmitting ? "確認中..." : shouldRetry ? "再挑戦する" : currentActivity.actionLabel || "答えを確認する"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    disabled={isSubmitting || !canGoNext}
                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                    endIcon={isSubmitting ? undefined : <PlayArrowIcon />}
                    onClick={handleCompleteActivity}
                    sx={{ fontWeight: 950, borderRadius: 2, minWidth: 150, minHeight: 48 }}
                  >
                    {isSubmitting ? "保存中..." : currentActivityIndex === mission.activities.length - 1 ? "完了する" : "次へ"}
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

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import {
  answerMissionActivity,
  completeMission,
  completeMissionActivity,
  getMissionPlay,
  recordCourseExamTestExecution,
  viewCourseExamHint,
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
import { getActivityRendererDefinition } from "@/features/learning/activityContent";
import {
  ActivityFeedbackCard,
  ArrayIndexSelect,
  ArrayRegionSelect,
  ArrayTrace,
  PairDecisionSelect,
  SelectableCardList,
  parseArrayRegionQuestions,
  parseArrayIndexQuestions,
  parseArrayTraceData,
  type SelectableCardState,
} from "@/features/learning/components";

import type {
  ChoiceItem,
  MissionActivity,
  MissionActivityType,
  MissionPlayResponse,
  CourseExamTestResultLog,
} from "./type";
import { ActivitySuccessCelebration } from "./components/activitySuccessCelebration";
import { LearningSidebar } from "./components/learningSidebar";
import { ActivityShell } from "./components/activityShell";
import type { PythonTestCase } from "@/lib/pyodideRunner";
import {
  getActivityLearningRole,
  learningRoleLabel,
} from "./components/algorithm/learningRole";

const InteractiveMatchInput = dynamic(
  () => import("./components/interactiveMatchInput").then((module) => module.InteractiveMatchInput),
  { ssr: false }
);
const SortableOrderedStepsInput = dynamic(
  () => import("./components/sortableOrderedStepsInput").then((module) => module.SortableOrderedStepsInput),
  { ssr: false }
);
const LearningRoadmapScene = dynamic(
  () => import("./components/algorithm/missionOneScenes").then((module) => module.LearningRoadmapScene),
  { ssr: false }
);
const BinarySearchCourseScene = dynamic(
  () => import("./components/algorithm/binarySearchMissionTwo").then((module) => module.BinarySearchCourseScene),
  { ssr: false }
);
const SortOverviewScene = dynamic(
  () => import("./components/algorithm/missionOneScenes").then((module) => module.SortOverviewScene),
  { ssr: false }
);
const MissionTwoScene = dynamic(
  () => import("./components/algorithm/missionTwoScenes").then((module) => module.MissionTwoScene),
  { ssr: false }
);
const ComparisonSequenceInput = dynamic(
  () => import("./components/algorithm/missionTwoInputs").then((module) => module.ComparisonSequenceInput),
  { ssr: false }
);
const CodeBlockBuilderInput = dynamic(
  () => import("./components/algorithm/missionTwoInputs").then((module) => module.CodeBlockBuilderInput),
  { ssr: false }
);
const MultiDecisionInput = dynamic(
  () => import("./components/algorithm/missionTwoInputs").then((module) => module.MultiDecisionInput),
  { ssr: false }
);
const OptionFillInput = dynamic(
  () => import("./components/algorithm/missionTwoInputs").then((module) => module.OptionFillInput),
  { ssr: false }
);
const MissionThreeScene = dynamic(
  () => import("./components/algorithm/missionThreeScenes").then((module) => module.MissionThreeScene),
  { ssr: false }
);
const MissionFourScene = dynamic(
  () => import("./components/algorithm/missionFourScenes").then((module) => module.MissionFourScene),
  { ssr: false }
);
const MissionFiveScene = dynamic(
  () => import("./components/algorithm/missionFiveScenes").then((module) => module.MissionFiveScene),
  { ssr: false }
);
const CodeRepairInput = dynamic(
  () => import("./components/algorithm/missionSixInputs").then((module) => module.CodeRepairInput),
  { ssr: false }
);
const LoopRoleInput = dynamic(
  () => import("./components/algorithm/missionSixInputs").then((module) => module.LoopRoleInput),
  { ssr: false }
);
const MissionSixScene = dynamic(
  () => import("./components/algorithm/missionSixScenes").then((module) => module.MissionSixScene),
  { ssr: false }
);
const CourseCheckEditor = dynamic(
  () => import("./components/courseCheckEditor").then((module) => module.CourseCheckEditor),
  { ssr: false }
);
const CourseCompletionEditor = dynamic(
  () => import("./components/courseCompletionEditor").then((module) => module.CourseCompletionEditor),
  { ssr: false }
);

const activityLabel: Record<MissionActivityType, string> = {
  TUTORIAL: "チュートリアル",
  VIEW: "見る",
  CHOICE: "選択",
  MATCH: "分類",
  ORDERED_STEPS: "並べ替え",
  SELECT_FILL: "穴埋め",
  TRY_CODE: "コード",
};

const parseDifficultyParam = (value: string | null): Difficulty | undefined => {
  if (value === "easy" || value === "normal" || value === "hard") {
    return value;
  }

  return undefined;
};

type ActivityResult = { isCorrect: boolean | null; feedback?: string; incorrectAttemptCount?: number };

const getEffectiveType = (activity: MissionActivity): MissionActivityType => activity.type;

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
  if (type === "CHOICE" || type === "MATCH" || type === "ORDERED_STEPS") {
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
  revealCorrectAnswer,
}: {
  choices: ChoiceItem[];
  selectedChoiceId: string | null;
  result?: ActivityResult;
  onSelect: (choiceId: string) => void;
  disabled: boolean;
  revealCorrectAnswer: boolean;
}) => {
  const items = choices.map((choice) => {
      const selected = selectedChoiceId === choice.id;
      const showResult = Boolean(result);
      const isCorrectChoice = choice.isCorrect === true;
      const showCorrectChoice =
        isCorrectChoice &&
        showResult &&
        (result?.isCorrect === true || revealCorrectAnswer);
      const isWrongSelected = showResult && selected && result?.isCorrect === false;
      const state: SelectableCardState = showCorrectChoice
        ? "correct"
        : isWrongSelected
          ? "incorrect"
          : selected
            ? "selected"
            : "idle";
      return { id: choice.id, label: choice.label, state };
    });

  return <SelectableCardList items={items} disabled={disabled} onSelect={onSelect} />;
};

const AnswerInput = ({
  activity,
  answer,
  activityResult,
  onAnswerChange,
  disabled,
  revealCorrectAnswer,
}: {
  activity: MissionActivity;
  answer: unknown;
  activityResult?: ActivityResult;
  onAnswerChange: (answer: unknown) => void;
  disabled: boolean;
  revealCorrectAnswer: boolean;
}) => {
  const type = getEffectiveType(activity);
  const answerRenderer = getActivityRendererDefinition(
    activity.content.rendererKey,
  ).answer;

  if (type === "CHOICE") {
    if (answerRenderer === "INDEX_SELECT") {
      const questions = parseArrayIndexQuestions(activity.content.data.indexSelectionQuestions);
      const answerRecord = answer && typeof answer === "object" && !Array.isArray(answer)
        ? answer as { selectedIndices?: unknown }
        : {};
      const selectedIndices = answerRecord.selectedIndices &&
        typeof answerRecord.selectedIndices === "object" &&
        !Array.isArray(answerRecord.selectedIndices)
        ? answerRecord.selectedIndices as Record<string, unknown>
        : {};
      return (
        <ArrayIndexSelect
          key={activity.id}
          questions={questions}
          selectedIndices={selectedIndices}
          disabled={disabled}
          showCorrect={activityResult?.isCorrect === true || revealCorrectAnswer}
          onChange={(next) => onAnswerChange({ selectedIndices: next })}
        />
      );
    }

    if (answerRenderer === "ARRAY_REGION_SELECT") {
      const questions = parseArrayRegionQuestions(activity.content.data.rangeDecisionQuestions);
      const answerRecord = answer && typeof answer === "object" && !Array.isArray(answer)
        ? answer as { selectedRegions?: unknown }
        : {};
      const selectedRegions = answerRecord.selectedRegions &&
        typeof answerRecord.selectedRegions === "object" &&
        !Array.isArray(answerRecord.selectedRegions)
        ? answerRecord.selectedRegions as Record<string, unknown>
        : {};
      return (
        <ArrayRegionSelect
          key={activity.id}
          questions={questions}
          selectedRegions={selectedRegions}
          disabled={disabled}
          showCorrect={activityResult?.isCorrect === true || revealCorrectAnswer}
          sequenceMode={activity.content.data.sequenceMode === "TRACE" ? "TRACE" : "QUESTIONS"}
          onChange={(next) => onAnswerChange({ selectedRegions: next })}
        />
      );
    }

    const answerRecord =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as { selectedChoiceId?: string })
        : {};

    return (
      <ChoiceInput
        choices={activity.content.data.choices ?? []}
        selectedChoiceId={answerRecord.selectedChoiceId ?? null}
        result={activityResult}
        disabled={disabled}
        revealCorrectAnswer={revealCorrectAnswer}
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
        items={activity.content.data.items ?? []}
        targets={activity.content.data.targets ?? []}
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
        steps={activity.content.data.steps ?? []}
        answer={Array.isArray(answer) ? answer : []}
        disabled={disabled}
        onAnswerChange={onAnswerChange}
      />
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
        : courseCheckAnswer.code ?? activity.content.data.starterCode ?? "";
    if (
      activity.content.data.evaluationMode === "TRANSCRIPTION" &&
      typeof activity.content.data.sampleCode === "string"
    ) {
      return (
        <CourseCheckEditor
          sampleCode={activity.content.data.sampleCode}
          value={code}
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
    if (answerRenderer === "PAIR_DECISION") {
      const questions = Array.isArray(activity.content.data.decisionPairs)
        ? activity.content.data.decisionPairs.flatMap((item) => {
            if (!isPlainRecord(item) || typeof item.id !== "string" || typeof item.left !== "number" || typeof item.right !== "number") return [];
            return [{
              id: item.id,
              left: item.left,
              right: item.right,
              ...(typeof item.feedback === "string" ? { feedback: item.feedback } : {}),
            }];
          })
        : [];
      const answerRecord = isPlainRecord(answer) ? answer : {};
      const values = isPlainRecord(answerRecord.values)
        ? Object.fromEntries(Object.entries(answerRecord.values).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        : {};
      const correctAnswers = isPlainRecord(activity.content.data.correctAnswers)
        ? Object.fromEntries(Object.entries(activity.content.data.correctAnswers).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        : {};
      return (
        <PairDecisionSelect
          key={activity.id}
          questions={questions}
          values={values}
          correctAnswers={correctAnswers}
          disabled={disabled}
          showCorrect={activityResult?.isCorrect === true || revealCorrectAnswer}
          onChange={(nextValues) => onAnswerChange({ values: nextValues })}
        />
      );
    }

    if (answerRenderer === "LOOP_ROLE") {
      return (
        <LoopRoleInput
          activity={activity}
          answer={answer}
          disabled={disabled}
          showExplanation={activityResult?.isCorrect === true || revealCorrectAnswer}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    if (answerRenderer === "CODE_REPAIR") {
      return (
        <CodeRepairInput
          activity={activity}
          answer={answer}
          disabled={disabled}
          showCorrect={activityResult?.isCorrect === true || revealCorrectAnswer}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    if (answerRenderer === "COMPARISON_SEQUENCE") {
      return (
        <ComparisonSequenceInput
          activity={activity}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    if (answerRenderer === "MULTI_DECISION") {
      return (
        <MultiDecisionInput
          activity={activity}
          answer={answer}
          disabled={disabled}
          showExplanation={activityResult?.isCorrect === true}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    if (answerRenderer === "OPTION_FILL") {
      return (
        <OptionFillInput
          activity={activity}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    if (answerRenderer === "CODE_BLOCK_BUILDER") {
      return (
        <CodeBlockBuilderInput
          activity={activity}
          answer={answer}
          isCorrect={activityResult?.isCorrect === true}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
    }

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

const ActivityContext = ({ activity }: { activity: MissionActivity }) => {
  const body = activity.content.data.body ?? activity.content.data.text;
  const summary = activity.content.data.summary ?? [];
  const sections = Array.isArray(activity.content.data.sections)
    ? activity.content.data.sections.flatMap((section) => {
        if (!section || typeof section !== "object" || Array.isArray(section)) return [];
        const candidate = section as Record<string, unknown>;
        if (typeof candidate.heading !== "string" || typeof candidate.body !== "string") return [];
        return [{
          heading: candidate.heading,
          body: candidate.body,
          label: typeof candidate.label === "string" ? candidate.label : null,
        }];
      })
    : [];
  const conclusion =
    typeof activity.content.data.conclusion === "string"
      ? activity.content.data.conclusion
      : null;
  const listItems = Array.isArray(activity.content.data.listItems)
    ? activity.content.data.listItems.filter((item): item is string => typeof item === "string")
    : [];
  const comparisonRecord =
    activity.content.data.comparison &&
    typeof activity.content.data.comparison === "object" &&
    !Array.isArray(activity.content.data.comparison)
      ? activity.content.data.comparison as Record<string, unknown>
      : null;
  const comparisonHeaders = Array.isArray(comparisonRecord?.headers)
    ? comparisonRecord.headers.filter((header): header is string => typeof header === "string")
    : [];
  const comparisonRows = Array.isArray(comparisonRecord?.rows)
    ? comparisonRecord.rows.flatMap((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return [];
        const candidate = row as Record<string, unknown>;
        const cells = Array.isArray(candidate.cells)
          ? candidate.cells.filter((cell): cell is string => typeof cell === "string")
          : [];
        if (cells.length !== comparisonHeaders.length) return [];
        return [{
          cells,
          label: typeof candidate.label === "string" ? candidate.label : null,
          note: typeof candidate.note === "string" ? candidate.note : null,
        }];
      })
    : [];
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {body && (
        <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.75, color: "#334155", fontWeight: 700, fontSize: { xs: 15, sm: 16 } }}>
          {body}
        </Typography>
      )}
      {summary.length > 0 && (
        <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
          {summary.slice(0, 4).map((item) => (
            <Chip
              key={item}
              icon={<CheckCircleIcon />}
              label={item}
              size="small"
              sx={{ bgcolor: "#eff6ff", color: "#1e3a8a", fontWeight: 800 }}
            />
          ))}
        </Stack>
      )}
      {listItems.length > 0 && (
        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1.25,
            listStyle: "none",
          }}
        >
          {listItems.map((item) => (
            <Paper
              component="li"
              key={item}
              elevation={0}
              sx={{ p: 1.75, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#f8fbff" }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <CheckCircleIcon sx={{ mt: 0.1, color: "#2563eb", fontSize: 21 }} />
                <Typography fontWeight={850} color="#1e293b" sx={{ lineHeight: 1.65 }}>
                  {item}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}
      {comparisonHeaders.length > 0 && comparisonRows.length > 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: "1px solid #bfdbfe" }}>
          <Table sx={{ minWidth: 680 }} aria-label="探索方法の比較">
            <TableHead>
              <TableRow sx={{ bgcolor: "#eff6ff" }}>
                {comparisonHeaders.map((header) => (
                  <TableCell key={header} sx={{ color: "#1e3a8a", fontWeight: 950, borderColor: "#bfdbfe" }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.cells.join("-")} sx={{ bgcolor: row.label ? "#f8fbff" : "#fff" }}>
                  {row.cells.map((cell, index) => (
                    <TableCell key={`${cell}-${index}`} sx={{ verticalAlign: "top", borderColor: "#dbeafe" }}>
                      <Stack spacing={0.75} alignItems="flex-start">
                        <Typography fontWeight={index === 0 ? 950 : 750} color="#1e293b">
                          {cell}
                        </Typography>
                        {index === 0 && row.label && (
                          <Chip label={row.label} size="small" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 900 }} />
                        )}
                        {index === 0 && row.note && (
                          <Typography variant="caption" color="#64748b" fontWeight={750}>
                            {row.note}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {sections.length > 0 && (
        <Stack spacing={2.25}>
          {sections.map((section) => (
            <Box key={section.heading}>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.6 }}>
                <Typography component="h2" sx={{ fontSize: { xs: 17, sm: 19 }, fontWeight: 950, color: "#0f172a" }}>
                  {section.heading}
                </Typography>
                {section.label && (
                  <Chip
                    label={section.label}
                    size="small"
                    sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 900 }}
                  />
                )}
              </Stack>
              <Typography sx={{ lineHeight: 1.8, color: "#334155", fontWeight: 700, fontSize: { xs: 15, sm: 16 } }}>
                {section.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
      {conclusion && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
          <Typography sx={{ lineHeight: 1.8, color: "#1e3a8a", fontWeight: 900 }}>
            {conclusion}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
};

const ActivityVisualization = ({
  activity,
  answer,
  result,
}: {
  activity: MissionActivity;
  answer?: unknown;
  result?: ActivityResult;
}) => {
  const rendererKey = activity.content.rendererKey;
  const data = activity.content.data;
  const renderer = getActivityRendererDefinition(rendererKey);
  const numberList = (value: unknown) =>
    Array.isArray(value) && value.every((item) => typeof item === "number")
      ? (value as number[])
      : [];

  if (renderer.visualization === "BINARY_SEARCH") {
    return <BinarySearchCourseScene rendererKey={rendererKey} content={data} />;
  }

  if (renderer.visualization === "ARRAY_TRACE") {
    const trace = parseArrayTraceData(data);
    return trace ? <ArrayTrace key={activity.id} data={trace} /> : null;
  }

  if (renderer.visualization === "BUBBLE_MISSION_6") {
    return <MissionSixScene rendererKey={rendererKey} content={data} answer={answer} isCorrect={result?.isCorrect === true} />;
  }

  if (renderer.visualization === "BUBBLE_MISSION_5") {
    return <MissionFiveScene rendererKey={rendererKey} content={data} isCorrect={result?.isCorrect === true} />;
  }

  if (renderer.visualization === "BUBBLE_MISSION_4") {
    return <MissionFourScene rendererKey={rendererKey} content={data} answer={answer} isCorrect={result?.isCorrect === true} />;
  }

  if (renderer.visualization === "BUBBLE_MISSION_3") {
    return <MissionThreeScene rendererKey={rendererKey} content={data} answer={answer} isCorrect={result?.isCorrect === true} />;
  }

  if (renderer.visualization === "BUBBLE_MISSION_2") {
    return <MissionTwoScene rendererKey={rendererKey} content={data} />;
  }

  if (renderer.visualization === "SORT_OVERVIEW") {
    return (
      <SortOverviewScene
        beforeValues={numberList(data.beforeValues)}
        ascendingValues={numberList(data.ascendingValues)}
        descendingValues={numberList(data.descendingValues)}
        explanation={typeof data.explanation === "string" ? data.explanation : ""}
        finalExplanation={typeof activity.content.data.finalExplanation === "string"
          ? activity.content.data.finalExplanation
          : ""}
      />
    );
  }

  if (renderer.visualization === "LEARNING_ROADMAP") {
    const steps = Array.isArray(activity.content.data.roadmapSteps)
      ? activity.content.data.roadmapSteps.filter((step): step is string => typeof step === "string")
      : [];
    return (
      <LearningRoadmapScene
        steps={steps}
        emphasis={typeof activity.content.data.emphasis === "string"
          ? activity.content.data.emphasis
          : ""}
      />
    );
  }

  return null;
};

const hasActivityVisualization = (activity: MissionActivity) =>
  getActivityRendererDefinition(activity.content.rendererKey).visualization !== "NONE";

const hasAnswer = (activity: MissionActivity, answer: unknown) => {
  const type = getEffectiveType(activity);
  const answerRenderer = getActivityRendererDefinition(
    activity.content.rendererKey,
  ).answer;

  if (type === "CHOICE") {
    if (answerRenderer === "INDEX_SELECT") {
      const questions = Array.isArray(activity.content.data.indexSelectionQuestions)
        ? activity.content.data.indexSelectionQuestions
        : [];
      const requiredIds = questions.flatMap((question) => {
        if (!isPlainRecord(question) || typeof question.id !== "string") return [];
        return [question.id];
      });
      const selectedIndices =
        answer && typeof answer === "object" && !Array.isArray(answer)
          ? (answer as { selectedIndices?: unknown }).selectedIndices
          : null;
      return Boolean(
        selectedIndices &&
        typeof selectedIndices === "object" &&
        !Array.isArray(selectedIndices) &&
        requiredIds.length > 0 &&
        requiredIds.every((id) => typeof (selectedIndices as Record<string, unknown>)[id] === "number")
      );
    }

    if (answerRenderer === "ARRAY_REGION_SELECT") {
      const questions = Array.isArray(activity.content.data.rangeDecisionQuestions)
        ? activity.content.data.rangeDecisionQuestions
        : [];
      const requiredIds = questions.flatMap((question) => {
        if (!isPlainRecord(question) || typeof question.id !== "string") return [];
        return [question.id];
      });
      const selectedRegions =
        answer && typeof answer === "object" && !Array.isArray(answer)
          ? (answer as { selectedRegions?: unknown }).selectedRegions
          : null;
      return Boolean(
        selectedRegions &&
        typeof selectedRegions === "object" &&
        !Array.isArray(selectedRegions) &&
        requiredIds.length > 0 &&
        requiredIds.every((id) => {
          const selected = (selectedRegions as Record<string, unknown>)[id];
          return selected === "left" || selected === "center" || selected === "right";
        })
      );
    }

    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        (answer as { selectedChoiceId?: string }).selectedChoiceId
    );
  }

  if (answerRenderer === "MATCH") {
    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        Object.keys((answer as { itemTargetMap?: Record<string, string> }).itemTargetMap ?? {}).length > 0
    );
  }

  if (answerRenderer === "BLOCK_ORDER") {
    return (Array.isArray(answer) && answer.length > 0) || (activity.content.data.steps?.length ?? 0) > 0;
  }

  if (type === "TRY_CODE" && activity.content.data.evaluationMode === "TEST_CASES") {
    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        typeof (answer as { code?: unknown }).code === "string" &&
        (answer as { code: string }).code.trim().length > 0
    );
  }

  if (type === "TRY_CODE" && activity.content.data.evaluationMode === "TRANSCRIPTION") {
    return Boolean(
      answer &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        (answer as { executionPassed?: boolean }).executionPassed
    );
  }

  if (type === "SELECT_FILL" || type === "TRY_CODE") {
    if (
      type === "SELECT_FILL" &&
      answer &&
      typeof answer === "object" &&
      !Array.isArray(answer)
    ) {
      const values = (answer as { values?: unknown }).values;
      if (
        answerRenderer === "PAIR_DECISION" ||
        answerRenderer === "MULTI_DECISION" ||
        answerRenderer === "LOOP_ROLE" ||
        answerRenderer === "CODE_REPAIR"
      ) {
        const requiredCount = Array.isArray(activity.content.data.decisionPairs)
          ? activity.content.data.decisionPairs.length
          : 0;
        return Boolean(
          values &&
          typeof values === "object" &&
          !Array.isArray(values) &&
          Object.keys(values).length === requiredCount
        );
      }
      if (answerRenderer === "COMPARISON_SEQUENCE") {
        const requiredCount = Array.isArray(activity.content.data.sequenceQuestions)
          ? activity.content.data.sequenceQuestions.length
          : 0;
        return Array.isArray(values) && values.length === requiredCount && values.every((value) => typeof value === "string" && value.length > 0);
      }
      if (answerRenderer === "CODE_BLOCK_BUILDER") {
        const requiredCount = Array.isArray(activity.content.data.correctAnswers)
          ? activity.content.data.correctAnswers.length
          : 0;
        return Array.isArray(values) && values.length === requiredCount && values.every((value) => typeof value === "string" && value.length > 0);
      }
    }
    return typeof answer === "string" && answer.trim().length > 0;
  }

  return true;
};

const getCorrectAnswerLabel = (activity: MissionActivity) => {
  if (getEffectiveType(activity) !== "CHOICE") return null;
  return activity.content.data.choices?.find((choice) => choice.isCorrect)?.label ?? null;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const stringifyAnswerValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => String(item)).join(" / ");
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
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
  const answerRenderer = getActivityRendererDefinition(
    activity.content.rendererKey,
  ).answer;

  if (type === "MATCH") {
    const answers = Array.isArray(activity.content.data.answers) ? activity.content.data.answers : [];
    if (answers.length === 0) return null;

    const targetLabelById = new Map(
      (activity.content.data.targets ?? []).map((target) => [target.id, target.label])
    );
    const itemLabelById = new Map(
      (activity.content.data.items ?? []).map((item) => [item.id, item.label])
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
    const expectedOrder = toStringArray(activity.content.data.answerOrder);
    if (expectedOrder.length === 0) return null;

    const stepLabelById = new Map((activity.content.data.steps ?? []).map((step) => [step.id, step.label]));
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
    if (
      answerRenderer === "PAIR_DECISION" ||
      answerRenderer === "MULTI_DECISION" ||
      answerRenderer === "LOOP_ROLE" ||
      answerRenderer === "CODE_REPAIR"
    ) return null;
    const expected = activity.content.data.correctAnswers ?? activity.content.data.answer;
    if (expected === undefined) return null;

    const answerRecord = isPlainRecord(answer) ? answer : {};
    const userValue = answerRecord.values ?? answer;
    const labelById = new Map<string, string>();
    if (Array.isArray(activity.content.data.codeBlocks)) {
      activity.content.data.codeBlocks.forEach((item) => {
        if (!isPlainRecord(item) || typeof item.id !== "string" || typeof item.label !== "string") return;
        labelById.set(item.id, item.label);
      });
    }
    if (Array.isArray(activity.content.data.fillOptions)) {
      activity.content.data.fillOptions.forEach((item) => {
        if (!isPlainRecord(item) || typeof item.id !== "string" || typeof item.label !== "string") return;
        labelById.set(item.id, item.label);
      });
    }
    if (Array.isArray(activity.content.data.sequenceQuestions)) {
      activity.content.data.sequenceQuestions.forEach((question) => {
        if (!isPlainRecord(question) || !Array.isArray(question.options)) return;
        question.options.forEach((option) => {
          if (!isPlainRecord(option) || typeof option.id !== "string" || typeof option.label !== "string") return;
          labelById.set(option.id, option.label);
        });
      });
    }
    const formatAnswer = (value: unknown) => {
      if (Array.isArray(value)) {
        return value.map((item) => typeof item === "string" ? labelById.get(item) ?? item : String(item)).join(" / ");
      }
      return typeof value === "string" ? labelById.get(value) ?? value : stringifyAnswerValue(value);
    };

    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}>
        <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1 }}>
          回答の確認
        </Typography>
        <Typography color="#166534" fontWeight={900}>正解: {formatAnswer(expected)}</Typography>
        <Typography color="#92400e" fontWeight={800} sx={{ mt: 0.5 }}>
          あなたの回答: {formatAnswer(userValue) || "未回答"}
        </Typography>
      </Paper>
    );
  }

  if (answerRenderer === "CODE_EDITOR") {
    const expectedCode =
      typeof activity.content.data.answerCode === "string"
        ? activity.content.data.answerCode
        : typeof activity.content.data.expectedCode === "string"
          ? activity.content.data.expectedCode
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
    <ActivityFeedbackCard
      tone={isCorrect ? "correct" : "hint"}
      title={isCorrect ? "正解！" : "もう一度考えてみよう"}
      message={feedbackText}
      detail={!isCorrect && correctAnswerLabel ? (
        <Typography sx={{ color: "#166534", fontWeight: 950, lineHeight: 1.7 }}>
          正解は「{correctAnswerLabel}」です。
        </Typography>
      ) : undefined}
      aside={(
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            component="img"
            src={getMascotImagePath(mascotId, isCorrect ? "happy" : "thinking")}
            alt="学習を応援する相棒"
            sx={{ width: 68, height: 68, objectFit: "contain" }}
          />
        </Stack>
      )}
    />
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
    Record<string, ActivityResult>
  >({});
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingMission, setIsCompletingMission] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEffectKey, setSuccessEffectKey] = useState(0);
  const mascotId = useUserMascot();
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
                feedback: "完了済みです。",
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
  const currentLearningRole = currentActivity
    ? getActivityLearningRole(currentActivity)
    : "EXPLANATION";
  const completedCount = completedActivityIds.size;
  const currentPositionValue = mission
    ? Math.round(((currentActivityIndex + 1) / mission.activities.length) * 100)
    : 0;

  useEffect(() => {
    if (!currentActivityResult) return;
    window.requestAnimationFrame(() => {
      feedbackRegionRef.current?.focus();
    });
  }, [currentActivityResult, currentActivity?.id]);

  const advanceToActivity = (nextIndex: number) => {
    if (!mission) return;
    setCurrentActivityIndex(nextIndex);
    setErrorMessage(null);
  };

  const handleBackActivity = () => {
    if (!mission) return;

    for (let index = currentActivityIndex - 1; index >= 0; index -= 1) {
      if (completedActivityIds.has(mission.activities[index].id)) {
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
          ? currentActivity.content.data.steps?.map((step) => step.id) ?? []
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

  const handleViewCourseExamHint = async (hintId: string) => {
    const attempt = mission?.courseExamAttempt;
    if (!token || !mission || !attempt) {
      throw new Error("COURSE_EXAMの挑戦情報を取得できませんでした。");
    }

    const hintView = await viewCourseExamHint(
      token,
      mission.id,
      attempt.id,
      hintId
    );
    setMission((current) => {
      if (!current?.courseExamAttempt) return current;
      if (
        current.courseExamAttempt.hintViews.some(
          (view) => view.hintId === hintView.hintId
        )
      ) {
        return current;
      }
      return {
        ...current,
        courseExamAttempt: {
          ...current.courseExamAttempt,
          hintViews: [...current.courseExamAttempt.hintViews, hintView],
        },
      };
    });
  };

  const handleRecordCourseExamTestExecution = async (execution: {
    code: string;
    testResults: CourseExamTestResultLog[];
    runtimeError: string | null;
  }) => {
    const attempt = mission?.courseExamAttempt;
    if (!token || !mission || !attempt) {
      throw new Error("COURSE_EXAMの試行情報を取得できませんでした。");
    }

    const savedExecution = await recordCourseExamTestExecution(
      token,
      mission.id,
      attempt.id,
      execution
    );
    setMission((current) => {
      if (!current?.courseExamAttempt) return current;
      return {
        ...current,
        courseExamAttempt: {
          ...current.courseExamAttempt,
          testExecutions: [
            ...current.courseExamAttempt.testExecutions,
            savedExecution,
          ],
        },
      };
    });
  };

  const handleCompleteActivity = async () => {
    if (!mission || !currentActivity || !firebaseUid) return;

    const alreadyCompleted = completedActivityIds.has(currentActivity.id);
    const nextIndex = currentActivityIndex + 1;
    const isLastActivity = nextIndex >= mission.activities.length;
    const requiresServerConfirmation = isLastActivity;

    if (alreadyCompleted && !requiresServerConfirmation) {
      advanceToActivity(nextIndex);
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
      const completedAttemptId =
        missionResult.courseExamAttemptId ?? mission.courseExamAttempt?.id;
      if (completedAttemptId) {
        window.localStorage.removeItem(
          `course-exam-draft:${completedAttemptId}`
        );
      }
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
  const feedbackPolicy = currentActivity.content.feedbackPolicy;
  const incorrectAttemptCount = answerResult?.incorrectAttemptCount ?? currentActivity.incorrectAttemptCount;
  const revealCorrectAnswer = Boolean(
    answerResult?.isCorrect === false &&
    feedbackPolicy.mode === "RETRY_WITH_HINT" &&
    incorrectAttemptCount >= feedbackPolicy.revealAfterAttempts
  );
  const correctAnswerLabel = revealCorrectAnswer ? getCorrectAnswerLabel(currentActivity) : null;
  const shouldRetry = answerResult?.isCorrect === false;
  const isCurrentCompleted = completedActivityIds.has(currentActivity.id);
  const isCorrect = answerResult?.isCorrect === true || isCurrentCompleted;
  const canGoNext = !answerRequired || isCorrect;
  const remainingActivityCount = Math.max(
    mission.activities.length - completedCount - (isCurrentCompleted ? 0 : 1),
    0
  );
  const availableActivityId =
    mission.activities.find(
      (activity) => !completedActivityIds.has(activity.id)
    )?.id ?? null;
  const isCourseCompletionActivity = currentActivity.content.data.evaluationMode === "TEST_CASES";
  const courseExamAttemptId = mission.courseExamAttempt?.id ?? null;
  const courseCompletionAnswer = isPlainRecord(currentAnswer) ? currentAnswer : {};
  const courseCompletionCode =
    typeof currentAnswer === "string"
      ? currentAnswer
      : typeof courseCompletionAnswer.code === "string"
        ? courseCompletionAnswer.code
        : typeof currentActivity.content.data.starterCode === "string"
          ? currentActivity.content.data.starterCode
          : "";
  const courseCompletionFunctionName = typeof currentActivity.content.data.functionName === "string"
    ? currentActivity.content.data.functionName
    : "bubble_sort";
  const courseCompletionTests: PythonTestCase[] = Array.isArray(currentActivity.content.data.testCases)
    ? currentActivity.content.data.testCases.flatMap((test) => {
        if (!isPlainRecord(test)) return [];
        const legacyInput = test.input;
        const args = Array.isArray(test.args)
          ? test.args
          : Array.isArray(legacyInput) && legacyInput.every((item) => typeof item === "number")
            ? [legacyInput]
            : null;
        const expected = test.expected;
        if (
          typeof test.id !== "string" ||
          typeof test.label !== "string" ||
          args === null ||
          expected === undefined
        ) return [];
        return [{
          id: test.id,
          label: test.label,
          functionName: courseCompletionFunctionName,
          args,
          expected,
          displayInput: typeof test.displayInput === "string"
            ? test.displayInput
            : legacyInput ?? args,
        }];
      })
    : [];
  const courseCompletionHints = Array.isArray(currentActivity.content.data.hints)
    ? currentActivity.content.data.hints.flatMap((hint) => {
        if (
          !isPlainRecord(hint) ||
          typeof hint.id !== "string" ||
          typeof hint.title !== "string" ||
          typeof hint.body !== "string"
        ) return [];
        return [{
          id: hint.id,
          title: hint.title,
          body: hint.body,
          ...(typeof hint.code === "string" ? { code: hint.code } : {}),
        }];
      })
    : [];

  const updateCurrentAnswer = (nextAnswer: unknown) => {
    setAnswerMap((current) => ({ ...current, [currentActivity.id]: nextAnswer }));
    setAnswerResultMap((current) => {
      if (!current[currentActivity.id] || current[currentActivity.id].isCorrect === true) return current;
      const next = { ...current };
      delete next[currentActivity.id];
      return next;
    });
  };

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
              display: "none",
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
                      label={activityLabel[currentActivity.type]}
                      sx={{
                        bgcolor: "#eff6ff",
                        color: "#1d4ed8",
                        fontWeight: 950,
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                    <Chip
                      label={learningRoleLabel[currentLearningRole]}
                      variant="outlined"
                      sx={{ fontWeight: 900 }}
                    />
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
                    sx={{ fontSize: { xs: 24, md: 28 }, lineHeight: 1.25 }}
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
                  label={`Activity ${currentActivityIndex + 1} / ${mission.activities.length}`}
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

          <ActivityShell
            header={
              <Stack direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    <Chip
                      icon={<ActivityIcon type={currentActivity.type} />}
                      label={isCourseCompletionActivity ? "COURSE MISSION" : activityLabel[currentActivity.type]}
                      sx={{
                        bgcolor: isCourseCompletionActivity ? "#fef3c7" : "#eff6ff",
                        color: isCourseCompletionActivity ? "#a16207" : "#1d4ed8",
                        fontWeight: 950,
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                    {!isCourseCompletionActivity && (
                      <Chip
                        label={learningRoleLabel[currentLearningRole]}
                        variant="outlined"
                        sx={{ fontWeight: 900 }}
                      />
                    )}
                    {isCourseCompletionActivity && (
                      <Chip label="コース完了課題" sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 950 }} />
                    )}
                  </Stack>
                  <Typography component="h1" sx={{ fontSize: { xs: 24, md: 28 }, lineHeight: 1.3, fontWeight: 950, color: "#0f172a" }}>
                    {currentActivity.title}
                  </Typography>
                  <Typography sx={{ mt: 0.75, color: "#475569", fontSize: { xs: 15, sm: 16 }, fontWeight: 700 }}>
                    {currentActivity.instruction}
                  </Typography>
                </Box>
                <Typography fontWeight={900} color="#475569" sx={{ whiteSpace: "nowrap" }}>
                  Activity {currentActivityIndex + 1} / {mission.activities.length}
                </Typography>
              </Stack>
            }
            context={isCourseCompletionActivity ? undefined : <ActivityContext activity={currentActivity} />}
            visualization={isCourseCompletionActivity ? (
              courseExamAttemptId ? (
              <CourseCompletionEditor
                attemptId={courseExamAttemptId}
                starterCode={typeof currentActivity.content.data.starterCode === "string" ? currentActivity.content.data.starterCode : ""}
                value={courseCompletionCode}
                tests={courseCompletionTests}
                hints={courseCompletionHints}
                viewedHintIds={mission.courseExamAttempt?.hintViews.map((view) => view.hintId) ?? []}
                mascotId={mascotId}
                disabled={isSubmitting || isCorrect}
                onChange={(code) => updateCurrentAnswer({ code, executionPassed: false, passedTestCount: 0, totalTestCount: courseCompletionTests.length, testResults: [], runtimeError: null })}
                onTestResult={({ passed, passedCount, totalCount, testResults, runtimeError }) => updateCurrentAnswer({
                  code: courseCompletionCode,
                  executionPassed: passed,
                  passedTestCount: passedCount,
                  totalTestCount: totalCount,
                  testResults,
                  runtimeError,
                })}
                onTestExecution={handleRecordCourseExamTestExecution}
                onViewHint={handleViewCourseExamHint}
              />
              ) : (
                <Alert severity="error">
                  COURSE_EXAMの試行情報を取得できませんでした。ページを再読み込みしてください。
                </Alert>
              )
            ) : hasActivityVisualization(currentActivity) ? (
              <ActivityVisualization
                activity={currentActivity}
                answer={answerMap[currentActivity.id]}
                result={answerResultMap[currentActivity.id]}
              />
            ) : undefined}
            visualizationVariant={isCourseCompletionActivity ? "workspace" : "default"}
            interaction={answerRequired && !isCourseCompletionActivity ? (
              <Stack spacing={2}>
                <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 950, color: "#0f172a" }}>
                  {typeof currentActivity.content.data.question === "string"
                    ? currentActivity.content.data.question
                    : "操作して答えを確認しましょう"}
                </Typography>
                <AnswerInput
                  key={currentActivity.id}
                  activity={currentActivity}
                  answer={currentAnswer}
                  activityResult={answerResult}
                  disabled={isSubmitting || isCorrect}
                  revealCorrectAnswer={revealCorrectAnswer}
                  onAnswerChange={updateCurrentAnswer}
                />
              </Stack>
            ) : undefined}
            feedback={isCourseCompletionActivity ? (
              answerResult ? (
                <Box ref={feedbackRegionRef} tabIndex={-1} aria-live="polite" sx={{ outline: "none" }}>
                  <FeedbackPanel result={answerResult} mascotId={mascotId} />
                </Box>
              ) : undefined
            ) : answerRequired ? (
              <Box ref={feedbackRegionRef} tabIndex={-1} aria-live="polite" sx={{ outline: "none" }}>
                {answerResult ? (
                  <Stack spacing={1.5}>
                    <FeedbackPanel result={answerResult} mascotId={mascotId} correctAnswerLabel={correctAnswerLabel} />
                    {revealCorrectAnswer && (
                      <AnswerReviewPanel activity={currentActivity} answer={currentAnswer} result={answerResult} />
                    )}
                  </Stack>
                ) : (
                  <MascotCoach
                    mascotId={mascotId}
                    message={currentActivity.mentorMessage}
                    mood="thinking"
                  />
                )}
              </Box>
            ) : (
              <MascotCoach
                mascotId={mascotId}
                message={currentActivity.mentorMessage}
                mood={currentActivityIndex === mission.activities.length - 1 ? "cheer" : "thinking"}
              />
            )}
            navigation={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
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
                    {isSubmitting
                      ? "保存中..."
                      : isCorrect && isCourseCompletionActivity
                        ? "Course Missionを完了"
                        : isCorrect && typeof currentActivity.content.data.completionLabel === "string"
                        ? currentActivity.content.data.completionLabel
                        : currentActivity.actionLabel || (currentActivityIndex === mission.activities.length - 1 ? "Missionを完了" : "次へ")}
                  </Button>
                )}
              </Stack>
            }
          />
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

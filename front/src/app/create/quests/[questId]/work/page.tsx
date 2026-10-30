"use client";

import Editor from "@monaco-editor/react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ForumIcon from "@mui/icons-material/Forum";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Chip, CircularProgress,
  Container, Divider, FormControlLabel, LinearProgress, Paper, Skeleton, Stack, Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getCreateQuest, getCreateQuestFeedback, saveCreateQuestAttempt, saveCreateQuestExecution,
  startCreateQuestAttempt, startCreateQuestFeedback, submitCreateQuest, viewCreateQuestHint,
  type CreateQuest, type CreateQuestFeedbackResponse, type RequirementResult,
} from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateQuestPreview } from "@/app/create/_components/createQuestPreview";
import { auth } from "@/lib/firebase";
import { disposePyodideRunner, preparePyodide, runCreateQuestTests } from "@/lib/pyodideRunner";

const categoryLabel = { FUNCTIONAL: "機能", QUALITY: "品質", PERFORMANCE: "性能", IMPLEMENTATION: "実装" } as const;

export default function CreateQuestWorkPage() {
  const { questId } = useParams<{ questId: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [quest, setQuest] = useState<CreateQuest | null>(null);
  const [code, setCode] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<RequirementResult[]>([]);
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<{ id: string; score: number; maxScore: number } | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<{ id: string; title: string; rarity: string }[]>([]);
  const [feedback, setFeedback] = useState<CreateQuestFeedbackResponse | null>(null);
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());

  const load = useCallback(async (idToken: string) => {
    let data = await getCreateQuest(idToken, questId);
    if (!data.attempt) {
      await startCreateQuestAttempt(idToken, questId);
      data = await getCreateQuest(idToken, questId);
    }
    setQuest(data);
    setCode(data.attempt?.code || data.starterCode);
    setSelectedIds(data.attempt?.selectedRequirementIds ?? []);
    setRevealedHints(new Set((data.attempt?.viewedHints ?? []).map((item) => `${item.requirementId}:${item.hintId}`)));
    setResults(data.attempt?.latestExecution?.requirementResults ?? []);
    const latestSubmission = data.attempt?.latestSubmission;
    setSubmission(latestSubmission ? { id: latestSubmission.id, score: latestSubmission.score, maxScore: latestSubmission.maxScore } : null);
    setFeedback(latestSubmission?.feedback ?? null);
  }, [questId]);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setError("ログインが必要です。"); return; }
    try { const idToken = await user.getIdToken(); setToken(idToken); await load(idToken); }
    catch (cause) { console.error(cause); setError("作る課題を準備できませんでした。"); }
  }), [load]);

  useEffect(() => {
    let active = true;
    preparePyodide()
      .then(() => { if (active) setRuntime("ready"); })
      .catch((cause) => {
        if (!active) return;
        console.error(cause);
        setRuntime("error");
      });
    return () => { active = false; disposePyodideRunner(); };
  }, []);

  useEffect(() => {
    if (!token || !submission || feedback?.status !== "GENERATING") return;
    const timer = window.setInterval(async () => {
      try {
        const next = await getCreateQuestFeedback(token, submission.id);
        setFeedback(next);
        if (next.status !== "GENERATING") window.clearInterval(timer);
      } catch (cause) { console.error(cause); }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [feedback?.status, submission, token]);

  const score = useMemo(() => quest?.requirements.filter((item) => results.find((result) => result.requirementId === item.id)?.passed).reduce((sum, item) => sum + item.points, 0) ?? 0, [quest, results]);
  const basicPassed = useMemo(() => Boolean(quest) && quest!.requirements.filter((item) => item.kind === "BASIC").every((item) => results.find((result) => result.requirementId === item.id)?.passed), [quest, results]);
  const run = async () => {
    if (!quest || !token || !quest.attempt || runtime !== "ready") return;
    setRunning(true); setError(null); setSubmission(null); setFeedback(null);
    try {
      const response = await runCreateQuestTests({ code, functionName: quest.functionName, requirements: quest.requirements });
      const stored = await saveCreateQuestExecution(token, quest.attempt.id, code, response.results, null);
      setResults(stored.requirementResults);
    } catch (cause) {
      console.error(cause); const message = cause instanceof Error ? cause.message : "コードを実行できませんでした。"; setError(message);
      await saveCreateQuestExecution(token, quest.attempt.id, code, [], message).catch(console.error);
    } finally { setRunning(false); }
  };

  const save = async () => {
    if (!quest?.attempt || !token) return;
    setSaving(true); setError(null);
    try { const response = await saveCreateQuestAttempt(token, quest.attempt.id, code, selectedIds); setSavedAt(new Date(response.savedAt).toLocaleString("ja-JP")); }
    catch (cause) { console.error(cause); setError("コードを保存できませんでした。"); }
    finally { setSaving(false); }
  };

  const submit = async () => {
    if (!quest?.attempt || !token || !basicPassed) return;
    setSubmitting(true); setError(null);
    try {
      const next = await submitCreateQuest(token, quest.attempt.id, code, results);
      setSubmission({ id: next.submissionId, score: next.score, maxScore: next.maxScore });
      setUnlockedAchievements(next.unlockedAchievements);
      setFeedback(await startCreateQuestFeedback(token, next.submissionId));
    } catch (cause) { console.error(cause); setError("提出またはAIレビューの開始に失敗しました。"); }
    finally { setSubmitting(false); }
  };

  const revealHint = async (requirementId: string, hintId: string) => {
    const key = `${requirementId}:${hintId}`;
    if (revealedHints.has(key) || !quest?.attempt || !token) return;
    await viewCreateQuestHint(token, quest.attempt.id, requirementId, hintId);
    setRevealedHints((current) => new Set([...current, key]));
  };

  const shareHref = useMemo(() => {
    if (!quest || !submission) return "";
    const params = new URLSearchParams({
      category: "WORK_SHARE", title: `${quest.title}（${submission.score}点）`,
      body: `「${quest.title}」を${submission.score} / ${submission.maxScore}点で完成させました。\n達成した要件や実装方法について共有します。`, code,
    });
    return `/quest-board/new?${params.toString()}`;
  }, [code, quest, submission]);

  const feedbackActionHref = useMemo(() => {
    const action = feedback?.feedback;
    if (!action || !quest) return null;
    if (action.actionType === "SHARE_CREATE_QUEST") return shareHref;
    if (action.actionType === "VIEW_BOARD_POSTS") return "/quest-board";
    if (action.actionType === "OPEN_RELATED_COURSE") {
      const relatedCourse = quest.relatedCourses.find((course) =>
        action.actionLabel.includes(course.title),
      ) ?? quest.relatedCourses[0];
      return relatedCourse ? `/courses/roadmap/${encodeURIComponent(relatedCourse.id)}` : "/courses";
    }
    return null;
  }, [feedback?.feedback, quest, shareHref]);

  if (!quest) return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}><AppHeader /><Container sx={{ py: 4 }}>{error ? <Alert severity="error">{error}</Alert> : <Skeleton variant="rounded" height={760} />}</Container></Box>;

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}><AppHeader /><Container maxWidth={false} sx={{ maxWidth: 1440, py: 3 }}><Stack spacing={2.5}>
    <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: quest.title, href: `/create/quests/${quest.id}` }, { label: "実装" }]} />
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Box><Typography variant="h3" fontWeight={950}>{quest.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{quest.scenario}</Typography></Box><Paper elevation={0} sx={{ p: 2, minWidth: 230, border: "1px solid #c7d8f7", borderRadius: 2 }}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={900}>現在の得点</Typography><Typography variant="h5" fontWeight={950} color="primary">{score} / {quest.maxScore}</Typography></Stack><LinearProgress variant="determinate" value={(score / quest.maxScore) * 100} sx={{ mt: 1, height: 9, borderRadius: 99 }} /><Typography fontSize={12} color="text.secondary" sx={{ mt: 0.7 }}>{basicPassed ? "基本要件クリア" : `基本要件 ${quest.basicScore}点分をすべて通すと提出できます`}</Typography></Paper></Stack>
    {error && <Alert severity="error">{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "360px minmax(460px, 1fr) 280px" }, gap: 2, alignItems: "start" }}>
      <Stack spacing={1.3}><Typography variant="h5" fontWeight={950}>要件</Typography>{quest.requirements.map((requirement) => {
        const result = results.find((item) => item.requirementId === requirement.id);
        const selected = selectedIds.includes(requirement.id);
        return <Accordion key={requirement.id} disableGutters elevation={0} sx={{ border: `1px solid ${result?.passed ? "#86efac" : "#dbe3ef"}`, borderRadius: "10px !important", overflow: "hidden", bgcolor: result?.passed ? "#f0fdf4" : "#fff" }}>
          <AccordionSummary><Stack sx={{ width: "100%" }} spacing={0.6}><Stack direction="row" justifyContent="space-between" gap={1}><Stack direction="row" spacing={1} alignItems="center">{result?.passed ? <CheckCircleIcon color="success" /> : <Box sx={{ width: 20, height: 20, border: "2px solid #cbd5e1", borderRadius: "50%" }} />}<Typography fontWeight={950}>{requirement.title}</Typography></Stack><Chip icon={<StarIcon />} label={`+${requirement.points}`} size="small" color={result?.passed ? "success" : "default"} /></Stack><Stack direction="row" spacing={0.7}><Chip label={requirement.kind === "BASIC" ? "基本" : "追加"} size="small" color={requirement.kind === "BASIC" ? "primary" : "default"} /><Chip label={categoryLabel[requirement.category]} size="small" variant="outlined" /></Stack></Stack></AccordionSummary>
          <AccordionDetails><Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{requirement.description}</Typography>{requirement.kind === "OPTIONAL" && <FormControlLabel control={<Checkbox checked={selected} onChange={() => setSelectedIds((current) => selected ? current.filter((id) => id !== requirement.id) : [...current, requirement.id])} />} label="目標に設定" />}
            {result && <Stack spacing={0.7} sx={{ mt: 1 }}>{result.testResults.map((test) => <Paper key={test.id} elevation={0} sx={{ p: 1.2, border: `1px solid ${test.passed ? "#bbf7d0" : "#fecaca"}`, bgcolor: test.passed ? "#f0fdf4" : "#fef2f2" }}><Typography fontSize={13} fontWeight={900}>{test.passed ? "通過" : "未通過"}：{test.label}</Typography>{test.metric?.comparisons !== undefined && <Typography fontSize={12}>比較 {test.metric.comparisons} / 上限 {test.metric.maxComparisons}</Typography>}{test.metric?.accesses !== undefined && <Typography fontSize={12}>通路参照 {test.metric.accesses} / 上限 {test.metric.maxAccesses}</Typography>}{test.error && <Typography fontSize={12} color="error">{test.error}</Typography>}</Paper>)}</Stack>}
            <Divider sx={{ my: 1.5 }} /><Stack spacing={1}>{requirement.hints.map((hint) => { const key = `${requirement.id}:${hint.id}`; const open = revealedHints.has(key); return <Paper key={hint.id} elevation={0} sx={{ p: 1.2, border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}><Button size="small" startIcon={<LightbulbOutlinedIcon />} onClick={() => void revealHint(requirement.id, hint.id)} disabled={open} sx={{ fontWeight: 900 }}>{open ? hint.title : `${hint.title}を見る`}</Button>{open && <><Typography fontSize={13} sx={{ mt: 0.7, lineHeight: 1.7 }}>{hint.body}</Typography>{hint.courseId && <Button component={Link} href={`/courses/roadmap/${hint.courseId}`} size="small" sx={{ mt: 0.5 }}>関連コースを開く</Button>}</>}</Paper>; })}</Stack>
          </AccordionDetails>
        </Accordion>;
      })}</Stack>

      <Paper elevation={0} sx={{ border: "1px solid #dbe3ef", borderRadius: 2, overflow: "hidden" }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1} sx={{ p: 1.5, borderBottom: "1px solid #e2e8f0" }}><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={950}>Pythonコードエディタ</Typography><Chip label={runtime === "ready" ? "実行準備OK" : runtime === "loading" ? "読込中" : "読込エラー"} size="small" color={runtime === "ready" ? "success" : runtime === "error" ? "error" : "default"} /></Stack><Button startIcon={saving ? <CircularProgress size={16} /> : <SaveOutlinedIcon />} variant="outlined" onClick={() => void save()} disabled={saving}>保存</Button></Stack>
        <Editor height="540px" language="python" value={code} onChange={(value) => { setCode(value ?? ""); setResults([]); setSubmission(null); setFeedback(null); }} options={{ minimap: { enabled: false }, fontSize: 15, wordWrap: "on", tabSize: 4, insertSpaces: true, scrollBeyondLastLine: false, padding: { top: 16, bottom: 16 } }} />
        <Stack spacing={1.2} sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>{savedAt && <Typography fontSize={12} color="text.secondary">{savedAt}に保存しました</Typography>}<Button variant="contained" size="large" startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />} disabled={runtime !== "ready" || running || !code.trim()} onClick={() => void run()} sx={{ minHeight: 50, fontWeight: 950 }}>{running ? "全要件をテスト中..." : "全要件をテストする"}</Button><Button variant="contained" color="success" size="large" startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} disabled={!basicPassed || submitting} onClick={() => void submit()} sx={{ minHeight: 50, fontWeight: 950 }}>{basicPassed ? "提出してAIレビュー" : "基本要件を満たすと提出できます"}</Button></Stack>
      </Paper>

      <Stack spacing={2}><CreateQuestPreview quest={quest} results={results} />
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #dbe3ef", borderRadius: 2 }}><Stack direction="row" spacing={1}><InfoOutlinedIcon color="primary" /><Typography fontWeight={950}>{quest.previewData.guidanceTitle ?? "実装方法は自由です"}</Typography></Stack><Typography fontSize={13} color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>{quest.previewData.guidanceBody ?? "基本要件を満たす方法から始め、追加要件に合わせて実装を改善できます。"}</Typography></Paper>
        {submission && <Paper elevation={0} sx={{ p: 2, border: "2px solid #86efac", bgcolor: "#f0fdf4", borderRadius: 2 }}><Typography variant="h5" fontWeight={950}>提出完了 {submission.score} / {submission.maxScore}点</Typography>{unlockedAchievements.length > 0 && <Alert severity="success" sx={{ mt: 1 }}>実績を解除しました：{unlockedAchievements.map((item) => `${item.title}（${item.rarity}）`).join("、")}</Alert>}{feedback?.status === "GENERATING" && <Alert severity="info" sx={{ mt: 1 }}>AIレビューを生成しています。</Alert>}{feedback?.status === "FAILED" && <Alert severity="error" sx={{ mt: 1 }}>AIレビューを生成できませんでした。</Alert>}{feedback?.feedback && <Stack spacing={1.2} sx={{ mt: 1.5 }}><Box><Typography fontWeight={950}>現在の状態</Typography><Typography fontSize={13}>{feedback.feedback.currentState}</Typography></Box><Box><Typography fontWeight={950}>次の目標</Typography><Typography fontSize={13}>{feedback.feedback.nextGoal}</Typography></Box><Box><Typography fontWeight={950}>次の一歩</Typography><Typography fontSize={13}>{feedback.feedback.nextStep}</Typography></Box>{feedback.feedback.actionType === "RETRY_CREATE_QUEST" ? <Button variant="contained" onClick={() => { setSubmission(null); setFeedback(null); setUnlockedAchievements([]); }} sx={{ fontWeight: 900 }}>{feedback.feedback.actionLabel}</Button> : feedbackActionHref ? <Button component={Link} href={feedbackActionHref} variant="contained" sx={{ fontWeight: 900 }}>{feedback.feedback.actionLabel}</Button> : null}</Stack>}<Button component={Link} href={shareHref} startIcon={<ForumIcon />} variant="outlined" sx={{ mt: 1.5, fontWeight: 900 }}>掲示板で共有する</Button></Paper>}
      </Stack>
    </Box>
  </Stack></Container></Box>;
}

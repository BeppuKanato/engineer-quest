"use client";
import { Alert, Box, Button, Container, LinearProgress, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RouteIcon from "@mui/icons-material/Route";
import QuizIcon from "@mui/icons-material/Quiz";
import CodeIcon from "@mui/icons-material/Code";
import ExtensionIcon from "@mui/icons-material/Extension";
import TerminalIcon from "@mui/icons-material/Terminal";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/app/component/appHeader";
import { getMascotImagePath, useUserMascot } from "@/app/component/mascot";
import { useUserSession } from "@/app/component/userSession";
import { startLearningUnit } from "@/api/learning.api";
import { appLearningTokens as tokens } from "./appLearning.tokens";
import { findLearningUnit, learnUrl, resumePhaseIndex } from "./unitRegistry";
import { useLearningProgress, learningErrorMessage } from "./useLearningProgress";
import { useLearningLog } from "./useLearningLog";

const icons = [LightbulbIcon, RouteIcon, QuizIcon, CodeIcon, QuizIcon, ExtensionIcon, TerminalIcon];
export function UnitOverview({ courseId }: { courseId: string }) {
  const unit = findLearningUnit(courseId), router = useRouter(), mascot = useUserMascot();
  const { firebaseUser } = useUserSession();
  const { progress, loading, error, reload, authenticated } = useLearningProgress(unit?.courseId);
  const [starting, setStarting] = useState(false), [startError, setStartError] = useState<string | null>(null);
  const log = useLearningLog(courseId), reduce = useReducedMotion();
  const next = unit && progress ? resumePhaseIndex(unit, progress) : null;
  const completed = progress?.phases.filter(phase => unit?.phases.some(item => item.id === phase.phaseKey) && phase.status === "COMPLETED").length ?? 0;
  const start = async (reviewIndex?: number) => {
    if (!unit || !progress || !firebaseUser || starting) return;
    const index = reviewIndex ?? next ?? 0;
    setStarting(true); setStartError(null);
    try {
      await startLearningUnit(await firebaseUser.getIdToken(), courseId, unit.phases[index].id);
      log({ eventType: "unit_start", phaseKey: unit.phases[index].id, payload: { resume: !!progress.unit, review: reviewIndex !== undefined } });
      router.push(learnUrl(courseId) + (reviewIndex !== undefined ? `?phase=${encodeURIComponent(unit.phases[index].id)}` : ""));
    } catch (error) { setStartError(learningErrorMessage(error)); setStarting(false); }
  };
  return <Box sx={{ minHeight: "100dvh", bgcolor: tokens.background, color: tokens.text }}>
    <AppHeader />
    <Container component={motion.main} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} sx={{ py: 3, maxWidth: 1200 }}>
      <Button component={Link} href="/courses">コース一覧へ</Button>
      <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mt: 2 }}>{unit?.title ?? "単元"}</Typography>
      {!unit ? <Box sx={{ py: 6 }}><Typography>この単元は準備中です。</Typography><Typography>公開まで、ほかのコースをご覧ください。</Typography></Box> : !authenticated && !loading ? <Button component={Link} href="/auth/login">ログインして学習する</Button> : loading ? <Typography role="status" sx={{ my: 4 }}>進捗を読み込んでいます。</Typography> : error ?
        <Alert severity="error" action={<Button onClick={reload}>再読み込み</Button>}>{error}</Alert> : progress && <>
          <Typography sx={{ mt: 2 }}>フェーズ {completed}/{unit.phases.length} 完了</Typography>
          <LinearProgress aria-label="単元の進捗" variant="determinate" value={completed / unit.phases.length * 100} sx={{ my: 2, height: 8, borderRadius: 4 }} />
          <Box component="ol" aria-label="フェーズ一覧" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))", lg: "repeat(7, minmax(0, 1fr))" }, gap: 2, p: 0, listStyle: "none", my: 3 }}>
            {unit.phases.map((phase, index) => {
              const done = progress.phases.some(item => item.phaseKey === phase.id && item.status === "COMPLETED");
              const current = index === next, reachable = index <= (next ?? unit.phases.length - 1), Icon = icons[index];
              const status = done ? "完了" : current && progress.unit ? "進行中" : "未着手";
              return <Box component={motion.li} layout key={phase.id} sx={{ minWidth: 0, textAlign: "center", pt: 7, position: "relative" }}>
                {current && <Box component={motion.img} layoutId="learning-next-mascot" src={getMascotImagePath(mascot, "cheer")} alt="次にやるフェーズ" sx={{ position: "absolute", top: 0, left: "calc(50% - 28px)", width: 56, height: 56, objectFit: "contain" }} />}
                <Button aria-label={`フェーズ${phase.phase} ${phase.formalName}：${status}`} aria-current={current ? "step" : undefined} disabled={!reachable || starting}
                  onClick={() => void start(current ? undefined : index)} sx={{ width: 100, maxWidth: "100%", height: 100, borderRadius: "50%", border: `3px solid ${current ? tokens.progress.next : tokens.progress.stroke}`,
                    bgcolor: done ? tokens.progress.completed : current ? tokens.progress.next : tokens.progress.idle, color: current ? tokens.surface : tokens.text, position: "relative",
                    transition: "background-color 200ms, transform 200ms", "&:hover": { transform: "translateY(-3px)", bgcolor: done ? tokens.progress.completed : current ? tokens.progress.next : tokens.progress.idle } }}>
                  <Icon sx={{ fontSize: 44 }} />{done && <CheckCircleIcon aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, fontSize: 28 }} />}
                </Button>
                <Typography sx={{ mt: 1, fontSize: 14 }}>{phase.phase}. {phase.shortName}</Typography><Typography sx={{ fontSize: 13 }}>{status}</Typography>
              </Box>;
            })}
          </Box>
          {startError && <Alert severity="error" sx={{ my: 2 }}>{startError}</Alert>}
          <Button variant="contained" disabled={starting} onClick={() => void start()} sx={{ minHeight: 48, px: 4 }}>{starting ? "学習を開いています。" : next === null ? "復習する" : progress.unit ? "続きから始める" : "学習を始める"}</Button>
        </>}
    </Container>
  </Box>;
}

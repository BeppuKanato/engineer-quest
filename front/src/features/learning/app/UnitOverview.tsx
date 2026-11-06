"use client";
import { Alert, Box, Button, Chip, Container, LinearProgress, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RouteIcon from "@mui/icons-material/Route";
import QuizIcon from "@mui/icons-material/Quiz";
import CodeIcon from "@mui/icons-material/Code";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExtensionIcon from "@mui/icons-material/Extension";
import StarIcon from "@mui/icons-material/Star";
import TerminalIcon from "@mui/icons-material/Terminal";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAchievements, type AchievementItem } from "@/api/achievements.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { CourseThumbnail } from "@/app/courses/component/courseThumbnail";
import { useUserSession } from "@/app/component/userSession";
import { startLearningUnit } from "@/api/learning.api";
import { knowledgeCardTones } from "@/features/collection/knowledgeCard.tokens";
import { appLearningTokens as tokens } from "./appLearning.tokens";
import { findLearningUnit, learnUrl, resumePhaseIndex, type LearningUnit } from "./unitRegistry";
import { useLearningProgress, learningErrorMessage } from "./useLearningProgress";
import { useLearningLog } from "./useLearningLog";

const icons = [LightbulbIcon, RouteIcon, QuizIcon, CodeIcon, QuizIcon, ExtensionIcon, TerminalIcon];

/** Sin カーブの軌跡。t は 0〜1、段階 i のノードは t = i / (段階数 - 1) に乗る。 */
const WAVE = { width: 1200, height: 480, margin: 90, center: 225, amplitude: 100 } as const;
const wavePoint = (t: number) => ({
  x: WAVE.margin + t * (WAVE.width - WAVE.margin * 2),
  y: WAVE.center - WAVE.amplitude * Math.sin(t * Math.PI * 3),
});
const wavePath = (until: number) => {
  const segments = Math.max(1, Math.round(72 * until));
  return Array.from({ length: segments + 1 }, (_, i) => {
    const point = wavePoint((i / segments) * until);
    return `${i === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
};

export function UnitOverview({ courseId }: { courseId: string }) {
  const unit = findLearningUnit(courseId), router = useRouter();
  const { firebaseUser } = useUserSession();
  const { progress, loading, error, reload, authenticated } = useLearningProgress(unit?.courseId);
  const [starting, setStarting] = useState(false), [startError, setStartError] = useState<string | null>(null);
  const log = useLearningLog(courseId);
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
    <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
      <AppBreadcrumbs items={[{ label: "コース", href: "/courses" }, { label: unit?.title ?? "単元" }]} />
    </Container>
    <Container component={motion.main} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ pt: 1, pb: 5, maxWidth: 1200 }}>
      <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mt: 2 }}>{unit?.title ?? "単元"}</Typography>
      {!unit ? <Box sx={{ py: 6 }}><Typography>この単元は準備中です。</Typography><Typography>公開まで、ほかのコースをご覧ください。</Typography></Box> : !authenticated && !loading ? <Button component={Link} href="/auth/login">ログインして学習する</Button> : loading ? <Typography role="status" sx={{ my: 4 }}>進捗を読み込んでいます。</Typography> : error ?
        <Alert severity="error" action={<Button onClick={reload}>再読み込み</Button>}>{error}</Alert> : progress && <>
          <Typography sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8 }}>{unit.intro}</Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography sx={{ mt: 2 }}>{completed} / {unit.phases.length} 完了</Typography>
            {next === null && <Chip icon={<CheckCircleIcon />} label="単元完了" size="small" sx={{ mt: 2, fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d", "& .MuiChip-icon": { color: "inherit" } }} />}
          </Stack>
          <LinearProgress aria-label="単元の進捗" variant="determinate" value={completed / unit.phases.length * 100} sx={{ my: 2, height: 8, borderRadius: 4 }} />
          {startError && <Alert severity="error" sx={{ my: 2 }}>{startError}</Alert>}
          <UnitPathMap unit={unit} next={next} completedIds={new Set(progress.phases.filter(phase => phase.status === "COMPLETED").map(phase => phase.phaseKey))} hasProgress={!!progress.unit} starting={starting} onStart={(index, isCurrent) => void start(isCurrent ? undefined : index)} />
          <UnitAchievements courseId={courseId} />
        </>}
    </Container>
  </Box>;
}

function UnitPathMap({ unit, next, completedIds, hasProgress, starting, onStart }: {
  unit: LearningUnit;
  next: number | null;
  completedIds: ReadonlySet<string>;
  hasProgress: boolean;
  starting: boolean;
  onStart: (index: number, isCurrent: boolean) => void;
}) {
  const theme = useTheme();
  const vertical = useMediaQuery(theme.breakpoints.down("sm"));
  const reduced = useReducedMotion();
  const count = unit.phases.length;
  // 縦向きは横向きの座標を入れ替える（x が進み具合、y が波の振れ）。
  const point = (index: number) => {
    const wave = wavePoint(count === 1 ? 0 : index / (count - 1));
    return vertical ? { x: wave.y, y: wave.x } : { x: wave.x, y: wave.y };
  };
  const path = (until: number) => {
    const full = wavePath(until);
    if (!vertical) return full;
    return full.replace(/([ML])([\d.]+),([\d.]+)/g, (_, cmd, x, y) => `${cmd}${y},${x}`);
  };
  const viewBox = vertical ? `0 0 ${WAVE.height} ${WAVE.width}` : `0 0 ${WAVE.width} ${WAVE.height}`;
  const doneUntil = next === null ? 1 : count === 1 ? 0 : next / (count - 1);
  const first = point(0), last = point(count - 1);
  return (
    <Box
      component="section"
      aria-label="この単元の流れ"
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: vertical ? `${WAVE.height} / ${WAVE.width}` : `${WAVE.width} / ${WAVE.height}`,
        border: `1px solid ${tokens.border}`,
        borderRadius: "24px",
        overflow: "hidden",
        mt: 1,
      }}
    >
      {/* 単元自身の図を薄く敷く（装飾）。サムネイル未定義の単元では何も出ない。 */}
      <Box aria-hidden sx={{ position: "absolute", right: vertical ? -60 : 16, bottom: vertical ? 16 : 0, width: vertical ? 300 : 470, maxWidth: "55%", opacity: 0.1, pointerEvents: "none" }}>
        <CourseThumbnail courseId={unit.courseId} />
      </Box>
      <svg viewBox={viewBox} width="100%" height="100%" aria-hidden style={{ position: "absolute", inset: 0 }}>
        <path d={path(1)} fill="none" stroke="#c3d4ec" strokeWidth={9} strokeLinecap="round" />
        <motion.path
          d={path(doneUntil)}
          fill="none"
          stroke={tokens.progress.next}
          strokeWidth={9}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut", delay: 0.15 }}
        />
        {/* スタートとゴールの旗。最初の段階が現在地のときは、チップと重なるためスタート旗を出さない。 */}
        {next !== 0 && (
          <g aria-hidden>
            <line x1={first.x} y1={first.y} x2={vertical ? first.x - 46 : first.x} y2={vertical ? first.y : first.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
            <polygon
              points={vertical ? `${first.x - 46},${first.y} ${first.x - 46},${first.y + 26} ${first.x - 20},${first.y + 13}` : `${first.x},${first.y - 46} ${first.x},${first.y - 22} ${first.x + 28},${first.y - 34}`}
              fill={tokens.progress.next}
            />
            <text x={vertical ? first.x - 52 : first.x - 6} y={vertical ? first.y - 10 : first.y - 56} textAnchor={vertical ? "end" : "start"} fontSize={24} fontWeight={700} fill={tokens.progress.next}>スタート</text>
          </g>
        )}
        <g aria-hidden>
          <line x1={last.x} y1={last.y} x2={vertical ? last.x - 46 : last.x} y2={vertical ? last.y : last.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon
            points={vertical ? `${last.x - 46},${last.y} ${last.x - 46},${last.y + 26} ${last.x - 20},${last.y + 13}` : `${last.x},${last.y - 46} ${last.x},${last.y - 22} ${last.x - 28},${last.y - 34}`}
            fill="#d97706"
          />
          <text x={vertical ? last.x - 52 : last.x + 6} y={vertical ? last.y - 10 : last.y - 56} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
        </g>
      </svg>
      {unit.phases.map((phase, index) => {
        const done = completedIds.has(phase.id);
        const current = index === next;
        const reachable = index <= (next ?? count - 1);
        const Icon = icons[index];
        const status = done ? "完了" : current && hasProgress ? "進行中" : "未着手";
        const position = point(index);
        const size = current ? 118 : 102;
        const tone = phase.cardRarity ? knowledgeCardTones[phase.cardRarity] : null;
        return (
          <Box
            key={phase.id}
            sx={{ position: "absolute", left: `${(position.x / (vertical ? WAVE.height : WAVE.width)) * 100}%`, top: `${(position.y / (vertical ? WAVE.width : WAVE.height)) * 100}%`, transform: "translate(-50%, -50%)", width: size, height: size }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.2 + index * 0.07 }}
              sx={{ width: "100%", height: "100%" }}
            >
            <Button
              aria-label={`${phase.phase}. ${phase.formalName}：${status}${phase.cardRarity ? "・知識カードが手に入ることがあります" : ""}`}
              aria-current={current ? "step" : undefined}
              disabled={!reachable || starting}
              onClick={() => onStart(index, current)}
              sx={{
                width: size, height: size, minWidth: size, borderRadius: "50%",
                border: `3px solid ${current ? tokens.progress.next : tokens.progress.stroke}`,
                bgcolor: done ? tokens.progress.completed : current ? tokens.progress.next : tokens.progress.idle,
                color: current ? tokens.surface : tokens.text,
                position: "relative",
                boxShadow: current
                  ? `0 0 0 5px ${tokens.background}, 0 0 0 9px #93c5fd, 0 12px 24px rgba(37, 99, 235, 0.35)`
                  : reachable ? "0 8px 18px rgba(15, 23, 42, 0.16)" : "none",
                transition: "background-color 200ms, transform 200ms",
                "&:hover": { transform: "translateY(-3px)", bgcolor: done ? tokens.progress.completed : current ? tokens.progress.next : tokens.progress.idle },
              }}
            >
              <Icon sx={{ fontSize: 44 }} />
              {done && <CheckCircleIcon aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, fontSize: 28 }} />}
              {tone && (
                <Box aria-hidden sx={{ position: "absolute", top: -8, right: -8, width: 23, height: 31, borderRadius: "4px", bgcolor: tone.color, border: "2px solid #fff", display: "grid", placeItems: "center", boxShadow: "0 4px 10px rgba(15,23,42,0.25)" }}>
                  <StarIcon sx={{ fontSize: 13, color: "#fff" }} />
                </Box>
              )}
            </Button>
            {current && (
              <Box
                component={motion.span}
                style={{ x: "-50%" }}
                animate={reduced ? undefined : { y: [0, -4, 0] }}
                transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                sx={{ position: "absolute", bottom: "calc(100% + 12px)", left: "50%", bgcolor: tokens.progress.next, color: "#fff", px: 1.5, py: 0.5, borderRadius: 999, fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", pointerEvents: "none" }}
              >
                ここから始める
              </Box>
            )}
            <Box sx={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: vertical ? 150 : 190, maxWidth: "38vw", textAlign: "center", pointerEvents: "none" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{phase.phase}. {phase.shortName}</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{status}</Typography>
            </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** その単元に関連する実績（courseId が一致するもの）のプレビュー。取得できなくても画面は壊さない。 */
function UnitAchievements({ courseId }: { courseId: string }) {
  const { firebaseUser } = useUserSession();
  const [items, setItems] = useState<AchievementItem[] | null>(null);
  useEffect(() => {
    if (!firebaseUser) return;
    let current = true;
    void firebaseUser.getIdToken().then(token => getAchievements(token)).then(
      response => { if (current) setItems(response.groups.flatMap(group => group.achievements).filter(item => item.courseId === courseId)); },
      () => { if (current) setItems([]); },
    );
    return () => { current = false; };
  }, [firebaseUser, courseId]);
  if (!items || items.length === 0) return null;
  return (
    <Box component="section" aria-label="この単元の実績" sx={{ mt: 4 }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <EmojiEventsIcon sx={{ color: "#b45309" }} />
        <Typography component="h2" variant="h6" fontWeight={950}>この単元の実績</Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {items.map(item => {
          const achieved = item.status === "achieved";
          return (
            <Box key={item.id} sx={{ display: "flex", gap: 1.5, p: 2, border: `1px solid ${tokens.border}`, borderRadius: 2, bgcolor: tokens.surface, opacity: achieved ? 1 : 0.75 }}>
              <EmojiEventsIcon aria-hidden sx={{ color: achieved ? "#b45309" : "#94a3b8", fontSize: 32, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{item.title}</Typography>
                  {achieved && <Chip label="達成済み" size="small" sx={{ height: 22, fontSize: 12, fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d" }} />}
                </Stack>
                <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>{item.conditionLabel ?? item.description}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

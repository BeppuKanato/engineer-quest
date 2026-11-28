"use client";
import { Alert, Box, Button, Chip, Container, LinearProgress, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import ScienceIcon from "@mui/icons-material/Science";
import BuildIcon from "@mui/icons-material/Build";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAchievements, type AchievementItem } from "@/api/achievements.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { CourseThumbnail } from "@/app/courses/component/courseThumbnail";
import { missionThumbnailFor } from "./MissionThumbnail";
import { GoalFlag } from "./GoalFlag";
import { MissionStoryDialog } from "./MissionStoryDialog";
import { useUserSession } from "@/app/component/userSession";
import { startLearningUnit } from "@/api/learning.api";
import { appLearningTokens as tokens } from "./appLearning.tokens";
import { findLearningUnit, learnUrl, resumePhaseIndex, type LearningUnit } from "./unitRegistry";
import { learningPhaseIcons } from "./learningPhaseIcons";
import { WAVE, wavePath, wavePoint } from "./unitPathGeometry";
import { useLearningProgress, learningErrorMessage } from "./useLearningProgress";
import { ProgressLoadingSkeleton } from "./ProgressLoadingSkeleton";
import StyleIcon from "@mui/icons-material/Style";
import { getCollection, type CollectionKnowledgeTip } from "@/api/collection.api";
import { knowledgeCardTones, uncollectedTone } from "../../../components/rewards/rarity.tokens";
import { useLearningLog } from "./useLearningLog";
import { findDevelopmentLinks, findUnitMission, type DevelopmentMissionLink } from "./missionRegistry";
import { developmentMissionThumbnailFor } from "./DevelopmentMissionThumbnail";
import { findDevelopmentMission } from "./developmentMissions";
import { getDevelopmentMissionBests } from "@/api/developmentMissions.api";


// 波形の形状は unitPathGeometry に共通化（最終リザルトのミニマップと共有）。
// 再設計（2026-11-22）：段階は1〜6で数え、波の7番目の点は「ミッション挑戦」。
// 段階7（自分で実装）はミッション挑戦に置き換わったため、進捗の分母は6。

export function UnitOverview({ courseId }: { courseId: string }) {
  const unit = findLearningUnit(courseId), router = useRouter();
  const { firebaseUser } = useUserSession();
  const { progress, loading, error, reload, authenticated } = useLearningProgress(unit?.courseId);
  const [starting, setStarting] = useState(false), [startError, setStartError] = useState<string | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);

  const log = useLearningLog(courseId);
  const mission = unit ? findUnitMission(unit.courseId) : undefined;
  const devLinks = findDevelopmentLinks(courseId);
  const [devBests, setDevBests] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!firebaseUser || devLinks.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const { bests } = await getDevelopmentMissionBests(token);
        if (!cancelled) setDevBests(Object.fromEntries(bests.map((best) => [best.missionId, best.points])));
      } catch { /* ベストが取れなくても画面は壊さない */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, courseId]);
  const next = unit && progress ? resumePhaseIndex(unit, progress) : null;
  const learningPhases = unit?.phases.slice(0, 6) ?? [];
  const completed = progress?.phases.filter(phase => learningPhases.some(item => item.id === phase.phaseKey) && phase.status === "COMPLETED").length ?? 0;
  const missionDone = progress?.unit?.status === "COMPLETED";
  const missionReady = next === 6;
  const waveNext = missionDone ? null : next;
  const nextPhase = next !== null && next < 6 ? unit?.phases[next] : null;
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
  // ミッション挑戦＝学習フローの最終フェーズ（自分で実装）。開始処理は通常の開始と同じ。
  const goMission = async () => {
    if (!unit || !progress || !firebaseUser || starting) return;
    const index = unit.phases.length - 1;
    setStarting(true); setStartError(null);
    try {
      await startLearningUnit(await firebaseUser.getIdToken(), courseId, unit.phases[index].id);
      log({ eventType: "unit_start", phaseKey: unit.phases[index].id, payload: { resume: !!progress.unit, review: false } });
      router.push(learnUrl(courseId) + `?phase=${encodeURIComponent(unit.phases[index].id)}`);
    } catch (error) { setStartError(learningErrorMessage(error)); setStarting(false); }
  };
  return <Box sx={{ minHeight: "100dvh", bgcolor: tokens.background, color: tokens.text }}>
    <AppHeader />
    <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
      <AppBreadcrumbs items={[{ label: "コース", href: "/courses" }, { label: unit?.title ?? "単元" }]} />
    </Container>
    <Container component={motion.main} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ pt: 1, pb: 5, maxWidth: 1200 }}>
      <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900, mt: 2 }}>{unit?.title ?? "単元"}</Typography>
      {!unit ? <Box sx={{ py: 6 }}><Typography>この単元は準備中です。</Typography><Typography>公開まで、ほかのコースをご覧ください。</Typography></Box> : !authenticated && !loading ? <Button component={Link} href="/auth/login">ログインして学習する</Button> : loading ? <ProgressLoadingSkeleton variant="overview" /> : error ?
        <Alert severity="error" action={<Button onClick={reload}>再読み込み</Button>}>{error}</Alert> : progress && <>
          <Typography sx={{ mt: 1.5, lineHeight: 1.8 }}>{unit.intro}</Typography>
          {mission && (
            <Box component="section" aria-label="単元ミッション" sx={{ mt: 2.5, p: { xs: 2, md: 3 }, bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "stretch", md: "center" }}>
                <Box aria-hidden sx={{ width: { xs: "100%", md: 220 }, maxWidth: 280, flexShrink: 0, alignSelf: "center" }}>
                  {missionThumbnailFor(unit.courseId) ?? <CourseThumbnail courseId={unit.courseId} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip label="単元ミッション" size="small" sx={{ fontWeight: 800, bgcolor: "#2563eb", color: "#fff" }} />
                    {/* 旗は画像に被せず、見出し行に置く（一覧と同UI、2026-11-23）。 */}
                    <GoalFlag courseId={courseId} title={unit.title} />
                  </Stack>
                  <Typography component="h2" sx={{ fontSize: 18, fontWeight: 900, mt: 1.5, lineHeight: 1.5 }}>{mission.title}</Typography>
                  {/* 学習開始後は説明文を畳む（2026-11-23決定）：未着手と、挑戦・結果が主役の状態では全文を出す。 */}
                  {(!progress.unit || missionReady || missionDone) && <Typography sx={{ mt: 0.5, lineHeight: 1.8 }}>{mission.description}</Typography>}
                  <Typography sx={{ mt: 1, fontSize: 14 }}>達成の条件：{mission.successCondition}</Typography>
                </Box>
                <Stack spacing={1.5} sx={{ width: { xs: "100%", md: 260 }, flexShrink: 0 }}>
                  {/* 主ボタンはアプリの主色 #2563eb を明示する。テーマ未設定のため
                      variant="contained" だけだと MUI 既定色（#1976d2）になり、
                      他画面の主ボタンより薄く見える（2026-11-28 レビュー指摘）。 */}
                  {missionDone ? (
                    <Button variant="contained" component={Link} href={learnUrl(courseId)} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>単元の結果を見る</Button>
                  ) : missionReady ? (
                    <Button variant="contained" onClick={goMission} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>ミッションに挑戦する</Button>
                  ) : (
                    <>
                      {nextPhase && <Typography sx={{ fontSize: 14, fontWeight: 700 }}>次は『{nextPhase.formalName}』</Typography>}
                      <Button variant="contained" onClick={() => void start()} disabled={starting} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>{progress.unit ? "学習を進める" : "学習を始める"}</Button>
                    </>
                  )}
                  {/* ストーリーの入口（選ぶ動機・見直し）：帯からいつでも開ける（2026-11-23）。 */}
                  <Button variant="text" startIcon={<PlayCircleOutlineIcon />} onClick={() => setStoryOpen(true)} sx={{ fontWeight: 700 }}>
                    どんな問題を解く？
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
          {/* ストーリー末尾の主ボタンは、帯の開始ボタンと同じ状態・文言・処理にそろえる。
              押すとダイアログを閉じてから既存の開始経路（start / goMission / 結果表示）を
              そのまま使うので、二重開始にはならない。 */}
          <MissionStoryDialog courseId={courseId} open={storyOpen} onClose={() => setStoryOpen(false)}
            startDisabled={starting}
            startLabel={missionDone ? "単元の結果を見る" : missionReady ? "ミッションに挑戦する" : progress.unit ? "学習を進める" : "学習を始める"}
            onStart={() => {
              setStoryOpen(false);
              if (missionDone) router.push(learnUrl(courseId));
              else if (missionReady) void goMission();
              else void start();
            }} />
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 700 }}>学習段階 {completed} / 6 完了</Typography>
            <Chip
              label={missionDone ? "ミッション達成済み" : missionReady ? "ミッションに挑戦できる" : "ミッション未挑戦"}
              size="small"
              sx={{ fontWeight: 800, bgcolor: missionDone ? "#dcfce7" : missionReady ? "#dbeafe" : "#f1f5f9", color: missionDone ? "#15803d" : missionReady ? "#1e40af" : "#475569" }}
            />
            {progress.unit?.status === "COMPLETED" && <Chip icon={<CheckCircleIcon />} label="単元完了" size="small" sx={{ fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d", "& .MuiChip-icon": { color: "inherit" } }} />}
          </Stack>
          <LinearProgress aria-label="単元の進捗" variant="determinate" value={completed / 6 * 100} sx={{ my: 2, height: 8, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 4 } }} />
          {startError && <Alert severity="error" sx={{ my: 2 }}>{startError}</Alert>}
          <UnitPathMap unit={unit} next={waveNext} completedIds={new Set(progress.phases.filter(phase => phase.status === "COMPLETED").map(phase => phase.phaseKey))} hasProgress={!!progress.unit} starting={starting} missionReady={missionReady} missionDone={missionDone} devLinks={devLinks} devBests={devBests} onStart={(index, isCurrent) => void start(isCurrent ? undefined : index)} onMission={() => void goMission()} />
          <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 14, color: "text.primary" }}>任意フェーズは、学習段階の進捗には数えません。</Typography>
            {devLinks.length > 0 && (
              <Link href="/missions" style={{ color: "#2563eb", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                発展ミッション一覧へ
              </Link>
            )}
          </Box>
          {/* 概念の確認状況は出さない（2026-11-23決定）：概念名はカリキュラム側の語彙で、
              学習者の行動につながらない。代わりに実績と知識カードの提示を置く。 */}
          <UnitAchievements courseId={courseId} />
          <UnitKnowledgeCards courseId={courseId} />
        </>}
    </Container>
  </Box>;
}

function UnitPathMap({ unit, next, completedIds, hasProgress, starting, missionReady, missionDone, devLinks, devBests, onStart, onMission }: {
  unit: LearningUnit;
  next: number | null;
  completedIds: ReadonlySet<string>;
  hasProgress: boolean;
  starting: boolean;
  missionReady: boolean;
  missionDone: boolean;
  devLinks: DevelopmentMissionLink[];
  devBests: Record<string, number>;
  onStart: (index: number, isCurrent: boolean) => void;
  onMission: () => void;
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
  const xDen = vertical ? WAVE.height : WAVE.width;
  const yDen = vertical ? WAVE.width : WAVE.height;
  const viewBox = vertical ? `0 0 ${WAVE.height} ${WAVE.width}` : `0 0 ${WAVE.width} ${WAVE.height}`;
  // 任意フェーズの置き場所（波の座標系でのずらし）：1.5 は本線の上、6.5 は本線の下に逃がし、
  // 破線で本線とつなぐ。本線の上に置くと前後の段階ラベルと重なるため。
  const optionals =
    count >= 7
      ? [
          { t: 0.5 / (count - 1), dx: -14, dy: -60, label: "予測・実験", Icon: ScienceIcon, labelSide: "above" as const, timing: "任意・予想してみよう", needsGoal: false },
          { t: 5.5 / (count - 1), dx: -95, dy: 126, label: "実装の橋渡し", Icon: BuildIcon, labelSide: "below" as const, timing: "任意・段階6のあと", needsGoal: true },
        ]
      : [];
  const optionalPos = (o: (typeof optionals)[number]) => {
    const wave = wavePoint(o.t);
    return vertical ? { x: wave.y + o.dy, y: wave.x + o.dx } : { x: wave.x + o.dx, y: wave.y + o.dy };
  };
  const doneUntil = next === null ? 1 : count === 1 ? 0 : next / (count - 1);
  const first = point(0), last = point(count - 1);
  // 発展ミッションノード（2026-11-25 Kanato）：最終チャレンジの先に破線でつなぐ。
  // 完了前は灰色で見せておき、完了後の初回訪問で色づく演出（解放）を出す。
  const devMissions = devLinks.flatMap((link) => {
    const m = findDevelopmentMission(link.missionId);
    return m ? [m] : [];
  });
  const devOffsets: Record<number, [number, number][]> = vertical
    ? { 1: [[168, 6]], 2: [[158, -84], [168, 88]], 3: [[148, -122], [184, 0], [150, 108]] }
    : { 1: [[6, 168]], 2: [[-84, 158], [88, 168]], 3: [[-122, 148], [0, 184], [108, 150]] };
  const devPos = (i: number) => {
    const [dx, dy] = (devOffsets[devMissions.length] ?? devOffsets[1])[i] ?? [0, 0];
    return { x: last.x + dx, y: last.y + dy };
  };
  const devStorageKey = `engineer-quest:mission-nodes-celebrated:${unit.courseId}`;
  const [devCelebrate, setDevCelebrate] = useState(false);
  useEffect(() => {
    if (!missionDone || devMissions.length === 0) return;
    let seen = false;
    try { seen = localStorage.getItem(devStorageKey) === "1"; } catch { /* 読めなければ初回扱い */ }
    if (!seen) {
      if (!reduced) setDevCelebrate(true);
      try { localStorage.setItem(devStorageKey, "1"); } catch { /* 保存できなくても表示は続ける */ }
    }
    // devMissions は毎レンダーで変わるため、件数だけを依存にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionDone, devMissions.length, reduced, devStorageKey]);

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
      {/* 図はミッション帯が担うため、波の地図には敷かない（段階のラベルと重なるため）。 */}
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
        {/* ゴール旗。ミッション挑戦が現在地のときは「ここから始める」と重なるため出さない。 */}
        {next !== count - 1 && (
        <g aria-hidden>
          <line x1={last.x} y1={last.y} x2={vertical ? last.x - 46 : last.x} y2={vertical ? last.y : last.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <polygon
            points={vertical ? `${last.x - 46},${last.y} ${last.x - 46},${last.y + 26} ${last.x - 20},${last.y + 13}` : `${last.x},${last.y - 46} ${last.x},${last.y - 22} ${last.x - 28},${last.y - 34}`}
            fill="#d97706"
          />
          <text x={vertical ? last.x - 52 : last.x + 6} y={vertical ? last.y - 10 : last.y - 56} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
        </g>
        )}
        {/* 発展ミッションノードと最終チャレンジをつなぐ破線 */}
        {devMissions.map((m, i) => {
          const to = devPos(i);
          return <line key={m.id} x1={last.x} y1={last.y} x2={to.x} y2={to.y} stroke={missionDone ? tokens.progress.next : "#cbd5e1"} strokeWidth={2.5} strokeDasharray="5 6" />;
        })}
        {/* 任意フェーズと本線をつなぐ破線 */}
        {optionals.map((o) => {
          const wave = wavePoint(o.t);
          const from = vertical ? { x: wave.y, y: wave.x } : { x: wave.x, y: wave.y };
          const to = optionalPos(o);
          return <line key={o.label} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={o.needsGoal && !missionReady && !missionDone ? "#cbd5e1" : tokens.progress.next} strokeWidth={2.5} strokeDasharray="5 6" />;
        })}
      </svg>
      {unit.phases.map((phase, index) => {
        const isMission = index === count - 1;
        const done = isMission ? missionDone : completedIds.has(phase.id);
        const current = index === next;
        const reachable = index <= (next ?? count - 1);
        const Icon = isMission ? FlagIcon : learningPhaseIcons[index];
        const status = done ? "達成済み" : isMission ? (missionReady ? "挑戦できる" : "未着手") : current && hasProgress ? "進行中" : "未着手";
        const label = isMission ? "最終チャレンジ" : `${phase.phase}. ${phase.shortName}`;
        const position = point(index);
        const size = current ? 118 : 102;
        return (
          <Box
            key={phase.id}
            sx={{ position: "absolute", left: `${(position.x / xDen) * 100}%`, top: `${(position.y / yDen) * 100}%`, transform: "translate(-50%, -50%)", width: size, height: size }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.2 + index * 0.07 }}
              sx={{ width: "100%", height: "100%" }}
            >
            <Button
              aria-label={`${label}：${status}`}
              aria-current={current ? "step" : undefined}
              disabled={!reachable || starting}
              onClick={() => { if (isMission) onMission(); else onStart(index, current); }}
              sx={{
                width: size, height: size, minWidth: size, borderRadius: "50%",
                // 完了ノードはプレイヤーの状態色（灰）ではなく意味色の緑にする。完了は押して
                // 復習できるのに、灰色だと「押せない」と誤読されるため（2026-11-23 Kanato）。
                border: `3px solid ${current ? tokens.progress.next : done ? "#16a34a" : tokens.progress.stroke}`,
                // 緑は枠線だけ（2026-11-23 Kanato）：面とアイコンは通常色に戻す。
                bgcolor: done ? "#fff" : current ? tokens.progress.next : tokens.progress.idle,
                color: current ? tokens.surface : tokens.text,
                position: "relative",
                boxShadow: current
                  ? `0 0 0 5px ${tokens.background}, 0 0 0 9px #93c5fd, 0 12px 24px rgba(37, 99, 235, 0.35)`
                  : reachable ? "0 8px 18px rgba(15, 23, 42, 0.16)" : "none",
                transition: "background-color 200ms, transform 200ms",
                "&:hover": { transform: "translateY(-3px)", bgcolor: done ? "#f0fdf4" : current ? tokens.progress.next : tokens.progress.idle },
              }}
            >
              <Icon sx={{ fontSize: 44 }} />
              {/* 完了バッジはチェックではなく「復習できる」の↻にする（一覧の復習ボタンと同じ形・同じ意味）。 */}
              {done && (
                <Box component="span" aria-hidden sx={{ position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: "50%", bgcolor: "#fff", border: "2.5px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ReplayIcon sx={{ fontSize: 19, color: "#16a34a" }} />
                </Box>
              )}
              {/* 現在地ノードは「押せる」ことが見た目で分かるように、再生バッジを常時出す
                  （2026-11-23、Kanato：ホバーで出るだけでは足りない）。完了のチェックと対の位置。 */}
              {current && (
                <Box component="span" aria-hidden sx={{ position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: "50%", bgcolor: "#fff", border: `2.5px solid ${tokens.progress.next}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlayArrowIcon sx={{ fontSize: 18, color: tokens.progress.next }} />
                </Box>
              )}
            </Button>
            {current && (
              <Box
                component={motion.span}
                style={{ x: "-50%" }}
                animate={reduced ? undefined : { y: [0, -4, 0] }}
                transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                sx={{ position: "absolute", bottom: "calc(100% + 12px)", left: "50%", bgcolor: tokens.progress.next, color: "#fff", px: 1.5, py: 0.5, borderRadius: 999, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", pointerEvents: "none" }}
              >
                {hasProgress ? "現在地" : "ここから始める"}
              </Box>
            )}
            <Box sx={{ position: "absolute", top: "calc(100% + 8px)", width: vertical ? 150 : 190, maxWidth: "38vw", pointerEvents: "none", ...(isMission ? { right: 0, textAlign: "right" as const } : { left: "50%", transform: "translateX(-50%)", textAlign: "center" as const }) }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{isMission ? "最終チャレンジ" : `${phase.phase}. ${phase.shortName}`}</Typography>
              {/* 最終チャレンジが帯の単元ミッションと同一物だと分かるよう、題をそのまま出す
                  （2026-11-23、GPTレビュー9：ミッションと進捗のつながり）。 */}
              {isMission && <Typography sx={{ fontSize: 14 }}>{findUnitMission(unit.courseId)?.title}</Typography>}
              <Typography sx={{ fontSize: 14, color: "text.primary" }}>{status}</Typography>
            </Box>
            </Box>
          </Box>
        );
      })}
      {/* 任意フェーズ（2026-11-23「置く」と決定）：1.5＝予測・実験（段階1と2の間）、
          6.5＝実装の橋渡し（段階6とミッション挑戦の間）。本線から少し離して破線でつなぎ、
          本線の円より小さく破線の輪で「任意」を表す。進捗の分母（6）には入れない。 */}
      {optionals.map((o) => {
        const pos = optionalPos(o);
        const size = 80;
        const Icon = o.Icon;
        // 取り組めるタイミングを形と文で出す（2026-11-23、GPT指摘）：橋渡しは段階6を
        // 終えるまで対象外なので、色を落として「まだ」を表す。
        const locked = o.needsGoal && !missionReady && !missionDone;
        return (
          <Box
            key={o.label}
            aria-label={`任意フェーズ：${o.label}（${o.timing}）`}
            sx={{ position: "absolute", left: `${(pos.x / xDen) * 100}%`, top: `${(pos.y / yDen) * 100}%`, transform: "translate(-50%, -50%)", width: size, height: size }}
          >
            <Box sx={{ width: size, height: size, borderRadius: "50%", border: `2.5px dashed ${locked ? "#cbd5e1" : tokens.progress.next}`, bgcolor: locked ? "#f8fafc" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: locked ? "#94a3b8" : tokens.progress.next }}>
              <Icon sx={{ fontSize: 30 }} />
            </Box>
            {/* 取り組める任意ノードにも、本線の現在地と同じ再生バッジを付けて「押せる」を形で示す
                （2026-11-23、GPTレビュー10のクリック可能性の指摘を採用）。 */}
            {!locked && (
              <Box component="span" aria-hidden sx={{ position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: "50%", bgcolor: "#fff", border: `2px solid ${tokens.progress.next}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PlayArrowIcon sx={{ fontSize: 14, color: tokens.progress.next }} />
              </Box>
            )}
            <Box
              sx={{
                position: "absolute",
                ...(o.labelSide === "above" ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
                left: "50%",
                transform: "translateX(-50%)",
                width: 150,
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{o.label}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.primary" }}>{o.timing}</Typography>
            </Box>
          </Box>
        );
      })}
      {/* 発展ミッションノード：最終チャレンジの先に置く。同一性は挑戦画面・一覧と同じ
          場面イラストで運ぶ。完了前はグレースケールで「まだ」を表し、完了後の初回訪問では
          色づき＋「解放されました」の演出を出す（localStorage で訪問済みを覚える）。 */}
      {devMissions.map((m, i) => {
        const pos = devPos(i);
        const unlocked = missionDone;
        const node = (
          <>
            <Box
              component={motion.div}
              key={devCelebrate ? "celebrating" : "plain"}
              initial={devCelebrate ? { filter: "grayscale(1)", scale: 0.7, opacity: 0.4 } : false}
              animate={{ filter: "grayscale(0)", scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.5 + i * 0.25, type: "spring", bounce: 0.45 }}
              sx={{ width: 96, height: 68, borderRadius: 2.5, overflow: "hidden", border: `2.5px solid ${unlocked ? "#2563eb" : "#cbd5e1"}`, bgcolor: "#fff", ...(unlocked ? {} : { filter: "grayscale(1)", opacity: 0.55 }) }}
            >
              {developmentMissionThumbnailFor(m.id)}
            </Box>
            {devCelebrate && (
              <Box
                component={motion.span}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1 + i * 0.25, duration: 0.3 }}
                sx={{ position: "absolute", right: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)", bgcolor: "#16a34a", color: "#fff", px: 1.25, py: 0.4, borderRadius: 999, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 2 }}
              >
                解放されました
              </Box>
            )}
            <Box sx={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 190, textAlign: "right", pointerEvents: "none" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{m.title}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.primary" }}>{unlocked ? (devBests[m.id] !== undefined ? `自己ベスト ${devBests[m.id]}点` : "挑戦できる") : "単元完了で解放"}</Typography>
            </Box>
          </>
        );
        const wrapSx = { position: "absolute" as const, left: `${(pos.x / xDen) * 100}%`, top: `${(pos.y / yDen) * 100}%`, transform: "translate(-50%, -50%)", width: 96, height: 68, textDecoration: "none" };
        return unlocked ? (
          <Box key={m.id} component={Link} href={`/missions/${m.id}`} aria-label={`発展ミッション：${m.title}（挑戦できる）`} sx={wrapSx}>{node}</Box>
        ) : (
          <Box key={m.id} aria-label={`発展ミッション：${m.title}（単元完了で解放）`} sx={wrapSx}>{node}</Box>
        );
      })}
    </Box>
  );
}

/** その単元に関連する実績（courseId が一致するもの）のプレビュー。取得できなくても画面は壊さない。 */
function UnitKnowledgeCards({ courseId }: { courseId: string }) {
  const { firebaseUser } = useUserSession();
  const [cards, setCards] = useState<CollectionKnowledgeTip[] | null>(null);
  useEffect(() => {
    if (!firebaseUser) return;
    let current = true;
    void firebaseUser.getIdToken().then(token => getCollection(token)).then(
      response => {
        if (current) setCards(response.knowledgeTips.items.filter(item => item.courseId === courseId).sort((a, b) => a.catalogNumber - b.catalogNumber));
      },
      () => { if (current) setCards([]); },
    );
    return () => { current = false; };
  }, [firebaseUser, courseId]);
  if (!cards || cards.length === 0) return null;
  // 獲得スロットは単元内の並び順（1枚目=段階2、2枚目=段階5、3枚目=最終チャレンジ）。
  const slotHint = (slot: number) => slot === 0 ? "段階2で獲得できます" : slot === 1 ? "段階5で獲得できます" : "最終チャレンジで獲得できます";
  return (
    <Box component="section" aria-label="この単元の知識カード" sx={{ mt: 4 }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <StyleIcon sx={{ color: "#2563eb" }} />
        <Typography component="h2" variant="h6" fontWeight={950}>この単元の知識カード</Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {cards.map((card, slot) => {
          const owned = card.isCollected;
          const tone = knowledgeCardTones[card.rarity as keyof typeof knowledgeCardTones];
          return (
            <Box key={card.id} sx={{ p: 2, border: `1.5px solid ${owned ? tone.border : tokens.border}`, borderRadius: 2, bgcolor: owned ? tone.bgcolor : uncollectedTone.background }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: owned ? tone.color : uncollectedTone.color }}>{tone.label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: owned ? "#15803d" : "text.primary" }}>{owned ? "獲得済み" : "未獲得"}</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 700, fontSize: 15, mt: 1 }}>{owned ? card.title : "？？？"}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.primary", mt: 0.5 }}>{owned ? card.description : slotHint(slot)}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

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
            <Box key={item.id} sx={{ display: "flex", gap: 1.5, p: 2, border: `1px solid ${tokens.border}`, borderRadius: 2, bgcolor: tokens.surface }}>
              <EmojiEventsIcon aria-hidden sx={{ color: achieved ? "#b45309" : "#94a3b8", fontSize: 32, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{item.title}</Typography>
                  {achieved && <Chip label="達成済み" size="small" sx={{ height: 22, fontSize: 12, fontWeight: 800, bgcolor: "#dcfce7", color: "#15803d" }} />}
                </Stack>
                <Typography sx={{ fontSize: 14, color: "text.primary", mt: 0.5 }}>{item.conditionLabel ?? item.description}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

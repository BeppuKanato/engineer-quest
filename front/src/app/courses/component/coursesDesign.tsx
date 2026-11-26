"use client";

// コース一覧（/courses）の確定形（2026-11-22/23 に下書きで確定、実アプリ移植）。
// この画面の目的は「次に学ぶものを選ぶ画面」。サムネイル主役：
// - カードは図を全面に大きく置き、テキストは単元名とミッションの題、
//   学ぶ仕組みの説明だけに絞る。管理情報（進捗の集計など）はホームと単元画面の仕事。
// - 状態は、ボタンの色分けではなく「印と進捗の形」で表す（学習アプリの慣例）：
//   未着手＝印なし、学習中＝青い塗りのバッジ＋枠＋サムネ下端の進捗バー
//   （「段階 n/総数」のラベル付き）、完了＝印なし（緑の復習ボタンが担う。
//   メダルバッジは、完了が学習中より目立つ逆転とボタンとの二重表現のため付けない）。
//   ボタンは主色にそろえ文言だけが変わる（始める／続きから／復習する）。
//   ただし完了の復習ボタンだけは緑のアウトライン。グレーは操作できない状態だけ。
// - 並びは全単元を3列で流し、課題軸の区別はカードの「アイコン＋グループ名」
//   チップで付ける。チップは形も色も全軸共通（軸ごとの色分けはしない）。
//   表示順は 学習中 → 未着手 → 完了、同じ状態の中では軸の隣接順を保つ。
// - カード全体が単元画面へのリンク。目標の旗と「どんな問題を解く？」は
//   リンクとは独立した実ボタン。

import { useState } from "react";

import { Box, ButtonBase, Paper, Snackbar, Stack, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import Link from "next/link";

import { CourseThumbnail } from "@/app/courses/component/courseThumbnail";
import type { Course } from "@/app/courses/type";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { missionThumbnailFor } from "@/features/learning/app/MissionThumbnail";
import { GoalFlag } from "@/features/learning/app/GoalFlag";
import { MissionStoryDialog } from "@/features/learning/app/MissionStoryDialog";

type UnitStatus = "IN_PROGRESS" | "NOT_STARTED" | "COMPLETED";
type UnitView = {
  id: string;
  title: string;
  href: string;
  status: UnitStatus;
  completedPhases: number;
  totalPhases: number;
  nextPhase?: string;
};

const TEXT = "#111827";
const PRIMARY = "#2563eb";
const BORDER = "#dbe3ef";
// 完了・復習の意味の色。ボタンとバッジで同じ緑を使う（色は意味で統一する）。
const GREEN = "#16a34a";


// 課題軸のグループ（2026-11-21 決定）。カードのラベルに使う。
// 貪欲法は手法の名前なので、解く問題の側の名前「最適化問題」をカテゴリにする
// （2026-11-23、GPTの分類粒度の指摘を受けた Kanato の判断。カテゴリは問題軸で統一）。
const GROUP_LABEL: Record<string, string> = {
  "course-algorithm-breadth-first-search-v1": "グラフ探索",
  "course-algorithm-depth-first-search-v1": "グラフ探索",
  "course-algorithm-maze-digging-v1": "迷路生成",
  "course-algorithm-wall-extension-v1": "迷路生成",
  "course-algorithm-bubble-sort-v2": "並び替え",
  "course-algorithm-binary-search-v1": "配列の検索",
  "course-algorithm-greedy-coins-v1": "最適化問題",
};

/** 軸のアイコン（24×24、線と点の最小限の絵）。色は使わず、形で軸を区別する。 */
const GroupGlyph: React.FC<{ label: string }> = ({ label }) => {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (label) {
    case "グラフ探索":
      return (
        <svg {...common}>
          <path d="M7 17 L12 6 M12 6 L18 14 M7 17 L18 14" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="7" cy="17" r="2.6" fill="currentColor" />
          <circle cx="12" cy="6" r="2.6" fill="currentColor" />
          <circle cx="18" cy="14" r="2.6" fill="currentColor" />
        </svg>
      );
    case "迷路生成":
      return (
        <svg {...common}>
          <path
            d="M4 20 V4 H20 V20 H10 V11 H16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "並び替え":
      return (
        <svg {...common}>
          <rect x="5.2" y="13" width="3.6" height="7" fill="currentColor" />
          <rect x="10.6" y="9" width="3.6" height="11" fill="currentColor" />
          <rect x="16" y="5" width="3.6" height="15" fill="currentColor" />
        </svg>
      );
    case "配列の検索":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M14.8 14.8 L20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "最適化問題":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * グループチップ：形も色も全軸共通（本文色の太枠）。軸ごとの色分けはしない
 * ——軸が何種類になるか分からず、色が枯渇・衝突するため（2026-11-23 Kanato）。
 * 「同じ軸」は、同じアイコンの形と名前、それと隣り合う並び順で表す。
 */
const GroupChip: React.FC<{ label: string }> = ({ label }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.75,
      alignSelf: "flex-start",
      px: 1.5,
      py: 0.75,
      mb: 1,
      border: `2px solid ${TEXT}`,
      borderRadius: 999,
      bgcolor: "#fff",
      color: TEXT,
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    <GroupGlyph label={label} />
    {label}
  </Box>
);

/** 絞り込み用の軸（最適化問題＝貪欲法の単元も1つの軸として含む）。 */
const FILTER_GROUP: Record<string, string> = {
  ...GROUP_LABEL,
  "course-algorithm-greedy-coins-v1": "最適化問題",
};
const AXES = ["すべて", "グラフ探索", "迷路生成", "並び替え", "配列の検索", "最適化問題"];

/** 軸の検索欄：軸のチップを選んで単元を絞り込む。選択中だけ主色で塗る。 */
const AxisFilter: React.FC<{ value: string; onChange: (axis: string) => void }> = ({ value, onChange }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap aria-label="軸で絞り込む">
    {AXES.map((axis) => {
      const selected = axis === value;
      return (
        <ButtonBase
          key={axis}
          onClick={() => onChange(axis)}
          aria-pressed={selected}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.75,
            py: 1,
            borderRadius: 999,
            border: `1px solid ${selected ? PRIMARY : BORDER}`,
            bgcolor: selected ? PRIMARY : "#fff",
            color: selected ? "#fff" : TEXT,
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {axis !== "すべて" && <GroupGlyph label={axis} />}
          {axis}
        </ButtonBase>
      );
    })}
  </Stack>
);

/** 状態の検索欄：学習状態で絞り込む。件数つき。軸の検索欄とは分ける（GPT指摘）。 */
const STATE_OPTIONS: { key: string; label: string }[] = [
  { key: "ALL", label: "すべて" },
  { key: "IN_PROGRESS", label: "学習中" },
  { key: "NOT_STARTED", label: "未着手" },
  { key: "COMPLETED", label: "完了" },
];

const StateFilter: React.FC<{
  value: string;
  onChange: (key: string) => void;
  counts: Record<string, number>;
}> = ({ value, onChange, counts }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap aria-label="学習状態で絞り込む">
    {STATE_OPTIONS.map((opt) => {
      const selected = opt.key === value;
      const count = opt.key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[opt.key] ?? 0);
      return (
        <ButtonBase
          key={opt.key}
          onClick={() => onChange(opt.key)}
          aria-pressed={selected}
          sx={{
            px: 1.75,
            py: 1,
            borderRadius: 999,
            border: `1px solid ${selected ? PRIMARY : BORDER}`,
            bgcolor: selected ? PRIMARY : "#fff",
            color: selected ? "#fff" : TEXT,
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {opt.label}（{count}）
        </ButtonBase>
      );
    })}
  </Stack>
);

/** 表示順の優先度：学習中 → 未着手 → 完了。 */
const STATE_ORDER: Record<string, number> = { IN_PROGRESS: 0, NOT_STARTED: 1, COMPLETED: 2 };

/**
 * 学習内容の説明（2026-11-23 追加）：役割分担は、ミッションの題＝この単元で挑む課題（場面）、
 * この説明＝どうやって解決するかの仕組みを学ぶ、という文（GPT案を Kanato が採用）。
 * 目的を説明側にも書くと題と重なるため、説明は仕組み＋学びに寄せる。
 */
const FEATURE_TEXT: Record<string, string> = {
  "course-algorithm-breadth-first-search-v1": "近い場所から順に調べていくことで、最短ルートを見つける仕組みを学びます",
  "course-algorithm-depth-first-search-v1": "一本道を深く進み、行き止まりで戻ることで、道を見つける仕組みを学びます",
  "course-algorithm-maze-digging-v1": "壁を掘って通路を伸ばしていくことで、迷路を作る仕組みを学びます",
  "course-algorithm-wall-extension-v1": "柱から壁を倒して伸ばすことで、迷路を作る仕組みを学びます",
  "course-algorithm-bubble-sort-v2": "隣同士を比べて交換を繰り返すことで、並べ替える仕組みを学びます",
  "course-algorithm-binary-search-v1": "調べる範囲を半分ずつ絞り込むことで、効率よく探す仕組みを学びます",
  "course-algorithm-greedy-coins-v1": "その場で最良の選択を繰り返すことで、答えを出す考え方を学びます",
};

// 流す順序：同じ軸の単元を隣り合わせ、組が行の途中で割れないようにする。
const FLOW_ORDER = [
  "course-algorithm-breadth-first-search-v1",
  "course-algorithm-depth-first-search-v1",
  "course-algorithm-bubble-sort-v2",
  "course-algorithm-maze-digging-v1",
  "course-algorithm-wall-extension-v1",
  "course-algorithm-binary-search-v1",
  "course-algorithm-greedy-coins-v1",
];

const OTHER_IDS = [
  "course-algorithm-kmp-v1",
  "course-algorithm-selection-sort-v1",
  "course-algorithm-merge-sort-v1",
];

/**
 * 状態の印：バッジは学習中だけに付ける（2026-11-23、GPT指摘を受けた Kanato の判断）。
 * 完了のメダルバッジは外した。完了が学習中より目立ってしまう逆転が起きるのと、
 * 完了は緑の復習ボタンがすでに担っていて二重表現になるため。完了＝印なし。
 */
const StateMark: React.FC<{ unit: UnitView }> = ({ unit }) => {
  if (unit.status === "IN_PROGRESS") {
    return (
      <Box
        component="span"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.25,
          py: 0.75,
          borderRadius: 999,
          bgcolor: PRIMARY,
          color: "#fff",
          fontWeight: 800,
          fontSize: 14,
          lineHeight: 1,
          boxShadow: "0 2px 6px rgba(15, 40, 90, 0.35)",
        }}
      >
        <PlayArrowIcon sx={{ fontSize: 15 }} />
        学習中
      </Box>
    );
  }
  return null;
};

/**
 * 状態ボタン：カード下部に置く見た目上のボタン（遷移はカード全体のリンクが担う）。
 * 色は主色にそろえ、文言だけが変わる。状態の違いは印と進捗の形が担う。
 * 例外は完了だけ：復習ボタンは緑のアウトラインにして主張を下げる。
 */
const StateButton: React.FC<{ unit: UnitView }> = ({ unit }) => {
  const base = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    height: 42,
    borderRadius: 2,
    fontSize: 15,
    fontWeight: 700,
  } as const;
  if (unit.status === "COMPLETED") {
    // 完了はアウトラインにして主張を下げる（2026-11-23、GPT指摘を受けた Kanato の判断）
    return (
      <Box component="span" sx={{ ...base, bgcolor: "#fff", color: "#15803d", border: "2px solid #15803d" }}>
        <ReplayIcon sx={{ fontSize: 19 }} />
        復習する
      </Box>
    );
  }
  if (unit.status === "IN_PROGRESS") {
    return (
      <Box component="span" sx={{ ...base, bgcolor: PRIMARY, color: "#fff" }}>
        <PlayArrowIcon sx={{ fontSize: 19 }} />
        続きから学ぶ
      </Box>
    );
  }
  return (
    <Box component="span" sx={{ ...base, bgcolor: PRIMARY, color: "#fff" }}>
      <PlayArrowIcon sx={{ fontSize: 19 }} />
      学習を始める
    </Box>
  );
};

const UnitCard: React.FC<{ unit: UnitView; onToggleGoal: (unit: UnitView, nowGoal: boolean) => void; onShowStory: (unit: UnitView) => void }> = ({ unit, onToggleGoal, onShowStory }) => {
  const mission = findUnitMission(unit.id);
  const scene = missionThumbnailFor(unit.id);
  const inProgress = unit.status === "IN_PROGRESS";
  return (
    <Paper
      component={Link}
      href={unit.href}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: inProgress ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        textDecoration: "none",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        "&:hover": { boxShadow: "0 8px 24px rgba(30, 64, 175, 0.18)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ position: "relative", height: 196, bgcolor: "#f6f9ff", flexShrink: 0 }}>
        <StateMark unit={unit} />
        {scene ?? (
          <Box sx={{ position: "absolute", inset: 0, p: 1.5 }}>
            <CourseThumbnail courseId={unit.id} />
          </Box>
        )}
        {inProgress && (
          <>
            {/* 進捗バーのラベル：何の進捗か（段階のどこまでか）を数字で添える */}
            <Box
              component="span"
              sx={{
                position: "absolute",
                right: 8,
                bottom: 12,
                zIndex: 1,
                px: 1,
                py: 0.375,
                borderRadius: 999,
                bgcolor: "rgba(255, 255, 255, 0.94)",
                border: `1px solid ${BORDER}`,
                color: TEXT,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              段階 {unit.completedPhases}/{unit.totalPhases}
            </Box>
            <Box
              aria-label={`段階 ${unit.completedPhases}/${unit.totalPhases} まで完了`}
              sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, bgcolor: "#dbe3ef", zIndex: 1 }}
            >
              <Box sx={{ width: `${(unit.completedPhases / unit.totalPhases) * 100}%`, height: "100%", bgcolor: GREEN }} />
            </Box>
          </>
        )}
      </Box>
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* 旗は画像に被せず、テキスト側の見出し行の右端に置く（2026-11-23）。 */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          {GROUP_LABEL[unit.id] ? <GroupChip label={GROUP_LABEL[unit.id]} /> : <span />}
          <GoalFlag courseId={unit.id} title={unit.title} onToggle={(nowGoal) => onToggleGoal(unit, nowGoal)} />
        </Stack>
        <Typography fontSize={18} fontWeight={900} color={TEXT}>
          {unit.title}
        </Typography>
        {mission && (
          <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {mission.title}
          </Typography>
        )}
        {FEATURE_TEXT[unit.id] && (
          <Typography fontSize={16} color={TEXT} sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {FEATURE_TEXT[unit.id]}
          </Typography>
        )}
        <Box sx={{ mt: "auto", pt: 2 }}>
          {inProgress && unit.nextPhase && (
            <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ mb: 1 }}>
              次は「{unit.nextPhase}」
            </Typography>
          )}
          {/* 開始前の入口（選ぶ動機）：ミッションストーリーを任意に開く。カード全体の
              リンクとは独立した実ボタンにする（2026-11-23 決定）。 */}
          {mission && (
            <Box
              component="button"
              type="button"
              aria-label={`${unit.title}で解く問題を見る`}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onShowStory(unit); }}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.75, mb: 1.25, p: 0,
                border: "none", background: "none", cursor: "pointer",
                color: PRIMARY, fontSize: 15, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              <PlayCircleOutlineIcon sx={{ fontSize: 20 }} />
              どんな問題を解く？
            </Box>
          )}
          <StateButton unit={unit} />
        </Box>
      </Box>
    </Paper>
  );
};

const OtherCard: React.FC<{ course: Course }> = ({ course }) => (
  <Paper
    component={Link}
    href={`/courses/roadmap/${course.id}`}
    elevation={0}
    sx={{
      borderRadius: 3,
      border: `1px solid ${BORDER}`,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      textDecoration: "none",
      transition: "box-shadow 0.18s ease, transform 0.18s ease",
      "&:hover": { boxShadow: "0 8px 24px rgba(30, 64, 175, 0.18)", transform: "translateY(-2px)" },
    }}
  >
    <Box sx={{ position: "relative", height: 196, bgcolor: "#f6f9ff", flexShrink: 0 }}>
      <Box sx={{ position: "absolute", inset: 0, p: 1.5 }}>
        <CourseThumbnail courseId={course.id} />
      </Box>
    </Box>
    <Box sx={{ p: 2.5 }}>
      <Typography fontSize={18} fontWeight={900} color={TEXT}>
        {course.title}
      </Typography>
      <Typography
        fontSize={14}
        color={TEXT}
        sx={{
          mt: 0.5,
          lineHeight: 1.7,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {course.description}
      </Typography>
    </Box>
  </Paper>
);

const CardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
      gap: 3,
      alignItems: "stretch",
    }}
  >
    {children}
  </Box>
);

export const CoursesDesign: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const toView = (course: Course): UnitView => ({
    id: course.id,
    title: course.title,
    href: `/courses/roadmap/${course.id}`,
    status: course.status === "completed" ? "COMPLETED" : course.status === "in_progress" ? "IN_PROGRESS" : "NOT_STARTED",
    completedPhases: course.completedPhases ?? 0,
    totalPhases: course.totalPhases ?? 0,
    ...(course.nextPhaseLabel ? { nextPhase: course.nextPhaseLabel } : {}),
  });
  const unitById = new Map(courses.filter((c) => FLOW_ORDER.includes(c.id)).map((c) => [c.id, toView(c)]));
  const units = [...unitById.values()];
  const totalUnits = units.length;
  const completedUnits = units.filter((u) => u.status === "COMPLETED").length;
  const ratio = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;
  const [axis, setAxis] = useState("すべて");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const [storyCourseId, setStoryCourseId] = useState<string | null>(null);
  // 目標トグルの通知：効果（ホームに表示される）を結果で伝える。
  const handleToggleGoal = (_unit: UnitView, nowGoal: boolean) => {
    setNotice(nowGoal ? "目標に設定しました。ホームの目標に表示されます" : "目標を外しました");
  };
  const stateCounts: Record<string, number> = {};
  for (const u of units) {
    stateCounts[u.status] = (stateCounts[u.status] ?? 0) + 1;
  }
  const visibleUnits = FLOW_ORDER.map((id) => unitById.get(id))
    .filter(
      (u): u is UnitView =>
        !!u &&
        (axis === "すべて" || FILTER_GROUP[u.id] === axis) &&
        (stateFilter === "ALL" || u.status === stateFilter),
    )
    // 表示順：学習中 → 未着手 → 完了。同じ状態の中では FLOW_ORDER（軸の隣接順）を保つ。
    .sort((a, b) => STATE_ORDER[a.status] - STATE_ORDER[b.status]);
  const otherCourses = courses.filter((c) => !FLOW_ORDER.includes(c.id) && !OTHER_IDS.includes(c.id));
  const otherOrdered = [...OTHER_IDS.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c), ...otherCourses];
  return (
    <Stack spacing={4}>
      <Box>
        <Typography component="h1" fontSize={24} fontWeight={900} color={TEXT}>
          コース一覧
        </Typography>
        <Paper elevation={0} sx={{ mt: 2, px: 3, py: 2, borderRadius: 3, border: `1px solid ${BORDER}` }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Typography fontSize={16} fontWeight={700} color={TEXT} sx={{ whiteSpace: "nowrap" }}>
              全{totalUnits}単元中 {completedUnits}単元完了
            </Typography>
            <Box sx={{ flex: 1, width: "100%", height: 10, borderRadius: 999, bgcolor: "#e8eef7", overflow: "hidden" }}>
              <Box sx={{ width: `${ratio}%`, height: "100%", bgcolor: GREEN, borderRadius: 999 }} />
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography fontSize={14} fontWeight={800} color={TEXT} sx={{ width: 64, flexShrink: 0 }}>
            学習状況
          </Typography>
          <StateFilter value={stateFilter} onChange={setStateFilter} counts={stateCounts} />
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography fontSize={14} fontWeight={800} color={TEXT} sx={{ width: 64, flexShrink: 0 }}>
            カテゴリ
          </Typography>
          <AxisFilter value={axis} onChange={setAxis} />
        </Stack>
      </Stack>

      <Box component="section" aria-label="単元">
        <CardGrid>
          {visibleUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} onToggleGoal={handleToggleGoal} onShowStory={(u) => setStoryCourseId(u.id)} />
          ))}
        </CardGrid>
      </Box>

      {otherOrdered.length > 0 && (
        <Box component="section" aria-label="その他のコース">
          <Typography component="h2" fontSize={18} fontWeight={900} color={TEXT} sx={{ mb: 2 }}>
            その他のコース
          </Typography>
          <CardGrid>
            {otherOrdered.map((course) => (
              <OtherCard key={course.id} course={course} />
            ))}
          </CardGrid>
        </Box>
      )}

      <Snackbar
        open={notice !== null}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        message={notice ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      <MissionStoryDialog courseId={storyCourseId} open={storyCourseId !== null} onClose={() => setStoryCourseId(null)} />
    </Stack>
  );
};

"use client";

// 発展ミッション挑戦画面の下書き（2026-11-25、Issue #507）。
// 土台はフェーズ7の自由実装の枠（プログラム形式）を流用し、スコアパネルと
// 関連知識カードの参照要素（Issue #510）を足したもの。
import { AppHeader } from "@/app/component/appHeader";
import { RobotBust } from "@/app/component/robotBust";
import { developmentMissionThumbnailFor } from "@/features/learning/app/DevelopmentMissionThumbnail";
import { KnowledgeCardFace } from "@/features/learning/app/KnowledgeCardFace";
import { MissionExampleTrace, MissionInputVisual } from "@/features/learning/app/MissionInputVisual";
import { RankMedal } from "@/features/learning/app/RankMedal";
import {
  findDevelopmentMission, nextRank, pointsForCount, rankForPoints,
  rankThresholds, type DevMission,
} from "@/features/learning/app/developmentMissions";
import { QuickPostDialog, type QuickPostPreset } from "@/app/quest-board/_components/QuickPostDialog";
import { LEARNING_EDITOR_THEME, setupLearningEditor } from "@/features/learning/code/learningEditor";
import { preparePyodide, runProgramFree, runProgramTests } from "@/lib/pyodideRunner";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Box, Button, Chip, Dialog, Tab, Tabs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserSession } from "@/app/component/userSession";
import { getCollection } from "@/api/collection.api";
import { getDevelopmentMissionBests, recordDevelopmentMissionAttempt } from "@/api/developmentMissions.api";
import { useLearningProgress } from "@/features/learning/app/useLearningProgress";
import type { CardFaceData } from "@/features/learning/app/KnowledgeCardFace";

type Outcome = { status: "unrun" | "pass" | "fail" | "error"; answer?: string; count?: number; error?: string };


const draftKey = (missionId: string) => `engineer-quest:mission-code:${missionId}`;

/** ミッション→対応単元（掲示板への関連付けに使う）。 */
const missionCourseIds: Record<string, string> = {
  "dungeon-escape": "course-algorithm-breadth-first-search-v1",
  "island-count": "course-algorithm-depth-first-search-v1",
  "first-broken-version": "course-algorithm-binary-search-v1",
};

/** アルドのバストアップは共通部品（@/app/component/robotBust）を使う。 */

/** ランクの進捗バー：C→B→A→S の物差しの上に、現在のベストの位置を示す。 */
const RankLadder: React.FC<{ points: number | null }> = ({ points }) => (
  <Box sx={{ px: 1, pt: 0.5 }}>
    <Box sx={{ position: "relative", height: 34 }}>
      <Box sx={{ position: "absolute", left: 0, right: 0, top: 15, height: 5, borderRadius: 999, bgcolor: "#e2e8f0" }} />
      {points !== null && (
        <Box sx={{ position: "absolute", left: 0, top: 15, height: 5, borderRadius: 999, bgcolor: "#16a34a", width: `${Math.min(100, points / 10)}%` }} />
      )}
      {[...rankThresholds].reverse().map((t) => (
        <Box key={t.rank} sx={{ position: "absolute", left: `${t.min / 10}%`, top: 0, transform: "translateX(-50%)" }}>
          <RankMedal rank={t.rank} size={34} />
        </Box>
      ))}
    </Box>
    <Box sx={{ position: "relative", height: 18 }}>
      {[...rankThresholds].reverse().map((t) => (
        <Typography key={t.rank} component="p" sx={{ position: "absolute", left: `${t.min / 10}%`, transform: "translateX(-50%)", fontSize: 14, whiteSpace: "nowrap" }}>
          {t.min}点〜
        </Typography>
      ))}
    </Box>
  </Box>
);

export function MissionChallengeDraft({ missionId, initialBest, allCards, ownedCardIds, token }: {
  missionId: string;
  initialBest: { points: number; rank: string } | null;
  allCards: CardFaceData[];
  ownedCardIds: Set<string>;
  token: string | null;
}) {
  const router = useRouter();
  const mission = findDevelopmentMission(missionId);
  const [code, setCode] = useState<string>(() => {
    if (!mission) return "";
    try { return localStorage.getItem(draftKey(mission.id)) ?? mission.starterCode; } catch { return mission.starterCode; }
  });
  const [panel, setPanel] = useState<"statement" | "tests" | "console" | "hints">("statement");
  const [quickPost, setQuickPost] = useState<QuickPostPreset | null>(null);
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [runningTests, setRunningTests] = useState(false);
  const [runningFree, setRunningFree] = useState(false);
  const running = runningTests || runningFree;
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [freeOut, setFreeOut] = useState<{ stdout: string; error: string | null } | null>(null);
  const [result, setResult] = useState<{ points: number; rank: string; count: number } | null>(null);
  const [modalClosed, setModalClosed] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  // 自己ベストは画面の中で保持する（再挑戦で消えない）。prevBest は今回の結果が出る直前のベスト。
  const [sessionBest, setSessionBest] = useState<{ points: number; rank: string } | null>(initialBest);
  const [prevBest, setPrevBest] = useState<{ points: number; rank: string } | null>(initialBest);
  const sessionBestRef = useRef<{ points: number; rank: string } | null>(initialBest);
  const [testedCode, setTestedCode] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [openInputs, setOpenInputs] = useState<Record<string, boolean>>({});
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  useEffect(() => {
    let active = true;
    preparePyodide().then(() => { if (active) setRuntime("ready"); }).catch(() => { if (active) setRuntime("error"); });
    return () => { active = false; };
  }, []);

  if (!mission) {
    return <Box sx={{ p: 4 }}><Typography>ミッションが見つかりません。</Typography></Box>;
  }
  const relatedCards = mission.relatedCardIds
    .map((id) => allCards.find((c) => c.id === id))
    .filter((c): c is CardFaceData => !!c);
  const scoringTest = mission.tests.find((t) => t.scoring);
  const passedCount = mission.tests.filter((t) => outcomes[t.id]?.status === "pass").length;
  // 自己ベストと今回の記録は別物。ベストは「これまでの最大」、今回の記録は結果そのもの。
  const displayBest = sessionBest ?? (result ? { points: result.points, rank: result.rank } : null);
  const bestPoints = displayBest?.points ?? -1;
  const hasBest = displayBest !== null;
  const bestRank = hasBest ? rankForPoints(bestPoints) : null;
  const isFirstClear = !!result && !prevBest;
  const isRecordUpdate = !!result && !!prevBest && result.points > prevBest.points;
  const celebrate = isFirstClear || isRecordUpdate;
  const resultsStale = testedCode !== null && testedCode !== code && Object.keys(outcomes).length > 0;
  const scoreMissing = !!scoringTest && outcomes[scoringTest.id]?.status === "fail" && outcomes[scoringTest.id]?.answer === scoringTest.expectedAnswer;

  const persist = (next: string) => {
    setCode(next);
    try { localStorage.setItem(draftKey(mission.id), next); } catch { /* noop */ }
  };

  const runTests = async () => {
    if (running || runtime !== "ready") return;
    setRunningTests(true);
    setPanel("tests");
    setOutcomes({});
    setResult(null);
    setRunError(null);
    setTestedCode(code);
    const acc: Record<string, Outcome> = {};
    try {
      // テストごとに分けて実行する。前回の結果が残ったまま新しい実行が始まると、
      // どの結果が今回のものか分からなくなるため、終わったテストから順に表示する。
      for (const t of mission.tests) {
        const { results } = await runProgramTests(code, [{ id: t.id, input: t.input }]);
        const r = results.find((x) => x.id === t.id);
        if (!r || r.error) {
          acc[t.id] = { status: "error", error: r?.error ?? "実行できませんでした" };
        } else {
          const lines = r.stdout.split("\n").map((x) => x.trim()).filter((x) => x !== "");
          const answer = lines[0] ?? "";
          const count = Number.parseInt(lines[1] ?? "", 10);
          acc[t.id] = {
            status: answer === t.expectedAnswer ? "pass" : "fail",
            answer,
            count: Number.isNaN(count) ? undefined : count,
          };
          // スコア計測テストで答えは合っているのに2行目が数字でない場合は、通過にしない。
          // 「全件通過なのにスコアが出ない」状態を作らないため。
          if (t.scoring && answer === t.expectedAnswer && Number.isNaN(count)) {
            acc[t.id] = { status: "fail", answer, count: undefined };
          }
        }
        setOutcomes({ ...acc });
      }
      const allPass = mission.tests.every((t) => acc[t.id]?.status === "pass");
      if (allPass && scoringTest) {
        const count = acc[scoringTest.id]?.count;
        if (typeof count === "number") {
          const points = pointsForCount(count, mission.scoring);
          const rank = rankForPoints(points);
          setPrevBest(sessionBestRef.current);
          if (points > (sessionBestRef.current?.points ?? -1)) {
            const nb = { points, rank };
            sessionBestRef.current = nb;
            setSessionBest(nb);
          }
          setResult({ points, rank, count });
          setModalClosed(false);
          // スコアはサーバーにも記録する（自己ベストの正本）。失敗しても画面の結果は保つ。
          if (token) void recordDevelopmentMissionAttempt(token, mission.id, { points, count, code }).catch(() => {});
        }
      }
    } catch {
      setRunError("テストの実行が時間切れになりました。コードを見直して、もう一度実行してください。");
    } finally {
      setRunningTests(false);
    }
  };

  const runFree = async () => {
    if (running || runtime !== "ready") return;
    setRunningFree(true);
    setPanel("console");
    try {
      const out = await runProgramFree(code, mission.tests[0].input);
      setFreeOut({ stdout: out.stdout, error: out.stderr ? out.stderr : null });
    } catch {
      setFreeOut({ stdout: "", error: "実行が時間切れになりました。無限ループになっていないか確認してください。" });
    } finally {
      setRunningFree(false);
    }
  };

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const stamp = (o?: Outcome) => {
    if (!o || o.status === "unrun") return <Chip size="small" label="○ 未実行" variant="outlined" sx={{ borderColor: "#c3cad4", fontWeight: 700 }} />;
    if (o.status === "pass") return <Chip size="small" label="✓ 通過" sx={{ bgcolor: "#16a34a", color: "#fff", fontWeight: 700 }} />;
    if (o.status === "error") return <Chip size="small" label="！ 実行エラー" variant="outlined" sx={{ borderColor: "#111827", fontWeight: 700 }} />;
    return <Chip size="small" label="× 不一致" variant="outlined" sx={{ borderColor: "#111827", fontWeight: 700 }} />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      {/* ミッションバンド（場面イラストは一覧と同じものを使う） */}
      <Box sx={{ flexShrink: 0, bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 3, p: 2, display: "flex", gap: 2.5, flexDirection: { xs: "column", sm: "row" } }}>
        <Box sx={{ width: { sm: 196 }, height: { xs: 140, sm: 118 }, flexShrink: 0, borderRadius: 2, overflow: "hidden" }}>
          {developmentMissionThumbnailFor(mission.id)}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip size="small" label="発展ミッション" sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700 }} />
            <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{mission.title}</Typography>
            <Chip size="small" variant="outlined" label={`解放条件：${mission.unlockUnitName}の単元完了`} />
          </Box>
          <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.8, mt: 0.75 }}>{mission.problem}</Typography>
          <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>達成の条件：{mission.successCondition}</Typography>
        </Box>
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "flex-end", gap: 0.5, ml: "auto", flexShrink: 0 }}>
          <Box sx={{ position: "relative", bgcolor: "#eef4fc", border: "1.5px solid #bfdbfe", borderRadius: 3, px: 1.75, py: 1.25, mb: 2.5, maxWidth: 300 }}>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 700 }}>
              {sessionBest
                ? result && sessionBest !== prevBest
                  ? `ベストは ${sessionBest.points} 点まで上がったよ。`
                  : `前回のベストは ${sessionBest.points} 点。今日は超えられるかな？`
                : "解き方は自分で選ぶミッション。まずはクリアを目指そう。"}
            </Typography>
            <Box sx={{ position: "absolute", right: -7, bottom: 18, width: 14, height: 14, bgcolor: "#eef4fc", borderRight: "1.5px solid #bfdbfe", borderTop: "1.5px solid #bfdbfe", transform: "rotate(45deg)" }} />
          </Box>
          <RobotBust state={sessionBest ? "cheer" : "point"} width={148} height={102} />
        </Box>
      </Box>

      {/* スコアパネル（常時表示） */}
      <Box sx={{ flexShrink: 0, bgcolor: "#fff", border: "1px solid #dbe3ef", borderRadius: 3, px: 2.5, py: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.7fr 1fr" }, gap: 2.5, alignItems: "start" }}>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>スコア条件</Typography>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7 }}>
              {mission.countLabel}で計算します（少ないほど高得点）。答えと一緒に出力してください。
            </Typography>
          </Box>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.75 }}>ランクとスコアの目安（1000点満点）</Typography>
            <RankLadder points={hasBest ? bestPoints : null} />
          </Box>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>自己ベストと次の目標</Typography>
            {hasBest ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                <RankMedal rank={bestRank!} size={40} />
                <Typography component="p" sx={{ fontSize: 24, fontWeight: 900 }}>{bestPoints}点</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, width: "100%" }}>
                  {nextRank(bestPoints)
                    ? `次の${nextRank(bestPoints)!.rank}ランクまで あと ${nextRank(bestPoints)!.min - bestPoints}点`
                    : "最高ランクに到達しています"}
                </Typography>
                {result && displayBest && result.points < displayBest.points && (
                  <Typography component="p" sx={{ fontSize: 14, width: "100%" }}>
                    今回の記録：{result.points}点（自己ベストまであと {displayBest.points - result.points}点）
                  </Typography>
                )}
                {result && displayBest && prevBest && result.points === displayBest.points && result.points <= prevBest.points && (
                  <Typography component="p" sx={{ fontSize: 14, width: "100%" }}>
                    今回の記録：{result.points}点（自己ベストと同点）
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography component="p" sx={{ fontSize: 16 }}>まだ記録なし。クリアすると、ここにベストが出ます。</Typography>
            )}
          </Box>
        </Box>
        {result && !celebrate && displayBest && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, pt: 2, borderTop: "1px solid #eef2f7", flexWrap: "wrap" }}>
            <Typography component="p" sx={{ fontSize: 16, fontWeight: 900 }}>全テスト通過</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RankMedal rank={result.rank} size={30} />
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 700 }}>今回 {result.points}点</Typography>
            </Box>
            <Typography component="p" sx={{ fontSize: 14 }}>{result.points < displayBest.points ? `自己ベスト ${displayBest.points}点まであと ${displayBest.points - result.points}点` : "自己ベストと同点です"}</Typography>
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" onClick={() => { setOutcomes({}); setResult(null); }} sx={{ fontWeight: 800 }}>もう一度挑戦する</Button>
          </Box>
        )}
      </Box>

      {/* クリア演出モーダル：コードを残したまま、その上に称賛と結果を出す */}
      <Dialog
        open={!!result && celebrate && !modalClosed}
        onClose={() => setModalClosed(true)}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: { bgcolor: "rgba(15, 23, 42, 0.35)" } }, paper: { sx: { borderRadius: 4, overflow: "hidden", m: 2 } } }}
      >
        {result && (
          <Box>
            <Box sx={{ bgcolor: "#fffbeb", px: 3, pt: 2, pb: 2.5, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <RobotBust state="celebrate" width={230} height={158} />
              <Typography component="p" sx={{ fontSize: 24, fontWeight: 900, mt: 0.5 }}>{isRecordUpdate ? "自己ベスト更新！" : "ミッション達成！"}</Typography>
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 700, mt: 0.5 }}>{isRecordUpdate ? "前回の自分を超えたね。" : "自分の解き方で課題を解き切ったね。"}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
                <RankMedal rank={result.rank} size={58} />
                <Typography component="p" sx={{ fontSize: 38, fontWeight: 900 }}>{result.points}点</Typography>
              </Box>
              <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>
                {mission.countLabel}：{result.count}
                {isRecordUpdate
                  ? `／前回 ${prevBest!.points}点から +${result.points - prevBest!.points}点`
                  : "／初めての記録です"}
                {isRecordUpdate && prevBest!.rank !== result.rank ? `／${prevBest!.rank}ランクから${result.rank}ランクに上がりました` : ""}
              </Typography>
              <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>
                {nextRank(result.points)
                  ? `次の${nextRank(result.points)!.rank}ランクまで あと ${nextRank(result.points)!.min - result.points}点`
                  : "最高ランクです。この調子で次のミッションへ。"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, px: 3, py: 2, flexWrap: "wrap", justifyContent: "center" }}>
              {result.points >= 950 ? (
                <>
                  <Button variant="outlined" onClick={() => setModalClosed(true)} sx={{ fontWeight: 800 }}>コードを確認する</Button>
                  <Button variant="contained" onClick={() => router.push("/missions")} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>次のミッションへ</Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" onClick={() => router.push("/missions")} sx={{ fontWeight: 800 }}>発展ミッション一覧へ</Button>
                  <Button variant="contained" onClick={() => setModalClosed(true)} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>解法を改善する</Button>
                </>
              )}
              <Box sx={{ width: "100%", textAlign: "center" }}>
                <Button
                  onClick={() => {
                    setModalClosed(true);
                    setQuickPost({
                      category: "WORK_SHARE",
                      courseId: missionCourseIds[mission.id],
                      contextLabel: `発展ミッション『${mission.title}』`,
                      mission: { id: mission.id, title: mission.title, score: result.points, rank: result.rank },
                    });
                  }}
                  sx={{ fontWeight: 800, color: "#2563eb" }}
                >
                  成果を仲間に共有する
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* ワークスペース */}
      <Box sx={{ flex: 1, minHeight: 0, display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.5fr) minmax(340px, 1fr)", gap: 2, overflowY: { xs: "auto", md: "hidden" } }}>
        <Box sx={{ display: "flex", flexDirection: "column", border: "2px solid #dbe3ef", borderRadius: 3, bgcolor: "#fff", overflow: "hidden", minHeight: { xs: 420, md: 0 }, "&:focus-within": { borderColor: "#2563eb" } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderBottom: "1px solid #eef2f7", flexWrap: "wrap" }}>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mr: 1 }}>Pythonコード</Typography>
            <Button size="small" variant="outlined" disabled={running || runtime !== "ready"} onClick={runFree} sx={{ fontWeight: 800 }}>試しに実行</Button>
            <Button size="small" variant="contained" disabled={running || runtime !== "ready"} onClick={runTests} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>テストとスコアを実行</Button>
            <Typography component="p" role="status" sx={{ fontSize: 14, ml: "auto" }}>
              {runtime === "loading" ? "実行環境を準備しています…" : runtime === "error" ? "実行環境を読み込めませんでした" : runningTests ? "テストを実行中…" : runningFree ? "実行中…" : "実行できます。"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Editor
              language="python"
              theme={LEARNING_EDITOR_THEME}
              beforeMount={setupLearningEditor}
              value={code}
              onChange={(v) => persist(v ?? "")}
              onMount={onMount}
              options={{ minimap: { enabled: false }, fontSize: 16, lineHeight: 29, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12 } }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", border: "1px solid #dbe3ef", borderRadius: 3, bgcolor: "#fff", overflow: "hidden", minHeight: { xs: 360, md: 0 } }}>
          <Tabs value={panel} onChange={(_, v) => setPanel(v)} variant="fullWidth" sx={{ borderBottom: "1px solid #eef2f7", minHeight: 44 }}>
            <Tab value="statement" label="問題" sx={{ fontWeight: 800, minHeight: 44, fontSize: 14, px: 0.5 }} />
            <Tab value="tests" label="テスト" sx={{ fontWeight: 800, minHeight: 44, fontSize: 14, px: 0.5 }} />
            <Tab value="console" label="コンソール" sx={{ fontWeight: 800, minHeight: 44, fontSize: 14, px: 0.5 }} />
            <Tab value="hints" label="ヒント・カード" sx={{ fontWeight: 800, minHeight: 44, fontSize: 14, px: 0.5 }} />
          </Tabs>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
            {panel === "statement" && (
              <Box>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mb: 1 }}>{mission.title}</Typography>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mt: 1 }}>入出力の例</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5, mb: 1 }}>入力の見方（例）</Typography>
                <MissionInputVisual visual={mission.inputVisual} />
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 2, mb: 1 }}>出力の例</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {mission.outputExample.map((line, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Box sx={{ minWidth: 52, textAlign: "center", px: 1, py: 0.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>{line.value}</Box>
                      <Typography component="p" sx={{ fontSize: 14 }}>{i + 1}行目：{line.label}</Typography>
                    </Box>
                  ))}
                </Box>
                {mission.exampleTrace && mission.inputVisual.kind === "grid" && (
                  <>
                    <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 2, mb: 1 }}>例の見方：通る部屋と、調べた部屋</Typography>
                    <MissionExampleTrace
                      rows={mission.inputVisual.rows}
                      pathCells={mission.exampleTrace.pathCells}
                      examinedCells={mission.exampleTrace.examinedCells}
                      pathLabel={`通る経路（${mission.exampleTrace.pathCells.length}マス）＝ 出力の1行目`}
                      examinedLabel={`調べたけれど通らない部屋（${mission.exampleTrace.examinedCells.length}マス）。通る経路と合わせた数が、出力の2行目になります`}
                    />
                  </>
                )}
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 2 }}>入力</Typography>
                <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.8 }}>{mission.statement.inputFormat}</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>出力</Typography>
                <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.8 }}>{mission.statement.outputFormat}</Typography>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>条件</Typography>
                {mission.statement.conditions.map((c) => (
                  <Typography key={c} component="p" sx={{ fontSize: 16, lineHeight: 1.8 }}>・{c}</Typography>
                ))}
              </Box>
            )}
            {panel === "tests" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography component="p" sx={{ fontSize: 16, fontWeight: 700 }}>
                  {runningTests
                    ? `検証中…（${Object.keys(outcomes).length} / ${mission.tests.length} 件終わりました）`
                    : `${passedCount} / ${mission.tests.length} 件通過`}
                </Typography>
                {resultsStale && (
                  <Typography component="p" sx={{ fontSize: 14 }}>コードが変更されています。これは前回の結果です。再実行すると更新されます。</Typography>
                )}
                {runError && (
                  <Typography component="p" sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{runError}</Typography>
                )}
                {scoreMissing && (
                  <Typography component="p" sx={{ fontSize: 14 }}>答えは合っていますが、2行目の「{mission.countLabel}」が数字でないため、スコアを計算できません。</Typography>
                )}
                {!runningTests && Object.keys(outcomes).length > 0 && passedCount < mission.tests.length && (
                  <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5 }}>
                    <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>解決方法に迷っていますか？</Typography>
                    <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>ヒントは今すぐ見られます。掲示板の回答は後から届きます。</Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1.25, flexWrap: "wrap" }}>
                      <Button variant="contained" onClick={() => setPanel("hints")} sx={{ fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>ヒントを見る</Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          const failed = mission.tests.filter((t) => outcomes[t.id] && outcomes[t.id].status !== "pass");
                          const resultsDetail = failed.map((t) => {
                            const o = outcomes[t.id];
                            return o.status === "error"
                              ? `${t.label}：実行エラー\n${o.error ?? ""}`
                              : `${t.label}：不合格\n期待する答え：${t.expectedAnswer}\n実際の答え：${o.answer || "（出力なし）"}`;
                          }).join("\n\n");
                          setQuickPost({
                            category: "ERROR_HELP",
                            courseId: missionCourseIds[mission.id],
                            contextLabel: `${mission.unlockUnitName} › 発展ミッション『${mission.title}』`,
                            attachments: [
                              { id: "code", label: "現在のコード", kind: "code", detail: code, defaultChecked: true },
                              { id: "results", label: "テスト結果（不合格のケース）", kind: "text", detail: resultsDetail, defaultChecked: true },
                            ],
                          });
                        }}
                        sx={{ fontWeight: 800 }}
                      >
                        仲間に相談する
                      </Button>
                    </Box>
                    <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>相談するときは、今のコードと不合格のテスト結果を添付できます（中身は投稿前に確認できます）。</Typography>
                  </Box>
                )}
                {mission.tests.map((t) => {
                  const o = outcomes[t.id];
                  return (
                    <Box key={t.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography component="p" sx={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{t.label}</Typography>
                        {t.scoring && <Chip size="small" label="スコア計測" sx={{ bgcolor: "#fef3c7", fontWeight: 700 }} />}
                        {runningTests && !o ? <Chip size="small" label="結果待ち" sx={{ bgcolor: "#eef2f7", fontWeight: 700 }} /> : stamp(o)}
                      </Box>
                      {(openInputs[t.id] ?? o?.status !== "pass") ? (
                        <Box component="pre" sx={{ m: 0, mt: 1, p: 1, bgcolor: "#f8fafc", borderRadius: 1, fontFamily: "monospace", fontSize: 14, overflowX: "auto", maxHeight: 120, overflowY: "auto" }}>{t.input}</Box>
                      ) : null}
                      {o?.status === "pass" && (
                        <Button size="small" onClick={() => setOpenInputs((prev) => ({ ...prev, [t.id]: !(prev[t.id] ?? false) }))} sx={{ mt: 0.5, fontWeight: 700, alignSelf: "flex-start" }}>
                          {(openInputs[t.id] ?? false) ? "入力を閉じる" : "入力を見る"}
                        </Button>
                      )}
                      {o?.status === "fail" && (
                        <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>
                          あなたの答え：{o.answer || "（出力なし）"}／期待する答え：{t.expectedAnswer}
                        </Typography>
                      )}
                      {o?.status === "error" && (
                        <Typography component="p" sx={{ fontSize: 14, mt: 1, whiteSpace: "pre-wrap" }}>{o.error}</Typography>
                      )}
                      {o?.status === "pass" && typeof o.count === "number" && (
                        <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>{mission.countLabel}：{o.count}</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
            {panel === "console" && (
              <Box>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>入力（最初のテスト）</Typography>
                <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 14, overflowX: "auto" }}>{mission.tests[0].input}</Box>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 2 }}>出力</Typography>
                {freeOut
                  ? <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 14, whiteSpace: "pre-wrap" }}>{freeOut.error ?? (freeOut.stdout || "（出力なし）")}</Box>
                  : <Typography component="p" sx={{ fontSize: 16, mt: 0.5 }}>「試しに実行」を押すと、ここに出力が表示されます。</Typography>}
              </Box>
            )}
            {panel === "hints" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                  <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, flex: 1 }}>解き方のヒント</Typography>
                  <Typography component="p" sx={{ fontSize: 14 }}>{hintsShown} / {mission.hints.length} 件閲覧</Typography>
                </Box>
                {mission.hints.slice(0, hintsShown).map((h, i) => (
                  <Box key={h} sx={{ display: "flex", gap: 1.25 }}>
                    <Box sx={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", bgcolor: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>{i + 1}</Box>
                    <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.8 }}>{h}</Typography>
                  </Box>
                ))}
                {hintsShown < mission.hints.length && (
                  <Button variant="outlined" onClick={() => setHintsShown((n) => n + 1)} sx={{ fontWeight: 800, alignSelf: "flex-start" }}>
                    {hintsShown === 0 ? `ヒントを見る（全部で${mission.hints.length}件）` : `もう1つヒントを見る（あと${mission.hints.length - hintsShown}件）`}
                  </Button>
                )}
                <Typography component="p" sx={{ fontSize: 14 }}>ヒントは1つずつ開けます。解き方そのものは示さず、考え方の手がかりだけを置いています。</Typography>
                <Box sx={{ borderTop: "1px solid #eef2f7", pt: 2, mt: 0.5 }}>
                  <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>このミッションで役立つ知識カード</Typography>
                  <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.5 }}>
                    カードの「使いどころ」が、このミッションとのつながりです。持っていなくても挑戦できます。
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}>
                    {relatedCards.map((card) => (
                      <KnowledgeCardFace key={card.id} card={card} owned={ownedCardIds.has(card.id)} layout="tile" />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
          <Box sx={{ borderTop: "1px solid #eef2f7", p: 1.5 }}>
            <Button
              fullWidth variant="outlined"
              onClick={() => setQuickPost({
                category: "QUESTION",
                courseId: missionCourseIds[mission.id],
                contextLabel: `${mission.unlockUnitName} › 発展ミッション『${mission.title}』`,
                code,
              })}
              sx={{ minHeight: 44, fontWeight: 800, borderRadius: 2, color: "#111827", borderColor: "#cbd5e1", "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" } }}
            >
              仲間に質問する
            </Button>
          </Box>
        </Box>
      </Box>
      <QuickPostDialog open={quickPost !== null} onClose={() => setQuickPost(null)} preset={quickPost} />
    </Box>
  );
}

export function MissionChallengePage({ missionId }: { missionId: string }) {
  const mission = findDevelopmentMission(missionId);
  const { status, token } = useUserSession();
  const { progress, loading: progressLoading, authenticated } = useLearningProgress(mission?.unlockCourseId);
  const [initialBest, setInitialBest] = useState<{ points: number; rank: string } | null>(null);
  const [allCards, setAllCards] = useState<CardFaceData[]>([]);
  const [ownedCardIds, setOwnedCardIds] = useState<Set<string>>(new Set());
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !token || !mission) return;
    let cancelled = false;
    void (async () => {
      try {
        const [bests, collection] = await Promise.all([
          getDevelopmentMissionBests(token).catch(() => ({ bests: [] as { missionId: string; points: number; count: number; attempts: number; lastAttemptAt: string }[] })),
          getCollection(token).catch(() => null),
        ]);
        if (cancelled) return;
        const mine = bests.bests.find((best) => best.missionId === mission.id);
        setInitialBest(mine ? { points: mine.points, rank: rankForPoints(mine.points) } : null);
        if (collection) {
          const items = collection.knowledgeTips.items;
          setAllCards(items.map((item) => ({
            id: item.id, title: item.title, label: item.label, rarity: item.rarity,
            description: item.description, connection: item.connection ?? "", useCase: item.useCase ?? "",
          })));
          setOwnedCardIds(new Set(items.filter((item) => item.isCollected).map((item) => item.id)));
        }
      } finally {
        if (!cancelled) setDataReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [status, token, mission]);

  const unlocked = progress?.unit?.status === "COMPLETED";
  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: "#f5f8fc" }}>
      {/* 他画面と共通のヘッダーを付ける（一覧画面にはあるのに挑戦画面だけ無かった）。 */}
      <AppHeader />
      <Box sx={{ flexShrink: 0, px: 2.5, pt: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Button onClick={() => { window.location.href = "/missions"; }} sx={{ fontWeight: 800, px: 0 }}>← 発展ミッション一覧へ</Button>
        <Typography component="p" sx={{ fontSize: 14 }}>発展ミッション／{mission?.title ?? ""}</Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, px: 2.5, pb: 2.5, pt: 1.5 }}>
        {!mission ? (
          <Typography component="p" sx={{ fontSize: 16 }}>その発展ミッションは見つかりません。</Typography>
        ) : status === "loading" || progressLoading || (authenticated && !dataReady) ? (
          <Typography component="p" sx={{ fontSize: 16 }}>読み込んでいます。</Typography>
        ) : !authenticated ? (
          <Box>
            <Typography component="p" sx={{ fontSize: 16, mb: 2 }}>挑戦するにはログインが必要です。</Typography>
            <Button variant="contained" onClick={() => { window.location.href = "/auth/login"; }}>ログインして学習する</Button>
          </Box>
        ) : !unlocked ? (
          <Box sx={{ maxWidth: 640 }}>
            <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mb: 1 }}>このミッションはまだ解放されていません</Typography>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.8, mb: 2 }}>
              {mission.unlockUnitName}の単元を完了すると挑戦できます。解放は、どの考え方を持っていけばいいかの案内でもあります。
            </Typography>
            <Button variant="contained" onClick={() => { window.location.href = "/courses"; }}>コース一覧へ</Button>
          </Box>
        ) : (
          <MissionChallengeDraft missionId={missionId} initialBest={initialBest} allCards={allCards} ownedCardIds={ownedCardIds} token={token} />
        )}
      </Box>
    </Box>
  );
}

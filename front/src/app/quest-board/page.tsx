"use client";

import { FeedbackDestination } from "@/app/component/feedbackV1";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";

import { getCourses } from "@/api/courses.api";
import {
  getQuestBoardPosts,
  type QuestBoardListResponse,
  type QuestPostCategory,
  type QuestPostSummary,
} from "@/api/questBoard.api";
import { QuestBoardAuthor } from "./_components/QuestBoardAuthor";
import { CategoryChip, CourseChip, MissionChip, StatusChip, isResolvableCategory } from "./_components/BoardChips";
import { AppHeader } from "@/app/component/appHeader";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { RobotFigure } from "@/app/component/robotFigure";
import type { Course } from "@/app/courses/type";
import { fetchClientQuery, peekClientQueryData, queryTags } from "@/lib/clientQueryCache";
import { useUserSession } from "@/app/component/userSession";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      onClick={onClick}
      sx={{
        minHeight: 38, px: 2, borderRadius: 999, fontSize: 14, fontWeight: 700,
        bgcolor: selected ? "#2563eb" : "#fff",
        color: selected ? "#fff" : "#111827",
        border: `1px solid ${selected ? "#2563eb" : "#cbd5e1"}`,
        "&:hover": { bgcolor: selected ? "#1d4ed8" : "#f1f5f9" },
      }}
    >
      {children}
    </Button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 800, minWidth: 56, pt: 1.25 }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{children}</Box>
    </Box>
  );
}

const PostCard = ({ post }: { post: QuestPostSummary }) => (
  <Paper
    component={Link}
    href={`/quest-board/${encodeURIComponent(post.id)}`}
    elevation={0}
    sx={{
      display: "block", p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0",
      bgcolor: "#fff", color: "inherit", textDecoration: "none",
      transition: "border-color 120ms ease, transform 120ms ease",
      "&:hover": { borderColor: "#2563eb", transform: "translateY(-1px)" },
    }}
  >
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      <CategoryChip category={post.category} label={post.categoryLabel} />
      {isResolvableCategory(post.category) && <StatusChip status={post.status} commentCount={post.commentCount} />}
      {post.courseTitle && <CourseChip title={post.courseTitle} />}
      {post.missionTitle && <MissionChip title={post.missionTitle} />}
      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: 14 }}>{formatDate(post.createdAt)}</Typography>
    </Box>
    <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 1.25, lineHeight: 1.5 }}>{post.title}</Typography>
    <Typography sx={{ fontSize: 16, lineHeight: 1.7, mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {post.excerpt}
    </Typography>
    {post.code && (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1 }}>
        <CodeRoundedIcon sx={{ fontSize: 18, color: "#334155" }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>コード付きの投稿</Typography>
      </Box>
    )}
    {post.category === "WORK_SHARE" && post.missionTitle && (
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mt: 1.25, p: 1.25, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>発展ミッション</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{post.missionTitle}</Typography>
        </Box>
        {typeof post.workScore === "number" && (
          <Box sx={{ ml: "auto", textAlign: "right", flexShrink: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{post.workScore}点</Typography>
            {post.workRank && <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{post.workRank}ランク</Typography>}
          </Box>
        )}
      </Box>
    )}
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mt: 1.75 }}>
      <QuestBoardAuthor author={post} isDeleted={post.isDeleted} />
      <Box sx={{ flex: 1 }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: "#334155" }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{isResolvableCategory(post.category) ? "回答" : "コメント"} {post.commentCount}</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        <LightbulbOutlinedIcon sx={{ fontSize: 18, color: "#334155" }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>参考になった {post.reactions.byType.HELPFUL ?? 0}</Typography>
      </Box>
    </Box>
  </Paper>
);

export default function QuestBoardPage() {
  const router = useRouter();
  const { showOverlay, startNavigation } = useNavigationFeedback();
  const { status: sessionStatus, token } = useUserSession();
  const [cachedBoard] = useState(() => peekClientQueryData<QuestBoardListResponse>("quest-board"));
  const [cachedBoardCourses] = useState(() => peekClientQueryData<Course[]>("quest-board-courses"));
  const [board, setBoard] = useState<QuestBoardListResponse | null>(cachedBoard ?? null);
  const [allPosts, setAllPosts] = useState<QuestPostSummary[]>(cachedBoard?.posts ?? []);
  const [courses, setCourses] = useState<Course[]>(cachedBoardCourses ?? []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<QuestPostCategory | "ALL">("ALL");
  const [courseId, setCourseId] = useState("");
  // 閲覧の目的はタブ（すべて/回答募集中/学び・作品共有/自分の投稿）、
  // 種類・単元は「絞り込み」の中に格納する。状態はタブに吸収した。
  const [view, setView] = useState<"ALL" | "WAITING" | "SHARE" | "MINE">("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!cachedBoard);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const filtersReady = useRef(false);

  const loadBoard = async (idToken: string, overrides: Partial<{ q: string; category: QuestPostCategory | "ALL"; courseId: string; view: typeof view }> = {}) => {
    const merged = {
      q: overrides.q ?? query, category: overrides.category ?? category,
      courseId: overrides.courseId ?? courseId, view: overrides.view ?? view,
    };
    const data = await getQuestBoardPosts(idToken, {
      q: merged.q.trim() || undefined,
      category: merged.category,
      status: merged.view === "WAITING" ? "OPEN" : "ALL",
      courseId: merged.courseId || undefined,
      mine: merged.view === "MINE",
    });
    setBoard(data);
  };

  const SHARE_CATEGORIES: QuestPostCategory[] = ["WORK_SHARE", "CODE_SHARE", "MEMO", "REFERENCE"];
  const displayPosts = (board?.posts ?? []).filter((post) => {
    if (view === "WAITING") return isResolvableCategory(post.category) && post.status === "OPEN";
    if (view === "SHARE") return SHARE_CATEGORIES.includes(post.category);
    return true;
  });
  // 未解決の質問は、回答がまだ無いものを先に出す（回答1件でも未解決なら残す）。
  const sortedPosts = view === "WAITING"
    ? [...displayPosts].sort((a, b) => a.commentCount - b.commentCount)
    : displayPosts;
  /** タブを切り替えたとき、タブと矛盾する種類の絞り込みは解除する。 */
  const changeView = (next: typeof view) => {
    if (next === "WAITING" && category !== "ALL" && !isResolvableCategory(category)) {
      setCategory("ALL");
      if (token) void loadBoard(token, { view: next, category: "ALL" }).catch(() => undefined);
    } else if (next === "SHARE" && category !== "ALL" && !SHARE_CATEGORIES.includes(category)) {
      setCategory("ALL");
      if (token) void loadBoard(token, { view: next, category: "ALL" }).catch(() => undefined);
    } else if (token) {
      void loadBoard(token, { view: next }).catch(() => undefined);
    }
    setView(next);
  };

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus !== "authenticated" || !token) {
      if (!cachedBoard) { setErrorMessage("ログインが必要です。"); setIsLoading(false); }
      return;
    }
    let isMounted = true;
    Promise.all([
      fetchClientQuery("quest-board", () => getQuestBoardPosts(token), { staleTimeMs: 300_000, tags: [queryTags.questBoard] }),
      fetchClientQuery("quest-board-courses", () => getCourses(token), { staleTimeMs: 300_000, tags: [queryTags.questBoard] }),
    ])
      .then(([boardData, courseData]) => {
        if (!isMounted) return;
        setBoard(boardData);
        setAllPosts(boardData.posts);
        setCourses(courseData);
        setErrorMessage(null);
        filtersReady.current = true;
      })
      .catch(error => { console.error(error); if (isMounted && !cachedBoard) setErrorMessage("掲示板を取得できませんでした。"); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, token]);

  // 絞り込みは選んだ瞬間に反映する（検索ボタンはキーワード専用）。
  useEffect(() => {
    if (!filtersReady.current || !token) return;
    let cancelled = false;
    setIsLoading(true);
    loadBoard(token)
      .then(() => { if (!cancelled) setErrorMessage(null); })
      .catch(error => { console.error(error); if (!cancelled) setErrorMessage("検索に失敗しました。"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, courseId, view]);

  const handleSearch = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await loadBoard(token);
    } catch (error) {
      console.error(error);
      setErrorMessage("検索に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const detailFilterCount = (category !== "ALL" ? 1 : 0) + (courseId !== "" ? 1 : 0);
  const hasActiveFilters = category !== "ALL" || courseId !== "" || view !== "ALL" || query.trim() !== "";
  const clearFilters = () => {
    setQuery(""); setCategory("ALL"); setCourseId(""); setView("ALL");
    if (token) void loadBoard(token, { q: "", category: "ALL", courseId: "", view: "ALL" });
  };

  const categoryCount = (value: QuestPostCategory) => allPosts.filter((p) => p.category === value).length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !errorMessage} />
      <PageTransitionOverlay
        open={showOverlay}
        title="新規投稿を開いています"
        description="投稿フォームを準備しています。"
      />
      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
        <AppBreadcrumbs items={[{ label: "掲示板" }]} />
      </Container>
      <Container maxWidth={false} sx={{ maxWidth: 1200, pt: 3, pb: 5 }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 900 }}>掲示板</Typography>
              <Typography sx={{ fontSize: 16, mt: 0.75, lineHeight: 1.7 }}>
                質問する、学びを共有する、仲間の学習を助ける場所です。
              </Typography>
            </Box>
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={() => startNavigation(() => router.push("/quest-board/new"))}
              sx={{ minHeight: 48, px: 3, fontWeight: 800, borderRadius: 2, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
            >
              投稿する
            </Button>
          </Box>

          <Stack spacing={1.75}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                placeholder="キーワードで探す"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") void handleSearch(); }}
                fullWidth
                sx={{ bgcolor: "#fff" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 96, fontWeight: 800, borderRadius: 2, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
                検索
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <FilterChip selected={view === "ALL"} onClick={() => changeView("ALL")}>すべて</FilterChip>
              <FilterChip selected={view === "WAITING"} onClick={() => changeView("WAITING")}>未解決の質問</FilterChip>
              <FilterChip selected={view === "SHARE"} onClick={() => changeView("SHARE")}>学び・作品共有</FilterChip>
              <FilterChip selected={view === "MINE"} onClick={() => changeView("MINE")}>自分の投稿</FilterChip>
            </Box>
            {filtersOpen && (
              <>
                <FilterRow label="種類">
                  <FilterChip selected={category === "ALL"} onClick={() => setCategory("ALL")}>すべて {allPosts.length}</FilterChip>
                  {(board?.options.categories ?? []).map((option) => (
                    <FilterChip
                      key={option.value}
                      selected={category === option.value}
                      onClick={() => setCategory(option.value as QuestPostCategory)}
                    >
                      {option.label} {categoryCount(option.value as QuestPostCategory)}
                    </FilterChip>
                  ))}
                </FilterRow>
                <FilterRow label="単元">
                  <FilterChip selected={courseId === ""} onClick={() => setCourseId("")}>すべて</FilterChip>
                  {courses.map((course) => (
                    <FilterChip key={course.id} selected={courseId === course.id} onClick={() => setCourseId(course.id)}>
                      {course.title}
                    </FilterChip>
                  ))}
                </FilterRow>
              </>
            )}
          </Stack>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>
              {isLoading ? "読み込み中" : `${sortedPosts.length}件の投稿 ・ ${view === "WAITING" ? "回答がまだ無い順" : "新着順"}`}
            </Typography>
            <Box sx={{ flex: 1 }} />
            {hasActiveFilters && (
              <Button onClick={clearFilters} sx={{ fontWeight: 700, color: "#2563eb" }}>条件をクリア</Button>
            )}
            <Button
              variant="outlined"
              startIcon={<TuneRoundedIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{ minHeight: 40, fontWeight: 800, borderRadius: 999, color: "#111827", borderColor: "#cbd5e1", "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" } }}
            >
              絞り込み{detailFilterCount > 0 ? `（${detailFilterCount}）` : ""}
            </Button>
          </Box>

          <Stack spacing={2}>
            {isLoading ? (
              [0, 1, 2].map((index) => (
                <Skeleton key={index} variant="rounded" height={168} sx={{ borderRadius: 3 }} />
              ))
            ) : sortedPosts.length ? (
              sortedPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px solid #e2e8f0", textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <RobotFigure alt="マスコット" size="L" grounding="frame" presentation="circle" motion="none" />
                </Box>
                <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 2 }}>投稿がありません</Typography>
                <Typography sx={{ fontSize: 16, mt: 1 }}>
                  {hasActiveFilters ? "条件に合う投稿がありません。条件を変えてみてください。" : "最初の投稿を作成してみましょう。"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 2.5, flexWrap: "wrap" }}>
                  {hasActiveFilters && (
                    <Button variant="outlined" onClick={clearFilters} sx={{ minHeight: 44, fontWeight: 800, borderRadius: 2 }}>条件をクリア</Button>
                  )}
                  <Button component={Link} href="/quest-board/new" variant="contained" startIcon={<AddIcon />} sx={{ minHeight: 44, fontWeight: 800, borderRadius: 2, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
                    投稿する
                  </Button>
                </Box>
              </Paper>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

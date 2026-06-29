"use client";

import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ForumIcon from "@mui/icons-material/Forum";
import SearchIcon from "@mui/icons-material/Search";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getCourses } from "@/api/courses.api";
import {
  getQuestBoardPosts,
  type QuestBoardListResponse,
  type QuestPostCategory,
  type QuestPostStatus,
  type QuestPostSummary,
} from "@/api/questBoard.api";
import { AppHeader } from "@/app/component/appHeader";
import type { Course } from "@/app/courses/type";
import { auth } from "@/lib/firebase";

const categoryColor: Record<QuestPostCategory, "primary" | "secondary" | "success" | "warning" | "info" | "default"> = {
  QUESTION: "primary",
  ERROR_HELP: "warning",
  WORK_SHARE: "success",
  CODE_SHARE: "secondary",
  MEMO: "info",
  REFERENCE: "default",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const PostCard = ({ post }: { post: QuestPostSummary }) => {
  const isResolvable = post.category === "QUESTION" || post.category === "ERROR_HELP";

  return (
    <Paper
      component={Link}
      href={`/quest-board/${encodeURIComponent(post.id)}`}
      elevation={0}
      sx={{
        display: "block",
        p: 2.5,
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        color: "inherit",
        textDecoration: "none",
        transition: "border-color 120ms ease, transform 120ms ease",
        "&:hover": {
          borderColor: "#60a5fa",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            label={post.categoryLabel}
            color={categoryColor[post.category]}
            size="small"
            sx={{ fontWeight: 900 }}
          />
          {isResolvable && (
            <Chip
              icon={post.status === "RESOLVED" ? <CheckCircleIcon /> : undefined}
              label={post.status === "RESOLVED" ? "解決済み" : "未解決"}
              color={post.status === "RESOLVED" ? "success" : "default"}
              size="small"
              sx={{ fontWeight: 900 }}
            />
          )}
          {post.courseTitle && <Chip label={post.courseTitle} size="small" variant="outlined" />}
          {post.missionTitle && <Chip label={post.missionTitle} size="small" variant="outlined" />}
        </Stack>

        <Box>
          <Typography variant="h6" fontWeight={900}>
            {post.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
            {post.excerpt}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" color="text.secondary" flexWrap="wrap">
          <Typography variant="body2">{post.authorName}</Typography>
          <Typography variant="body2">{formatDate(post.createdAt)}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="body2">{post.commentCount}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ThumbUpAltOutlinedIcon fontSize="small" />
            <Typography variant="body2">{post.reactions.total}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default function QuestBoardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [board, setBoard] = useState<QuestBoardListResponse | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<QuestPostCategory | "ALL">("ALL");
  const [status, setStatus] = useState<QuestPostStatus | "ALL">("ALL");
  const [courseId, setCourseId] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId]
  );

  const loadBoard = async (idToken: string) => {
    const data = await getQuestBoardPosts(idToken, {
      q: query.trim() || undefined,
      category,
      status,
      courseId: courseId || undefined,
      mine: mineOnly,
    });
    setBoard(data);
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setToken(null);
        setBoard(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const idToken = await user.getIdToken();
        const [boardData, courseData] = await Promise.all([
          getQuestBoardPosts(idToken),
          getCourses(idToken),
        ]);

        if (!isMounted) return;
        setToken(idToken);
        setBoard(boardData);
        setCourses(courseData);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("Quest Board を取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                  }}
                >
                  <ForumIcon />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900}>
                    Quest Board
                  </Typography>
                  <Typography color="text.secondary">
                    質問、エラー相談、作品共有、メモをカテゴリ別に投稿できます。
                  </Typography>
                </Box>
              </Stack>
              <Button
                component={Link}
                href="/quest-board/new"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ minHeight: 44, fontWeight: 900, borderRadius: 2 }}
              >
                投稿する
              </Button>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Stack spacing={2}>
              <TextField
                label="キーワード検索"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <ToggleButtonGroup
                  exclusive
                  value={category}
                  onChange={(_, value) => value && setCategory(value)}
                  size="small"
                  sx={{ flexWrap: "wrap" }}
                >
                  <ToggleButton value="ALL">すべて</ToggleButton>
                  {(board?.options.categories ?? []).map((option) => (
                    <ToggleButton key={option.value} value={option.value}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Course</InputLabel>
                  <Select
                    label="Course"
                    value={courseId}
                    onChange={(event) => setCourseId(event.target.value)}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>状態</InputLabel>
                  <Select
                    label="状態"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as QuestPostStatus | "ALL")}
                  >
                    <MenuItem value="ALL">すべて</MenuItem>
                    <MenuItem value="OPEN">未解決</MenuItem>
                    <MenuItem value="RESOLVED">解決済み</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel>表示</InputLabel>
                  <Select
                    label="表示"
                    value={mineOnly ? "mine" : "all"}
                    onChange={(event) => setMineOnly(event.target.value === "mine")}
                  >
                    <MenuItem value="all">全員の投稿</MenuItem>
                    <MenuItem value="mine">自分の投稿</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleSearch} sx={{ minHeight: 54, fontWeight: 900 }}>
                  検索
                </Button>
              </Stack>
              {selectedCourse && (
                <Typography variant="body2" color="text.secondary">
                  Course 絞り込み: {selectedCourse.title}
                </Typography>
              )}
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Stack spacing={2}>
            {isLoading ? (
              [0, 1, 2].map((index) => (
                <Skeleton key={index} variant="rounded" height={168} sx={{ borderRadius: 2 }} />
              ))
            ) : board?.posts.length ? (
              board.posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Typography fontWeight={900}>投稿がありません。</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  条件を変えるか、最初の投稿を作成してください。
                </Typography>
              </Paper>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

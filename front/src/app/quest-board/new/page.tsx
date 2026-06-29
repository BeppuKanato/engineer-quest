"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCourses } from "@/api/courses.api";
import {
  createQuestPost,
  getQuestBoardPosts,
  type QuestBoardOption,
  type QuestPostCategory,
} from "@/api/questBoard.api";
import { AppHeader } from "@/app/component/appHeader";
import type { Course } from "@/app/courses/type";
import { auth } from "@/lib/firebase";

const defaultCategories: QuestBoardOption[] = [
  { value: "QUESTION", label: "質問" },
  { value: "ERROR_HELP", label: "エラー相談" },
  { value: "WORK_SHARE", label: "作品共有" },
  { value: "CODE_SHARE", label: "コード共有" },
  { value: "MEMO", label: "メモ" },
  { value: "REFERENCE", label: "参考リンク" },
];

export default function NewQuestPostPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<QuestBoardOption[]>(defaultCategories);
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState<QuestPostCategory>("QUESTION");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [missionId, setMissionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId]
  );

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setErrorMessage("ログインが必要です。");
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const [boardData, courseData] = await Promise.all([
          getQuestBoardPosts(idToken),
          getCourses(idToken),
        ]);

        if (!isMounted) return;
        setToken(idToken);
        setCategories(boardData.options.categories);
        setCourses(courseData);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("投稿フォームの準備に失敗しました。");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await createQuestPost(token, {
        category,
        title,
        body,
        code: code.trim() || undefined,
        referenceUrl: referenceUrl.trim() || undefined,
        courseId: courseId || undefined,
        missionId: missionId || undefined,
      });

      router.push(`/quest-board/${encodeURIComponent(result.postId)}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("投稿を保存できませんでした。入力内容を確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 960, py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight={900}>
                新しい投稿
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                質問、エラー相談、作品共有、学習メモを Quest Board に投稿します。
              </Typography>
            </Box>
            <Button component={Link} href="/quest-board" startIcon={<ArrowBackIcon />}>
              戻る
            </Button>
          </Stack>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Stack spacing={2.5}>
              <FormControl fullWidth>
                <InputLabel>カテゴリ</InputLabel>
                <Select
                  label="カテゴリ"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as QuestPostCategory)}
                >
                  {categories.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="タイトル"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                fullWidth
              />

              <TextField
                label="本文"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                fullWidth
                multiline
                minRows={7}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>関連 Course</InputLabel>
                  <Select
                    label="関連 Course"
                    value={courseId}
                    onChange={(event) => {
                      setCourseId(event.target.value);
                      setMissionId("");
                    }}
                  >
                    <MenuItem value="">なし</MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={!selectedCourse}>
                  <InputLabel>関連 Mission</InputLabel>
                  <Select
                    label="関連 Mission"
                    value={missionId}
                    onChange={(event) => setMissionId(event.target.value)}
                  >
                    <MenuItem value="">なし</MenuItem>
                    {(selectedCourse?.missions ?? []).map((mission) => (
                      <MenuItem key={mission.id} value={mission.id}>
                        {mission.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="コード"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                fullWidth
                multiline
                minRows={8}
                placeholder="HTML / CSS / JavaScript / Python などを貼り付け"
                InputProps={{
                  sx: { fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace" },
                }}
              />

              <TextField
                label="参考 URL"
                value={referenceUrl}
                onChange={(event) => setReferenceUrl(event.target.value)}
                fullWidth
                placeholder="https://..."
              />

              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                disabled={!canSubmit || !token}
                onClick={handleSubmit}
                sx={{ minHeight: 48, fontWeight: 900, borderRadius: 2 }}
              >
                {isSubmitting ? "投稿中..." : "投稿する"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

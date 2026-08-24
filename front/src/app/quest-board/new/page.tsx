"use client";

import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCourses } from "@/api/courses.api";
import {
  createQuestPost,
  getQuestBoardPosts,
  type QuestBoardOption,
  type QuestPostCategory,
} from "@/api/questBoard.api";
import { ActionButton } from "@/app/component/actionButton";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { AppSnackbar } from "@/app/component/appSnackbar";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
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

const titleMinLength = 5;
const titleMaxLength = 100;
const bodyMinLength = 10;
const bodyMaxLength = 5000;
const getLengthError = (
  value: string,
  min: number,
  max: number,
  label: string
) => {
  const length = value.trim().length;
  if (length === 0) return `${label}を入力してください`;
  if (length < min) return `${label}は${min}文字以上で入力してください`;
  if (length > max) return `${label}は${max}文字以内で入力してください`;
  return "";
};

export default function NewQuestPostPage() {
  const router = useRouter();
  const { play } = useSoundEffect();

  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] =
    useState<QuestBoardOption[]>(defaultCategories);
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState<QuestPostCategory>("QUESTION");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [missionId, setMissionId] = useState("");
  const [workId, setWorkId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigatingAfterSubmit, setIsNavigatingAfterSubmit] =
    useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId]
  );

  const titleError = getLengthError(
    title,
    titleMinLength,
    titleMaxLength,
    "タイトル"
  );
  const bodyError = getLengthError(body, bodyMinLength, bodyMaxLength, "本文");
  const canSubmit =
    !titleError &&
    !bodyError &&
    !isSubmitting &&
    Boolean(token) &&
    Boolean(category);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const nextCategory = searchParams.get("category") as QuestPostCategory | null;
    const nextTitle = searchParams.get("title") ?? "";
    const nextBody = searchParams.get("body") ?? "";
    const nextReferenceUrl = searchParams.get("referenceUrl") ?? "";
    const nextCourseId = searchParams.get("courseId") ?? "";
    const nextMissionId = searchParams.get("missionId") ?? "";
    const nextWorkId = searchParams.get("workId") ?? "";

    if (
      nextCategory &&
      defaultCategories.some((item) => item.value === nextCategory)
    ) {
      setCategory(nextCategory);
    }
    if (nextTitle) setTitle(nextTitle);
    if (nextBody) setBody(nextBody);
    if (nextReferenceUrl) setReferenceUrl(nextReferenceUrl);
    if (nextCourseId) setCourseId(nextCourseId);
    if (nextMissionId) setMissionId(nextMissionId);
    if (nextWorkId) setWorkId(nextWorkId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setErrorMessage("ログインが必要です。");
        setIsOptionsLoading(false);
        return;
      }

      try {
        setIsOptionsLoading(true);
        setOptionsError(null);
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
        setOptionsError("カテゴリや関連コースを取得できませんでした。");
        setErrorMessage("投稿フォームの準備に失敗しました。");
      } finally {
        if (!isMounted) return;
        setIsOptionsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (!token || !canSubmit) {
      setErrorMessage(titleError || bodyError || "投稿内容を確認してください");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await createQuestPost(token, {
        category,
        title: title.trim(),
        body: body.trim(),
        code: code.trim() || undefined,
        referenceUrl: referenceUrl.trim() || undefined,
        courseId: courseId || undefined,
        missionId: missionId || undefined,
        workId: workId || undefined,
      });

      play("saveSuccess");
      setSuccessSnackbarOpen(true);
      setIsNavigatingAfterSubmit(true);
      router.push(`/quest-board/${encodeURIComponent(result.postId)}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "投稿を保存できませんでした。入力内容を確認してください。"
      );
      setIsSubmitting(false);
      setIsNavigatingAfterSubmit(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <PageTransitionOverlay
        open={isNavigatingAfterSubmit}
        title="投稿詳細へ移動しています"
        description="投稿の保存が完了しました。詳細画面を開いています。"
      />

      <Container maxWidth={false} sx={{ maxWidth: 960, py: 4 }}>
        <Stack spacing={3}>
          <AppBreadcrumbs
            items={[
              { label: "掲示板", href: "/quest-board" },
              { label: "新規投稿" },
            ]}
          />
          <Box>
            <Typography variant="h4" fontWeight={900}>
              新しい投稿
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              質問、エラー相談、作品共有、学習メモを掲示板に投稿します。
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}
          >
            <Stack spacing={2.5}>
              <FormControl fullWidth>
                <InputLabel>カテゴリ</InputLabel>
                <Select
                  label="カテゴリ"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as QuestPostCategory)
                  }
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
                error={Boolean(titleError && title.length > 0)}
                helperText={
                  title.length > 0
                    ? titleError || `${title.trim().length} / ${titleMaxLength}文字`
                    : `必須・${titleMinLength}〜${titleMaxLength}文字`
                }
                inputProps={{ maxLength: titleMaxLength + 20 }}
                required
                fullWidth
              />

              <TextField
                label="本文"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                error={Boolean(bodyError && body.length > 0)}
                helperText={
                  body.length > 0
                    ? bodyError || `${body.trim().length} / ${bodyMaxLength}文字`
                    : `必須・${bodyMinLength}〜${bodyMaxLength}文字`
                }
                inputProps={{ maxLength: bodyMaxLength + 100 }}
                required
                fullWidth
                multiline
                minRows={7}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>関連コース</InputLabel>
                  <Select
                    label="関連コース"
                    value={courseId}
                    disabled={isOptionsLoading || courses.length === 0}
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
                  <FormHelperText>
                    {isOptionsLoading
                      ? "コースを取得しています。"
                      : optionsError
                        ? "コースを取得できませんでした。"
                        : courses.length === 0
                          ? "選択できるコースがありません。"
                          : "任意で関連コースを選択できます。"}
                  </FormHelperText>
                </FormControl>

                <FormControl
                  fullWidth
                  disabled={
                    !selectedCourse || (selectedCourse?.missions ?? []).length === 0
                  }
                >
                  <InputLabel>関連ミッション</InputLabel>
                  <Select
                    label="関連ミッション"
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
                  <FormHelperText>
                    {!selectedCourse
                      ? "コースを選ぶとミッションを選択できます。"
                      : selectedCourse.missions.length === 0
                        ? "このコースには選択できるミッションがありません。"
                        : "選択したコースのミッションだけを表示しています。"}
                  </FormHelperText>
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
                  sx: {
                    bgcolor: "#f8fafc",
                    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                    "& textarea": {
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Consolas, monospace",
                      lineHeight: 1.7,
                    },
                  },
                }}
              />

              <TextField
                label="参考URL"
                value={referenceUrl}
                onChange={(event) => setReferenceUrl(event.target.value)}
                fullWidth
                placeholder="https://..."
              />

              <ActionButton
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                loading={isSubmitting}
                loadingLabel="投稿中..."
                disabled={!canSubmit}
                onClick={handleSubmit}
                sx={{ minHeight: 48, fontWeight: 900, borderRadius: 2 }}
              >
                {titleError || bodyError ? "入力内容を確認してください" : "投稿する"}
              </ActionButton>
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <AppSnackbar
        open={successSnackbarOpen}
        severity="success"
        message="投稿を保存しました。"
        onClose={() => setSuccessSnackbarOpen(false)}
      />
    </Box>
  );
}

"use client";

import { FeedbackDestination } from "@/app/component/feedbackV1";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCourses } from "@/api/courses.api";
import {
  createQuestPost,
  getQuestBoardPosts,
  type QuestBoardListResponse,
  type QuestBoardOption,
  type QuestPostCategory,
} from "@/api/questBoard.api";
import { categoryIcons } from "../_components/BoardChips";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { ActionButton } from "@/app/component/actionButton";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { AppSnackbar } from "@/app/component/appSnackbar";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import type { Course } from "@/app/courses/type";
import { fetchClientQuery, peekClientQueryData, queryTags } from "@/lib/clientQueryCache";
import { useUserSession } from "@/app/component/userSession";

const defaultCategories: QuestBoardOption[] = [
  { value: "QUESTION", label: "質問" },
  { value: "ERROR_HELP", label: "エラー相談" },
  { value: "WORK_SHARE", label: "作品共有" },
  { value: "CODE_SHARE", label: "コード共有" },
  { value: "MEMO", label: "メモ" },
  { value: "REFERENCE", label: "参考リンク" },
];

/** 種類タイルの説明。初見でも迷わず選べるよう、面に出す。 */
const categoryDescriptions: Record<string, string> = {
  QUESTION: "分からないことを聞く",
  ERROR_HELP: "エラーや動かないコードの相談",
  WORK_SHARE: "作ったものを見せる",
  CODE_SHARE: "書いたコードを共有する",
  MEMO: "学んだことをメモに残す",
  REFERENCE: "役立った資料を知らせる",
};

/** 種類ごとの本文の入力例。ガイドは補助で、埋めることを強制しない。 */
const bodyPlaceholders: Record<string, string> = {
  QUESTION: "例：キューから取り出すタイミングが分からない",
  ERROR_HELP: "例：真ん中より大きいのに右半分を探してしまいます",
  WORK_SHARE: "例：発展ミッションで767点が取れました",
  CODE_SHARE: "例：幅優先探索を deque で書いてみました",
  MEMO: "例：大きい硬貨から使うと枚数が少なくなる理由",
  REFERENCE: "例：二分探索の図解が分かりやすい記事",
};

/** 種類ごとに本文の書き方を変える（回答がつきやすくなる書き方を面に出す）。 */
const bodyHints: Record<string, string> = {
  QUESTION: "何をしていて、どこで分からなくなったかを書くと、回答がつきやすくなります。",
  ERROR_HELP: "何をしたときに、どんなエラーが出たかを書いてください。下のコード欄に、エラーが出たコードを貼れます。",
  WORK_SHARE: "何を作ったか、工夫したところを書いてください。",
  CODE_SHARE: "コードの説明と、見てほしいところを書いてください。コードは下のコード欄に貼れます。",
  MEMO: "あとで読み返して分かるように、学んだことを自分の言葉で書きましょう。",
  REFERENCE: "どんな資料か、どこが役立ったかを書いてください。URLは下の欄に入れます。",
};

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1 }}>{children}</Typography>;
}

export default function NewQuestPostPage() {
  const router = useRouter();
  const { play } = useSoundEffect();

  const { status, token } = useUserSession();
  const [cachedBoard] = useState(() => peekClientQueryData<QuestBoardListResponse>("quest-board"));
  const [cachedBoardCourses] = useState(() => peekClientQueryData<Course[]>("quest-board-courses"));
  const [categories, setCategories] =
    useState<QuestBoardOption[]>(cachedBoard?.options.categories ?? defaultCategories);
  const [courses, setCourses] = useState<Course[]>(cachedBoardCourses ?? []);
  const [category, setCategory] = useState<QuestPostCategory>("QUESTION");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigatingAfterSubmit, setIsNavigatingAfterSubmit] =
    useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(!cachedBoard);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  // 入力欄は種類で出し分ける：エラー相談・コード共有はコード欄を最初から開き、
  // 参考リンクはURL欄を最初から開く。それ以外は「追加」ボタンで開く（任意欄が
  // 最初から大きな面積を占めて、投稿の負担に見えないようにする）。
  useEffect(() => {
    setCodeOpen(category === "ERROR_HELP" || category === "CODE_SHARE");
    setUrlOpen(category === "REFERENCE");
  }, [category]);

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
    const nextCode = searchParams.get("code") ?? "";
    const nextReferenceUrl = searchParams.get("referenceUrl") ?? "";
    const nextCourseId = searchParams.get("courseId") ?? "";

    if (
      nextCategory &&
      defaultCategories.some((item) => item.value === nextCategory)
    ) {
      setCategory(nextCategory);
    }
    if (nextTitle) setTitle(nextTitle);
    if (nextBody) setBody(nextBody);
    if (nextCode) { setCode(nextCode); setCodeOpen(true); }
    if (nextReferenceUrl) { setReferenceUrl(nextReferenceUrl); setUrlOpen(true); }
    if (nextCourseId) setCourseId(nextCourseId);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) {
      if (!cachedBoard) { setErrorMessage("ログインが必要です。"); setIsOptionsLoading(false); }
      return;
    }
    let isMounted = true;
    Promise.all([
      fetchClientQuery("quest-board", () => getQuestBoardPosts(token), { staleTimeMs: 300_000, tags: [queryTags.questBoard] }),
      fetchClientQuery("quest-board-courses", () => getCourses(token), { staleTimeMs: 300_000, tags: [queryTags.questBoard] }),
    ])
      .then(([boardData, courseData]) => {
        if (!isMounted) return;
        setCategories(boardData.options.categories);
        setCourses(courseData);
        setOptionsError(null);
      })
      .catch(error => {
        console.error(error);
        if (isMounted && !cachedBoard) {
          setOptionsError("カテゴリや関連コースを取得できませんでした。");
          setErrorMessage("投稿フォームの準備に失敗しました。");
        }
      })
      .finally(() => { if (isMounted) setIsOptionsLoading(false); });
    return () => { isMounted = false; };
  }, [status, token, cachedBoard]);

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

  const submitBlockReason = !canSubmit && !isSubmitting
    ? (title.trim().length > 0 && titleError ? titleError
      : body.trim().length > 0 && bodyError ? bodyError
      : `タイトル（${titleMinLength}文字以上）と本文（${bodyMinLength}文字以上）を入力すると投稿できます。`)
    : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader /><FeedbackDestination failed={!!optionsError} ready={!isOptionsLoading && !optionsError} />
      <PageTransitionOverlay
        open={isNavigatingAfterSubmit}
        title="投稿詳細へ移動しています"
        description="投稿の保存が完了しました。詳細画面を開いています。"
      />

      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
          <AppBreadcrumbs
            items={[
              { label: "掲示板", href: "/quest-board" },
              { label: "新規投稿" },
            ]}
          />
        </Container>
      <Container maxWidth={false} sx={{ maxWidth: 960, pt: 3, pb: 5 }}>
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 900 }}>
              新しい投稿
            </Typography>
            <Typography sx={{ fontSize: 16, mt: 1, lineHeight: 1.7 }}>
              小さな疑問や発見でも、気軽に共有しましょう。
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff" }}
          >
            <Stack spacing={3}>
              <Box>
                <SectionLabel>種類</SectionLabel>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
                  {categories.map((option) => {
                    const value = option.value as QuestPostCategory;
                    const Icon = categoryIcons[value];
                    const selected = category === value;
                    return (
                      <Box
                        key={option.value}
                        component="button"
                        type="button"
                        onClick={() => setCategory(value)}
                        aria-pressed={selected}
                        sx={{
                          position: "relative", textAlign: "left", cursor: "pointer",
                          p: 2, borderRadius: 2.5, bgcolor: selected ? "#eff6ff" : "#fff",
                          border: selected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          color: "#111827", font: "inherit",
                          "&:hover": { borderColor: "#2563eb" },
                        }}
                      >
                        {selected && (
                          <CheckCircleRoundedIcon sx={{ position: "absolute", top: 8, right: 8, fontSize: 20, color: "#2563eb" }} />
                        )}
                        {Icon && <Icon sx={{ fontSize: 26, color: "#2563eb" }} />}
                        <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.75 }}>{option.label}</Typography>
                        <Typography sx={{ fontSize: 14, mt: 0.25, lineHeight: 1.6 }}>
                          {categoryDescriptions[option.value] ?? ""}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

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

              <Box>
                <Typography sx={{ fontSize: 14, lineHeight: 1.7, mb: 1 }}>
                  {bodyHints[category]}
                </Typography>
                <TextField
                  label="本文"
                  value={body}
                  placeholder={bodyPlaceholders[category]}
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
              </Box>

              <Box>
                <SectionLabel>関連（任意）</SectionLabel>
                <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 0.75 }}>単元</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    onClick={() => setCourseId("")}
                    sx={{
                      minHeight: 38, px: 2, borderRadius: 999, fontSize: 14, fontWeight: 700,
                      bgcolor: courseId === "" ? "#2563eb" : "#fff",
                      color: courseId === "" ? "#fff" : "#111827",
                      border: `1px solid ${courseId === "" ? "#2563eb" : "#cbd5e1"}`,
                      "&:hover": { bgcolor: courseId === "" ? "#1d4ed8" : "#f1f5f9" },
                    }}
                  >
                    なし
                  </Button>
                  {courses.map((course) => (
                    <Button
                      key={course.id}
                      onClick={() => setCourseId(course.id)}
                      sx={{
                        minHeight: 38, px: 2, borderRadius: 999, fontSize: 14, fontWeight: 700,
                        bgcolor: courseId === course.id ? "#2563eb" : "#fff",
                        color: courseId === course.id ? "#fff" : "#111827",
                        border: `1px solid ${courseId === course.id ? "#2563eb" : "#cbd5e1"}`,
                        "&:hover": { bgcolor: courseId === course.id ? "#1d4ed8" : "#f1f5f9" },
                      }}
                    >
                      {course.title}
                    </Button>
                  ))}
                </Box>
                {(isOptionsLoading || optionsError) && (
                  <Typography sx={{ fontSize: 14, mt: 1 }}>
                    {isOptionsLoading ? "単元を取得しています。" : "単元を取得できませんでした。"}
                  </Typography>
                )}
              </Box>

              {codeOpen ? (
                <TextField
                  label="コード（任意）"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  fullWidth
                  multiline
                  minRows={8}
                  placeholder="Pythonなどのプログラムを貼り付け"
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
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<CodeRoundedIcon />}
                  endIcon={<AddRoundedIcon />}
                  onClick={() => setCodeOpen(true)}
                  sx={{
                    minHeight: 48, justifyContent: "flex-start", px: 2, borderRadius: 2,
                    borderStyle: "dashed", borderColor: "#94a3b8", color: "#111827", fontWeight: 700,
                    "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
                  }}
                >
                  コードを追加
                </Button>
              )}

              {urlOpen ? (
                <TextField
                  label="参考URL（任意）"
                  value={referenceUrl}
                  onChange={(event) => setReferenceUrl(event.target.value)}
                  fullWidth
                  placeholder="https://..."
                />
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<LinkRoundedIcon />}
                  endIcon={<AddRoundedIcon />}
                  onClick={() => setUrlOpen(true)}
                  sx={{
                    minHeight: 48, justifyContent: "flex-start", px: 2, borderRadius: 2,
                    borderStyle: "dashed", borderColor: "#94a3b8", color: "#111827", fontWeight: 700,
                    "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
                  }}
                >
                  URLを追加
                </Button>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <ActionButton
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  loading={isSubmitting}
                  loadingLabel="投稿中..."
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  sx={{ minHeight: 48, px: 4, fontWeight: 900, borderRadius: 2, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                >
                  {`${categories.find((option) => option.value === category)?.label ?? "投稿"}を投稿する`}
                </ActionButton>
                {submitBlockReason && (
                  <Typography sx={{ fontSize: 14 }}>{submitBlockReason}</Typography>
                )}
              </Box>
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

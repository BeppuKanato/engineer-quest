"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Link as MuiLink,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  addQuestComment,
  deleteQuestPost,
  getQuestPost,
  toggleQuestReaction,
  updateQuestPost,
  updateQuestPostStatus,
  type QuestBoardOptions,
  type QuestPostDetail,
  type QuestPostCategory,
  type QuestPostStatus,
  type QuestReactionType,
} from "@/api/questBoard.api";
import { ActionButton } from "@/app/component/actionButton";
import { AppHeader } from "@/app/component/appHeader";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { BlockingProcessOverlay } from "@/app/component/blockingProcessOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { auth } from "@/lib/firebase";

const reactionMeta: Record<QuestReactionType, { label: string; icon: ReactNode }> = {
  LIKE: { label: "いいね", icon: <FavoriteBorderIcon /> },
  HELPFUL: { label: "参考になった", icon: <LightbulbOutlinedIcon /> },
  SAVED_ME: { label: "助かった", icon: <HelpOutlineIcon /> },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const isResolvableCategory = (post: QuestPostDetail) =>
  post.category === "QUESTION" || post.category === "ERROR_HELP";

const titleMinLength = 5;
const titleMaxLength = 100;
const bodyMinLength = 10;
const bodyMaxLength = 5000;

const getLengthError = (value: string, min: number, max: number, label: string) => {
  const length = value.trim().length;
  if (length === 0) return `${label}を入力してください`;
  if (length < min) return `${label}は${min}文字以上で入力してください`;
  if (length > max) return `${label}は${max}文字以内で入力してください`;
  return "";
};

export default function QuestPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const { play } = useSoundEffect();
  const postId = params.postId;
  const [token, setToken] = useState<string | null>(null);
  const [post, setPost] = useState<QuestPostDetail | null>(null);
  const [options, setOptions] = useState<QuestBoardOptions | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<QuestPostCategory>("QUESTION");
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editReferenceUrl, setEditReferenceUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const idToken = await user.getIdToken();
        const data = await getQuestPost(idToken, postId);

        if (!isMounted) return;
        setToken(idToken);
        setPost(data.post);
        setOptions(data.options);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("投稿を取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [postId]);

  const handleReaction = async (type: QuestReactionType) => {
    if (!token || !post) return;
    const wasReacted = post.reactions.userReactedTypes.includes(type);

    try {
      const result = await toggleQuestReaction(token, post.id, type);
      setPost({ ...post, reactions: result.reactions });
      if (!wasReacted) {
        play("likePop");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("リアクションを更新できませんでした。");
    }
  };

  const openEditDialog = () => {
    if (!post) return;
    setEditCategory(post.category);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditCode(post.code ?? "");
    setEditReferenceUrl(post.referenceUrl ?? "");
    setEditOpen(true);
  };

  const editTitleError = getLengthError(editTitle, titleMinLength, titleMaxLength, "タイトル");
  const editBodyError = getLengthError(editBody, bodyMinLength, bodyMaxLength, "本文");
  const canSaveEdit = Boolean(post && token) && !editTitleError && !editBodyError && !isEditing;

  const handleSaveEdit = async () => {
    if (!token || !post || !canSaveEdit) return;

    try {
      setIsEditing(true);
      setErrorMessage(null);
      const result = await updateQuestPost(token, post.id, {
        category: editCategory,
        title: editTitle,
        body: editBody,
        code: editCode.trim() || undefined,
        referenceUrl: editReferenceUrl.trim() || undefined,
        courseId: post.courseId ?? undefined,
        missionId: post.missionId ?? undefined,
      });
      setPost(result.post);
      setOptions(result.options);
      setEditOpen(false);
      play("saveSuccess");
    } catch (error) {
      console.error(error);
      setErrorMessage("投稿を更新できませんでした。入力内容を確認してください。");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !post || isDeleting) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await deleteQuestPost(token, post.id);
      router.push("/quest-board");
    } catch (error) {
      console.error(error);
      setErrorMessage("投稿を削除できませんでした。もう一度試してください。");
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleStatusChange = async (status: QuestPostStatus) => {
    if (!token || !post) return;

    try {
      const result = await updateQuestPostStatus(token, post.id, status);
      setPost({ ...post, status: result.status, updatedAt: result.updatedAt });
    } catch (error) {
      console.error(error);
      setErrorMessage("ステータスを更新できませんでした。");
    }
  };

  const handleAddComment = async () => {
    if (!token || !post) return;
    if (commentBody.trim().length < 2) {
      setErrorMessage("コメントは2文字以上で入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await addQuestComment(token, post.id, commentBody);
      setPost({
        ...post,
        comments: [...post.comments, result.comment],
        commentCount: post.commentCount + 1,
      });
      setCommentBody("");
      play("saveSuccess");
    } catch (error) {
      console.error(error);
      setErrorMessage("コメントを投稿できませんでした。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 960, py: 4 }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[{ label: "掲示板", href: "/quest-board" }, { label: post?.title ?? "投稿詳細" }]} />

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading || !post ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : (
            <>
              {post.isOwner && !post.isDeleted && (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={openEditDialog}
                    sx={{ fontWeight: 900, borderRadius: 2 }}
                  >
                    編集
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteOpen(true)}
                    sx={{ fontWeight: 900, borderRadius: 2 }}
                  >
                    削除
                  </Button>
                </Stack>
              )}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                    <Chip label={post.categoryLabel} color="primary" sx={{ fontWeight: 900 }} />
                    {isResolvableCategory(post) && (
                      <Chip
                        icon={post.status === "RESOLVED" ? <CheckCircleIcon /> : undefined}
                        label={post.status === "RESOLVED" ? "解決済み" : "未解決"}
                        color={post.status === "RESOLVED" ? "success" : "default"}
                        sx={{ fontWeight: 900 }}
                      />
                    )}
                    {post.courseTitle && <Chip label={post.courseTitle} variant="outlined" />}
                    {post.missionTitle && <Chip label={post.missionTitle} variant="outlined" />}
                  </Stack>

                  <Box>
                    <Typography variant="h4" fontWeight={900}>
                      {post.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {post.authorName} / {formatDate(post.createdAt)}
                    </Typography>
                  </Box>

                  <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{post.body}</Typography>

                  {post.code && (
                    <Box
                      component="pre"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#0f172a",
                        color: "#e2e8f0",
                        overflowX: "auto",
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      <code>{post.code}</code>
                    </Box>
                  )}

                  {post.referenceUrl && (
                    <Typography>
                      {post.category === "WORK_SHARE" && post.referenceUrl.startsWith("/my-works/")
                        ? "元の制作記録"
                        : "参考 URL"}
                      :{" "}
                      <MuiLink
                        href={post.referenceUrl}
                        target={post.referenceUrl.startsWith("/") ? undefined : "_blank"}
                        rel={post.referenceUrl.startsWith("/") ? undefined : "noreferrer"}
                      >
                        {post.referenceUrl}
                      </MuiLink>
                    </Typography>
                  )}

                  <Divider />

                  {!post.isDeleted && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                    {(Object.keys(reactionMeta) as QuestReactionType[]).map((type) => {
                      const reacted = post.reactions.userReactedTypes.includes(type);
                      return (
                        <Button
                          key={type}
                          variant={reacted ? "contained" : "outlined"}
                          startIcon={reactionMeta[type].icon}
                          onClick={() => handleReaction(type)}
                          sx={{ fontWeight: 900, borderRadius: 2 }}
                        >
                          {reactionMeta[type].label} {post.reactions.byType[type] ?? 0}
                        </Button>
                      );
                    })}
                  </Stack>
                  )}

                  {!post.isDeleted && post.canResolve && isResolvableCategory(post) && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button
                        variant={post.status === "RESOLVED" ? "contained" : "outlined"}
                        color="success"
                        onClick={() => handleStatusChange("RESOLVED")}
                        disabled={post.status === "RESOLVED"}
                      >
                        解決済みにする
                      </Button>
                      <Button
                        variant={post.status === "OPEN" ? "contained" : "outlined"}
                        onClick={() => handleStatusChange("OPEN")}
                        disabled={post.status === "OPEN"}
                      >
                        未解決に戻す
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ChatBubbleOutlineIcon color="primary" />
                    <Typography variant="h5" fontWeight={900}>
                      コメント
                    </Typography>
                    <Chip label={post.commentCount} size="small" />
                  </Stack>

                  {post.comments.length === 0 ? (
                    <Typography color="text.secondary">まだコメントはありません。</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {post.comments.map((comment) => (
                        <Paper
                          key={comment.id}
                          elevation={0}
                          sx={{ p: 2, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff" }}
                        >
                          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                            {comment.body}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {comment.authorName} / {formatDate(comment.createdAt)}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  <Divider />

                  {post.isDeleted ? (
                    <Alert severity="info">削除済み投稿のため、新しいコメントはできません。</Alert>
                  ) : (
                    <>
                      <TextField
                        label="コメントを書く"
                        value={commentBody}
                        onChange={(event) => setCommentBody(event.target.value)}
                        error={commentBody.trim().length > 0 && commentBody.trim().length < 2}
                        helperText={
                          commentBody.trim().length > 0
                            ? `${commentBody.trim().length}文字`
                            : "2文字以上で入力してください"
                        }
                        multiline
                        minRows={4}
                        fullWidth
                      />
                      <ActionButton
                        variant="contained"
                        loading={isSubmitting}
                        loadingLabel="投稿中..."
                        disabled={commentBody.trim().length < 2 || isSubmitting}
                        onClick={handleAddComment}
                        sx={{ minHeight: 44, fontWeight: 900, borderRadius: 2, alignSelf: "flex-start" }}
                      >
                        コメントする
                      </ActionButton>
                    </>
                  )}
                </Stack>
              </Paper>

              <Dialog open={editOpen} onClose={() => !isEditing && setEditOpen(false)} fullWidth maxWidth="md">
                <DialogTitle fontWeight={900}>投稿を編集</DialogTitle>
                <DialogContent>
                  <Stack spacing={2.5} sx={{ pt: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>カテゴリ</InputLabel>
                      <Select
                        label="カテゴリ"
                        value={editCategory}
                        onChange={(event) => setEditCategory(event.target.value as QuestPostCategory)}
                      >
                        {(options?.categories ?? []).map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="タイトル"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      error={Boolean(editTitleError && editTitle.length > 0)}
                      helperText={editTitleError || `${editTitle.trim().length} / ${titleMaxLength}文字`}
                      fullWidth
                      required
                    />
                    <TextField
                      label="本文"
                      value={editBody}
                      onChange={(event) => setEditBody(event.target.value)}
                      error={Boolean(editBodyError && editBody.length > 0)}
                      helperText={editBodyError || `${editBody.trim().length} / ${bodyMaxLength}文字`}
                      fullWidth
                      required
                      multiline
                      minRows={6}
                    />
                    <TextField
                      label="コード"
                      value={editCode}
                      onChange={(event) => setEditCode(event.target.value)}
                      fullWidth
                      multiline
                      minRows={6}
                      InputProps={{
                        sx: {
                          bgcolor: "#f8fafc",
                          fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                          "& textarea": {
                            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                            lineHeight: 1.7,
                          },
                        },
                      }}
                    />
                    <TextField
                      label="参考 URL"
                      value={editReferenceUrl}
                      onChange={(event) => setEditReferenceUrl(event.target.value)}
                      fullWidth
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                  <Button onClick={() => setEditOpen(false)} disabled={isEditing}>
                    キャンセル
                  </Button>
                  <ActionButton
                    variant="contained"
                    loading={isEditing}
                    loadingLabel="保存中..."
                    disabled={!canSaveEdit}
                    onClick={handleSaveEdit}
                    sx={{ fontWeight: 900 }}
                  >
                    保存する
                  </ActionButton>
                </DialogActions>
              </Dialog>

              <Dialog open={deleteOpen} onClose={() => !isDeleting && setDeleteOpen(false)}>
                <DialogTitle fontWeight={900}>この投稿を削除しますか？</DialogTitle>
                <DialogContent>
                  <Typography color="text.secondary">
                    削除後は元に戻せません。コメントは会話の流れを残すため保持されます。
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                  <Button onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                    キャンセル
                  </Button>
                  <ActionButton
                    color="error"
                    variant="contained"
                    loading={isDeleting}
                    loadingLabel="削除中..."
                    disabled={isDeleting}
                    onClick={handleDelete}
                    sx={{ fontWeight: 900 }}
                  >
                    削除する
                  </ActionButton>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Stack>
      </Container>
      <BlockingProcessOverlay
        open={isDeleting}
        title="投稿を削除しています"
        description="完了後に掲示板一覧へ移動します。"
        mascotState="thinking"
      />
    </Box>
  );
}

"use client";

import { FeedbackDestination } from "@/app/component/feedbackV1";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  addQuestComment,
  deleteQuestPost,
  getQuestPost,
  markQuestCommentSolution,
  toggleQuestCommentReaction,
  toggleQuestReaction,
  updateQuestPost,
  updateQuestPostStatus,
  type QuestBoardOptions,
  type QuestPostDetail,
  type QuestPostCategory,
  type QuestPostStatus,
  type QuestReactionType,
} from "@/api/questBoard.api";
import { QuestBoardAuthor } from "../_components/QuestBoardAuthor";
import { CategoryChip, CourseChip, MissionChip, StatusChip, isResolvableCategory } from "../_components/BoardChips";
import { ActionButton } from "@/app/component/actionButton";
import { AppHeader } from "@/app/component/appHeader";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { BlockingProcessOverlay } from "@/app/component/blockingProcessOverlay";
import { MascotFigure } from "@/app/component/mascotFigure";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { fetchClientQuery, peekClientQueryData, queryTags, setClientQueryData } from "@/lib/clientQueryCache";
import { useUserSession } from "@/app/component/userSession";

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
  const { status, token } = useUserSession();
  type QuestPostResponse = Awaited<ReturnType<typeof getQuestPost>>;
  const detailKey = `quest-board-post:${postId}`;
  const [cachedDetail] = useState(() => peekClientQueryData<QuestPostResponse>(detailKey));
  const [post, setPost] = useState<QuestPostDetail | null>(cachedDetail?.post ?? null);
  const [options, setOptions] = useState<QuestBoardOptions | null>(cachedDetail?.options ?? null);
  const [commentBody, setCommentBody] = useState("");
  const [isLoading, setIsLoading] = useState(!cachedDetail);
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
    if (post) setClientQueryData<QuestPostResponse>(detailKey, { post, options: options ?? cachedDetail?.options ?? ({} as QuestBoardOptions) }, [queryTags.questBoard]);
  }, [post, options, detailKey, cachedDetail]);
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) {
      if (!cachedDetail) { setErrorMessage("ログインが必要です。"); setIsLoading(false); }
      return;
    }
    let isMounted = true;
    fetchClientQuery(detailKey, () => getQuestPost(token, postId), { staleTimeMs: 300_000, tags: [queryTags.questBoard] })
      .then(data => {
        if (!isMounted) return;
        setPost(data.post);
        setOptions(data.options);
        setErrorMessage(null);
      })
      .catch(error => { console.error(error); if (isMounted && !cachedDetail) setErrorMessage("投稿を取得できませんでした。"); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [status, token, postId, detailKey, cachedDetail]);

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

  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = async () => {
    if (!post?.code) return;
    try {
      await navigator.clipboard.writeText(post.code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // コピーできない環境では何もしない（コードは選択してコピーできる）。
    }
  };

  const handleMarkSolution = async (commentId: string) => {
    if (!token || !post) return;
    try {
      const result = await markQuestCommentSolution(token, post.id, commentId);
      setPost(result.post);
      play("saveSuccess");
    } catch (error) {
      console.error(error);
      setErrorMessage("解決した回答を指定できませんでした。");
    }
  };

  const handleCommentReaction = async (commentId: string, type: "HELPFUL" | "THANKS") => {
    if (!token || !post) return;
    try {
      const result = await toggleQuestCommentReaction(token, post.id, commentId, type);
      setPost({
        ...post,
        comments: post.comments.map((comment) =>
          comment.id === commentId ? { ...comment, reactions: result.reactions } : comment
        ),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddComment = async () => {
    if (!token || !post) return;
    if (commentBody.trim().length < 2) {
      setErrorMessage(`${isResolvableCategory(post.category) ? "回答" : "コメント"}は2文字以上で入力してください。`);
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
      setErrorMessage(`${isResolvableCategory(post.category) ? "回答" : "コメント"}を投稿できませんでした。`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvable = post ? isResolvableCategory(post.category) : false;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !!post && !errorMessage} />
      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
          <AppBreadcrumbs items={[{ label: "掲示板", href: "/quest-board" }, { label: post?.title ?? "投稿詳細" }]} />
        </Container>
      <Container maxWidth={false} sx={{ maxWidth: 960, pt: 3, pb: 5 }}>
        <Stack spacing={3}>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading || !post ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Stack>
          ) : (
            <>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                <Stack spacing={2.5}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <CategoryChip category={post.category} label={post.categoryLabel} />
                    {resolvable && <StatusChip status={post.status} commentCount={post.commentCount} />}
                    {post.courseTitle && <CourseChip title={post.courseTitle} />}
                    {post.missionTitle && <MissionChip title={post.missionTitle} />}
                    <Box sx={{ flex: 1 }} />
                    {post.isOwner && !post.isDeleted && (
                      <>
                        <Button variant="text" startIcon={<EditIcon />} onClick={openEditDialog} sx={{ fontWeight: 800, color: "#2563eb" }}>
                          編集
                        </Button>
                        <Button variant="text" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} sx={{ fontWeight: 800, color: "#111827" }}>
                          削除
                        </Button>
                      </>
                    )}
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.5 }}>
                      {post.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mt: 1.25 }}>
                      <QuestBoardAuthor author={post} isDeleted={post.isDeleted} />
                      <Typography sx={{ fontSize: 14 }}>{formatDate(post.createdAt)}</Typography>
                    </Box>
                  </Box>

                  <Typography sx={{ fontSize: 16, whiteSpace: "pre-wrap", lineHeight: 1.9 }}>{post.body}</Typography>

                  {post.code && (
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                        <CodeRoundedIcon sx={{ fontSize: 18, color: "#334155" }} />
                        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>コード</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, bgcolor: "#f1f5f9" }}>Python</Typography>
                        <Box sx={{ flex: 1 }} />
                        <Button
                          size="small"
                          startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
                          onClick={handleCopyCode}
                          sx={{ fontWeight: 700, color: "#2563eb", minHeight: 32 }}
                        >
                          {copiedCode ? "コピーしました" : "コピー"}
                        </Button>
                      </Box>
                      <Box
                        sx={{
                          p: 2, borderRadius: 2, bgcolor: "#0f172a", color: "#e2e8f0",
                          overflowX: "auto", fontSize: 14, lineHeight: 1.7,
                          fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                        }}
                      >
                        {post.code.split("\n").map((line, index) => (
                          <Box key={index} sx={{ display: "flex", gap: 2 }}>
                            <Box component="span" sx={{ width: 24, textAlign: "right", color: "#64748b", userSelect: "none", flexShrink: 0 }}>
                              {index + 1}
                            </Box>
                            <Box component="span" sx={{ whiteSpace: "pre" }}>{line || " "}</Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {post.referenceUrl && (
                    <Box
                      component="a"
                      href={post.referenceUrl}
                      target={post.referenceUrl.startsWith("/") ? undefined : "_blank"}
                      rel={post.referenceUrl.startsWith("/") ? undefined : "noreferrer"}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.25, p: 2, borderRadius: 2,
                        border: "1px solid #cbd5e1", bgcolor: "#fff", color: "inherit", textDecoration: "none",
                        "&:hover": { borderColor: "#2563eb" },
                      }}
                    >
                      <LinkRoundedIcon sx={{ color: "#2563eb" }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                          {post.category === "WORK_SHARE" && post.referenceUrl.startsWith("/my-works/") ? "元の制作記録" : "参考リンク"}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "#2563eb", overflowWrap: "anywhere" }}>{post.referenceUrl}</Typography>
                      </Box>
                    </Box>
                  )}

                  {!post.isDeleted && (
                    <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", pt: 0.5 }}>
                      {(Object.keys(reactionMeta) as QuestReactionType[]).map((type) => {
                        const reacted = post.reactions.userReactedTypes.includes(type);
                        return (
                          <Button
                            key={type}
                            variant={reacted ? "contained" : "outlined"}
                            startIcon={reactionMeta[type].icon}
                            onClick={() => handleReaction(type)}
                            sx={{
                              minHeight: 44, px: 2.5, borderRadius: 999, fontWeight: 800,
                              ...(reacted
                                ? { bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }
                                : { color: "#111827", borderColor: "#cbd5e1", "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" } }),
                            }}
                          >
                            {reactionMeta[type].label} {post.reactions.byType[type] ?? 0}
                          </Button>
                        );
                      })}
                    </Box>
                  )}

                  {!post.isDeleted && post.canResolve && resolvable && (
                    post.status === "RESOLVED" ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", flexWrap: "wrap" }}>
                        <CheckCircleRoundedIcon sx={{ color: "#16a34a" }} />
                        <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#166534" }}>解決済みです</Typography>
                        <Box sx={{ flex: 1 }} />
                        <Button onClick={() => handleStatusChange("OPEN")} sx={{ fontWeight: 700, color: "#2563eb" }}>
                          未解決に戻す
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderRadius: 2, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: 16 }}>答えが見つかったら、解決済みにしましょう。</Typography>
                        <Box sx={{ flex: 1 }} />
                        <Button
                          variant="contained" startIcon={<CheckCircleRoundedIcon />}
                          onClick={() => handleStatusChange("RESOLVED")}
                          sx={{ minHeight: 44, fontWeight: 800, borderRadius: 2, bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
                        >
                          解決済みにする
                        </Button>
                      </Box>
                    )
                  )}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                <Stack spacing={2.5}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{resolvable ? "回答" : "コメント"}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{post.commentCount}件</Typography>
                  </Box>

                  {post.comments.length === 0 ? (
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <MascotFigure mascotId="red-panda" alt="マスコット" size="S" grounding="frame" presentation="circle" motion="none" />
                      <Typography sx={{ fontSize: 16 }}>
                        {resolvable
                          ? "まだ回答がありません。分かったことがあれば、最初の回答を書いてみましょう。"
                          : "まだコメントはありません。"}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {post.comments.map((comment, index) => (
                        <Box
                          key={comment.id}
                          sx={{
                            pt: index === 0 ? 0 : 2, mt: index === 0 ? 0 : 2,
                            borderTop: index === 0 ? "none" : "1px solid #e2e8f0",
                            ...(comment.isSolution
                              ? { bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 2, p: 2, mt: index === 0 ? 0 : 2 }
                              : {}),
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                            <QuestBoardAuthor author={comment} />
                            <Typography sx={{ fontSize: 14 }}>{formatDate(comment.createdAt)}</Typography>
                            {comment.isSolution && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: 999, bgcolor: "#dcfce7" }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                                <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#166534" }}>解決した回答</Typography>
                              </Box>
                            )}
                          </Box>
                          <Typography sx={{ fontSize: 16, whiteSpace: "pre-wrap", lineHeight: 1.8, mt: 1 }}>
                            {comment.body}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, mt: 1.25, flexWrap: "wrap", alignItems: "center" }}>
                            {([
                              { type: "HELPFUL" as const, label: "参考になった", count: comment.reactions?.helpful ?? 0 },
                              { type: "THANKS" as const, label: "ありがとう", count: comment.reactions?.thanks ?? 0 },
                            ]).map((item) => {
                              const active = comment.reactions?.userTypes.includes(item.type) ?? false;
                              return (
                                <Button
                                  key={item.type}
                                  size="small"
                                  variant={active ? "contained" : "outlined"}
                                  onClick={() => handleCommentReaction(comment.id, item.type)}
                                  sx={{
                                    minHeight: 34, borderRadius: 999, fontWeight: 700,
                                    ...(active
                                      ? { bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }
                                      : { color: "#111827", borderColor: "#cbd5e1", "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" } }),
                                  }}
                                >
                                  {item.label} {item.count}
                                </Button>
                              );
                            })}
                            {resolvable && post.canResolve && !comment.isSolution && (
                              <Button
                                size="small"
                                startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={() => handleMarkSolution(comment.id)}
                                sx={{ fontWeight: 700, color: "#166534", minHeight: 32 }}
                              >
                                解決した回答にする
                              </Button>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {post.isDeleted ? (
                    <Alert severity="info">削除済み投稿のため、新しい{resolvable ? "回答" : "コメント"}はできません。</Alert>
                  ) : (
                    <Box sx={{ borderTop: "1px solid #e2e8f0", pt: 2.5 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1 }}>
                        {resolvable ? "あなたの回答" : "コメントを書く"}
                      </Typography>
                      {resolvable && (
                        <Typography sx={{ fontSize: 14, mb: 1.5 }}>
                          考え方や解決方法を共有しましょう。
                        </Typography>
                      )}
                      <TextField
                        label={resolvable ? "回答を書く" : "コメントを書く"}
                        id="reply"
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
                        sx={{ minHeight: 44, fontWeight: 900, borderRadius: 2, alignSelf: "flex-start", mt: 1.5, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                      >
                        {resolvable ? "回答する" : "コメントする"}
                      </ActionButton>
                    </Box>
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
                  <Typography>
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

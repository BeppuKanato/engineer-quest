"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  addQuestComment,
  getQuestPost,
  toggleQuestReaction,
  updateQuestPostStatus,
  type QuestPostDetail,
  type QuestPostStatus,
  type QuestReactionType,
} from "@/api/questBoard.api";
import { AppHeader } from "@/app/component/appHeader";
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

export default function QuestPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params.postId;
  const [token, setToken] = useState<string | null>(null);
  const [post, setPost] = useState<QuestPostDetail | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      const result = await toggleQuestReaction(token, post.id, type);
      setPost({ ...post, reactions: result.reactions });
    } catch (error) {
      console.error(error);
      setErrorMessage("リアクションを更新できませんでした。");
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
    if (!token || !post || !commentBody.trim()) return;

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
          <Button component={Link} href="/quest-board" startIcon={<ArrowBackIcon />} sx={{ alignSelf: "flex-start" }}>
            Quest Board に戻る
          </Button>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading || !post ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : (
            <>
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
                      参考 URL:{" "}
                      <MuiLink href={post.referenceUrl} target="_blank" rel="noreferrer">
                        {post.referenceUrl}
                      </MuiLink>
                    </Typography>
                  )}

                  <Divider />

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

                  {post.canResolve && isResolvableCategory(post) && (
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

                  <TextField
                    label="コメントを書く"
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    multiline
                    minRows={4}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    disabled={!commentBody.trim() || isSubmitting}
                    onClick={handleAddComment}
                    sx={{ minHeight: 44, fontWeight: 900, borderRadius: 2, alignSelf: "flex-start" }}
                  >
                    {isSubmitting ? "投稿中..." : "コメントする"}
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

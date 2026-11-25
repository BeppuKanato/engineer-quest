"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createQuestPost,
  getQuestBoardPosts,
  getQuestPost,
  type QuestPostCategory,
  type QuestPostDetail,
  type QuestPostSummary,
} from "@/api/questBoard.api";
import { useUserSession } from "@/app/component/userSession";
import { StatusChip } from "./BoardChips";

/** 投稿に添付できる学習情報。code はコード欄へ、text は本文の末尾に付く。 */
export type QuickPostAttachment = {
  id: string;
  label: string;
  kind: "code" | "text";
  /** code のときはコード本文、text のときは添付する文章。 */
  detail?: string;
  defaultChecked?: boolean;
};

export type QuickPostPreset = {
  category: QuestPostCategory;
  courseId?: string;
  /** どこから投稿したか（例：幅優先探索 › 発展ミッション『ダンジョンの最短脱出』）。 */
  contextLabel: string;
  /** コード添付の初期値（attachments が無いときの簡易指定）。 */
  code?: string;
  attachments?: QuickPostAttachment[];
  mission?: { id: string; title: string; score?: number; rank?: string };
};

const dialogTitles: Record<QuestPostCategory, string> = {
  QUESTION: "仲間に質問する",
  ERROR_HELP: "仲間に相談する",
  WORK_SHARE: "成果を共有する",
  CODE_SHARE: "コードを共有する",
  MEMO: "学びを共有する",
  REFERENCE: "参考リンクを共有する",
};

const bodyFields: Partial<
  Record<QuestPostCategory, { label: string; placeholder: string }>
> = {
  QUESTION: {
    label: "何が分かりませんか？",
    placeholder: "例：キューから取り出すタイミングが分からない",
  },
  ERROR_HELP: {
    label: "どこで困っていますか？",
    placeholder: "例：テスト3だけ通りません。どこが間違っているのでしょうか",
  },
  WORK_SHARE: {
    label: "工夫したことや感想",
    placeholder: "例：ゴールに着いたらすぐ止めるようにしました",
  },
};

/** 下書きはダイアログを閉じても保持する（誤って閉じても書いた文章が消えない）。投稿できたら消す。 */
const drafts = new Map<string, { body: string; checkedIds: string[] }>();
const draftKeyOf = (preset: QuickPostPreset) =>
  `${preset.category}|${preset.courseId ?? ""}|${preset.mission?.id ?? ""}|${preset.contextLabel}`;

export function QuickPostDialog({
  open,
  onClose,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  preset: QuickPostPreset | null;
}) {
  const router = useRouter();
  const { token } = useUserSession();
  const [body, setBody] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [related, setRelated] = useState<QuestPostSummary[]>([]);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<QuestPostDetail | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [donePostId, setDonePostId] = useState<string | null>(null);

  const attachments = useMemo<QuickPostAttachment[]>(() => {
    if (!preset) return [];
    if (preset.attachments) return preset.attachments;
    return preset.code
      ? [
          {
            id: "code",
            label: "現在のコードを添付する",
            kind: "code" as const,
            detail: preset.code,
          },
        ]
      : [];
  }, [preset]);

  useEffect(() => {
    if (!open || !preset) return;
    const draft = drafts.get(draftKeyOf(preset));
    setBody(draft?.body ?? "");
    setCheckedIds(
      draft?.checkedIds ??
        attachments.filter((a) => a.defaultChecked).map((a) => a.id),
    );
    setPreviewId(null);
    setRelatedOpen(false);
    setExpandedId(null);
    setExpandedDetail(null);
    setError(null);
    setDonePostId(null);
    if (
      token &&
      preset.courseId &&
      (preset.category === "QUESTION" || preset.category === "ERROR_HELP")
    ) {
      getQuestBoardPosts(token, { courseId: preset.courseId })
        .then((result) => setRelated(result.posts.slice(0, 3)))
        .catch(() => setRelated([]));
    } else {
      setRelated([]);
    }
  }, [open, preset, token, attachments]);

  if (!preset) return null;
  const field = bodyFields[preset.category] ?? {
    label: "内容",
    placeholder: "",
  };
  const bodyValid = body.trim().length >= 10;

  const persistDraft = () => {
    drafts.set(draftKeyOf(preset), { body, checkedIds });
  };
  const handleClose = () => {
    if (!donePostId) persistDraft();
    onClose();
  };

  const toggleRelatedPost = async (post: QuestPostSummary) => {
    if (expandedId === post.id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(post.id);
    setExpandedDetail(null);
    if (!token) return;
    try {
      setExpandedDetail((await getQuestPost(token, post.id)).post);
    } catch {
      setExpandedDetail(null);
    }
  };

  const handleSubmit = async () => {
    if (!token || !bodyValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const trimmed = body.trim().replace(/\s+/g, " ");
      const checked = attachments.filter((a) => checkedIds.includes(a.id));
      const textAttachments = checked.filter(
        (a) => a.kind === "text" && a.detail,
      );
      const fullBody =
        textAttachments.length > 0
          ? `${body.trim()}\n\n${textAttachments.map((a) => `【${a.label}】\n${a.detail}`).join("\n\n")}`
          : body.trim();
      const codeAttachment = checked.find((a) => a.kind === "code");
      const result = await createQuestPost(token, {
        category: preset.category,
        title: trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed,
        body: fullBody,
        code: codeAttachment?.detail || undefined,
        courseId: preset.courseId,
      });
      drafts.delete(draftKeyOf(preset));
      setDonePostId(result.postId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "投稿に失敗しました。時間をおいてもう一度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, fontSize: 22 }}>
        {dialogTitles[preset.category]}
      </DialogTitle>
      <DialogContent dividers>
        {donePostId ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "#16a34a" }} />
            <Typography
              component="p"
              sx={{ fontSize: 18, fontWeight: 900, mt: 1 }}
            >
              投稿しました
            </Typography>
            <Typography component="p" sx={{ fontSize: 16, mt: 1 }}>
              回答や反応は掲示板に届きます。この画面に戻ってくることはありません。
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography
              component="p"
              sx={{ fontSize: 14, color: "#2563eb", fontWeight: 700 }}
            >
              {preset.contextLabel}
            </Typography>
            {preset.mission && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Box>
                  <Typography component="p" sx={{ fontSize: 14 }}>
                    発展ミッション
                  </Typography>
                  <Typography
                    component="p"
                    sx={{ fontSize: 16, fontWeight: 800 }}
                  >
                    {preset.mission.title}
                  </Typography>
                </Box>
                {typeof preset.mission.score === "number" && (
                  <Box sx={{ ml: "auto", textAlign: "right" }}>
                    <Typography
                      component="p"
                      sx={{ fontSize: 18, fontWeight: 900 }}
                    >
                      {preset.mission.score}点
                    </Typography>
                    <Typography component="p" sx={{ fontSize: 14 }}>
                      {preset.mission.rank}ランク
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            <TextField
              label={field.label}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={field.placeholder}
              multiline
              minRows={4}
              fullWidth
              autoFocus
              helperText={
                bodyValid
                  ? undefined
                  : "10文字以上で入力してください（タイトルは本文の冒頭から自動で付きます）"
              }
            />
            {attachments.length > 0 && (
              <Box>
                <Typography
                  component="p"
                  sx={{ fontSize: 14, fontWeight: 800 }}
                >
                  添付する学習情報
                </Typography>
                {attachments.map((attachment) => (
                  <Box key={attachment.id}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checkedIds.includes(attachment.id)}
                            onChange={(event) =>
                              setCheckedIds((prev) =>
                                event.target.checked
                                  ? [...prev, attachment.id]
                                  : prev.filter((id) => id !== attachment.id),
                              )
                            }
                          />
                        }
                        label={attachment.label}
                      />
                      {attachment.detail && (
                        <Button
                          size="small"
                          onClick={() =>
                            setPreviewId(
                              previewId === attachment.id
                                ? null
                                : attachment.id,
                            )
                          }
                          sx={{ fontWeight: 700 }}
                        >
                          {previewId === attachment.id
                            ? "確認を閉じる"
                            : "確認"}
                        </Button>
                      )}
                    </Box>
                    {previewId === attachment.id && attachment.detail && (
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          ml: 4,
                          mb: 1,
                          p: 1.5,
                          bgcolor: "#f8fafc",
                          border: "1px solid #e5e7eb",
                          borderRadius: 1.5,
                          fontFamily: "monospace",
                          fontSize: 14,
                          whiteSpace: "pre-wrap",
                          maxHeight: 180,
                          overflowY: "auto",
                        }}
                      >
                        {attachment.detail}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            <Typography component="p" sx={{ fontSize: 14 }}>
              掲示板に公開されます。回答は掲示板に届きます（この画面には返ってきません）。
            </Typography>
            {related.length > 0 && (
              <Box sx={{ borderTop: "1px solid #eef2f7", pt: 1.5 }}>
                <Button
                  onClick={() => setRelatedOpen((v) => !v)}
                  endIcon={
                    <ExpandMoreRoundedIcon
                      sx={{
                        transform: relatedOpen ? "rotate(180deg)" : "none",
                        transition: "transform.2s",
                      }}
                    />
                  }
                  sx={{ fontWeight: 800, color: "#111827", px: 0 }}
                >
                  同じ単元の投稿 {related.length}件
                </Button>
                {relatedOpen && (
                  <Box>
                    {related.map((post) => (
                      <Box
                        key={post.id}
                        sx={{ borderTop: "1px solid #eef2f7", py: 1 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Button
                            onClick={() => toggleRelatedPost(post)}
                            sx={{
                              fontWeight: 700,
                              color: "#111827",
                              textAlign: "left",
                              flex: 1,
                              justifyContent: "flex-start",
                              px: 0,
                            }}
                          >
                            {post.title}
                          </Button>
                          <StatusChip
                            status={post.status}
                            commentCount={post.commentCount}
                          />
                          <Typography
                            component="span"
                            sx={{ fontSize: 14, whiteSpace: "nowrap" }}
                          >
                            {post.category === "QUESTION" ||
                            post.category === "ERROR_HELP"
                              ? `回答 ${post.commentCount}`
                              : `コメント ${post.commentCount}`}
                          </Typography>
                        </Box>
                        {expandedId === post.id && (
                          <Box sx={{ mt: 1 }}>
                            {expandedDetail === null ? (
                              <CircularProgress size={18} />
                            ) : (
                              <>
                                <Typography
                                  component="p"
                                  sx={{
                                    fontSize: 14,
                                    lineHeight: 1.8,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {expandedDetail.body}
                                </Typography>
                                {expandedDetail.comments
                                  .slice(0, 2)
                                  .map((comment) => (
                                    <Typography
                                      key={comment.id}
                                      component="p"
                                      sx={{
                                        fontSize: 14,
                                        lineHeight: 1.8,
                                        mt: 1,
                                        pl: 1.5,
                                        borderLeft: "3px solid #e2e8f0",
                                      }}
                                    >
                                      {comment.authorName}：{comment.body}
                                    </Typography>
                                  ))}
                                <Button
                                  size="small"
                                  onClick={() => {
                                    persistDraft();
                                    router.push(`/quest-board/${post.id}`);
                                  }}
                                  sx={{ fontWeight: 700, mt: 0.5, px: 0 }}
                                >
                                  掲示板で開く
                                </Button>
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {donePostId ? (
          <>
            <Button
              onClick={() => router.push(`/quest-board/${donePostId}`)}
              sx={{ fontWeight: 700 }}
            >
              投稿内容を確認する
            </Button>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                fontWeight: 800,
                bgcolor: "#2563eb",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              学習に戻る
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} sx={{ fontWeight: 700 }}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!bodyValid || submitting}
              sx={{
                fontWeight: 800,
                bgcolor: "#2563eb",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              {submitting ? "投稿しています…" : "投稿する"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

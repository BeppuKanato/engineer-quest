"use client";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Alert, Box, Button, Chip, CircularProgress, Drawer, IconButton, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import { createAiConsultation, listAiConsultations } from "@/api/aiConsultation.api";
import { RobotBust } from "@/app/component/robotBust";
import { RobotFigure } from "@/app/component/robotFigure";

/**
 * 学習プレイヤー常駐の AI 相談（ステージ1）。
 *
 * 置き場の整理: フェーズ画面そのものには従来どおりアルドを出さない（学習導線に
 * マスコットを置かない決めは維持）。このパネルは学習者が意図して開く別面なので、
 * 中ではアルドが相談相手として登場する。相談相手は答え・解法コードを出さない
 * （担保はバックエンドのプロンプト制約と事後チェック）。
 */

const ACTION_BLUE = "#2563eb";
const TEXT_BLACK = "#111827";
const ALDO_INTRO =
  "ぼくはアルド。答えは教えられないけど、考え方は一緒に整理できるよ。どこで手が止まっているか、自分の言葉で教えて。";

export type AiConsultationPreviewMessage = { role: "user" | "assistant"; text: string };

type PanelMessage = AiConsultationPreviewMessage & { id: string };

export function AiConsultationPanel({
  courseId,
  phaseKey,
  phaseLabel,
  code,
  getToken,
  defaultOpen = false,
  initialMessages,
  disableFetch = false,
}: {
  courseId: string;
  phaseKey?: string | null;
  phaseLabel?: string | null;
  /** 現在書いているコード。文脈として送り、概念レベルの指摘にだけ使われる。 */
  code?: string;
  getToken: () => Promise<string>;
  /** 撮影用ハーネス等で最初から開いておく場合に使う。 */
  defaultOpen?: boolean;
  /** 撮影用ハーネス等で会話を差し込む場合に使う。 */
  initialMessages?: readonly AiConsultationPreviewMessage[];
  /** 撮影用ハーネス等で実 API を呼ばない場合に使う。 */
  disableFetch?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<PanelMessage[]>(() =>
    (initialMessages ?? []).map((message, index) => ({ ...message, id: `initial-${index}` }))
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyLoaded = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending, open]);

  const loadHistory = useCallback(async () => {
    if (disableFetch || historyLoaded.current) return;
    historyLoaded.current = true;
    setLoadingHistory(true);
    try {
      const token = await getToken();
      const data = await listAiConsultations(token, courseId);
      setMessages(
        data.consultations.flatMap((record) => [
          { id: `${record.id}-user`, role: "user" as const, text: record.userMessage },
          { id: `${record.id}-assistant`, role: "assistant" as const, text: record.assistantMessage },
        ])
      );
    } catch {
      // 履歴が取れなくても相談自体は始められる。エラーは送信時に改めて伝える。
    } finally {
      setLoadingHistory(false);
    }
  }, [courseId, disableFetch, getToken]);

  useEffect(() => {
    if (open) void loadHistory();
  }, [open, loadHistory]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    setSending(true);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text }]);
    try {
      const token = await getToken();
      const result = await createAiConsultation(token, {
        courseId,
        phaseKey: phaseKey ?? null,
        message: text,
        context: code?.trim() ? { code } : undefined,
      });
      setMessages((current) => [
        ...current,
        { id: `assistant-${result.consultation.id}`, role: "assistant", text: result.reply },
      ]);
    } catch {
      setError("相談を送れませんでした。通信の状態を確認して、もう一度送ってください。");
    } finally {
      setSending(false);
    }
  }, [code, courseId, getToken, input, phaseKey, sending]);

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        aria-label="アルドに相談を開く"
        sx={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 1200,
          borderRadius: 999,
          bgcolor: ACTION_BLUE,
          color: "#ffffff",
          pl: 1,
          pr: 2,
          py: 0.75,
          gap: 1,
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
          "&:hover": { bgcolor: "#1d4ed8" },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
          aria-hidden
        >
          <RobotFigure alt="" state="cheer" size="S" presentation="circle" />
        </Box>
        <Box sx={{ textAlign: "left" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, color: "#ffffff" }}>アルドに相談</Typography>
          <Typography sx={{ fontSize: 14, lineHeight: 1.2, color: "#ffffff" }}>考え方を一緒に整理する</Typography>
        </Box>
        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20 }} />
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: "min(430px, 94vw)", display: "flex", flexDirection: "column" } }}
      >
        <Box sx={{ bgcolor: "#eff6ff", px: 2, pt: 1.5, pb: 1, borderBottom: "1px solid #bfdbfe", flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <RobotBust state="cheer" width={104} height={84} />
            <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: TEXT_BLACK }}>アルドに相談</Typography>
              <Typography sx={{ fontSize: 14, color: TEXT_BLACK }}>答えではなく、考え方を一緒に整理する場所です。</Typography>
              {phaseLabel ? (
                <Chip
                  size="small"
                  label={`いまの場所: ${phaseLabel}`}
                  sx={{ mt: 0.75, fontSize: 14, bgcolor: "#ffffff", color: TEXT_BLACK, border: `1px solid ${ACTION_BLUE}` }}
                />
              ) : null}
            </Box>
            <IconButton onClick={() => setOpen(false)} aria-label="相談を閉じる" sx={{ color: TEXT_BLACK }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Box ref={listRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 2, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#ffffff" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <Box sx={{ width: 36, height: 36, flexShrink: 0 }} aria-hidden>
              <RobotFigure alt="" state="normal" size="S" grounding="shadow" />
            </Box>
            <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "16px 16px 16px 4px", px: 1.5, py: 1 }}>
              <Typography sx={{ fontSize: 14, color: TEXT_BLACK }}>{ALDO_INTRO}</Typography>
            </Box>
          </Box>

          {loadingHistory ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} sx={{ color: ACTION_BLUE }} />
              <Typography sx={{ fontSize: 14, color: TEXT_BLACK }}>これまでの相談を読み込んでいます。</Typography>
            </Box>
          ) : null}

          {messages.map((message) =>
            message.role === "assistant" ? (
              <Box key={message.id} sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                <Box sx={{ width: 36, height: 36, flexShrink: 0 }} aria-hidden>
                  <RobotFigure alt="" state="normal" size="S" grounding="shadow" />
                </Box>
                <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "16px 16px 16px 4px", px: 1.5, py: 1, maxWidth: "85%" }}>
                  <Typography sx={{ fontSize: 14, color: TEXT_BLACK, whiteSpace: "pre-wrap" }}>{message.text}</Typography>
                </Box>
              </Box>
            ) : (
              <Box key={message.id} sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ bgcolor: "#2563eb", borderRadius: "16px 16px 4px 16px", px: 1.5, py: 1, maxWidth: "85%" }}>
                  <Typography sx={{ fontSize: 14, color: "#ffffff", whiteSpace: "pre-wrap" }}>{message.text}</Typography>
                </Box>
              </Box>
            )
          )}

          {sending ? (
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }} role="status">
              <Box sx={{ width: 36, height: 36, flexShrink: 0 }} aria-hidden>
                <RobotFigure alt="" state="thinking" size="S" grounding="shadow" />
              </Box>
              <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "16px 16px 16px 4px", px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: ACTION_BLUE }} />
                <Typography sx={{ fontSize: 14, color: TEXT_BLACK }}>アルドが考え中です。</Typography>
              </Box>
            </Box>
          ) : null}
        </Box>

        <Box sx={{ flexShrink: 0, borderTop: "1px solid #e5e7eb", px: 2, py: 1.5, bgcolor: "#ffffff" }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 1, fontSize: 14 }}>{error}</Alert>
          ) : null}
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !(event.nativeEvent as { isComposing?: boolean }).isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="どこで手が止まっているか書いてみて"
              multiline
              maxRows={4}
              fullWidth
              inputProps={{ style: { fontSize: 14 }, "aria-label": "相談内容" }}
            />
            <Button
              variant="contained"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              endIcon={<SendRoundedIcon />}
              sx={{ bgcolor: ACTION_BLUE, fontSize: 14, fontWeight: 800, flexShrink: 0, "&:hover": { bgcolor: "#1d4ed8" } }}
            >
              送る
            </Button>
          </Box>
          <Typography sx={{ fontSize: 14, color: TEXT_BLACK, mt: 1 }}>
            アルドは答えやプログラムそのものは出せません。考え方の整理をお手伝いします。
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}

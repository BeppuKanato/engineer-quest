"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  getFeedbackAssignment,
  updateFeedbackAssignment,
  type FeedbackAssignmentSlot,
} from "@/api/hexad.api";
import { useUserSession } from "@/app/component/userSession";
import { ApiError } from "@/lib/fetcher";

const SLOTS: FeedbackAssignmentSlot[] = [1, 2, 3];

/**
 * Feedback assignment slot picker (profile screen). Only the slot number
 * is shown; which feedback each number selects is managed server-side.
 * The slot can be changed only before any feedback has been generated.
 */
export const FeedbackAssignmentSetting = () => {
  const { status, token } = useUserSession();
  const [savedSlot, setSavedSlot] = useState<FeedbackAssignmentSlot | null>(null);
  const [draftSlot, setDraftSlot] = useState<FeedbackAssignmentSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      if (status === "unauthenticated") setIsLoading(false);
      return;
    }
    let isMounted = true;
    getFeedbackAssignment(token)
      .then((result) => {
        if (!isMounted) return;
        setSavedSlot(result.slot);
        setDraftSlot(result.slot);
      })
      .catch(() => {
        if (isMounted) setErrorMessage("設定を読み込めませんでした。");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [status, token]);

  const handleSave = async () => {
    if (!token || draftSlot === null || draftSlot === savedSlot) return;
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await updateFeedbackAssignment(token, draftSlot);
      setSavedSlot(result.slot);
      setDraftSlot(result.slot);
      setMessage("保存しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "保存できませんでした。時間をおいてもう一度お試しください。"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}
    >
      <Typography variant="h5" fontWeight={900}>
        フィードバック設定
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2, lineHeight: 1.8 }}>
        フィードバックの種類を番号で選びます。案内された番号に合わせて、学習を始める前に保存してください。フィードバックが作られた後は変更できません。
      </Typography>

      {isLoading ? (
        <Skeleton variant="rounded" height={56} />
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {SLOTS.map((slot) => {
              const selected = draftSlot === slot;
              return (
                <Button
                  key={slot}
                  variant={selected ? "contained" : "outlined"}
                  onClick={() => setDraftSlot(slot)}
                  sx={{
                    minWidth: 72,
                    minHeight: 56,
                    borderRadius: 2,
                    fontSize: 22,
                    fontWeight: 900,
                  }}
                >
                  {slot}
                </Button>
              );
            })}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving || draftSlot === null || draftSlot === savedSlot}
              sx={{ minHeight: 48, borderRadius: 2, fontWeight: 900, px: 3 }}
            >
              保存する
            </Button>
            {savedSlot !== null && (
              <Typography color="text.secondary">
                現在の設定：{savedSlot}
              </Typography>
            )}
          </Box>
          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      )}
    </Paper>
  );
};

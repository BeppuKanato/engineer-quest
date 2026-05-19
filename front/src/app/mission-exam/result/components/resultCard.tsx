"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ListAltIcon from "@mui/icons-material/ListAlt";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { MissionExamResultLog, NextMission } from "../type";
import { ResultConfetti } from "./resultConfetti";
import { CountUpExp } from "./countupExp";
import { ResultSummary } from "./resultSummary";

type MissionExamCompleteCardProps = {
  result: MissionExamResultLog;
  nextMission: NextMission | null;
  onClickNextMission: () => void;
  onClickMissionMap: () => void;
};

export const MissionExamCompleteCard = ({
  result,
  nextMission,
  onClickNextMission,
  onClickMissionMap,
}: MissionExamCompleteCardProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [confettiFireKey, setConfettiFireKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setConfettiFireKey((prev) => prev + 1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <ResultConfetti
        targetRef={cardRef}
        fireKey={confettiFireKey}
      />

      <Card
        ref={cardRef}
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 5,
          border: "1px solid #e2e8f0",
          bgcolor: "#fff",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
          overflow: "visible",
        }}
      >
        <Stack spacing={2.5}>
          <Box sx={{ textAlign: "center", pt: 1 }}>
            <Chip
              icon={<WorkspacePremiumIcon />}
              label="Mission Exam Clear!"
              sx={{
                mb: 2,
                bgcolor: "#eff6ff",
                color: "#1976d2",
                fontWeight: 900,
                border: "1px solid #bfdbfe",
              }}
            />

            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                mx: "auto",
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fff7cc",
                color: "#facc15",
                boxShadow:
                  "0 0 42px rgba(250, 204, 21, 0.45), 0 16px 34px rgba(15, 23, 42, 0.08)",
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 62 }} />
            </Box>

            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 30, md: 42 },
                fontWeight: 900,
                color: "#1976d2",
                lineHeight: 1.2,
              }}
            >
              ミッション確認テスト クリア！
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: "#0f172a",
                fontSize: { xs: 18, md: 22 },
                fontWeight: 900,
              }}
            >
              自己紹介カードを完成できました
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              お手本コードとの差分がなくなりました。
            </Typography>
          </Box>

          <Card
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              color: "#fff",
              textAlign: "center",
              background:
                "linear-gradient(135deg, #0ea5e9 0%, #1976d2 52%, #7c3aed 100%)",
              boxShadow: "0 18px 42px rgba(25, 118, 210, 0.30)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, #1DA1F2 0%, #28C6E8 45%, #4F7CFF 100%)",
              },
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Typography sx={{ fontWeight: 900, opacity: 0.95 }}>
                獲得EXP
              </Typography>

              <CountUpExp exp={result.exp} />

              <Typography sx={{ fontWeight: 900, mt: 0.5 }}>
                EXP
              </Typography>
            </Box>
          </Card>

          <ResultSummary result={result} />

          <Stack spacing={1.2}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={onClickNextMission}
              sx={{
                py: 1.4,
                borderRadius: 3,
                fontWeight: 900,
                bgcolor: "#1976d2",
                boxShadow: "0 12px 24px rgba(25, 118, 210, 0.24)",
                "&:hover": {
                  bgcolor: "#1565c0",
                  boxShadow: "0 12px 24px rgba(25, 118, 210, 0.3)",
                },
              }}
            >
              {nextMission ? "次のミッションへ進む" : "ミッション一覧へ戻る"}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ListAltIcon />}
              onClick={onClickMissionMap}
              sx={{
                py: 1.3,
                borderRadius: 3,
                fontWeight: 900,
                borderColor: "#bfdbfe",
                color: "#1976d2",
                bgcolor: "#fff",
                "&:hover": {
                  borderColor: "#93c5fd",
                  bgcolor: "#eff6ff",
                },
              }}
            >
              ミッション一覧へ戻る
            </Button>
          </Stack>
        </Stack>
      </Card>
    </>
  );
};
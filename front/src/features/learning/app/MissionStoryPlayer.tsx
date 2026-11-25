"use client";
/**
 * ミッションストーリーの再生部品。学習教材のプレイヤーと同じ作法
 * （大きな図＋ステップ連動の1文キャプション＋戻る/次へ）で再生する。
 * 学習進捗には含めない。最後のステップに到達したら onReachEnd を1回呼ぶ
 * （＝「見た」の記録はここ。途中で閉じたら呼ばれない）。
 * 最終ステップでは lastStepExtra（ゲート側の「学習を始める」等）を出す。
 */
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Box, IconButton, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { playerTokens } from "@/features/learning/player/player.tokens";
import type { MissionStory } from "./missionStories";

export function MissionStoryPlayer({ story, onReachEnd, lastStepExtra }: {
  story: MissionStory;
  onReachEnd?: () => void;
  lastStepExtra?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const reachedEnd = useRef(false);
  const last = story.steps.length - 1;
  const step = story.steps[index];

  useEffect(() => {
    if (index === last && !reachedEnd.current) {
      reachedEnd.current = true;
      onReachEnd?.();
    }
  }, [index, last, onReachEnd]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography sx={{
        textAlign: "center", fontWeight: 700, lineHeight: 1.5, minHeight: "2.6em",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "clamp(18px, 1.5vw, 30px)", color: playerTokens.text, px: 1,
      }}>
        {step.caption}
      </Typography>
      <Box aria-hidden sx={{ height: { xs: 240, sm: 380 }, borderRadius: 3, overflow: "hidden", bgcolor: "#f1f5f9" }}>
        {step.figure}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <IconButton aria-label="前のステップ" onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0}
          sx={{ width: 48, height: 48, border: `1px solid ${playerTokens.layers.layer1}`, color: playerTokens.text }}>
          <NavigateBeforeIcon />
        </IconButton>
        <Typography sx={{ fontSize: 16, fontWeight: 700, minWidth: 64, textAlign: "center" }}>{index + 1} / {story.steps.length}</Typography>
        <IconButton aria-label="次のステップ" onClick={() => setIndex(value => Math.min(last, value + 1))} disabled={index === last}
          sx={{ width: 48, height: 48, border: `1px solid ${playerTokens.layers.layer1}`, color: playerTokens.text }}>
          <NavigateNextIcon />
        </IconButton>
      </Box>
      {index === last && lastStepExtra}
    </Box>
  );
}

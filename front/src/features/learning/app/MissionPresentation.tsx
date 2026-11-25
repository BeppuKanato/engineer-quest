"use client";
/**
 * 段階1の初回開始時のゲート（2026-11-23 決定の形）。
 * 別URLの画面にしない：/learn の殻（単元名＋段階チップ）の中で開く「状態」。
 * 中身はミッションストーリー（学習教材と同じ再生形式）。役割は「枠付けの保証」で、
 * 開始前の入口（一覧・帯）で見なかった人にも、最終チャレンジの意味づけとして
 * 最低1回は届ける。最後まで見たら閲覧フラグが立ち、次からは素通りになる。
 * スキップもできる（その場合はフラグは立たないが、単元が開始されれば二度と出ない）。
 */
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FlagIcon from "@mui/icons-material/Flag";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { Fragment } from "react";
import type { UnitMission } from "@/features/learning/app/missionRegistry";
import type { LearningUnit } from "@/features/learning/app/unitRegistry";
import { playerTokens } from "@/features/learning/player/player.tokens";
import { GoalFlag } from "./GoalFlag";
import { missionStoryFor } from "./missionStories";
import { markMissionStorySeen } from "./missionStoryStore";
import { MissionStoryPlayer } from "./MissionStoryPlayer";

export function MissionPresentation({ unit, mission, onStart }: {
  unit: LearningUnit;
  mission: UnitMission;
  onStart: () => void;
}) {
  const reduced = useReducedMotion();
  const story = missionStoryFor(unit.courseId);
  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", bgcolor: playerTokens.background, color: playerTokens.text }}>
      {/* プレイヤーと同じヘッダー（単元名＋段階チップ）。操作はさせない、文脈を示すためのもの。
          段階1が現在地＝「学習の冒頭にいる」ことが見た目で分かる。 */}
      <Box component="header" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: { xs: 1, sm: 2 }, py: 1, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
        <Typography component="h1" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{unit.title}</Typography>
        <Box aria-hidden sx={{ display: "flex", alignItems: "center", gap: 0.5, overflowX: "auto", flex: 1, py: 0.25 }}>
          {unit.phases.map((phase, index) => {
            const isFinal = phase.transitionOut === "final";
            const current = index === 0;
            return (
              <Fragment key={phase.id}>
                {index > 0 && <ArrowForwardIcon sx={{ fontSize: 14, flexShrink: 0, color: playerTokens.states.completed.stroke }} />}
                <Box sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.5, minHeight: 36, px: 1.25, whiteSpace: "nowrap", fontSize: 13.5, borderRadius: 999,
                  color: current ? playerTokens.surface : playerTokens.text,
                  bgcolor: current ? playerTokens.focus : "transparent",
                  border: `2px solid ${current ? playerTokens.focus : playerTokens.states.idle.stroke}`,
                }}>
                  {isFinal && <FlagIcon sx={{ fontSize: 16 }} />}
                  {isFinal ? "最終チャレンジ" : `${phase.phase}. ${phase.shortName}`}
                </Box>
              </Fragment>
            );
          })}
        </Box>
      </Box>

      <Box component={motion.div}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
        sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", px: 3, py: 4 }}>
        <Box sx={{ width: "100%", maxWidth: 900 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="単元ミッション" size="small" color="primary" sx={{ fontWeight: 800 }} />
            <GoalFlag courseId={unit.courseId} title={mission.title} />
          </Stack>
          <Typography component="h2" sx={{ mt: 2, fontSize: 24, fontWeight: 900 }}>{mission.title}</Typography>
          {story ? (
            <Box sx={{ mt: 2 }}>
              <MissionStoryPlayer
                story={story}
                onReachEnd={() => markMissionStorySeen(unit.courseId)}
                lastStepExtra={(
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Typography sx={{ fontSize: 16 }}>
                      <Box component="span" sx={{ fontWeight: 800 }}>達成の条件：</Box>
                      {mission.successCondition}
                    </Typography>
                    <Button variant="contained" size="large" onClick={onStart}
                      sx={{ minWidth: 260, height: 54, fontSize: 16, fontWeight: 800, borderRadius: 2 }}>
                      学習を始める
                    </Button>
                  </Box>
                )}
              />
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Button variant="text" onClick={onStart} sx={{ fontWeight: 700 }}>
                  スキップして学習を始める
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 16 }}>{mission.description}</Typography>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                <Button variant="contained" size="large" onClick={onStart}
                  sx={{ minWidth: 260, height: 54, fontSize: 16, fontWeight: 800, borderRadius: 2 }}>
                  学習を始める
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

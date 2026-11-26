"use client";

import { Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";
import { developmentMissionThumbnailFor } from "@/features/learning/app/DevelopmentMissionThumbnail";
import { developmentMissions, type DevMission } from "@/features/learning/app/developmentMissions";

/** その単元の完了で解放される発展ミッション（作成済みのものだけ）。 */
export const missionsUnlockedByUnit = (courseId: string): DevMission[] =>
  developmentMissions.filter((m) => m.unlockCourseId === courseId);

/**
 * 単元フィードバックの「次の一歩」の後に置く、発展ミッションの解放通知。
 * 導線は新しい出口を作らず、フィードバックの流れの中で出す（結果画面の出口はフィードバックだけ）。
 * 同一性は一覧・挑戦画面と同じ場面イラストで運ぶ。
 */
export function MissionUnlockNotice({ courseId }: { courseId: string }) {
  const missions = missionsUnlockedByUnit(courseId);
  if (missions.length === 0) return null;
  return (
    <Box sx={{ maxWidth: 760, mt: 4 }}>
      <Typography component="p" sx={{ fontSize: 16, fontWeight: 800, mb: 1 }}>
        新しい挑戦が開きました
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {missions.map((mission) => {
          return (
            <Box
              key={mission.id}
              sx={{
                display: "flex",
                gap: 2,
                p: 2,
                bgcolor: "#fff",
                border: "1px solid #dbe3ef",
                borderRadius: 3,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ width: 200, flexShrink: 0, borderRadius: 2, overflow: "hidden" }}>
                {developmentMissionThumbnailFor(mission.id)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 260 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label="発展ミッション" sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 800 }} />
                  <Chip size="small" label="解放されました" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
                </Box>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mt: 0.75 }}>
                  {mission.title}
                </Typography>
                <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7, mt: 0.5 }}>
                  {mission.problem}
                </Typography>
                <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.5 }}>
                  {mission.unlockUnitName}の単元を終えたので挑戦できます。解き方は決まっていません。この単元で学んだ考え方を、別の課題で使う挑戦です。
                </Typography>
                <Button
                  component={Link}
                  href={`/missions/${mission.id}`}
                  variant="contained"
                  sx={{ mt: 1.5, minHeight: 44, px: 2.5, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                >
                  挑戦する →
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

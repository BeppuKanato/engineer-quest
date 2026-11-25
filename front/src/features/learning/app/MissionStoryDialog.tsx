"use client";
/**
 * 開始前の入口から開くミッションストーリー（オーバーレイ）。
 * 一覧の「ミッションを見る」と単元画面の帯がここを開く。任意に開くものなので
 * 割り込みにはならない。最後まで見たら閲覧フラグが立つ（開始時ゲートは出なくなる）。
 */
import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Chip, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { findLearningUnit } from "@/features/learning/app/unitRegistry";
import { GoalFlag } from "./GoalFlag";
import { missionStoryFor } from "./missionStories";
import { markMissionStorySeen } from "./missionStoryStore";
import { MissionStoryPlayer } from "./MissionStoryPlayer";

export function MissionStoryDialog({ courseId, open, onClose }: {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const unit = courseId ? findLearningUnit(courseId) : undefined;
  const mission = courseId ? findUnitMission(courseId) : undefined;
  const story = courseId ? missionStoryFor(courseId) : null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {unit && mission && story ? (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip label="単元ミッション" size="small" color="primary" sx={{ fontWeight: 800 }} />
              <GoalFlag courseId={unit.courseId} title={mission.title} />
              <Box sx={{ flex: 1 }} />
              <IconButton aria-label="閉じる" onClick={onClose}><CloseIcon /></IconButton>
            </Stack>
            <Typography component="h2" sx={{ mt: 1, fontSize: 22, fontWeight: 900 }}>
              {unit.title}：{mission.title}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <MissionStoryPlayer
                story={story}
                onReachEnd={() => markMissionStorySeen(unit.courseId)}
                lastStepExtra={(
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ fontSize: 16 }}>
                      <Box component="span" sx={{ fontWeight: 800 }}>達成の条件：</Box>
                      {mission.successCondition}
                    </Typography>
                    <Button variant="contained" size="large" onClick={onClose}
                      sx={{ minWidth: 200, height: 48, fontSize: 16, fontWeight: 800 }}>
                      閉じる
                    </Button>
                  </Box>
                )}
              />
            </Box>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 16 }}>この単元のミッションは準備中です。</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

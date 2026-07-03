"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Box, Button, Chip, Collapse, LinearProgress, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Status } from "../type";

type NextRankInfoProps = {
  nextRankInfo: {
    name: string;
  };
  nextRankCondition: Record<string, { title: string; status: Status }[]>;
};

export const NextRankInfo: React.FC<NextRankInfoProps> = ({
  nextRankInfo,
  nextRankCondition,
}) => {
  const [isConditionOpen, setIsConditionOpen] = useState(false);

  const requiredCount = useMemo(
    () => Object.values(nextRankCondition).reduce((sum, items) => sum + items.length, 0),
    [nextRankCondition]
  );
  const incompleteCount = useMemo(
    () =>
      Object.values(nextRankCondition).reduce(
        (total, items) => total + items.filter((item) => item.status === "incomplete").length,
        0
      ),
    [nextRankCondition]
  );

  const completeCount = requiredCount - incompleteCount;
  const nextRankProgress = requiredCount === 0 ? 100 : (completeCount / requiredCount) * 100;

  return (
    <Box>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "#fef3c7",
                color: "#F59E0B",
                display: "grid",
                placeItems: "center",
              }}
            >
              <EmojiEventsIcon fontSize="small" />
            </Box>
            <Typography variant="h5" fontWeight={950}>
              次のランクまで
            </Typography>
          </Stack>
          <Chip
            icon={<LockIcon />}
            label={nextRankInfo.name}
            sx={{
              bgcolor: "#F59E0B",
              color: "#fff",
              fontWeight: 900,
              "& .MuiChip-icon": { color: "#fff" },
            }}
          />
        </Stack>

        <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
          あと
          <Box component="span" sx={{ color: "#F59E0B", fontWeight: 900, mx: 0.5 }}>
            {incompleteCount}つの条件
          </Box>
          を満たすと、{nextRankInfo.name} に昇格できます。
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ mt: 4 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" fontWeight={900} color="text.secondary">
            PROGRESS
          </Typography>
          <Typography sx={{ color: "#F59E0B", fontWeight: 900 }}>
            {completeCount}/{requiredCount}
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={nextRankProgress}
          sx={{
            height: 10,
            borderRadius: 999,
            bgcolor: "#FDE7C2",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              bgcolor: "#F59E0B",
            },
          }}
        />

        <Typography variant="caption" color="text.secondary" textAlign="center">
          {Math.round(nextRankProgress)}% 完了
        </Typography>
      </Stack>

      <Button onClick={() => setIsConditionOpen((prev) => !prev)} sx={{ mt: 1, fontWeight: 900 }}>
        {isConditionOpen ? "閉じる" : "条件を見る"}
      </Button>

      <Collapse in={isConditionOpen}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {Object.entries(nextRankCondition).map(([category, items]) => (
            <Stack key={category} spacing={1}>
              <Typography variant="body2" fontWeight={900}>
                {category}
              </Typography>

              {items.map((item) => (
                <Stack key={item.title} direction="row" spacing={1} alignItems="center">
                  {item.status === "complete" ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                  )}

                  <Typography variant="body2">{item.title}</Typography>
                </Stack>
              ))}
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};

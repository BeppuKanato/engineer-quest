"use client";

import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import LockIcon from "@mui/icons-material/Lock";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getCreateMissions,
  type CreateMission,
} from "@/api/createMissions.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const MissionCard = ({ mission }: { mission: CreateMission }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 2,
      border: "1px solid #e2e8f0",
      bgcolor: mission.isUnlocked ? "#fff" : "#f8fafc",
      opacity: mission.isUnlocked ? 1 : 0.72,
      minHeight: 280,
    }}
  >
    <Stack spacing={2} sx={{ height: "100%" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Chip label={mission.courseTitle} size="small" sx={{ fontWeight: 900 }} />
        <Chip
          icon={mission.isUnlocked ? <AssignmentTurnedInIcon /> : <LockIcon />}
          label={mission.isUnlocked ? "Open" : "Course完了後に開放"}
          size="small"
          color={mission.isUnlocked ? "success" : "default"}
          sx={{ fontWeight: 900 }}
        />
        {mission.workCount > 0 && (
          <Chip label={`Works ${mission.workCount}`} size="small" color="primary" />
        )}
      </Stack>

      <Box>
        <Typography variant="h5" fontWeight={900}>
          {mission.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
          {mission.theme}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
        {mission.description}
      </Typography>

      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={900} sx={{ mb: 1 }}>
          最低条件
        </Typography>
        <Stack spacing={0.75}>
          {mission.minimumRequirements.slice(0, 4).map((requirement) => (
            <Typography key={requirement} variant="body2" color="text.secondary">
              ・{requirement}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Button
        component={Link}
        href={`/create-missions/${encodeURIComponent(mission.id)}`}
        variant="contained"
        disabled={!mission.isUnlocked}
        endIcon={<OpenInNewIcon />}
        sx={{ minHeight: 46, fontWeight: 900, borderRadius: 2 }}
      >
        制作記録を作る
      </Button>
    </Stack>
  </Paper>
);

export default function CreateMissionsPage() {
  const [missions, setMissions] = useState<CreateMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setMissions([]);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getCreateMissions(token);

        if (!isMounted) return;
        setMissions(data);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("Create Missionを取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={900}>
              Create Missions
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Courseで学んだ内容を使って作った制作物を記録します。
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} variant="rounded" height={280} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {missions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

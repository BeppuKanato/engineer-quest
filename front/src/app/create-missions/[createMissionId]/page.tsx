"use client";

import SaveIcon from "@mui/icons-material/Save";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getCreateMission,
  saveUserWork,
  type CreateMission,
} from "@/api/createMissions.api";
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { auth } from "@/lib/firebase";

const splitTechnologies = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export default function CreateMissionDetailPage() {
  const { play } = useSoundEffect();
  const params = useParams<{ createMissionId: string }>();
  const createMissionId = params.createMissionId;
  const [token, setToken] = useState<string | null>(null);
  const [mission, setMission] = useState<CreateMission | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focusPoint, setFocusPoint] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [code, setCode] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedWorkId, setSavedWorkId] = useState<string | null>(null);
  const [ticketMessage, setTicketMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = useMemo(
    () =>
      title.trim() &&
      description.trim() &&
      focusPoint.trim() &&
      code.trim() &&
      splitTechnologies(technologies).length > 0 &&
      mission?.isUnlocked,
    [title, description, focusPoint, code, technologies, mission]
  );

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setToken(null);
        setMission(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const idToken = await user.getIdToken();
        const data = await getCreateMission(idToken, createMissionId);

        if (!isMounted) return;
        setToken(idToken);
        setMission(data);
        setTechnologies(data.suggestedTechnologies.join(", "));
        setCode(data.starterCode ?? "");
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
  }, [createMissionId]);

  const handleSave = async () => {
    if (!token || !canSave) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setTicketMessage(null);
      const result = await saveUserWork(token, createMissionId, {
        title: title.trim(),
        description: description.trim(),
        focusPoint: focusPoint.trim(),
        technologies: splitTechnologies(technologies),
        code,
        isFavorite,
      });

      setSavedWorkId(result.workId);
      if (result.ticketReward) {
        setTicketMessage(
          `Badge Ticket +${result.ticketReward.amount} / 所持 ${result.ticketReward.currentTickets}枚`
        );
      }
      play("saveSuccess");
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("作品を保存できませんでした。入力内容を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1040, py: 4 }}>
        {isLoading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={520} sx={{ borderRadius: 2 }} />
          </Stack>
        ) : (
          <Stack spacing={3}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {ticketMessage && <Alert severity="success">{ticketMessage}</Alert>}
            {savedWorkId && (
              <Alert
                severity="success"
                action={
                  <Button component={Link} href="/my-works" color="inherit" size="small">
                    My Works
                  </Button>
                }
              >
                作品を保存しました。
              </Alert>
            )}

            {mission && (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={mission.courseTitle} sx={{ fontWeight: 900 }} />
                      <Chip
                        label={mission.isUnlocked ? "Open" : "Locked"}
                        color={mission.isUnlocked ? "success" : "default"}
                        sx={{ fontWeight: 900 }}
                      />
                    </Stack>
                    <Box>
                      <Typography variant="h4" fontWeight={900}>
                        {mission.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                        {mission.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography fontWeight={900}>テーマ</Typography>
                      <Typography>{mission.theme}</Typography>
                    </Box>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={900} sx={{ mb: 1 }}>
                          最低条件
                        </Typography>
                        {mission.minimumRequirements.map((item) => (
                          <Typography key={item} variant="body2" color="text.secondary">
                            ・{item}
                          </Typography>
                        ))}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={900} sx={{ mb: 1 }}>
                          発展条件
                        </Typography>
                        {mission.advancedRequirements.map((item) => (
                          <Typography key={item} variant="body2" color="text.secondary">
                            ・{item}
                          </Typography>
                        ))}
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>

                {!mission.isUnlocked && (
                  <Alert severity="info">
                    このCreate Missionは関連Courseの基礎Missionを完了すると開放されます。
                  </Alert>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Stack spacing={2}>
                    <TextField
                      label="作品名"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="作品説明"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                    <TextField
                      label="こだわりポイント"
                      value={focusPoint}
                      onChange={(event) => setFocusPoint(event.target.value)}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                    <TextField
                      label="使用技術（カンマ区切り）"
                      value={technologies}
                      onChange={(event) => setTechnologies(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="コード抜粋 / 制作メモ"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      fullWidth
                      multiline
                      minRows={12}
                      sx={{ "& textarea": { fontFamily: "monospace" } }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isFavorite}
                          onChange={(event) => setIsFavorite(event.target.checked)}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <StarBorderIcon fontSize="small" />
                          <span>お気に入りにする</span>
                        </Stack>
                      }
                    />
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SaveIcon />}
                      disabled={!canSave || isSaving}
                      onClick={handleSave}
                      sx={{ minHeight: 52, fontWeight: 900, borderRadius: 2 }}
                    >
                      {isSaving ? "保存中..." : "作品を保存する"}
                    </Button>
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

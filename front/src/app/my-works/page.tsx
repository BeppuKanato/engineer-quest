"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import {
  deleteUserWork,
  getUserWorks,
  reviewUserWork,
  updateUserWork,
  type UserWork,
} from "@/api/createMissions.api";
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { auth } from "@/lib/firebase";

const splitTechnologies = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const WorkCard = ({
  token,
  work,
  onChanged,
}: {
  token: string;
  work: UserWork;
  onChanged: () => Promise<void>;
}) => {
  const { play } = useSoundEffect();
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description);
  const [focusPoint, setFocusPoint] = useState(work.focusPoint);
  const [technologies, setTechnologies] = useState(work.technologies.join(", "));
  const [code, setCode] = useState(work.code);
  const [isFavorite, setIsFavorite] = useState(work.isFavorite);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);
      await updateUserWork(token, work.id, {
        title: title.trim(),
        description: description.trim(),
        focusPoint: focusPoint.trim(),
        technologies: splitTechnologies(technologies),
        code,
        isFavorite,
      });
      setMessage("作品を更新しました。");
      play("saveSuccess");
      await onChanged();
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("作品を更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("この作品を削除しますか？")) return;

    try {
      setErrorMessage(null);
      await deleteUserWork(token, work.id);
      play("saveSuccess");
      await onChanged();
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("作品を削除できませんでした。");
    }
  };

  const handleReview = async () => {
    try {
      setIsReviewing(true);
      setMessage(null);
      setErrorMessage(null);
      const result = await reviewUserWork(token, work.id);
      setMessage(
        result.ticketReward
          ? `AIレビューを保存しました。Badge Ticket +${result.ticketReward.amount} / 所持 ${result.ticketReward.currentTickets}枚`
          : "AIレビューを保存しました。"
      );
      play(result.ticketReward ? "ticket" : "saveSuccess");
      await onChanged();
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("AIレビューを実行できませんでした。");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={work.courseTitle} sx={{ fontWeight: 900 }} />
            <Chip label={work.createMissionTitle} variant="outlined" />
            {isFavorite && <Chip icon={<StarIcon />} label="Favorite" color="warning" />}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            更新 {formatDateTime(work.updatedAt)}
          </Typography>
        </Stack>

        {message && <Alert severity="success">{message}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField label="作品名" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth />
        <TextField
          label="作品説明"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="こだわりポイント"
          value={focusPoint}
          onChange={(event) => setFocusPoint(event.target.value)}
          fullWidth
          multiline
          minRows={2}
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
          minRows={8}
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
              {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              <span>お気に入り</span>
            </Stack>
          }
        />

        {work.latestReview && (
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              最新AIレビュー
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <b>良い点:</b> {work.latestReview.goodPoints}
              </Typography>
              <Typography variant="body2">
                <b>改善できる点:</b> {work.latestReview.improvements}
              </Typography>
              <Typography variant="body2">
                <b>次に試すとよいこと:</b> {work.latestReview.nextTry}
              </Typography>
            </Stack>
          </Box>
        )}

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSaving}
            onClick={handleSave}
            sx={{ minHeight: 46, fontWeight: 900, borderRadius: 2 }}
          >
            {isSaving ? "保存中..." : "編集を保存"}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            disabled={isReviewing}
            onClick={handleReview}
            sx={{ minHeight: 46, fontWeight: 900, borderRadius: 2 }}
          >
            {isReviewing ? "レビュー中..." : "AIレビュー"}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{ minHeight: 46, fontWeight: 900, borderRadius: 2 }}
          >
            削除
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default function MyWorksPage() {
  const [token, setToken] = useState<string | null>(null);
  const [works, setWorks] = useState<UserWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshWorks = async (idToken: string) => {
    const data = await getUserWorks(idToken);
    setWorks(data);
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setToken(null);
        setWorks([]);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const idToken = await user.getIdToken();

        if (!isMounted) return;
        setToken(idToken);
        await refreshWorks(idToken);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("My Worksを取得できませんでした。");
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
      <Container maxWidth={false} sx={{ maxWidth: 1040, py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={900}>
              My Works
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Create Missionで保存した制作記録を見返せます。
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <Stack spacing={2}>
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          ) : works.length === 0 ? (
            <Alert severity="info">まだ保存された作品がありません。</Alert>
          ) : (
            <Stack spacing={2}>
              {works.map((work) =>
                token ? (
                  <WorkCard
                    key={work.id}
                    token={token}
                    work={work}
                    onChanged={() => refreshWorks(token)}
                  />
                ) : null
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

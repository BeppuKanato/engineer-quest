"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import PublicIcon from "@mui/icons-material/Public";
import PublicOffIcon from "@mui/icons-material/PublicOff";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { deleteMyWork, getMyWork, shareMyWork, unshareMyWork, type CreateWork } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const formatDate = (value: string) => new Date(value).toLocaleString("ja-JP");

export default function MyWorkDetailPage() {
  const params = useParams<{ workId: string }>();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [work, setWork] = useState<CreateWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (idToken: string) => {
    const data = await getMyWork(idToken, params.workId);
    setWork(data);
  }, [params.workId]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!mounted) return;
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const idToken = await user.getIdToken();
        if (!mounted) return;
        setToken(idToken);
        await load(idToken);
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setErrorMessage("制作記録を取得できませんでした。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [load]);

  const mutate = async (action: () => Promise<unknown>) => {
    if (!token) return;
    try {
      setIsMutating(true);
      setErrorMessage(null);
      await action();
      await load(token);
    } catch (error) {
      console.error(error);
      setErrorMessage("操作に失敗しました。");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !window.confirm("この制作記録を削除しますか？")) return;
    await deleteMyWork(token, params.workId);
    router.push("/my-works");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1040, py: 4 }}>
        {isLoading ? (
          <Skeleton variant="rounded" height={620} sx={{ borderRadius: 2 }} />
        ) : (
          <Stack spacing={3}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {work && (
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        <Chip label={work.themeTitle} sx={{ fontWeight: 800 }} />
                        <Chip label={work.status === "COMPLETED" ? "完成" : "下書き"} color={work.status === "COMPLETED" ? "success" : "default"} />
                        <Chip label={work.visibility === "SHARED" ? "共有中" : "非公開"} color={work.visibility === "SHARED" ? "primary" : "default"} />
                      </Stack>
                      <Typography variant="h3" fontWeight={900}>{work.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>更新: {formatDate(work.updatedAt)}</Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button component={Link} href={`/my-works/${encodeURIComponent(work.id)}/edit`} variant="outlined" startIcon={<EditIcon />} sx={{ fontWeight: 900 }}>編集</Button>
                      {work.visibility === "SHARED" ? (
                        <Button disabled={isMutating} onClick={() => mutate(() => unshareMyWork(token!, work.id))} variant="outlined" startIcon={<PublicOffIcon />} sx={{ fontWeight: 900 }}>非公開にする</Button>
                      ) : (
                        <Button disabled={isMutating} onClick={() => mutate(() => shareMyWork(token!, work.id))} variant="contained" startIcon={<PublicIcon />} sx={{ fontWeight: 900 }}>共有する</Button>
                      )}
                    </Stack>
                  </Stack>

                  <Typography sx={{ lineHeight: 1.8 }}>{work.description}</Typography>
                  {work.learnedNote && (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fbff", border: "1px solid #dbeafe" }}>
                      <Typography fontWeight={900}>学んだこと・工夫したこと</Typography>
                      <Typography sx={{ mt: 1, lineHeight: 1.8 }}>{work.learnedNote}</Typography>
                    </Box>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap">{work.techStack.map((tag) => <Chip key={tag} label={tag} />)}</Stack>
                  {(work.publicUrl || work.repositoryUrl) && (
                    <Stack spacing={1}>
                      {work.publicUrl && <Button href={work.publicUrl} target="_blank" rel="noopener noreferrer" startIcon={<LinkIcon />} sx={{ alignSelf: "flex-start" }}>公開URLを開く</Button>}
                      {work.repositoryUrl && <Button href={work.repositoryUrl} target="_blank" rel="noopener noreferrer" startIcon={<LinkIcon />} sx={{ alignSelf: "flex-start" }}>リポジトリを開く</Button>}
                    </Stack>
                  )}
                  <Divider />
                  <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleDelete} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
                    削除
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

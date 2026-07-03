"use client";

import { Alert, Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyWork, updateMyWork, type CreateWork, type CreateWorkPayload } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateWorkForm } from "@/app/create/_components/createWorkForm";
import { auth } from "@/lib/firebase";

export default function MyWorkEditPage() {
  const params = useParams<{ workId: string }>();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [work, setWork] = useState<CreateWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        const data = await getMyWork(idToken, params.workId);
        if (!mounted) return;
        setToken(idToken);
        setWork(data);
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
  }, [params.workId]);

  const handleSubmit = async (payload: CreateWorkPayload) => {
    if (!token) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await updateMyWork(token, params.workId, payload);
      router.push(`/my-works/${encodeURIComponent(params.workId)}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("制作記録を更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1040, py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3" fontWeight={900}>制作記録を編集</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>作った内容やチェック状態を更新できます。</Typography>
          </Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {isLoading || !work ? (
            <Skeleton variant="rounded" height={680} sx={{ borderRadius: 2 }} />
          ) : (
            <CreateWorkForm
              theme={work.theme}
              initialWork={work}
              isSaving={isSaving}
              submitLabel="変更を保存"
              onSubmit={handleSubmit}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
}

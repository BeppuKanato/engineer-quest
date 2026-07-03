"use client";

import { Alert, Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createMyWork, getCreateTheme, type CreateTheme, type CreateWorkPayload } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateWorkForm } from "@/app/create/_components/createWorkForm";
import { auth } from "@/lib/firebase";

export default function CreateThemeWorkPage() {
  const params = useParams<{ themeId: string }>();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<CreateTheme | null>(null);
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
        const data = await getCreateTheme(idToken, params.themeId);
        if (!mounted) return;
        setToken(idToken);
        setTheme(data);
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setErrorMessage("制作テーマを取得できませんでした。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [params.themeId]);

  const handleSubmit = async (payload: CreateWorkPayload) => {
    if (!token) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const result = await createMyWork(token, params.themeId, payload);
      router.push(`/my-works/${encodeURIComponent(result.workId)}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("制作記録を保存できませんでした。保存上限は10件です。");
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
            <Typography variant="h3" fontWeight={900}>制作記録を作る</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              完成前でも保存できます。あとからMy Worksで編集できます。
            </Typography>
          </Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {isLoading || !theme ? (
            <Skeleton variant="rounded" height={680} sx={{ borderRadius: 2 }} />
          ) : (
            <CreateWorkForm theme={theme} isSaving={isSaving} submitLabel="制作記録を保存" onSubmit={handleSubmit} />
          )}
        </Stack>
      </Container>
    </Box>
  );
}

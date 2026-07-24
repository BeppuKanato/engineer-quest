"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ForumIcon from "@mui/icons-material/Forum";
import LinkIcon from "@mui/icons-material/Link";
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

import { deleteMyWork, getMyWork, type CreateWork } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { ActionButton } from "@/app/component/actionButton";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { ImagePreviewDialog } from "@/app/create/_components/imagePreviewDialog";
import { buildWorkShareHref } from "@/app/my-works/_utils/workShare";
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
  const [preview, setPreview] = useState<{ title: string; src?: string | null } | null>(null);

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

  const handleDelete = async () => {
    if (!token || !window.confirm("この制作記録を削除しますか？")) return;
    try {
      setIsMutating(true);
      setErrorMessage(null);
      await deleteMyWork(token, params.workId);
      router.push("/my-works");
    } catch (error) {
      console.error(error);
      setErrorMessage("削除に失敗しました。もう一度試してください。");
      setIsMutating(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1200, py: 4 }}>
        {isLoading ? (
          <Skeleton variant="rounded" height={620} sx={{ borderRadius: 2 }} />
        ) : (
          <Stack spacing={3}>
            <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: "My Works", href: "/my-works" }, { label: "作品詳細" }]} />
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {work && (
              <>
                <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.95fr 1.05fr" }, gap: 3 }}>
                    <CreateThumbnail
                      src={work.imageUrl || work.theme.defaultThumbnailUrl}
                      alt={`${work.title}の作品画像`}
                      height={320}
                      onClick={() => setPreview({ title: `${work.title}の作品画像`, src: work.imageUrl || work.theme.defaultThumbnailUrl })}
                    />
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={work.status === "COMPLETED" ? "完成" : "下書き"} color={work.status === "COMPLETED" ? "success" : "default"} sx={{ fontWeight: 800 }} />
                        <Chip label={work.visibility === "SHARED" ? "掲示板共有済み" : "未共有"} color={work.visibility === "SHARED" ? "primary" : "default"} sx={{ fontWeight: 800 }} />
                        <Chip label={work.themeTitle} sx={{ fontWeight: 800 }} />
                      </Stack>
                      <Box>
                        <Typography variant="h3" fontWeight={900}>
                          {work.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                          更新日 {formatDate(work.updatedAt)}
                        </Typography>
                      </Box>
                      <Typography sx={{ lineHeight: 1.8 }}>{work.description}</Typography>
                      <Alert severity="info">
                        My Worksは制作物の管理場所です。ほかの学習者に見せたい場合は、作品共有として掲示板へ投稿してください。
                      </Alert>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {work.techStack.map((tag) => (
                          <Chip key={tag} label={tag} sx={{ bgcolor: "#eef2ff", color: "#1d4ed8", fontWeight: 800 }} />
                        ))}
                      </Stack>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button component={Link} href={`/my-works/${encodeURIComponent(work.id)}/edit`} variant="outlined" startIcon={<EditIcon />} sx={{ fontWeight: 900 }}>
                          編集
                        </Button>
                        <Button
                          component={Link}
                          href={buildWorkShareHref(work)}
                          variant={work.visibility === "SHARED" ? "outlined" : "contained"}
                          startIcon={<ForumIcon />}
                          sx={{ fontWeight: 900 }}
                        >
                          {work.visibility === "SHARED" ? "再共有する" : "掲示板で共有する"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                    <Typography variant="h5" fontWeight={900}>
                      学んだこと・工夫したこと
                    </Typography>
                    <Typography sx={{ mt: 1.5, lineHeight: 1.8 }}>
                      {work.learnedNote || "まだ記録されていません。"}
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                    <Typography variant="h5" fontWeight={900}>
                      テーマの参考画像
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <CreateThumbnail
                        src={work.theme.defaultThumbnailUrl}
                        alt={`${work.themeTitle}の参考画像`}
                        height={170}
                        onClick={() => setPreview({ title: `${work.themeTitle}の参考画像`, src: work.theme.defaultThumbnailUrl })}
                      />
                    </Box>
                  </Paper>
                </Box>

                {(work.publicUrl || work.repositoryUrl) && (
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                    <Stack spacing={1}>
                      {work.publicUrl && (
                        <Button href={work.publicUrl} target="_blank" rel="noopener noreferrer" startIcon={<LinkIcon />} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
                          公開URLを開く
                        </Button>
                      )}
                      {work.repositoryUrl && (
                        <Button href={work.repositoryUrl} target="_blank" rel="noopener noreferrer" startIcon={<LinkIcon />} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
                          リポジトリを開く
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                )}

                <Divider />
                <ActionButton color="error" variant="outlined" loading={isMutating} loadingLabel="削除中..." startIcon={<DeleteIcon />} onClick={handleDelete} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
                  削除
                </ActionButton>
                <ImagePreviewDialog
                  open={Boolean(preview)}
                  title={preview?.title ?? ""}
                  src={preview?.src}
                  onClose={() => setPreview(null)}
                />
              </>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

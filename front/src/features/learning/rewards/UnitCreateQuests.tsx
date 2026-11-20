"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getUnitCreateQuests, type UnitCreateQuest } from "@/api/create.api";
import { useUserSession } from "@/app/component/userSession";

export function UnitCreateQuestLinks({ quests }: { quests: readonly UnitCreateQuest[] }) {
  if (!quests.length) return null;
  return <Box component="section" aria-label="作るで試す" data-unit-create-quests
    sx={{ width: "100%", maxWidth: 640, p: 2, border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff" }}>
    <Typography component="h2" fontSize={20} fontWeight={800}>作るで試す</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>この単元で学んだことを、関連するクエストで試してみましょう。</Typography>
    <Stack spacing={1} alignItems="flex-start" sx={{ mt: 2 }}>{quests.map(quest =>
      <Button key={quest.id} component={Link} href={`/create/quests/${encodeURIComponent(quest.id)}`} variant="outlined"
        sx={{ textAlign: "left", whiteSpace: "normal" }}>{quest.title}</Button>,
    )}</Stack>
  </Box>;
}

/** 最終結果のrenderRewardsだけで取得・表示する。完了保存やフィードバックからは独立。 */
export function UnitCreateQuests({ courseId }: { courseId: string }) {
  const { token, status } = useUserSession();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ token: string; courseId: string; items?: UnitCreateQuest[]; failed?: boolean } | null>(null);
  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let active = true;
    void getUnitCreateQuests(token, courseId).then(
      data => { if (active) setState({ token, courseId, items: data.items }); },
      () => { if (active) setState({ token, courseId, failed: true }); },
    );
    return () => { active = false; };
  }, [token, status, courseId, revision]);
  const current = status === "authenticated" && state?.token === token && state?.courseId === courseId ? state : null;
  if (current?.failed) return <Alert severity="info" action={<Button onClick={() => setRevision(value => value + 1)}>再読み込み</Button>}>作るのクエストを取得できませんでした。ほかの操作は続けられます。</Alert>;
  return current?.items ? <UnitCreateQuestLinks quests={current.items} /> : null;
}

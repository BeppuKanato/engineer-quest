import { Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export function RelatedQuestLinks({ quests }: { quests: readonly { id: string; title: string }[] }) {
  if (!quests.length) return null;
  return <Box data-card-use-places sx={{ borderTop: "1px solid #e2e8f0", pt: 2 }}>
    <Typography fontWeight={900} mb={1}>使える場所</Typography>
    <Stack spacing={1} alignItems="flex-start">{quests.map(quest => <Button key={quest.id} component={Link} href={`/create/quests/${encodeURIComponent(quest.id)}`} variant="outlined" sx={{ textAlign: "left" }}>{quest.title}</Button>)}</Stack>
  </Box>;
}

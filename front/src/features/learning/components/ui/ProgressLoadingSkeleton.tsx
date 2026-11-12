import { Box, Skeleton, Stack } from "@mui/material";

/** 進捗の読み込み中を、読み込み後の形に近いスケルトンで示す（#175）。
 * role="status" と読み上げ用の文言は維持し、見た目だけを素のテキストから置き換える。 */
export function ProgressLoadingSkeleton({ variant }: { variant: "screen" | "overview" }) {
  return <Box role="status" aria-label="進捗を読み込んでいます。" sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: variant === "screen" ? { xs: 2, md: 3 } : 0, pt: variant === "overview" ? 2 : undefined }}>
    <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>進捗を読み込んでいます。</Box>
    {variant === "screen" ? <>
      <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap sx={{ flexWrap: "wrap", mb: 2 }}>
        <Skeleton variant="rounded" width={180} height={28} />
        {Array.from({ length: 7 }, (_, index) => <Skeleton key={index} variant="rounded" width={92} height={32} sx={{ borderRadius: 999 }} />)}
      </Stack>
      <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 320, borderRadius: 2 }} />
    </> : <>
      <Skeleton variant="text" width="72%" height={28} />
      <Skeleton variant="text" width="48%" height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={10} sx={{ borderRadius: 999, mb: 3 }} />
      <Skeleton variant="rounded" height={460} sx={{ borderRadius: "24px" }} />
    </>}
  </Box>;
}

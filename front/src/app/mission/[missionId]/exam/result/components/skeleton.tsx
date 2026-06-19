import { Box, Card, Skeleton, Stack } from "@mui/material";

export const MissionExamResultSkeleton = () => {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 5,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Stack spacing={2.5} alignItems="stretch">
        <Box sx={{ textAlign: "center" }}>
          <Skeleton
            variant="rounded"
            width={180}
            height={32}
            sx={{ mx: "auto", mb: 2, borderRadius: 999 }}
          />
          <Skeleton
            variant="circular"
            width={96}
            height={96}
            sx={{ mx: "auto", mb: 2 }}
          />
          <Skeleton
            variant="text"
            width="70%"
            height={52}
            sx={{ mx: "auto" }}
          />
          <Skeleton
            variant="text"
            width="56%"
            height={32}
            sx={{ mx: "auto" }}
          />
        </Box>

        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 1.2,
          }}
        >
          <Skeleton variant="rounded" height={74} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={74} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={74} sx={{ borderRadius: 3 }} />
        </Box>

        <Skeleton variant="rounded" height={52} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={52} sx={{ borderRadius: 3 }} />
      </Stack>
    </Card>
  );
};

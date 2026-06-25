import { Box, Paper, Skeleton, Stack } from "@mui/material";

export const CourseSkeleton: React.FC = () => {
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Skeleton variant="text" width={180} height={36} />
        <Skeleton variant="text" width={32} height={22} />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((courseIndex) => (
          <Paper
            key={courseIndex}
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: "#fff",
              boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
              overflow: "hidden",
              border: "1px solid #dbe3ef",
            }}
          >
            <Box sx={{ p: 2, bgcolor: "#f1f5f9" }}>
              <Skeleton variant="rounded" width="100%" height={120} />
            </Box>

            <Stack spacing={2} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={78} height={24} />
                <Skeleton variant="rounded" width={90} height={24} />
              </Stack>

              <Box>
                <Skeleton variant="text" width="86%" height={30} />
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="72%" height={20} />
              </Box>

              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={72} height={24} />
                <Skeleton variant="rounded" width={84} height={24} />
              </Stack>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Skeleton variant="text" width={36} height={18} />
                  <Skeleton variant="text" width={48} height={18} />
                </Stack>
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={8}
                  sx={{ borderRadius: 999 }}
                />
              </Box>

              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={86} height={24} />
                <Skeleton variant="rounded" width={86} height={24} />
              </Stack>

              <Skeleton variant="rounded" width="100%" height={46} />
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
};

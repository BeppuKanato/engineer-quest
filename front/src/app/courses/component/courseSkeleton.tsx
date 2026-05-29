import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Paper, Skeleton, Stack } from "@mui/material";

export const CourseSkeleton: React.FC = () => {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Skeleton variant="text" width={180} height={36} />
        <Skeleton variant="text" width={32} height={22} />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          bgcolor: "#fff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={2}
            >
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={220} height={32} />
                <Skeleton variant="text" width={420} height={22} sx={{ mt: 0.5 }} />

                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 999 }} />
                  <Skeleton variant="rounded" width={84} height={24} sx={{ borderRadius: 999 }} />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 999 }} />
                <Skeleton variant="rounded" width={96} height={24} sx={{ borderRadius: 999 }} />
                <ExpandMoreIcon sx={{ color: "#cbd5e1" }} />
              </Stack>
            </Stack>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Skeleton variant="text" width={36} height={18} />
                <Skeleton variant="text" width={32} height={18} />
              </Stack>

              <Skeleton
                variant="rounded"
                width="100%"
                height={8}
                sx={{ borderRadius: 999 }}
              />
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            bgcolor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            p: 2.5,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{
              overflowX: "hidden",
              pb: 1,
            }}
          >
            {[0, 1, 2].map((index) => (
              <MissionCardSkeleton key={index} />
            ))}
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
};

const MissionCardSkeleton: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: 260,
        minWidth: 260,
        height: 320,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Skeleton variant="rounded" width="100%" height={110} sx={{ borderRadius: 0 }} />

      <Box sx={{ p: 1.5 }}>
        <Skeleton variant="rounded" width={68} height={22} sx={{ borderRadius: 999 }} />

        <Box sx={{ mt: 1 }}>
          <Skeleton variant="text" width="86%" height={26} />
          <Skeleton variant="text" width="72%" height={24} />

          <Skeleton variant="text" width="96%" height={20} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="82%" height={20} />

          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            <Skeleton variant="rounded" width={56} height={22} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rounded" width={68} height={22} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2 }} />
        </Stack>
      </Box>
    </Paper>
  );
};
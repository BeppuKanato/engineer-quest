import {
  Box,
  Card,
  LinearProgress,
  Skeleton,
  Stack,
} from "@mui/material";

export const LessonCompleteSkeleton = () => {
  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 760,
        mx: "auto",
        px: { xs: 3, md: 5 },
        py: { xs: 4, md: 5 },
        borderRadius: 5,
        bgcolor: "rgba(255, 255, 255, 0.97)",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.12)",
        border: "1px solid rgba(25, 118, 210, 0.08)",
      }}
    >
      <Stack alignItems="center">
        <Skeleton
          variant="rounded"
          width={120}
          height={30}
          sx={{ borderRadius: 999 }}
        />

        <Skeleton
          variant="circular"
          width={112}
          height={112}
          sx={{ mt: 3 }}
        />

        <Skeleton
          variant="text"
          height={64}
          sx={{ 
            mt: 2 ,
            width: { xs: 220, md: 320 },
          }}
        />

        <Skeleton
          variant="text"
          height={34}
          sx={{
            width: { xs: 240, md: 360 },
          }}
        />

        <Skeleton
          variant="text"
          height={24}
          sx={{ 
            mt: 0.5,
            width: { xs: 260, md: 420 }, 
        }}
        />
      </Stack>

      <Skeleton
        variant="rounded"
        height={150}
        sx={{
          mt: 4,
          borderRadius: 4,
        }}
      />

      <Box sx={{ mt: 4 }}>
        <Skeleton variant="text" width={110} height={30} />

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Skeleton
            variant="rounded"
            height={64}
            sx={{ borderRadius: 3 }}
          />
          <Skeleton
            variant="rounded"
            height={64}
            sx={{ borderRadius: 3 }}
          />
          <Skeleton
            variant="rounded"
            height={64}
            sx={{ borderRadius: 3 }}
          />
        </Stack>
      </Box>

      <Skeleton
        variant="rounded"
        height={82}
        sx={{
          mt: 4,
          borderRadius: 3,
        }}
      />

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Skeleton variant="text" width={90} height={22} />
          <Skeleton variant="text" width={150} height={22} />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={68}
          sx={{
            height: 8,
            borderRadius: 999,
            bgcolor: "#E5E7EB",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              bgcolor: "#CBD5E1",
            },
          }}
        />
      </Box>

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        <Skeleton
          variant="rounded"
          height={54}
          sx={{ borderRadius: 2 }}
        />

        <Skeleton
          variant="rounded"
          height={52}
          sx={{ borderRadius: 2 }}
        />

        <Skeleton
          variant="text"
          width={180}
          height={34}
          sx={{ alignSelf: "center" }}
        />
      </Stack>
    </Card>
  );
};
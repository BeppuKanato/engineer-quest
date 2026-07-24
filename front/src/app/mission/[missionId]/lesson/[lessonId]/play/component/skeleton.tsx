import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

export const LessonPlaySkeleton = () => {
  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
        <LessonHeaderSkeleton />

        <LessonActivitySkeleton />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Skeleton
            variant="rounded"
            width={132}
            height={56}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Stack>
  );
};

const LessonHeaderSkeleton = () => {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Skeleton width={150} height={20} />
            <Skeleton width="44%" height={42} sx={{ mt: 0.5 }} />
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton
              variant="rounded"
              height={10}
              sx={{
                flex: 1,
                borderRadius: 999,
              }}
            />
            <Skeleton width={34} height={22} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const LessonActivitySkeleton = () => {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          bgcolor: "#dbeafe",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Skeleton
              variant="rounded"
              width={96}
              height={28}
              sx={{ borderRadius: 999 }}
            />
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={56} height={56} />

            <Skeleton
              variant="rounded"
              height={42}
              sx={{ 
                    width: { xs: "72%", md: 430 },
                    borderRadius: 999 
                }}
            />
          </Stack>

          <Box>
            <Skeleton width="36%" height={36} />
            <Skeleton width="54%" height={24} sx={{ mt: 0.5 }} />
          </Box>

          <Box
            sx={{
              borderTop: "1px solid #e2e8f0",
              pt: 2.5,
            }}
          >
            <Skeleton width={96} height={26} sx={{ mb: 1.5 }} />

            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 3,
                bgcolor: "#f8fafc",
                p: { xs: 2, md: 2.5 },
              }}
            >
              <Box
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  minHeight: 170,
                }}
              >
                <Skeleton
                  variant="rounded"
                  height={118}
                  sx={{
                    width: { xs: "80%", md: 360 }, 
                    borderRadius: 2 }}
                />
              </Box>
            </Box>

            <Skeleton width="30%" height={22} sx={{ mt: 1.5 }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

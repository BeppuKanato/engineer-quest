import { Box, Card, CardContent, Grid, Skeleton, Stack } from "@mui/material";

export const MissionOverviewSkeleton: React.FC = () => {
  return (
    <Grid container spacing={3} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 4 }}>
        <MissionSummarySkeleton />
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <LessonRoadmapSkeleton />
      </Grid>
    </Grid>
  );
};

const MissionSummarySkeleton: React.FC = () => {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e2e8f0",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Skeleton variant="text" width="88%" height={44} />
            <Skeleton variant="text" width="66%" height={44} />

            <Skeleton
              variant="text"
              width="92%"
              height={24}
              sx={{ mt: 1 }}
            />
            <Skeleton variant="text" width="78%" height={24} />
          </Box>

          <Skeleton
            variant="rounded"
            width="100%"
            height={160}
            sx={{
              borderRadius: 3,
            }}
          />

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Skeleton
              variant="rounded"
              width={112}
              height={28}
              sx={{ borderRadius: 999 }}
            />
            <Skeleton
              variant="rounded"
              width={76}
              height={28}
              sx={{ borderRadius: 999 }}
            />
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Skeleton variant="text" width={36} height={18} />
              <Skeleton variant="text" width={34} height={18} />
            </Stack>

            <Skeleton
              variant="rounded"
              width="100%"
              height={9}
              sx={{ borderRadius: 999 }}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <Skeleton variant="text" width={82} height={18} />
            <Skeleton
              variant="text"
              width="72%"
              height={28}
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Skeleton
            variant="rounded"
            width="100%"
            height={48}
            sx={{ borderRadius: 2.5 }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

const LessonRoadmapSkeleton: React.FC = () => {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e2e8f0",
        overflow: "visible",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={0}>
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width={180} height={36} />
            <Skeleton variant="text" width={360} height={22} sx={{ mt: 0.5 }} />
          </Box>

          <Stack alignItems="center" spacing={0}>
            <RoadmapNodeSkeleton side="right" isCurrent />
            <RoadmapLineSkeleton />

            <RoadmapNodeSkeleton side="left" />
            <RoadmapLineSkeleton />

            <RoadmapNodeSkeleton side="right" type="exam" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

type RoadmapNodeSkeletonProps = {
  side: "left" | "right";
  type?: "lesson" | "exam";
  isCurrent?: boolean;
};

const RoadmapNodeSkeleton: React.FC<RoadmapNodeSkeletonProps> = ({
  side,
  type = "lesson",
  isCurrent = false,
}) => {
  const nodeSize = type === "exam" ? 78 : 70;

  return (
    <Box
      sx={{
        width: { xs: 300, md: 460 },
        minHeight: 104,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          transform:
            side === "right" ? "translateX(-52px)" : "translateX(52px)",
        }}
      >
        {isCurrent && (
          <Skeleton
            variant="rounded"
            width={76}
            height={34}
            sx={{
              borderRadius: 2,
              position: "absolute",
              top: -44,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        )}

        <Skeleton
          variant="circular"
          width={nodeSize}
          height={nodeSize}
          sx={{
            boxShadow: "0 9px 0 rgba(15, 23, 42, 0.08)",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: 180,
          ...(side === "right"
            ? {
                left: "calc(50% + 36px)",
                textAlign: "left",
              }
            : {
                right: "calc(50% + 36px)",
                textAlign: "right",
              }),
        }}
      >
        <Skeleton variant="text" width={160} height={28} />

        {type === "exam" && (
          <Skeleton
            variant="text"
            width={76}
            height={18}
            sx={{
              ml: side === "right" ? 0 : "auto",
            }}
          />
        )}
      </Box>
    </Box>
  );
};

const RoadmapLineSkeleton: React.FC = () => {
  return (
    <Skeleton
      variant="rounded"
      width={8}
      height={42}
      sx={{
        borderRadius: 999,
        mx: "auto",
        my: 0.5,
      }}
    />
  );
};
"use client";

import React from "react";
import { Box, Card, Container, Grid, Paper, Skeleton, Stack } from "@mui/material";

export const MissionExamPlaySkeleton: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <HeaderSkeleton />

      <Grid container spacing={2.5} sx={{ mt: 2.5 }} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }}>
          <EditorSkeleton />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SidePanelSkeleton />
        </Grid>
      </Grid>

      <ResultMessageSkeleton />

      <ActionsSkeleton />
    </Container>
  );
};

const HeaderSkeleton: React.FC = () => {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        border: "1px solid #dbeafe",
        bgcolor: "#fff",
        boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 220px" },
          gap: { xs: 2.5, md: 4 },
          alignItems: "center",
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
            <Skeleton
              variant="circular"
              animation="wave"
              sx={{ width: 38, height: 38 }}
            />
            <Skeleton
              variant="text"
              animation="wave"
              sx={{ width: 110, height: 24, borderRadius: 2 }}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{ width: 70, height: 24, borderRadius: 999 }}
            />
          </Stack>

          <Skeleton
            variant="text"
            animation="wave"
            sx={{
              width: { xs: "90%", md: 420 },
              height: 46,
              borderRadius: 2,
              mb: 1,
            }}
          />

          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: { xs: "100%", md: 760 }, height: 24, borderRadius: 2 }}
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: { xs: "92%", md: 620 }, height: 24, borderRadius: 2 }}
          />

          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{
              width: { xs: "100%", sm: 360 },
              height: 38,
              borderRadius: 3,
              mt: 2,
            }}
          />
        </Box>

        <Box
          sx={{
            justifySelf: { xs: "stretch", md: "center" },
            width: { xs: "100%", md: 180 },
            p: 1.3,
            borderRadius: 3,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: 70, height: 20, borderRadius: 2, mb: 1 }}
          />

          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{
              width: "100%",
              height: 104,
              borderRadius: 3,
            }}
          />

          <Skeleton
            variant="text"
            animation="wave"
            sx={{ mx: "auto", mt: 1, width: 120, height: 20, borderRadius: 2 }}
          />
        </Box>
      </Box>
    </Card>
  );
};

const EditorSkeleton: React.FC = () => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid #dbeafe",
        overflow: "hidden",
        boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.4,
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Skeleton
          variant="text"
          animation="wave"
          sx={{ width: 110, height: 24, borderRadius: 2 }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "56px 1fr",
          minHeight: 430,
          maxHeight: 520,
          bgcolor: "#0f172a",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            bgcolor: "rgba(15, 23, 42, 0.72)",
            py: 2,
            px: 1,
          }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              animation="wave"
              sx={{
                ml: "auto",
                width: 20,
                height: 24,
                borderRadius: 1,
                bgcolor: "rgba(148, 163, 184, 0.16)",
              }}
            />
          ))}
        </Box>

        <Box sx={{ p: 2 }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              animation="wave"
              sx={{
                width:
                  index === 0
                    ? "72%"
                    : index === 1
                      ? "96%"
                      : index === 2
                        ? "58%"
                        : index === 3
                          ? "88%"
                          : index === 4
                            ? "68%"
                            : index === 5
                              ? "42%"
                              : "24%",
                height: 24,
                borderRadius: 1,
                bgcolor: "rgba(226, 232, 240, 0.14)",
              }}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
};

const SidePanelSkeleton: React.FC = () => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid #dbeafe",
        overflow: "hidden",
        boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid #e2e8f0",
          bgcolor: "#f8fafc",
        }}
      >
        <Box sx={{ py: 1.5, px: 2, borderBottom: "2px solid #1976d2" }}>
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ mx: "auto", width: 90, height: 24, borderRadius: 2 }}
          />
        </Box>
        <Box sx={{ py: 1.5, px: 2 }}>
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ mx: "auto", width: 90, height: 24, borderRadius: 2 }}
          />
        </Box>
      </Box>

      <Box sx={{ p: 2, flex: 1 }}>
        <Skeleton
          variant="text"
          animation="wave"
          sx={{ width: 140, height: 26, borderRadius: 2, mb: 1.5 }}
        />

        <Paper
          elevation={0}
          sx={{
            minHeight: 390,
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            bgcolor: "#eef4ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Box
            sx={{
              width: { xs: 190, sm: 230 },
              p: 3,
              borderRadius: 4,
              bgcolor: "#ffffff",
              boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
              textAlign: "center",
            }}
          >
            <Skeleton
              variant="circular"
              animation="wave"
              sx={{ mx: "auto", width: 70, height: 70, mb: 2 }}
            />
            <Skeleton
              variant="text"
              animation="wave"
              sx={{ mx: "auto", width: 120, height: 32, borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              animation="wave"
              sx={{ mx: "auto", width: 160, height: 22, borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              animation="wave"
              sx={{ mx: "auto", width: 135, height: 22, borderRadius: 2 }}
            />
          </Box>
        </Paper>
      </Box>
    </Card>
  );
};

const ResultMessageSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        mt: 2,
        p: 2.2,
        borderRadius: 4,
        border: "1px solid #dbeafe",
        bgcolor: "#ffffff",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack direction="row" spacing={1.6} alignItems="center">
        <Skeleton
          variant="circular"
          animation="wave"
          sx={{ width: 38, height: 38 }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: 180, height: 24, borderRadius: 2 }}
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: { xs: "90%", md: 420 }, height: 22, borderRadius: 2 }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

const ActionsSkeleton: React.FC = () => {
  return (
    <Card
      elevation={0}
      sx={{
        mt: 2,
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        border: "1px solid #dbeafe",
        bgcolor: "#ffffff",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{ width: 150, height: 38, borderRadius: 3 }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{ width: 150, height: 38, borderRadius: 3 }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{ width: 170, height: 38, borderRadius: 3 }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{ width: 170, height: 38, borderRadius: 3 }}
          />
        </Stack>
      </Box>
    </Card>
  );
};
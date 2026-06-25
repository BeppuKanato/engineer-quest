import { Box, Skeleton, Stack } from "@mui/material";

export const RoadmapSkeleton = () => {
    return (
        <Stack spacing={3}>
            <Box
                sx={{
                    p: 3,
                    bgcolor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                }}
            >
                <Skeleton variant="text" width={360} height={44} />
                <Skeleton variant="text" width="72%" height={24} sx={{ mt: 1 }} />
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" width={88} height={26} sx={{ borderRadius: 999 }} />
                    <Skeleton variant="rounded" width={96} height={26} sx={{ borderRadius: 999 }} />
                    <Skeleton variant="rounded" width={108} height={26} sx={{ borderRadius: 999 }} />
                </Stack>
                <Skeleton variant="rounded" height={9} sx={{ mt: 2, borderRadius: 999 }} />
            </Box>

            <Stack spacing={2.5}>
                {[0, 1, 2, 3].map((index) => (
                    <Box
                        key={index}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: index % 2 === 0
                                    ? "minmax(0, 1fr) minmax(280px, 0.78fr)"
                                    : "minmax(0, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        <Skeleton variant="rounded" height={176} sx={{ borderRadius: 2 }} />
                        {index % 2 === 0 && (
                            <Skeleton variant="rounded" height={156} sx={{ borderRadius: 2 }} />
                        )}
                    </Box>
                ))}
            </Stack>
        </Stack>
    );
};

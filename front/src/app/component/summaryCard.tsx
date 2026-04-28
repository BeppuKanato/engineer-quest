import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import React from "react";

type SummaryCardProps = {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    accentColor: string;
    progress?: number
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    icon, label, value, subtext, accentColor, progress
}) => {
    return(
        <Card
            sx={{
                height: "100%",
                borderRadius: 4,
                border: "1px solid #E8ECF4",
                boxShadow: "0 8px 22px rgba(17, 24, 39, 0.04)",
            }}
        >
            <CardContent sx={{ p:3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: `${accentColor}18`,
                                color: accentColor,
                                display: "grid",
                                placeItems: "center"
                            }}
                        >
                            {icon}
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                            {label}
                        </Typography>
                    </Stack>

                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: accentColor, lineHeight: 1.1}}>
                        {value}
                    </Typography>

                    {
                        subtext && (
                            <Typography variant="body2" color="text.secondary">
                                {subtext}
                            </Typography>
                        )
                    }

                    {typeof progress === "number" && (
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 8,
                                borderRadius: 999,
                                bgcolor: `${accentColor}22`,
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 999,
                                    bgcolor: accentColor,
                                },
                            }}
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
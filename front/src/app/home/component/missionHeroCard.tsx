import React from "react";
import { Mission, MissionTab } from "../type";
import { Card, Stack, Tab, Tabs, Typography, Box, Grid, Chip, LinearProgress, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { AnimatePresence, motion } from "framer-motion";



type MissionHeroCardProps = {
    mission: Mission;
    tab: MissionTab;
    onChangeTab: (value: MissionTab) => void; 
}

export const MissionHeroCard: React.FC<MissionHeroCardProps> = ({
    mission, tab, onChangeTab
}) => {
    return(
        <AnimatePresence mode="wait">
            <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: "easeOut"}}
            >
                <Card
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        border: "1px solid #E8ECF4",
                        boxShadow: "0 10px 24px rgba(17, 24, 39, 0.05)"
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 3}}
                    >
                        <Typography variant="h5" fontWeight={700}>
                            あなたのミッション
                        </Typography>

                        <Tabs
                            value={tab}
                            onChange={(_, value) => onChangeTab(value)}
                            sx={{
                                minHeight: 40,
                                "& .MuiTab-root": {
                                    minHeight: 40,
                                    fontWeight: 700,
                                    fontSize: 12
                                },
                            }}
                        >
                            <Tab value="resume" label="RESUME" />
                            <Tab value="recommended" label="RECOMMENDED" />
                        </Tabs>
                    </Stack>
                    <Box
                        key={mission.id}
                        sx={{
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 4,
                            p: { xs: 3, md: 4},
                            minHeight: 320,
                            display: "flex",
                            alignItems: "stretch",
                            background:"linear-gradient(135deg, #6174F3 0%, #7E57C2 55%, #8E5AE8 100%)",
                            color: "#fff"
                        }} 
                    >
                        <Grid container spacing={3} alignItems="center">
                            <Grid size={{ xs: 12, md: 7}}>
                                <Stack spacing={2.5}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip
                                            label={mission.badgeLabel}
                                            size="small"
                                            sx={{
                                                color: "#fff",
                                                bgcolor: "rgba(255, 255, 255, 0.18)",
                                                fontWeight: 700
                                            }}
                                        />
                                        <Chip
                                            label={`Medium`}
                                            size="small"
                                            sx={{
                                                bgcolor: "#F59E0B",
                                                color: "#fff",
                                                fontWeight: 700,
                                            }} 
                                        />
                                    </Stack>

                                    <Typography 
                                        variant="h3" 
                                        fontWeight={800}
                                        sx={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            lineHeight: 1.2,
                                            minHeight: "2.4em",
                                        }}
                                    >
                                        {mission.title}
                                    </Typography>

                                    <Typography
                                        variant="body1"
                                        sx={{ 
                                            color: "rgba(255, 255, 255, 0.92)", 
                                            maxWidth: 560,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            lineHeight: 1.6,
                                            minHeight: "3.2em" 
                                        }} 
                                    >
                                        {mission.description}
                                    </Typography>

                                    <Box>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            sx={{ mb: 1 }}
                                        >
                                            <Typography variant="body2" fontWeight={700} >
                                                進捗状況
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                {mission.progress ?? 0}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={mission.progress ?? 0}
                                            sx={{
                                                height: 8,
                                                borderRadius: 999,
                                                bgcolor: "rgba(255, 255, 255, 0.2)",
                                                "& .MuiLinearProgress-bar": {
                                                    borderRadius: 999,
                                                    bgcolor: "#fff"
                                                }
                                            }} 
                                        />
                                    </Box>
                                    <Box>
                                        <Button
                                            variant="contained"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                px: 3,
                                                py: 1.25,
                                                borderRadius: 3,
                                                bgcolor: "#fff",
                                                color: "#6174F3",
                                                fontWeight: 700,
                                                boxShadow: "none",
                                                "&:hover": {
                                                    bgcolor: "#F8FAFC",
                                                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
                                                },
                                            }}
                                        >
                                            {mission.ctaLabel}
                                        </Button>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, md: 5}}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: { xs: "flex-start", md: "center"}
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={mission.goalImg}
                                        alt={mission.title}
                                        sx={{
                                            width: "100%",
                                            maxWidth: 340,
                                            height: 220,
                                            objectFit: "cover",
                                            borderRadius: 3,
                                            border: "2px solid rgba(255, 255, 255, 0.22)",
                                            boxShadow: "0 14px 32px rgba(15, 23, 42, 0.22)",
                                            bgcolor: "#0F172A",
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
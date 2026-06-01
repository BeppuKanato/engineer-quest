import { Box, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type LearnedItemListProps = {
  items: string[];
};


export const LearnedItemList: React.FC<LearnedItemListProps> = ({
    items
}) => {
    return (
        <Box sx={{ mt: 4 }}>
            <Typography
                sx={{
                    mb: 1.5,
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#111827",
                }}
            >
                学んだこと
            </Typography>

            <Stack spacing={1.5}>
                {items.map((item) => (
                    <Box
                        key={item}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            px: 2.2,
                            py: 1.8,
                            borderRadius: 3,
                            bgcolor: "#EEF6FF",
                            border: "1px solid #D8EAFE",
                        }}
                    >
                        <CheckCircleIcon
                            sx={{
                            color: "#34A853",
                            fontSize: 28,
                            flexShrink: 0,
                            }}
                        />

                        <Typography
                            sx={{
                            fontWeight: 700,
                            color: "#111827",
                            lineHeight: 1.6,
                            }}
                        >
                            {item}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
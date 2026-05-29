import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";

type PageTransitionOverlayProps = {
  open: boolean;
  message?: string;
};

export const PageTransitionOverlay: React.FC<PageTransitionOverlayProps> = ({
  open,
  message = "次の画面を準備しています...",
}) => {
  if (!open) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        bgcolor: "rgba(247, 248, 252, 0.58)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 2.4,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
          display: "flex",
          alignItems: "center",
          gap: 1.6,
          minWidth: 280,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "#eff6ff",
            color: "#1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MenuBookIcon sx={{ fontSize: 22 }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={900} color="text.primary">
            {message}
          </Typography>

          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            そのまま少しお待ちください
          </Typography>
        </Box>

        <CircularProgress size={24} thickness={5} />
      </Paper>
    </Box>
  );
};
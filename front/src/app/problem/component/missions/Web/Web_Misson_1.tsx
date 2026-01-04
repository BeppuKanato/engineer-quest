import { Box, Typography, List, ListItem, ListItemText, CardMedia, useTheme, alpha } from "@mui/material";
import { isHighlight, MissionComponentProps } from "../../common/common";

export const Web_Mission_1 = ({ highlight }: MissionComponentProps) => {
  const theme = useTheme();

  // ユーティリティ：青いハイライト背景
  const hl = (key: string) =>
    isHighlight(key, highlight) ? alpha(theme.palette.primary.main, 0.12) : "transparent";

  return (
    <Box sx={{ p: 3, bgcolor: hl("step-1") }}>
      {/* タイトル */}
      <Typography variant="h4" component="h1" sx={{ mb: 2, bgcolor: hl("step-2") }}>
        自己紹介ページ
      </Typography>

      {/* 自己紹介文 */}
      <Typography variant="body1" sx={{ mb: 1, bgcolor: hl("step-2") }}>
        こんにちは、新入社員です！
      </Typography>

      <Typography variant="body1" sx={{ mb: 2, bgcolor: hl("step-2") }}>
        私の好きな食べ物を紹介します！
      </Typography>

      {/* 好きな食べ物リスト */}
      <List sx={{ mb: 2, bgcolor: hl("step-2"), borderRadius: 1 }}>
        <ListItem>
          <ListItemText primary="ラーメン" />
        </ListItem>
        <ListItem>
          <ListItemText primary="寿司" />
        </ListItem>
        <ListItem>
          <ListItemText primary="カレー" />
        </ListItem>
      </List>

      {/* 画像 */}
      <Box
        sx={{
          position: "relative",
          display: "inline-block",
          borderRadius: 1,
          overflow: "hidden",
          width: 150,
          height: "auto",
        }}
      >
        <CardMedia
          component="img"
          image="/fit-logo.png"
          alt="大学アイコン"
          sx={{ display: "block", width: "100%" }}
        />

        {/* step-2 のハイライト（画像用） */}
        {isHighlight("step-2", highlight) && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              border: `4px solid ${theme.palette.primary.main}`,
              borderRadius: 1,
              pointerEvents: "none",
            }}
          />
        )}
      </Box>
    </Box>
  );
};

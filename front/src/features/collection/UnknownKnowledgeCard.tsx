import StyleIcon from "@mui/icons-material/Style";
import { Box, Typography } from "@mui/material";
import { uncollectedTone as tone } from "./knowledgeCard.tokens";

/** 未所持分は操作要素にせず、内容・レア度を示さない共通の影にする。 */
export function UnknownKnowledgeCard() {
  return <Box component="article" aria-label="未所持の知識カード" data-uncollected-card
    sx={{ p: 2, minHeight: 112, borderRadius: 2, bgcolor: tone.background, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
    <StyleIcon aria-hidden sx={{ fontSize: 64, color: tone.silhouette }} />
    <Typography component="p" sx={{ color: tone.color, fontSize: 24, fontWeight: 900 }}>？？？</Typography>
  </Box>;
}

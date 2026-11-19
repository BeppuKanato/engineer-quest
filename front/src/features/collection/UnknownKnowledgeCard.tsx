import StyleIcon from "@mui/icons-material/Style";
import { Box, Chip, Typography } from "@mui/material";
import { knowledgeCardTones, uncollectedTone as tone } from "./knowledgeCard.tokens";

/** 未所持分は操作要素にせず、内容は共通の影で伏せ、レア度だけ色とラベルで示す。 */
export function UnknownKnowledgeCard({ rarity }: { rarity: keyof typeof knowledgeCardTones }) {
  const rarityTone = knowledgeCardTones[rarity];
  return <Box component="article" aria-label="未所持の知識カード" data-uncollected-card
    sx={{ p: 2, minHeight: 112, borderRadius: 2, bgcolor: tone.background, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
    <StyleIcon aria-hidden sx={{ fontSize: 64, color: tone.silhouette }} />
    <Box>
      <Chip label={rarityTone.label} size="small" sx={{ fontWeight: 900, color: rarityTone.color, bgcolor: rarityTone.bgcolor, border: `1px solid ${rarityTone.border}` }} />
      <Typography component="p" sx={{ color: tone.color, fontSize: 24, fontWeight: 900 }}>？？？</Typography>
    </Box>
  </Box>;
}

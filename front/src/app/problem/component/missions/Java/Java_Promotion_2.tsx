"use client";

import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

export const Java_Promotion_2 = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <>
        <Typography variant="h6" sx={{ mb: 2 }}>
          実行イメージ
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          このチャレンジでは、配列に入った点数をもとに集計・判定を行います。
          <br />
          以下は「入力（点数）」に対して、どのような出力になるかの一例です。
        </Typography>

        {/* ===== ケース1：平均点が60以上 ===== */}
        <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            ケース①：平均点が合格ラインの場合
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            入力例（scores 配列）
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="scores = {70, 55, 80, 90}" />
            </ListItem>
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2">出力結果</Typography>
          <Box
            component="pre"
            sx={{
              fontSize: 13,
              lineHeight: 1.6,
              m: 0,
              mt: 1,
              bgcolor: "#fafafa",
              p: 1.5,
              borderRadius: 1,
            }}
          >
{`Score 1: 70
Score 2: 55
Score 3: 80
Score 4: 90
Average: 73
合格`}
          </Box>
        </Card>

        {/* ===== ケース2：平均点が60未満 ===== */}
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            ケース②：平均点が合格ライン未満の場合
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            入力例（scores 配列）
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="scores = {40, 50, 55}" />
            </ListItem>
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2">出力結果</Typography>
          <Box
            component="pre"
            sx={{
              fontSize: 13,
              lineHeight: 1.6,
              m: 0,
              mt: 1,
              bgcolor: "#fafafa",
              p: 1.5,
              borderRadius: 1,
            }}
          >
{`Score 1: 40
Score 2: 50
Score 3: 55
Average: 48
不合格`}
          </Box>
        </Card>
      </>
    </Box>
  );
};

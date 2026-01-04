"use client";

import { Box, Typography, Card } from "@mui/material";

export const Web_Mission_3_Exam = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        CSS 適用後の完成イメージ
      </Typography>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ color: "red", fontSize: 24 }}>
            ページタイトル（h1）
          </Typography>

          <Typography sx={{ color: "blue" }}>
            .blue クラスが指定されたテキスト
          </Typography>

          <Typography sx={{ color: "yellow", fontSize: 24 }}>
            #y-24 が指定されたテキスト
          </Typography>

          <Box
            sx={{
              backgroundColor: "lightblue",
              padding: "20px",
              margin: "10px 15px 10px 15px"
            }}
          >
            <Typography>
              .box クラスが指定されたコンテナ
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            ※ これは「CSS適用後の完成イメージ」です。  
            CSSを書いて、この見た目を再現してみましょう。
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

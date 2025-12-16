"use client";
import { Box, Typography, Card, CardContent } from "@mui/material";

export const Mission_4_Exam = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 2
        }}
      >
        実行結果
      </Typography>

      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 1,
          mb: 2,
        }}
      >
        <CardContent>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "monospace",
              whiteSpace: "pre-line"
            }}
          >
            {`3
              2
              1
              中吉`}
          </Typography>
        </CardContent>
      </Card>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          borderRadius: 1,
          p: 1,
        }}
      >
        ※ if文とfor文を使って、カウントダウンと運勢を表示しています。
      </Typography>
    </Box>
  );
};

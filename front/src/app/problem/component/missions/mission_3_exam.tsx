"use client";
import { Box, Typography } from "@mui/material";

export const Mission_3_Exam = () => {
  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 700,
        mx: "auto",
      }}
    >
        <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 4,
        }}
        >
            {/* h1 タグの確認 */}
            <Typography
                component="h1"
                sx={{
                color: "red",
                fontWeight: "bold",
                fontSize: "1.5rem",
                }}
            >
                h1タグの文字は赤色にしましょう
            </Typography>

            {/* blue クラス */}
            <Typography
                className="blue"
                sx={{
                color: "blue",
                }}
            >
                「blue」クラスの文字色を青色に設定しましょう
            </Typography>

            {/* y-24 ID */}
            <Typography
                id="y-24"
                sx={{
                color: "yellow",
                fontSize: "24px",
                backgroundColor: "#333",
                p: 1,
                borderRadius: "8px",
                }}
            >
                IDが「y-24」の文字色を黄色、フォントサイズを24pxに設定しましょう
            </Typography>

            {/* box クラス */}
            <Box
                className="box"
                sx={{
                backgroundColor: "lightblue",
                p: 2,
                borderRadius: "8px",
                textAlign: "center",
                }}
            >
                「box」クラスの背景色を水色、内側の余白を20pxに、外側の余白を上:10px、右:15px、下:10px、左:15pxに設定しましょう
            </Box>
        </Box>
    </Box>
  );
};

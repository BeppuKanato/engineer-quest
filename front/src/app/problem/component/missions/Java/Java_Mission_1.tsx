import { Box, Typography, Card } from "@mui/material";

export const Java_Mission_1 = () => {
    return(
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                このミッションのゴール
            </Typography>

            <Typography sx={{ mb: 2 }}>
                Javaプログラムを使って、<b>自己紹介の文章を画面に表示</b>できるようになることが目標です。
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                出力されるイメージ
            </Typography>

            <Card
                sx={{
                p: 2,
                backgroundColor: "#111",
                color: "#0f0",
                fontFamily: "monospace",
                whiteSpace: "pre-line",
                }}
            >
                {`はじめまして！
                私はJavaを勉強している新入社員です。
                今日はJavaで文字を表示する練習をしています。
                よろしくお願いします！`
                }
            </Card>
            </Box>
    )
}
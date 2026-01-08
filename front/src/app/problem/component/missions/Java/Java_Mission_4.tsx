"use client";

import { Box, Typography, Card, Divider } from "@mui/material";

export const Java_Mission_4 = () => {
  return (
    <>
        <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            ミッションの目標
          </Typography>

          <Card sx={{ p: 3 }}>
            <Typography sx={{ mb: 2 }}>
              このミッションでは、Javaで使われる
              <strong>「値の書き方（リテラル）」</strong>
              を整理します。
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              このミッションでできるようになること
            </Typography>
            <ul>
              <li>文字と文字列の違いが分かる</li>
              <li>数値（整数・小数）と true / false を書ける</li>
              <li>出力結果を見て、値の違いを確認できる</li>
            </ul>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              今回のルール
            </Typography>
            <ul>
              <li>このミッションでは <strong>class / main は書きません</strong></li>
              <li>System.out.println を使って、値をそのまま出力します</li>
              <li>仕組みより「どう書くか」を重視します</li>
            </ul>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              出力例
            </Typography>

            <Box
              sx={{
                bgcolor: "#111",
                color: "#0f0",
                fontFamily: "monospace",
                p: 2,
                borderRadius: 1,
              }}
            >
              <pre style={{ margin: 0 }}>
                {`A
                Java
                10
                true`}
              </pre>
            </Box>

            <Typography sx={{ mt: 2, color: "text.secondary" }}>
              ※ 上の出力ができれば、このミッションはOKです。
            </Typography>
          </Card>
        </Box>
    </>
  );
};

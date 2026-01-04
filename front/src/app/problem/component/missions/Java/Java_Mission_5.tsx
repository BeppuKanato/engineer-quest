"use client";

import { Box, Typography, Card, Divider } from "@mui/material";
import { MissionComponentProps, isComponentType } from "../../common/common";

export const Java_Mission_5 = ({ componentType }: MissionComponentProps) => {
  return (
    <>
      {/* === プレビューUI（ミッション開始前） === */}
      {isComponentType("", componentType) && (
        <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            ミッションの目標
          </Typography>

          <Card sx={{ p: 3 }}>
            <Typography sx={{ mb: 2 }}>
              このミッションでは、
              <strong>「値を覚えて、計算する」</strong>
              というプログラムの基本を身につけます。
            </Typography>

            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              このミッションでできるようになること
            </Typography>
            <ul>
              <li>値に名前を付けて覚えられる（変数）</li>
              <li>値を更新できる（代入・再代入）</li>
              <li>計算結果を変数に保存できる</li>
            </ul>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              なぜ変数が必要？
            </Typography>
            <Typography sx={{ mb: 1 }}>
              数字を直接書くと、あとで変更するのが大変になります。
            </Typography>

            <Box
              sx={{
                bgcolor: "#111",
                color: "#f55",
                fontFamily: "monospace",
                p: 2,
                borderRadius: 1,
                mb: 2,
              }}
            >
              <pre style={{ margin: 0 }}>
                {`System.out.println(150 * 3);`}
              </pre>
            </Box>

            <Typography sx={{ mb: 1 }}>
              変数を使うと、意味が分かりやすく、変更にも強くなります。
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
                {`int price = 150;
int count = 3;
int total = price * count;
System.out.println(total);`}
              </pre>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ mt: 2, color: "text.secondary" }}>
              ※ ここが分かると、次の if / for / 配列が一気に理解しやすくなります。
            </Typography>
          </Card>
        </Box>
      )}
    {isComponentType("step-1", componentType) && (
        <>
            <Typography variant="h6" fontWeight="bold">
            変数は「値を覚える箱」
            </Typography>

            <Typography sx={{ mb: 2 }}>
            変数は、値に名前を付けて覚えておくための仕組みです。
            今回は <code>hp</code> という名前で <code>30</code> を覚えさせます。
            </Typography>

            {/* 図っぽい表現 */}
            <Card sx={{ p: 2, mb: 2, bgcolor: "#f9f9f9" }}>
            <Typography fontWeight="bold">イメージ</Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Box
                sx={{
                    border: "2px solid #333",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    mr: 2,
                    fontFamily: "monospace",
                }}
                >
                hp
                </Box>
                <Typography>の中身 →</Typography>
                <Box
                sx={{
                    border: "2px solid #333",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    ml: 2,
                    fontFamily: "monospace",
                }}
                >
                30
                </Box>
            </Box>
            </Card>

            <Typography variant="subtitle1" fontWeight="bold">
            コードで書くとこうなる
            </Typography>

            <Card sx={{ p: 2, bgcolor: "#111", color: "#0f0", fontFamily: "monospace" }}>
            <pre style={{ margin: 0 }}>
        {`int hp = 30;
System.out.println(hp);`}
            </pre>
            </Card>

            <Typography sx={{ mt: 2 }}>
            <code>println(hp)</code> は、
            <strong>「hp に入っている中身を出して」</strong>
            という意味です。
            </Typography>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
            <Typography variant="h6" fontWeight="bold">
            代入：変数の中身を書き換える
            </Typography>

            <Typography sx={{ mb: 2 }}>
            Javaでは <code>=</code> を使って、
            <strong>変数の中の値を決めたり、変えたり</strong>します。
            これを <strong>代入</strong> と呼びます。
            </Typography>

            <Typography sx={{ mb: 2 }}>
            同じ変数名でも、あとから別の値を指定すると
            <strong>中身が新しい値に変わります</strong>。
            </Typography>

            {/* 図イメージ */}
            <Card sx={{ p: 2, mb: 2, bgcolor: "#f9f9f9" }}>
            <Typography fontWeight="bold">イメージ</Typography>

            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Box
                sx={{
                    border: "2px solid #333",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    mr: 2,
                    fontFamily: "monospace",
                }}
                >
                score
                </Box>
                <Typography sx={{ mx: 1 }}>最初</Typography>
                <Box
                sx={{
                    border: "2px solid #333",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    fontFamily: "monospace",
                }}
                >
                60
                </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Box
                sx={{
                    border: "2px solid #333",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    mr: 2,
                    fontFamily: "monospace",
                }}
                >
                score
                </Box>
                <Typography sx={{ mx: 1 }}>更新後</Typography>
                <Box
                sx={{
                    border: "2px solid #333",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    fontFamily: "monospace",
                }}
                >
                80
                </Box>
            </Box>
            </Card>

            <Typography variant="subtitle1" fontWeight="bold">
            コードで見るとこうなる
            </Typography>

            <Card sx={{ p: 2, bgcolor: "#111", color: "#0f0", fontFamily: "monospace" }}>
            <pre style={{ margin: 0 }}>
        {`int score = 60;
score = 80;
System.out.println(score);`}
            </pre>
            </Card>

            <Typography sx={{ mt: 2 }}>
            上のコードでは、最初に <code>60</code> を使い、
            そのあと <code>80</code> に変更しています。
            </Typography>

            <Typography sx={{ mt: 1 }}>
            最後に表示されるのは、
            <strong>一番新しい値</strong>です。
            </Typography>
        </>
        )}
    </>
  );
};

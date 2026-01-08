"use client";

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_8 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            {/* === プレビューUI === */}
            {isComponentType("", componentType) && (
            <>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                このミッションでできるようになること
                </Typography>

                <List>
                <ListItem>
                    <ListItemText primary="for文を使って、同じ処理を何度も実行できるようになる" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="決まった回数だけ処理をくり返す書き方が分かる" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="i という変数が、回数をどう管理しているか理解できる" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="< と <= の違いで、実行回数が変わる理由が分かる" />
                </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                出力イメージ例
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                for文を使うと、こんな出力を「短いコード」で作れるようになります。
                </Typography>

                <Box
                sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1,
                    p: 2,
                    fontFamily: "monospace",
                    fontSize: 14
                }}
                >
                Count: 1<br />
                Count: 2<br />
                Count: 3<br />
                Count: 4<br />
                Count: 5
                </Box>
            </>
            )}
        </>
        )}
        {/* === Step1 説明UI === */}
        {isComponentType("step-1", componentType) && (
        <>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                for文は「3つのパーツ」でできている
            </Typography>

            <Box
                sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
                p: 2,
                fontFamily: "monospace",
                fontSize: 14,
                mb: 2
                }}
            >
                for (int i = 0; i &lt; 3; i++) &#123;<br />
                &nbsp;&nbsp;System.out.println(`&quot;Hello&quot;`);<br />
                &#125;
            </Box>

            <List>
                <ListItem>
                <ListItemText
                    primary="① 初期化：int i = 0"
                    secondary="繰り返しが始まる前に1回だけ実行される。カウンタ変数のスタート地点。"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="② 条件：i < 3"
                    secondary="この条件が true の間、処理が繰り返される。false になったら終了。"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="③ 更新：i++"
                    secondary="1回処理が終わるごとに実行される。回数を進める役割。"
                />
                </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2">
                この例では、i は <strong>0 → 1 → 2</strong> と変化し、
                <strong>合計3回</strong> println が実行されます。
            </Typography>
        </>
        )}
        {/* === Step2 説明UI === */}
        {isComponentType("step-2", componentType) && (
        <>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                カウンタ変数 i は「今何回目か」を表す
            </Typography>

            <Box
                sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
                p: 2,
                fontFamily: "monospace",
                fontSize: 14,
                mb: 2
                }}
            >
                for (int i = 0; i &lt; 5; i++) &#123;<br />
                &nbsp;&nbsp;System.out.println(i);<br />
                &#125;
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                このfor文の動き
            </Typography>

            <List>
                <ListItem>
                <ListItemText
                    primary="1回目"
                    secondary="i = 0 → 条件 (0 < 5) は true → 0 を表示 → i++ で i = 1"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="2回目"
                    secondary="i = 1 → 条件 (1 < 5) は true → 1 を表示 → i++ で i = 2"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="3回目"
                    secondary="i = 2 → 条件 (2 < 5) は true → 2 を表示 → i++ で i = 3"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="…"
                    secondary="この流れを繰り返す"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="終了"
                    secondary="i = 5 → 条件 (5 < 5) は false → for文を抜ける"
                />
                </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2">
                ポイント：<br />
                <strong>表示されるのは「更新される前の i」</strong><br />
                だから 0 から始まり、最後は 4 で止まります。
            </Typography>
        </>
        )}
    </Box>
  );
};

"use client";

import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_9 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Card sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                このミッションでできるようになること
            </Typography>

            <List>
                <ListItem>
                <ListItemText
                    primary="for文と変数を組み合わせて、合計を計算できるようになる"
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="値を少しずつ積み上げる『累積処理』の考え方が分かる"
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="for文の中と外で、変数をどう使い分けるか理解できる"
                />
                </ListItem>
                <ListItem>
                <ListItemText
                    primary="for文と if を組み合わせて、条件付きの集計ができる"
                />
                </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                完成イメージ（出力例）
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                for文を使って計算すると、こんな集計結果を出せるようになります。
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
                Total: 16
            </Box>

            <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                ※ 例：1〜7のうち、奇数だけを足した結果
            </Typography>
            </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            値を「積み上げる」処理の考え方
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
            int sum = 0;<br />
            for (int i = 1; i &lt;= 3; i++) &#123;<br />
            &nbsp;&nbsp;sum = sum + i;<br />
            &#125;
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            for文の1回ごとの動き
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="1回目"
                secondary="sum = 0, i = 1 → sum = 0 + 1 → sum は 1 になる"
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="2回目"
                secondary="sum = 1, i = 2 → sum = 1 + 2 → sum は 3 になる"
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="3回目"
                secondary="sum = 3, i = 3 → sum = 3 + 3 → sum は 6 になる"
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="終了"
                secondary="i = 4 になり条件が false → for文を抜ける"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2">
            ポイント：
            <br />
            ・<strong>sum は for の外で用意する</strong>
            <br />
            ・<strong>for の中では sum を更新するだけ</strong>
            <br />
            ・for が終わった時点で、sum には「合計結果」が残る
          </Typography>
        </Card>
      )}
    </Box>
  );
};

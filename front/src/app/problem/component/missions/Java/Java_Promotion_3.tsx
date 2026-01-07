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

export const Java_Promotion_3 = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <>
        <Typography variant="h6" sx={{ mb: 2 }}>
          実行イメージ
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          このチャレンジでは、
          <strong>クラス・配列・for・private / public・コンストラクタ</strong>
          を組み合わせて、
          <br />
          <strong>「小さな管理アプリ」</strong>を設計します。
          <br />
          以下は、タスクを管理した場合の動作例です。
        </Typography>

        {/* ===== ケース：タスク管理 ===== */}
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            タスク管理アプリの例
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            入力例（Task 配列）
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary='tasks[0] = "Java復習"（完了）' />
            </ListItem>
            <ListItem>
              <ListItemText primary='tasks[1] = "レポート作成"（未完了）' />
            </ListItem>
            <ListItem>
              <ListItemText primary='tasks[2] = "運動"（未完了）' />
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
{`[DONE] Java復習
[TODO] レポート作成
[TODO] 運動`}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="body2" color="text.secondary">
            → タスクの状態はクラスの中で管理され、
            <br />
            main は「流れ」だけを書いています
          </Typography>
        </Card>
      </>
    </Box>
  );
};

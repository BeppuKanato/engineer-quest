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

export const Java_Promotion_1 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            実行イメージ
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            このミッションでは、入力された値に応じて出力内容が変わります。
            以下はその一例です。
          </Typography>

          {/* ===== ケース1：達成 ===== */}
          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              ケース①：順調な場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              入力例
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="学習日数（totalDays）：10日" />
              </ListItem>
              <ListItem>
                <ListItemText primary="学習した日数（studiedDays）：7日" />
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
                borderRadius: 1
              }}
            >
{`学習ログ Day 1
学習ログ Day 2
学習ログ Day 3
学習ログ Day 4
学習ログ Day 5
学習ログ Day 6
学習ログ Day 7
Rate: 70%
順調です`}
            </Box>
          </Card>

          {/* ===== ケース2：未達 ===== */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              ケース②：もう少し頑張ろうの場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              入力例
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="学習日数（totalDays）：10日" />
              </ListItem>
              <ListItem>
                <ListItemText primary="学習した日数（studiedDays）：4日" />
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
                borderRadius: 1
              }}
            >
{`学習ログ Day 1
学習ログ Day 2
学習ログ Day 3
学習ログ Day 4
Rate: 40%
もう少し頑張ろう`}
            </Box>
          </Card>
        </>
    </Box>
  );
};

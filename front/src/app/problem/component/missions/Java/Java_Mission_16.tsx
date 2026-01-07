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

export const Java_Mission_16 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            実行イメージ
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            クラスのインスタンスを配列に入れて、for 文でまとめて処理します。
            new されていない要素（null）は表示されません。
            </Typography>

            {/* ===== ケース1：2人分いる場合 ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース①：2人分のユーザがいる場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                配列の状態
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="users[0]：User(name = &quot;A&quot;)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[1]：User(name = &quot;B&quot;)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[2]：null" />
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
{`A
B`}
            </Box>
            </Card>

            {/* ===== ケース2：1人だけの場合 ===== */}
            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース②：1人分だけ new した場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                配列の状態
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="users[0]：User(name = &quot;Solo&quot;)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[1]：null" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[2]：null" />
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
{`Solo`}
            </Box>
            </Card>
        </>
        )}
    </Box>
  );
};

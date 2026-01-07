"use client";

import { Box, Typography, Card, List, ListItemText, ListItem } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_7 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            このミッションのゴール
            </Typography>

            <List dense>
            <ListItem>
                <ListItemText primary="数値を比べる条件（大きい・小さい・等しい）が書ける" />
            </ListItem>
            <ListItem>
                <ListItemText primary="条件を「かつ / または」で組み合わせられる" />
            </ListItem>
            <ListItem>
                <ListItemText primary="if 文の条件を自分で考えて書けるようになる" />
            </ListItem>
            </List>
            <Typography sx={{ mt: 2 }}>
            ここを越えると、プログラムが「判断できる」ようになります。
            </Typography>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            比較演算子一覧
            </Typography>

            <Card sx={{ p: 2 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                <tr>
                    <th align="left">記号</th>
                    <th align="left">意味（日本語）</th>
                    <th align="left">例</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>&gt;</td>
                    <td>左が右より大きい</td>
                    <td>score &gt; 60</td>
                </tr>
                <tr>
                    <td>&gt;=</td>
                    <td>左が右以上</td>
                    <td>score &gt;= 60</td>
                </tr>
                <tr>
                    <td>&lt;</td>
                    <td>左が右より小さい</td>
                    <td>hp &lt; 0</td>
                </tr>
                <tr>
                    <td>==</td>
                    <td>左と右が等しい</td>
                    <td>score == 100</td>
                </tr>
                <tr>
                    <td>!=</td>
                    <td>左と右が等しくない</td>
                    <td>score != 0</td>
                </tr>
                </tbody>
            </table>
            </Card>

            <Typography sx={{ mt: 2 }}>
            条件式は「日本語で読めるか？」を意識すると迷わなくなります。
            </Typography>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            条件を組み合わせる（論理演算子）
            </Typography>

            <Card sx={{ p: 2 }}>
            <List dense>
                <ListItem>
                    <ListItemText primary="数値を比べる条件（大きい・小さい・等しい）が書ける" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="条件を「かつ / または」で組み合わせられる" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="if 文の条件を自分で考えて書けるようになる" />
                </ListItem>
            </List>

            <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                例：
            </Typography>
            <pre>
        score &gt;= 60 && hasTicket
            </pre>
            <Typography>
                →「60点以上 <strong>かつ</strong> チケットあり」
            </Typography>
            </Card>

            <Typography sx={{ mt: 2 }}>
            まずは日本語で考えてから、記号に変換しよう。
            </Typography>
        </>
        )}
    </Box>
  );
};

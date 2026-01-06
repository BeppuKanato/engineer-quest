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

export const Java_Mission_10 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                🎯 このミッションの目標
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="同じ種類の値を、まとめて扱えるようになる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="番号（インデックス）で値を取り出せるようになる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="配列の長さ（要素数）を取得できるようになる" />
                </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                🧠 配列のイメージ
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                配列は「番号付きの箱」が横に並んだものだと思ってOK。
            </Typography>

            <Box
                sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                mb: 2
                }}
            >
                <Card sx={{ p: 1, minWidth: 60, textAlign: "center" }}>
                <Typography variant="caption">index 0</Typography>
                <Typography>70</Typography>
                </Card>
                <Card sx={{ p: 1, minWidth: 60, textAlign: "center" }}>
                <Typography variant="caption">index 1</Typography>
                <Typography>80</Typography>
                </Card>
                <Card sx={{ p: 1, minWidth: 60, textAlign: "center" }}>
                <Typography variant="caption">index 2</Typography>
                <Typography>90</Typography>
                </Card>
            </Box>

            <Typography variant="body2" color="text.secondary">
                ※ 番号（index）は <strong>0 から始まる</strong> ので注意しよう。
            </Typography>
            </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
            <Typography variant="h5" sx={{ mb: 2 }}>
                配列の基本イメージ
            </Typography>

            <Card sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
                配列は、<strong>同じ型の値を順番にまとめて持つ</strong> ための仕組みだよ。
                <br />
                1つ1つの値には「番号（インデックス）」が付いている。
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                📦 箱と番号のイメージ
            </Typography>

            <Box
                sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                mb: 2
                }}
            >
                <Card sx={{ p: 1, minWidth: 70, textAlign: "center" }}>
                <Typography variant="caption">index 0</Typography>
                <Typography>70</Typography>
                </Card>
                <Card sx={{ p: 1, minWidth: 70, textAlign: "center" }}>
                <Typography variant="caption">index 1</Typography>
                <Typography>80</Typography>
                </Card>
                <Card sx={{ p: 1, minWidth: 70, textAlign: "center" }}>
                <Typography variant="caption">index 2</Typography>
                <Typography>90</Typography>
                </Card>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ポイント：<strong>番号は 0 から始まる</strong>。
                <br />
                「1番目の要素」は index 0 になる。
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                ✅ このステップで押さえること
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="配列は同じ型の値をまとめて持つ" />
                </ListItem>
                <ListItem>
                <ListItemText primary="値は番号（インデックス）で管理される" />
                </ListItem>
                <ListItem>
                <ListItemText primary="インデックスは 0 から始まる" />
                </ListItem>
            </List>
            </Card>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
            <Typography variant="h5" sx={{ mb: 2 }}>
            配列から値を取り出す
            </Typography>

            <Card sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
                配列の中の値は、<strong>配列名[番号]</strong> という形で取り出せる。
                <br />
                この番号を <strong>インデックス</strong> と呼ぶ。
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                📦 配列とインデックスの対応
            </Typography>

            <Box
                sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                mb: 2
                }}
            >
                <Card sx={{ p: 1, minWidth: 80, textAlign: "center" }}>
                <Typography variant="caption">scores[0]</Typography>
                <Typography>60</Typography>
                </Card>
                <Card sx={{ p: 1, minWidth: 80, textAlign: "center" }}>
                <Typography variant="caption">scores[1]</Typography>
                <Typography>70</Typography>
                </Card>
                <Card sx={{ p: 1, minWidth: 80, textAlign: "center" }}>
                <Typography variant="caption">scores[2]</Typography>
                <Typography>80</Typography>
                </Card>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                例：
                <br />
                <strong>scores[1]</strong> を使うと、<strong>70</strong> が取り出される。
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                ⚠ よくある注意点
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="インデックスは 0 から始まる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="存在しない番号（例: scores[3]）はエラーになる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="配列の中身そのものは勝手に増えない" />
                </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                ✅ このステップでできるようになること
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="配列名[インデックス] で値を取り出せる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="『◯番目の値』がどの index か判断できる" />
                </ListItem>
            </List>
            </Card>
        </>
        )}
    </Box>
  );
};

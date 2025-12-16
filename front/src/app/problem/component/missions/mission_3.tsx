"use client";
import { Box, Typography, Card, alpha, useTheme, List, ListItem, ListItemText } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../common/common";

export const Mission_3 = ({ componentType }: MissionComponentProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 700,
        mx: "auto",
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        CSS 比較表示プレビュー
      </Typography>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
          {/* ミッション開始画面で最終目標として表示する画面がない場合に表示 */}
          {isComponentType("", componentType) && (
            <>
              <Typography>
                このレッスンでは、CSSを使ってどのように見た目が変わるのかを体験します。  
                それぞれの要素を1つずつ確認しながら理解していきましょう。
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
          💡    今回扱う内容
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="・文字の色やサイズの変更（color / font-size）" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="・フォントの種類（font-family）の違い" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="・余白と内側の余白（margin / padding）" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="・背景色の変更（background-color）" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="・class / id の指定方法" />
                </ListItem>
              </List>
            </>
          )}
          {/* === step-2-1: color & font-size === */}
          {isComponentType("step-2-1", componentType) && (
            <>
              <Typography sx={{ color: "black" }}>黒い文字（通常）</Typography>
              <Typography sx={{ color: "red" }}>赤い文字（color変更）</Typography>
              <Typography sx={{ fontSize: "16px" }}>通常サイズ</Typography>
              <Typography sx={{ fontSize: "28px" }}>大きいサイズ（font-size変更）</Typography>
            </>
          )}

          {/* === step-2-2: font-family === */}
          {isComponentType("step-2-2", componentType) && (
            <>
              <Typography sx={{ fontFamily: "serif" }}>serif（明朝体）</Typography>
              <Typography sx={{ fontFamily: "sans-serif" }}>sans-serif（ゴシック）</Typography>
              <Typography sx={{ fontFamily: '"Comic Sans MS", cursive' }}>Comic Sans（カジュアル）</Typography>
              <Typography sx={{ fontFamily: '"Courier New", monospace' }}>monospace（等幅）</Typography>
            </>
          )}


            {/* === step-3-1: margin / padding === */}
            {isComponentType("step-3-1", componentType) && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {/* === margin/paddingなし === */}
                <Box sx={{ border: "1px solid gray", width: 300, textAlign: "center" }}>
                  <Typography sx={{ m: 0, p: 0 }}>margin/paddingなし</Typography>
                </Box>

                {/* === margin/paddingあり（視覚化） === */}
                <Box
                  sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.3), // margin領域の可視化
                      p: 2, // paddingの外に余白
                      borderRadius: 2,
                  }}
                >
                <Box
                    sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.2), // padding領域の可視化
                    border: "1px solid gray",
                    m: 2,
                    p: 2,
                    width: 300,
                    textAlign: "center",
                    }}
                >
                    <Typography>margin/paddingあり</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", textAlign: "center" }}>
                  🟣 外側が margin 領域（紫） / 🔵 内側が padding 領域（青）
                </Typography>
                </Box>
              </Box>
            )}


          {/* === step-3-2: background-color === */}
          {isComponentType("step-3-2", componentType) && (
            <>
              <Box sx={{ p: 2, bgcolor: "white", border: "1px solid gray" }}>
                <Typography>背景なし</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.3), border: "1px solid gray" }}>
                <Typography>背景あり（background-color）</Typography>
              </Box>
            </>
          )}

          {/* === step-4-1: class指定 === */}
          {isComponentType("step-4-1", componentType) && (
            <>
              <Typography className="classA" sx={{ color: "gray" }}>
                通常のテキスト
              </Typography>
              <Typography
                className="classA"
                sx={{
                  color: theme.palette.success.main,
                  fontWeight: "bold",
                }}
              >
                .highlight が指定されたテキスト
              </Typography>
            </>
          )}

          {/* === step-4-2: id指定 === */}
          {isComponentType("step-4-2", componentType) && (
            <>
              <Typography id="special" sx={{ color: "gray" }}>
                通常のIDなしテキスト
              </Typography>
              <Typography
                id="special"
                sx={{
                  color: theme.palette.warning.main,
                  fontWeight: "bold",
                }}
              >
                #special が指定されたテキスト
              </Typography>
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

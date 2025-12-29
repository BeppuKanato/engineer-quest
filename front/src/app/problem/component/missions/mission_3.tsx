"use client";

import {
  Box,
  Typography,
  Card,
  alpha,
  useTheme,
  // List,
  // ListItem,
  // ListItemText,
} from "@mui/material";
import { MissionComponentProps, isComponentType } from "../common/common";

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
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "center",
          }}
        >
          {/* step-1-1 / step-1-2 : CSSセレクタの考え方 */}
          {isComponentType("step-1-1", componentType) && (
            <>
              <Typography sx={{ color: "black" }}>
                通常の h1 タイトル
              </Typography>
              <Typography sx={{ color: "red" }}>
                CSSで色を指定した h1 タイトル
              </Typography>
            </>
          )}

          {isComponentType("step-1-2", componentType) && (
            <>
              <Typography variant="caption" color="text.secondary">
                この h1 タグが CSS の対象になります
              </Typography>
              <Typography variant="h5">ページタイトル（h1）</Typography>
            </>
          )}

          {/* step-2-1 : HTML側 class の指定 */}
          {isComponentType("step-2-1", componentType) && (
            <>
              <Typography sx={{ color: "gray" }}>
                class 指定なしのテキスト
              </Typography>
              <Typography className="blue" sx={{ color: "blue" }}>
                class=&quot;blue&quot;が指定されたテキスト
              </Typography>
            </>
          )}

          {/* step-2-2 : CSS側 class セレクタ */}
          {isComponentType("step-2-2", componentType) && (
            <>
              <Typography sx={{ color: "gray" }}>
                通常のテキスト
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                }}
              >
                .blue クラスで色が変わるテキスト
              </Typography>
            </>
          )}

          {/* step-2-3 : HTML側 id の指定 */}
          {isComponentType("step-2-3", componentType) && (
            <>
              <Typography sx={{ color: "gray" }}>
                id 指定なしのテキスト
              </Typography>
              <Typography id="y-24" sx={{ color: "yellow", fontSize: 24 }}>
                id=&quot;y-24&quot;が指定されたテキスト
              </Typography>
            </>
          )}

          {/* step-2-4 : CSS側 id セレクタ */}
          {isComponentType("step-2-4", componentType) && (
            <>
              <Typography sx={{ color: "gray" }}>
                通常サイズのテキスト
              </Typography>
              <Typography sx={{ color: "yellow", fontSize: 24 }}>
                #y-24 で色とサイズを指定したテキスト
              </Typography>
            </>
          )}

          {/* step-3-1 : margin / padding / background */}
          {isComponentType("step-3-1", componentType) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              {/* 余白なし */}
              <Box
                sx={{
                  border: "1px solid gray",
                  width: 300,
                  textAlign: "center",
                }}
              >
                <Typography>余白・背景色なし</Typography>
              </Box>

              {/* 余白・背景色あり */}
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.3),
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "lightblue",
                    m: "10px 15px",
                    p: "20px",
                    width: 300,
                    textAlign: "center",
                  }}
                >
                  <Typography>
                    .box クラスが指定されたコンテナ
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  🟣 外側が margin / 🔵 内側が padding / 水色が背景色
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};
